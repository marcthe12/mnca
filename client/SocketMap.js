export default class SocketMap {
	constructor() {
		this.mapping = new Map()
	}
	get(key) {
		return this.mapping.get(key)
	}
	has(key) {
		return this.mapping.has(key)
	}
	create(recv, user, sendSignal, polite = true) {
		let makingOffer = false
		let ignoreOffer = false

		const conn = {
			id: recv,
			user,
			rtc: new RTCPeerConnection({
				iceServers: [{
					"urls": ["stun:172.26.208.101:3478"],
				},
				{
					"urls": ["turn:172.26.208.101:3478"],
					username: "chris",
					credential: "1234"
				}
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
			},
			onRecieve: (...args) => this.handleRecieve(...args),
			setupDataChannel(channel) {
				channel.addEventListener("open", () => {
					console.log("test")
					this.channel = channel
				})

				channel.addEventListener("message", async (event) => {
					const message = JSON.parse(event.data)
					await this.onRecieve(message)

				})
			},
			async send(data) {
				console.log(data)
				const msg = JSON.stringify(data)
				console.log(msg)
				this.channel.send(msg)
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
		conn.rtc.addEventListener("connectionstatechange", () => {
			this.handleChange()
		})

		conn.rtc.addEventListener("oniceconnectionstatechange", function () {
			if (this.iceConnectionState === "failed") {
				this.restartIce()
			}
		})

		conn.rtc.addEventListener("datachannel", async function ({ channel }) {
			conn.setupDataChannel(channel)
		})

		return conn
	}
	async sendAllClients(data, ...user) {
		await Promise.all(this.getAllClients(...user).map((client) => client.send(data)))
	}
	getAllClients(...user) {
		const userlist = new Set(user)
		return this.values.filter(({ user }) => userlist.has(user))
	}
	handleChange() {
		this.onChange?.(this.values)
	}
	async handleRecieve(message) {
		await this.onRecieve?.(message)
	}
	delete(key) {
		this.get(key).close()
		const ret = this.mapping.delete(key)
		this.handleChange()
		return ret
	}
	clear() {
		this.mapping.forEach((val, key) => {
			this.delete(key)
		})
	}

	get values() {
		return Array.from(this.mapping.values())
	}
}
