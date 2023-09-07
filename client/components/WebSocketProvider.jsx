import {createContext, useContext, useEffect, useState, useRef} from "react"
import {io} from "socket.io-client"
import {useUser} from "./UserProvider.jsx"

function createPeer(socket, dest){
	const polite = true
	var makingOffer = false
	var ignoreOffer = false

	const conn = { 
		rtc: new RTCPeerConnection(),
		send(type, data){
			return socket.emit(type, {
				src: socket.id,
				dest,
				...data
			})
		},
		async recvOffer(description){
			    if (description) {
				const offerCollision = description.type === "offer" && (makingOffer || this.rtc.signalingState !== "stable")

				ignoreOffer = !polite && offerCollision
				if (ignoreOffer) {
					return
				}

				await this.rtc.setRemoteDescription(description)
				if (description.type === "offer") {
					await this.rtc.setLocalDescription()
					this.send({ description: this.rtc.localDescription })
				}
			}
		}
	}
	conn.rtc.addEventListener("negotiationneeded", async function(){
		try{
			makingOffer = true
			await this.setLocalDescription()
			conn.send("offer", {
				offer: this.localDescription
			})
		} catch (err){
			throw err
		} finally {
			makingOffer = false
		}
	})
	conn.rtc.addEventListener("icecandidate", async function({ candidate }){
		conn.send("offer", {
			candidate,
		})
	})
	return conn
}

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

	const socketMap = useRef({})
	
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
				socket.on("connectionSuccess", (message) => {
					console.log(message)
				})
				socket.on("temporal", async function(id) {
					socketMap.current[id] = createPeer(this, id) 
					const conn = socketMap.current[id] 
					conn.datachannel = conn.rtc.createDataChannel("Test")
				})

				socket.on("offer", async function({src, dest, offer}){
					console.log(socketMap)
					socketMap.current[src] ??= createPeer(this, src)
					const conn = socketMap.current[src] 
					await conn.recvOffer(offer)
				})
			}
		},
		[socket]
	)

	return <WebSocketContex.Provider value={socket}>{children}</WebSocketContex.Provider>

}
