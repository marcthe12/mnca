import {Router} from "express"
import {User} from "./User.js"
import Token from "./Token.js"

async function register (req, res) {

	const {username, password} = req.body
	const newUser = new User({username})
	newUser.setPassword(password)
	await newUser.save()
	res.send({"msg": "User registered successfully."})

}

async function login (req, res) {

	const {username, password} = req.body
	const user = await User.findOne({username})
	if (user) {

		if (user.validPassword(password)) {

			const token = Token.sign({"user": username})
			return res.status(200).json({"message": "Login Sucessful",
				token,
				username})

		}

		return res.status(401).send({
			"message": "Wrong Password"
		})

	}
	res.status(401).send({"message": "Invalid username"})

}

export default function () {

	const route = Router()
	route.post(
		"/register",
		register
	)
	route.post(
		"/login",
		login
	)

	return route

}