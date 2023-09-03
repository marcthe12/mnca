import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useUser } from "./UserProvider.jsx"

const WebSocketContex = createContext(null)

export function useWebSocket() {
    return useContext(IndexDBContex)
}

export function WebSocketProvider({ children }) {
    const user = useUser()
    const [socket, setSocket] = useState(null)
    useEffect(() => {
        (async () => {
            if (socket) {
                socket.close()
            }
            const result = user.token ? io({ 
                query: { token: user.token } 
            }) : null
            setSocket(result)
        })()
    }, [user])

    return <WebSocketContex.Provider value={socket}>{children}</WebSocketContex.Provider>
}
