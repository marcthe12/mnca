import {createContext, useContext, useEffect, useState} from "react"
import api from "../api.js"

const UserContex = createContext(null)

export function useUser () {

	return useContext(UserContex)

}

function JWTdecode (token) {

	const list = token.split(".")
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	}

}

export function UserContext ({children}) {

	const [
			token,
			setToken
		] = useState(localStorage.getItem("token")),

	 loginRequest = api("/login")

	async function signIn (username, password) {

		const data = await loginRequest({username,
			password})
		setToken(data.token)

	}

	async function signOut () {

		setToken()

	}

	useEffect(
		() => {

			if (token) {

				localStorage.setItem(
					"token",
					token
				)

			} else {

				localStorage.removeItem("token")

			}

		},
		[token]
	)

	return <UserContex.Provider value={{
		get "data" () {

			return this.token
				? JWTdecode(this.token)
				: null

		},
		get "token" () {

			return token

		},
		signIn,
		signOut
	}}>{children}</UserContex.Provider>

}
