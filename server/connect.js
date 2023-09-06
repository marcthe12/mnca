import Token from "./Token.js"
import jwt from "jsonwebtoken"

const userSessions = new Map()

export function auth (socket, next) {

	const {token} = socket.handshake.auth
	if (Token.verify(token)) {

		const {user} = jwt.decode(token)
		socket.data.username = user

	} else {

		next(new Error("Invalid Tokens"))

	}

}

export default function connection (socket) {
	const username = socket.data.username
	socket.join(username)
	const userSession = userSessions.get(username)
	userSessions.set(username, [ ...(userSession ?? []), socket])

	socket.on("disconnect", () => {
		for (const [userId, userSession] of userSessions.entries()) {
			const sessionIndex = userSession.indexOf(socket)
			if (sessionIndex !== -1) {
				userSession.splice(sessionIndex, 1)
				if (userSession.length === 0) {
					userSessions.delete(userId)
				}
				break
			}
		}
	})
}

