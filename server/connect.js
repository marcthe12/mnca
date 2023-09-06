import Token from "./Token.js"
import jwt from "jsonwebtoken"

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
		return Array.from(this.set).filter((socket) => socket.id === id)
	}
	getUserSocket(username){
		return Array.from(this.set).filter(({data}) => data.username === username)
	}
}

const userSessions = new SocketMap()

export function auth (socket, next) {
	const {token} = socket.handshake.auth
	if (Token.verify(token)) {
		const {user} = jwt.decode(token)
		socket.data.username = user
		next()
	} else {
		next(new Error("Invalid Tokens"))
	}

}

export default function connection (socket) {
	const username = socket.data.username
	socket.join(username)
	userSessions.add(socket)
	socket.emit("connectionSuccess", socket.id)
	socket.to(username).emit("temporal", userSessions.getUserSocket(username).map(({id}) => id))

	socket.on("disconnect", function () {
		console.log("Disconnected")
		userSessions.remove(socket)
	})
}

