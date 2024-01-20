import {StrictMode} from "react"
import ReactDOM from "react-dom/client"
import "./index.css"
import App from "./App"

console.log(window.isSecureContext)
const isPersisted = await navigator.storage.persist()
console.log(await navigator.storage.persisted())
console.log(await navigator.storage.estimate())

const root = document.createElement("div")
document.body.append(root)
ReactDOM.createRoot(root).render(<StrictMode><App /></StrictMode>)
