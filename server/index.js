import mongoose from "mongoose"
import { Server } from "socket.io"
import http from "node:http"
import createApp from "./createApp.js"
import connect from "./connect.js"

export default async function () {
    await mongoose.connect(process.env.MONGO_URL)

    const app = createApp()

    const server = http.createServer(app)
    const io = new Server(server, {       
      });

    io.on('connection', connect)
      
    server.listen(process.env.PORT ?? 3000, function () { console.log(`HTTP Server is Starting}`) })

    server.on("close", () => { console.log("HTTP Server is Stopping") })

}


