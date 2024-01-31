import {StrictMode} from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";

const root = document.createElement("div");
document.body.append(root);
ReactDOM.createRoot(root).render(<StrictMode><App /></StrictMode>);
