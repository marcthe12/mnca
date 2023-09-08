import {createContext, useContext, useEffect, useState, useRef} from "react"
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

	const socketMap = useRef({})
	
	useEffect(
		() => {
			const url = new URL(window.location.href)
			url.pathname = "/"
			url.protocol = "ws"
			if (user.token) {
				url.searchParams.set("token", user.token)
			}
			const result = new WebSocket(url)
			result.addEventListener("open", function(){
				this.addEventListener("message", async function({data}){

					const message = JSON.parse(data)

					const createPeer = (recv) => {
						let makingOffer = false
						let ignoreOffer = false
						const polite = true

						const conn = {
							id: recv,
							rtc: new RTCPeerConnection({
								iceServers: [
									{
										urls: "stun:stun.services.mozilla.com",
									},
								]
							}),
							sendSignal: (data) => {
								return this.send(JSON.stringify({
									type: "proxy",
									dest: recv,
									...data
								}))
							},
							close(){
								this.rtc.close()
							},
							async onOffer(offer){
								const offerCollision = offer.type === "offer" && (makingOffer ||this.rtc.signalingState !== "stable")

								ignoreOffer = !polite && offerCollision
								if (ignoreOffer) {
									return
								}
								
								await this.rtc.setRemoteDescription(offer)
								if (offer.type === "offer") {
									await this.rtc.setLocalDescription()
									this.sendSignal({ 
										action:"offer", 
										offer: this.rtc.localDescription 
									})
								}
							},
							async onIceCandidate(candidate){
								try {
									console.log(candidate)
									await this.rtc.addIceCandidate(candidate)
								} catch (err) {
									if (!ignoreOffer) {
										throw err
									}
								}
							}
						}
						socketMap.current[recv] = conn

						conn.rtc.addEventListener("negotiationneeded", async function(){
							try{
								makingOffer = true
								await this.setLocalDescription()
								conn.sendSignal({
									action: "offer",
									offer: this.localDescription
								})
							} finally {
								makingOffer = false
							}
						})

						conn.rtc.addEventListener("icecandidate", async function({ candidate }){
							if (candidate !== null) {
								conn.sendSignal({
									action: "icecandidate",
									candidate,
								})
							}
						})


						conn.rtc.addEventListener("oniceconnectionstatechange", function() {
							if (this.iceConnectionState === "failed") {
								this.restartIce()
							}
						})

						conn.rtc.addEventListener("datachannel", async function({ channel }){
							console.log(channel)
						})

						return conn
	
					}

					switch (message.type) {
					case "normal":{
						switch (message.action) {
						case "subscribe":{
							const conn = createPeer(message.client)
							conn.sendSignal({action: "ack"})
							setTimeout(()=> { console.log(conn) }, 20000)
							break
						}
						case "unsubscribe":{
							if(socketMap.current[message.client]){
								socketMap.current[message.client].close()
								delete socketMap?.current[message.client]
							}
							break
						}
						}
						break
					}
					case "proxy":{
						switch (message.action) {
						case "ack":{
							const conn = createPeer(message.src)
							conn.rtc.createDataChannel(message.client)
							setTimeout(()=> { console.log(conn) }, 20000)
							break
						}
						case "offer":{
							const conn = socketMap.current[message.src]
							await conn.onOffer(message.offer)
							break
						}
						case "icecandidate":{
							const conn = socketMap.current[message.src]
							await conn.onIceCandidate(message.candidate)
							break
						}
						}
						break
					}
					}

				})
			})
			setSocket(result)
			return () => {
				Object.values(socketMap.current).forEach(val => {
					val?.close()
				})
				result.close()
			}

		},
		[user]
	)

	return <WebSocketContex.Provider value={socket}>{children}</WebSocketContex.Provider>

}
