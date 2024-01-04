import { WebSocketServer } from "ws"
import crypto from "node:crypto"
import Token from "./Token.js"
import { User } from "./User.js"

class SocketMap {
	constructor() {
		this.set = new Set()
	}
	add(socket) {
		this.set.add(socket)
	}
	remove(socket) {
		this.set.delete(socket)
	}
	getSocketFromId(id) {
		return [...this.set].find((socket) => socket.id === id)
	}
	getUserSockets(user) {
		return [...this.set].filter((socket) => socket.user === user)
	}
}

const userSessions = new SocketMap()

function broadcastToUser(user, id, action) {
	(userSessions.getUserSockets(user) ?? []).forEach((recvClient) => {
		if (recvClient.id !== id) {
			const message = { type: "normal", action, client: id, user }
			recvClient.ws.send(JSON.stringify(message))
		}
	})
}

export default function (server) {
	const wss = new WebSocketServer({ server })
	wss.on("connection", function (ws, req) {
		const token = new URL(req.url, `ws://${req.headers.host}`).searchParams.get("token")
		var user
		try {
			user = Token.verify(token).user
		} catch (err) {
			ws.close(1008, "Forbidden")
			return
		}

		const subList = new Set()

		const socket = { user, ws, id: crypto.randomUUID() }
		userSessions.add(socket)
		subList.add(user)
		broadcastToUser(user, socket.id, "subscribe")

		console.log(userSessions)

		ws.on("close", function (code, reason) {
			subList.forEach((user) =>
				broadcastToUser(user, socket.id, "unsubscribe")
			)
			userSessions.remove(socket)
			console.log(userSessions)
			console.error(code, reason)
		})
		ws.on("message", async function (message) {
			const msg = JSON.parse(message)
			console.log(msg)
			if (message.type === "auth") {
				switch (msg.action) {
				case "login": {
					const { username, password } = msg
					const user = await User.findOne({ username })
					if (user) {
						if (user.validPassword(password)) {
							const token = Token.sign({ "user": username })
							socket.ws.send(JSON.stringify({
								type: "normal",
								action: "login",
								success: true,
								token,
								username
							}))
						} else {
							socket.ws.send(
								JSON.stringify({
									type: "normal",
									action: "login",
									success: false,
									message: "Wrong Password"
								})
							)
						}

					} else {
						socket.ws.send(JSON.stringify({
							type: "normal",
							action: "login",
							success: false,
							message: "Invalid username"
						})
						)
					}
					break
				}
				case "register": {
					const { username, password } = msg
					const newUser = new User({ username })
					newUser.setPassword(password)
					await newUser.save()
					socket.ws.send(JSON.stringify({
						type: "",
						action: "",
						success: true,
						message: "User registered successfully"
					})
					)
					break
				}
				}
				return
			}
			switch (msg.type) {
			case "normal": {
				const user = msg.user
				switch (msg.action) {
				case "subscribe": {
					subList.add(user)	//bug	
					broadcastToUser(user, socket.id, msg.action)
					break
				}
				case "unsubscribe": {
					subList.remove(user)
					broadcastToUser(user, socket.id, msg.action)
					break
				}
				}
				break
			}
			case "proxy": {
				const target = userSessions.getSocketFromId(msg.dest)
				target?.ws.send(JSON.stringify({ src: socket.id, ...msg }))
				break
			}
			}
		})
	})
}
