import { createContext, useContext, useEffect, useState, useRef } from "react"
import UserAuth from "../UserAuth.js"

const UserContex = createContext(null)

export function useUser() {
	return useContext(UserContex)?.user
}

export function UserContext({ children }) {
	const [token, setToken] = useState()

	const user = useRef(null)

	useEffect(
		() => {
			user.current = new UserAuth()
			user.current.onSignin = token => {
				setToken(token)
			}
			user.current.onSignin(user.current.token)
			user.current.onSignOut = () => { setToken() }
		}, []
	)

	return <UserContex.Provider value={{
		user: user.current,
		get token() { return token }
	}}>{children}</UserContex.Provider>

}
