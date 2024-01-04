import {useState} from "react"
import {useUser} from "./components/UserProvider.jsx"
import MainArea from "./components/MainArea.jsx"
import RegistrationForm from "./components/RegistrationForm.jsx"
import LoginForm from "./components/LoginForm.jsx"

function Logout () {

	const [
		mode,
		setMode
	] = useState(true)
	return (
		<div>
			<div>
				<button className="p-4" onClick={() => setMode(true)}>Login</button>
				<button className="p-4" onClick={() => setMode(false)}>Register</button>
			</div>
			<div className="p-4">
				{mode
					? <LoginForm />
					: <RegistrationForm />}
			</div>
		</div>
	)

}

export default function MainApp () {

	const user = useUser()

	return user?.token
		? <MainArea />
		: <Logout />

}
