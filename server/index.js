import mongoose from "mongoose"
import http from "node:http"
import createApp from "./createApp.js"
import websocket from "./connect.js"
import config from "./config.js"

export default async function () {
	await mongoose.connect(config.mongo_url)
	const app = createApp()
	const server = http.createServer(app)
	websocket(server)

	server.listen(
		config.port,
		() => {
			console.log("HTTP Server is Starting")
		}
	)

	server.on(
		"close",
		() => {
			console.log("HTTP Server is Stopping")
		}
	)

}


