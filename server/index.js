import express from "express"
import morgan from "morgan"
import bodyParser from "body-parser"
import mongoose from "mongoose"
import http from "node:http"
import api from "./api.js"
import client from "./client.js"

export default async function () {
    await mongoose.connect(process.env.MONGO_URL)

    const app = express()

    app.use(morgan("tiny"))
    app.use(bodyParser.json())

    app.use(api())

    app.use(client())

    const server = http.createServer(app)

    server.listen(process.env.PORT ?? 3000, function () { console.log(`HTTP Server is Starting}`) })

    server.on("close", () => {console.log("HTTP Server is Stopping")})

}

