import { Router } from "express"
import { User } from "./User.js"
import Token from "./Token.js"
import config from "./config.js"

async function register(req, res) {

	const { username, password } = req.body
	const newUser = new User({ username })
	newUser.setPassword(password)
	await newUser.save()
	res.send({ "msg": "User registered successfully." })

}

async function client_config(req, res) {
	return res.status(200).json({
		websocket: config.websocket,
		iceProxies: config.iceProxies
	})
}
async function login(req, res) {

	const { username, password } = req.body
	const user = await User.findOne({ username })
	if (user) {

		if (user.validPassword(password)) {

			const token = Token.sign({ "user": username })
			return res.status(200).json({
				"message": "Login Sucessful",
				token,
				username
			})

		}

		return res.status(401).send({
			"message": "Wrong Password"
		})

	}
	res.status(401).send({ "message": "Invalid username" })

}
async function searchUser(req, res) {
	const { username } = req.body
	const user = await User.findOne({ username })
	if (user) {
		return res.status(200).json({ success: true })
	}

	return res.status(200).send({
		success: false,
		message: "User Not Found"
	})
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
	route.post(
		"/search",
		searchUser
	)
	route.post(
		"/config",
		client_config
	)
	return route

}
