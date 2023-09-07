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
	getUserSocket(username){
		return Array.from(this.set).filter(({data}) => data.username === username)
	}
}

const userSessions = new SocketMap()

export function auth (socket, next) {
	const {token} = socket.handshake.auth
	try{	
		const { user } = Token.verify(token)
		socket.data.username = user
		next()
	} catch (err) {
		next(err)
	}

}

export default function connection (socket) {
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

	socket.on("disconnect", function () {
		console.log("Disconnected")
		userSessions.remove(socket)
	})
}

