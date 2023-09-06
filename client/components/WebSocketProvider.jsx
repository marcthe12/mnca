import {createContext, useContext, useEffect, useState} from "react"
import {io} from "socket.io-client"
import {useUser} from "./UserProvider.jsx"


const WebSocketContex = createContext(null)

export function useWebSocket () {
	return useContext(WebSocketContex)
}

export function WebSocketProvider ({children}) {

	const user = useUser()
	const [
			socket,
			setSocket
		] = useState(null)
	
	useEffect(
		() => {
			const result = user.token
				? io({
					"auth": {"token": user.token}
				})
			: null
			setSocket(result)

			return () => socket?.disconnect()
		},
		[user]
	)

	useEffect(
		() => {
			if(socket !== null){
				console.log(socket)
				socket.on("connectionSuccess", (message) => {
					console.log(message)
				})
				socket.on("temporal", (message) => {
					console.log(message)
				})
			}
		},
		[socket]
	)

	return <WebSocketContex.Provider value={socket}>{children}</WebSocketContex.Provider>

}
