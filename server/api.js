import { Router } from "express";
import { User } from "./User.js";
import Token from "./Token.js";
import config from "./config.js";
import wrap from "./wrap.js";

async function register(req, res) {
	const { username, password } = req.body;
	try {
		const existingUser = await User.findOne({ username });
		if (existingUser) {
			return res.status(409).json({ message: "User already exists." , status: false});
		}
		const newUser = new User({ username });
		newUser.setPassword(password);
		await newUser.save();
		res.status(200).json({ message: "User registered successfully." , status: true});
	} catch (error) {
		res.status(500).json({ message: "Internal Server Error" , status: false});
	}
}
//409 err for reg fn
async function client_config(_req, res) {
	return res.status(200).json({
		websocket: config.websocket,
		iceProxies: config.iceProxies
	});
}

async function login(req, res) {
	const { username, password } = req.body;
	const user = await User.findOne({ username });
	if (user) {
		if (user.validPassword(password)) {
			const token = await Token.sign({ "user": username });
			return res.status(200).json({
				message: "Login Sucessful",
				status: true,
				token,
				username
			});
		}
		return res.status(401).send({
			message: "Wrong Password",
			status: false
		});
	}
	res.status(401).send({
		message: "Invalid username",
		status: false
	});
}

async function searchUser(req, res) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];
	if (token == null) {
		return res.status(401).send({ message: "Authorization Required" });
	}

	try {
		await Token.verify(token);
	} catch (err) {
		return res.status(403).send({ message: "Invalid User" });
	}

	const { username } = req.body;
	const user = await User.findOne({ username });
	if (user) {
		return res.status(200).json({ success: true });
	}

	return res.status(200).send({
		success: false,
		message: "User Not Found"
	});
}

export default function () {
	const route = Router();
	route.post(
		"/register",
		wrap(register)
	);
	route.post(
		"/login",
		wrap(login)
	);
	route.post(
		"/search",
		wrap(searchUser)
	);
	route.post(
		"/config",
		wrap(client_config)
	);
	return route;

}
