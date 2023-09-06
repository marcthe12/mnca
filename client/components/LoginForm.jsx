import {useState} from "react"
import {useUser} from "./UserProvider.jsx"

export default function LoginForm () {

	const user = useUser(),
	 [
			username,
			setUsername
		] = useState(""),
	 [
			password,
			setPassword
		] = useState("")

	async function handleSubmit (e) {

		e.preventDefault()
		await user.signIn(
			username,
			password
		)

	}

	function handleUsernameChange (e) {

		setUsername(e.target.value)

	}

	function handlePasswordChange (e) {

		setPassword(e.target.value)

	}

	return (
		<div>
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					placeholder="Username"
					value={username}
					onChange={handleUsernameChange} />
				<input
					type="password"
					placeholder="Password"
					value={password}
					onChange={handlePasswordChange} />
				<button type="submit">Login</button>
			</form>
		</div>
	)

}


