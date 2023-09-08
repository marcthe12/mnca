import mongoose from "mongoose"
import http from "node:http"
import createApp from "./createApp.js"
import websocket from "./connect.js"

export default async function () {

	await mongoose.connect(process.env.MONGO_URL)
	const app = createApp()
	const server = http.createServer(app)
	websocket(server)

	server.listen(
		process.env.PORT ?? 3000,
		() => {

			console.log("HTTP Server is Starting}")

		}
	)

	server.on(
		"close",
		() => {

			console.log("HTTP Server is Stopping")

		}
	)

}


