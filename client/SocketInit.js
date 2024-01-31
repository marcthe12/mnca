import SocketMap from "./SocketMap.js";
import config from "./config.js";
export default class SocketInit {
	constructor(userAuth) {
		this.getuserauth = userAuth;
		this.socketMap = new SocketMap(this);
		const url = new URL(config.websocket);
		if (userAuth.token) {
			url.searchParams.set("token", userAuth.token);
			url.searchParams.set("id", this.id);
		}
		const result = new WebSocket(url);
		result.addEventListener("open", async () => {
			this.result = result;
			this.result.addEventListener("message", async ({ data }) => {
				this.handleMessage(data);
			});
		});
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
				await conn.sendSignal({ action: "setup" });
				break;
			}
			case "setup": {
				const conn = this.socketMap.get(message.src);
				//conn.rtc.createDataChannel(message.client);
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
	}
}
