import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import api from "./api.js";
import client from "./client.js";

export default function() {
    const app = express();

    app.use(morgan("tiny"));
    app.use(bodyParser.json());

    app.use(api());

    app.use(client());
    return app;
}
