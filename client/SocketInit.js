import SocketMap from "./SocketMap.js"

export default class SocketInit {
	constructor(userAuth) {
		this.getuserauth = userAuth
		this.socketMap = new SocketMap()
	}

	connect() {
		const url = new URL(window.location.href)
		url.pathname = "/"
		url.protocol = "ws"
		if (this.getuserauth.token.token) {
			url.searchParams.set("token", this.getuserauth.token)
		}
		this.result = new WebSocket(url)
		this.result.addEventListener("open", () => {
			this.sendNormal({ action: "login" })
			this.result.addEventListener("message", async ({ data }) => {
				this.handleMessage(data)
			})

		})
	}

	createPeer(recv, user, polite = true) {
		return this.socketMap.create(recv, user, (data) => this.sendProxy(recv, data), polite)
	}
	send(type, data) {
		return this.result.send(JSON.stringify({
			type,
			...data
		}))

	}
	sendProxy(dest, data) {

		return this.send("proxy", {
			dest,
			...data
		})
	}
	sendNormal(data) {
		return this.send("normal", data)
	}
	handleMessage(data) {
		const message = JSON.parse(data)

		switch (message.type) {
			case "normal": {
				switch (message.action) {
					case "login": {
						this.getuserauth.handleSignIn(data)
						break
					}
					case "subscribe": {
						const conn = this.createPeer(message.client, message.user, false)
						conn.sendSignal({ action: "ack", user: this.getuserauth.data.body.user })
						break
					}
					case "unsubscribe": {
						if (this.socketMap.has(message.client)) {
							this.socketMap.delete(message.client)
						}
						break
					}
				}
				break
			}
			case "proxy": {
				switch (message.action) {
					case "ack": {
						const conn = this.createPeer(message.src, message.user)
						const channel = conn.rtc.createDataChannel(message.client)
						conn.setupDataChannel(channel)
						conn.sendSignal({ action: "setup" })
						break
					}
					case "setup": {
						const conn = this.socketMap.get(message.src)
						//conn.rtc.createDataChannel(message.client);
						break
					}
					case "offer": {
						const conn = this.socketMap.get(message.src)
						conn.onOffer(message.offer)
						break
					}
					case "icecandidate": {
						const conn = this.socketMap.get(message.src)
						conn.onIceCandidate(message.candidate)
						break
					}
				}
				break
			}
		}
	}

	close() {
		this.socketMap.clear()
		this.result?.close()
	}
}
