import { WebSocketServer } from "ws"
import crypto from "node:crypto"
import Token from "./Token.js"

class SocketMap{
	constructor(){
		this.set = new Set()
	}
	add(socket){
		this.set.add(socket)
	}
	remove(socket) {
		this.set.delete(socket)
	}
	getSocketFromId(id){
		return Array.from(this.set).find((socket) => socket.id === id)
	}
	getUserSockets(user) {
		return Array.from(this.set).filter((socket) => socket.user === user)
	}
}

const userSessions = new SocketMap()

export function connection (socket) {
	const username = socket.data.username
	socket.join(username)
	userSessions.add(socket)
	socket.emit("connectionSuccess", socket.id)
	socket.to(username).emit("temporal", socket.id)
	
	socket.on("offer", function(message){
		const target = userSessions.getSocketFromId(message.dest)
		target?.emit("offer", message)
	})

	socket.conn.on("upgrade", (transport) => {
		console.log(`transport upgraded to ${transport.name}`)
	})

	socket.on("disconnect", function (reason) {
		console.log(`Disconnected ${reason}`)
		userSessions.remove(socket)
	})
}

function broadcastToUser(user, id, action) {
	(userSessions.getUserSockets(user) ?? []).forEach((recvClient) => {
		if (recvClient.id !== id) {
			const message = { type: "normal", action, client: id, user }
			recvClient.ws.send(JSON.stringify(message))
		}
	})
}

export default function(server){
	const wss = new WebSocketServer({ server })
	wss.on("connection", function(ws, req){
		const token = new URL(req.url, `ws://${req.headers.host}`).searchParams.get("token")
		var user
		try{	
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

		ws.on("close", function(code, reason){
			subList.forEach((user) =>
				broadcastToUser(user, socket.id, "unsubscribe")
			)
			userSessions.remove(socket)
			console.log(userSessions)
			console.error(code, reason)
		})
		ws.on("message", function(message){
			const msg = JSON.parse(message)
		
			console.log(msg)
			switch (msg.type) {
			case "normal":{
				const user = msg.user
				switch (msg.action) {
				case "subscribe":{
					subList.add(user)	//bug	
					broadcastToUser(user, socket.id, msg.action)
					break
				}
				case "unsubscribe":{
					subList.remove(user)		
					broadcastToUser(user, socket.id, msg.action)
					break
				}
				}
				break
			}
			case "proxy":{
				const target = userSessions.getSocketFromId(msg.dest)
				target?.ws.send(JSON.stringify({src: socket.id, ...msg}))
				break
			}
			}
		})
	})
}
