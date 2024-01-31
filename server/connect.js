import { WebSocketServer } from "ws";
import Token from "./Token.js";
import crypto from "node:crypto";

class SocketMap {
	constructor() {
		this.db = new Map();
		this.userIndex = new Map();
	}
	add(socket) {
		this.db.set(socket.id, socket);
		if (!this.userIndex.has(socket.user)) {
			this.userIndex.set(socket.user, []);
		}
		this.userIndex.get(socket.user).push(socket);
	}
	remove(socket) {
		this.db.delete(socket.id);
		const userSockets = this.userIndex.get(socket.user);
		userSockets.splice(userSockets.indexOf(socket), 1);
	}
	getSocketFromId(id) {
		return this.db.get(id);
	}
	getUserSockets(user) {
		return this.userIndex.get(user) ?? [];
	}
}

class SubscribeSocket {
	constructor(db, onAdd = () => { }, onRemove = () => { }) {
		this.db = db;
		this.subList = new Set();
		this.onAdd = onAdd;
		this.onRemove = onRemove;
	}
	add(user) {
		if (!this.subList.has(user)) {
			this.subList.add(user);
			this.onAdd(user);
		}
	}
	delete(user) {
		if (this.subList.delete(user)) {
			this.onRemove(user);
		}
	}
	clear() {
		this.subList.forEach(user => this.delete(user));
	}
}

const userSessions = new SocketMap();

function broadcastToUser(user, id, action, data = {}) {
	(userSessions.getUserSockets(user) ?? []).forEach((recvClient) => {
		if (recvClient.id !== id) {
			const message = { type: "normal", action, client: id, recv: user, ...data };
			recvClient.ws.send(JSON.stringify(message));
		}
	});
}

function sendAck(ws, data, timeout, ackid = crypto.randomUUID(),) {
	return new Promise((resolve) => {
		const timer = setTimeout(() => {
			delete var1[ackid];
			resolve(false);
		}, timeout);
		var1[ackid] = (_msg, unsubscribe) => {
			clearTimeout(timer);
			unsubscribe();
			resolve(true);
		};
		ws.send(JSON.stringify({ ...data, ackid }));
	});
}

async function sendToUserOneByOne(user, id, action, data = {}) {
	const sockets = userSessions.getUserSockets(user) ?? [];
	for (const recvClient of sockets) {
		if (recvClient.id !== id) {
			const message = { type: "normal", action, client: id, user, ...data };
			const status = await sendAck(recvClient.ws, message, 5000);
			if (status) {
				return;
			}
		}
	}
}

const var1 = {};

export default function(server) {
	const wss = new WebSocketServer({ server });
	wss.on("connection", async function(ws, req) {
		const searchParams = new URL(req.url, `ws://${req.headers.host}`).searchParams;
		const token = searchParams.get("token");
		const id = searchParams.get("id");
		var tken;
		try {
			tken = await Token.verify(token); //token verification
		} catch (err) {
			ws.close(1008, "Forbidden");
			return;
		}

		const { user } = tken;

		const socket = { user, ws, id };
		userSessions.add(socket);

		console.log(user);
		const subList = new SubscribeSocket(
			userSessions,
			recv => broadcastToUser(recv, socket.id, "subscribe", { user }),
			recv => broadcastToUser(recv, socket.id, "unsubscribe", { user })
		);
		subList.add(user);

		let pingInterval = setInterval(() => {
			ws.ping();
		}, 30000);

		ws.on("pong", () => {
			clearInterval(pingInterval);
			setTimeout(() => {
				pingInterval = setInterval(() => {
					ws.ping();
				}, 30000);
			}, 30000);
		});

		ws.on("close", function(code, reason) {
			subList.clear();
			userSessions.remove(socket);
			console.error(code, reason);
		});
		ws.on("message", async function(message) {
			const msg = JSON.parse(message);
			if (msg.ref && var1[msg.ref]) {
				await var1[msg.ref](msg, () => delete var1[msg.ref]);
				return;
			}

			switch (msg.type) {
			case "normal": {
				const user = msg.user;
				switch (msg.action) {
				case "subscribe": {
					subList.add(user);
					break;
				}
				case "unsubscribe": {
					subList.delete(user);
					break;
				}
				case "join": {
					sendToUserOneByOne(user, socket.id, "join", { group: msg.group });
					break;
				}
				case "leave": {
					sendToUserOneByOne(user, socket.id, "leave", { groupId: msg.groupId });
					break;
				}
				}
				break;
			}
			case "proxy": {
				const target = userSessions.getSocketFromId(msg.dest);
				target?.ws.send(JSON.stringify({ src: socket.id, ...msg }));
				break;
			}
			}
		});
	});
}
