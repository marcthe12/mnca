import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"

const UserContex = createContext(null)

export function useUser() {
    return useContext(UserContex)
}

function jwtdecode(token) {
    const list = token.split(".")
    return {
        header: JSON.parse(atob(list[0])),
        body: JSON.parse(atob(list[1])),
        signature: list[2]
    }
}

export function UserContext({ children }) {
    const [token, setToken] = useState("")

    function setTokenData(newToken) {
        if (newToken) {
            setToken(newToken)
        } else {
            setToken("")
        }
    }

    async function signIn(username, password) {
        const response = await fetch('/login', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(
                {
                    username,
                    password,
                })
        })

        if (response.error) {
            console.error('Registration failed:', response.statusText)
        } else {
            const data = await response.json()
            localStorage.setItem('token', data.token)
            setTokenData(data.token)
        }
    }

    async function signOut() {
        localStorage.removeItem('token')
        setTokenData(null)
    }

    useEffect(() => {
        const newToken = localStorage.getItem("token")
        setTokenData(newToken)
    }, [])

    return <UserContex.Provider value={{
        get data() {
            return this.token ? jwtdecode(this.token) : null
        }, token,
        signIn,
        signOut
    }}>{children}</UserContex.Provider>
}
