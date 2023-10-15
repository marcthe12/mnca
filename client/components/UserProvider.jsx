import {createContext, useContext, useEffect, useState, useRef} from "react"
import { UserAuth } from "../UserAuth"

const UserContex = createContext(null)

export function useUser () {
	return useContext(UserContex)?.user
}

export function UserContext ({children}) {

	const [
			token,
			setToken
		] = useState()

	const user = useRef(null)

	useEffect(
		() => {
			user.current = new UserAuth()
			setToken(user.current.token)
			user.current.onSignin = token => {
				setToken(token)
			}
			user.current.onSignOut = () => {setToken()}
		},[]
	)

	return <UserContex.Provider value={{user:user.current,token}}>{children}</UserContex.Provider>

}
