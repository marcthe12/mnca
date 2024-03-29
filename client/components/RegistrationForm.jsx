import { useState } from "react";
import { useUser } from "./UserProvider.jsx";
import api from "../api.js";

export default function RegistrationForm() {
	const user = useUser();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");

	const registerRequest = api("/register");

	async function handleSubmit(e) {
		e.preventDefault();

		const data = await registerRequest({
			username,
			password,
		});
		if(data && data.status === false){
			alert("Username already exists, try login!")
		} else {
			await user.signIn(username, password);
		}
		
	}

	function handleUsernameChange(e) {
		setUsername(e.target.value);
	}

	function handlePasswordChange(e) {
		setPassword(e.target.value);
	}

	return (
		<div className="flex items-top justify-center min-h-screen">
			<div className="w-full max-w-md">
				<form
					onSubmit={handleSubmit}
					className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
				>
					<div className="mb-4">
						<label
							className="block text-gray-700 text-sm font-bold mb-2"
							htmlFor="username"
						>
              Username
						</label>
						<input
							className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							id="username"
							type="text"
							placeholder="Username"
							value={username}
							onChange={handleUsernameChange}
						/>
					</div>
					<div className="mb-6">
						<label
							className="block text-gray-700 text-sm font-bold mb-2"
							htmlFor="password"
						>
              Password
						</label>
						<input
							className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
							id="password"
							type="password"
							placeholder="Password"
							value={password}
							onChange={handlePasswordChange}
						/>
					</div>
					<div className="flex items-center justify-between">
						<button
							type="submit"
							className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
						>
              Register
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
