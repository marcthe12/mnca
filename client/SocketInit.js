import SocketMap from "./SocketMap.js";
import config from "./config.js";
export default class SocketInit {
	constructor(userAuth) {
		this.getuserauth = userAuth;
		this.socketMap = new SocketMap(this);
		this.connect();
		this.interval = setInterval(() => {
			this.handleChange()
		}, 1000); // Check status every second (adjust as needed)

		this.reconnectionAttempts = 0;
		this.maxReconnectionAttempts = 10;
	}
	connect() {
		const url = new URL(config.websocket);
		if (this.getuserauth.token) {
			url.searchParams.set("token", this.getuserauth.token);
			url.searchParams.set("id", this.id);
		}
		const result = new WebSocket(url);
		result.addEventListener("open", () => {
			this.reconnectionAttempts = 0
			this.result = result;
			this.result.addEventListener("message", ({ data }) => {
				this.handleMessage(data);
			});
		});
		result.addEventListener("close", () => {
			this.reconnect();
		});

		if (this.reconnectionAttempts === 0) {
			setTimeout(() => {
				if (this.checkStatus() === "Offline") {
					this.reconnect();
				}
			}, 10 * 1000);
		}
	}
	checkStatus() {
		return this.result?.readyState === WebSocket.OPEN ? "Online" : "Offline";//---added here       
	}
	handleChange() {
		this.onChange?.(this.checkStatus());
	}
	reconnect() {
		if (this.reconnectionAttempts < this.maxReconnectionAttempts) {
			const delay = Math.pow(2, this.reconnectionAttempts) * 1000; // milliseconds
			this.timeout = setTimeout(() => {
				console.log(`Attempting reconnection (attempt ${this.reconnectionAttempts + 1})...`);
				this.connect();
			}, delay);
			this.reconnectionAttempts++;
		} else {
			alert("Maximum reconnection attempts reached. Please refresh the page.");
		}
	}
	get id() {
		return this.getuserauth.clientID;
	}
	createPeer(recv, user, polite = true) {
		return this.socketMap.create(recv, user, async data => await this.sendProxy(recv, data), polite);
	}
	async send(type, data) {
		await new Promise((resolve) => {
			const checkValue = () => {
				if (this.result !== undefined) {
					resolve(this.channel);
				} else {
					setTimeout(checkValue, 100);
				}
			};
			checkValue();
		});
		this.result.send(JSON.stringify({
			type,
			...data
		}));
	}
	async sendProxy(dest, data) {
		await this.send("proxy", {
			dest,
			...data
		});
	}
	async sendNormal(data) {
		await this.send("normal", data);
	}
	async handleMessage(data) {
		const message = JSON.parse(data);

		switch (message.type) {
		case "normal": {
			switch (message.action) {
			case "subscribe": {
				const conn = this.createPeer(message.client, message.user, false);
				await conn.sendSignal({ action: "ack", user: this.getuserauth.data.body.user });
				break;
			}
			case "unsubscribe": {
				if (this.socketMap.has(message.client)) {
					this.socketMap.delete(message.client);
				}
				break;
			}
			case "join": {
				await this.send("", { ref: message.ackid });
				this.getuserauth.addGroup({
					groupId: message.group.groupId,
					users: new Set(message.group.users),
					messages: [],
					name: ""
				});
				break;
			}
			case "leave": {
				await this.send("", { ref: message.ackid });
				this.getuserauth.deleteGroup(message.groupId);
				break;
			}
			}
			break;
		}
		case "proxy": {
			switch (message.action) {
			case "ack": {//recheck for bug
				const conn = this.createPeer(message.src, message.user);
				const channel = conn.rtc.createDataChannel(message.client);
				conn.setupDataChannel(channel);
				break;
			}
			case "offer": {
				const conn = this.socketMap.get(message.src);
				await conn.onOffer(message.offer);
				break;
			}
			case "icecandidate": {
				const conn = this.socketMap.get(message.src);
				await conn.onIceCandidate(message.candidate);
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
		clearInterval(this.interval);
		clearTimeout(this.timeout);
	}
}
