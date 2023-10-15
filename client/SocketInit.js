
class SocketMap {
	constructor(){
		this.mapping = new Map() 
	}
	get(key){
		return this.mapping.get(key)
	}
	has(key){
		return this.mapping.has(key)
	}
	create(recv,user,sendSignal){
		console.log(user)
		let makingOffer = false
		let ignoreOffer = false
		const polite = true

		const conn = {
			id: recv,   
			user,                           // links to  a userid
			rtc: new RTCPeerConnection({
				iceServers: [
					{
						urls: ["stun:172.27.171.249:3478"],
					},
					{
						urls: ["turn:172.27.171.249:3478"],
						username: "chris",
						credential: "1234",
					},
				]
			}),
			sendSignal,
			close() {
				this.rtc.close()
			},
			async onOffer(offer) {
				const offerCollision = offer.type === "offer" && (makingOffer || this.rtc.signalingState !== "stable")

				ignoreOffer = !polite && offerCollision
				if (ignoreOffer) {
					return
				}

				await this.rtc.setRemoteDescription(offer)
				if (offer.type === "offer") {
					await this.rtc.setLocalDescription()
					this.sendSignal({
						action: "offer",
						offer: this.rtc.localDescription
					})
				}
			},
			async onIceCandidate(candidate) {
				try {
					
					await this.rtc.addIceCandidate(candidate)
				} catch (err) {
					if (!ignoreOffer) {
						throw err
					}
				}
			}
		}
		this.mapping.set(recv, conn)
		this.handleChange()
		conn.rtc.addEventListener("negotiationneeded", async function () {
			try {
				makingOffer = true
				await this.setLocalDescription()
				conn.sendSignal({
					action: "offer",
					offer: this.localDescription
				})
			} finally {
				makingOffer = false
			}
		})

		conn.rtc.addEventListener("icecandidate", async function ({ candidate }) {
			if (candidate !== null) {
				conn.sendSignal({
					action: "icecandidate",
					candidate,
				})
			}
		})
		conn.rtc.addEventListener("connectionstatechange", (event) => {
		
			this.handleChange()
		})

		conn.rtc.addEventListener("oniceconnectionstatechange", function () {
			if (this.iceConnectionState === "failed") {
				this.restartIce()
			}
		})

		conn.rtc.addEventListener("datachannel", async function ({ channel }) {//modify needed
			channel.addEventListener("open", function () {
				channel.send(conn.id)
				console.log(this)
			})

			channel.addEventListener("message", function (event) {
				channel.send(conn.id)
				console.log(event.data)
				//working bit

			})
		})

		return conn
	}
	handleChange(){
		this.onChange?.(this.values)
	}
	delete(key){
		this.get(key).close()
		const ret = this.mapping.delete(key)
		this.handleChange()
		return ret
	}
	clear(){
		this.mapping.forEach((val, key) => { //Changed to mapping
			this.delete(key)
		})
	}

	get values(){
		return Array.from(this.mapping.values())		
	}
}

export class SocketInit {
	constructor(userAuth) {
		this.getuserauth = userAuth
		this.socketMap = new SocketMap();
		const url = new URL(window.location.href);
		url.pathname = "/";
		url.protocol = "ws";
		if (userAuth.token) {
			url.searchParams.set("token", userAuth.token);
		}
		this.result = new WebSocket(url);
		this.result.addEventListener("open", () => {
			this.result.addEventListener("message", async ({ data }) => {
				this.handleMessage(data)
			})

		})

	}
	createPeer(recv,user) {
		return this.socketMap.create(recv,user,(data) => this.sendProxy(recv, data))
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
		const message = JSON.parse(data);

		switch (message.type) {
			case "normal": {
				switch (message.action) {
					case "subscribe": {
						const conn = this.createPeer(message.client,message.user);
						conn.sendSignal({ action: "ack" , user: this.getuserauth.data.body.user});
						break;
					}
					case "unsubscribe": {
						if (this.socketMap.has(message.client)) {
							this.socketMap.delete(message.client);
						}
						break;
					}
				}
				break;
			}
			case "proxy": {
				switch (message.action) {
					case "ack": {
						const conn = this.createPeer(message.src,message.user);
						conn.rtc.createDataChannel(message.client);
						conn.sendSignal({ action: "setup" });
						break;
					}
					case "setup": {
						const conn = this.socketMap.get(message.src);
						conn.rtc.createDataChannel(message.client);
						break;
					}
					case "offer": {
						const conn = this.socketMap.get(message.src);
						conn.onOffer(message.offer);
						break;
					}
					case "icecandidate": {
						const conn = this.socketMap.get(message.src);
						conn.onIceCandidate(message.candidate);
						break;
					}
				}
				break;
			}
		}
	}

	close() {
		this.socketMap.clear();
		this.result.close();
	}
}
