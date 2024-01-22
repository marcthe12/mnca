import "dotenv/config"
import {fileURLToPath} from "node:url"
import {dirname} from "node:path"
import {chdir} from "node:process"



await init()
await (await import("./server/index.js")).default()

async function init () {
	const currentModuleUrl = import.meta.url
	const currentModulePath = fileURLToPath(currentModuleUrl)
	const currentDirectory = dirname(currentModulePath)
	chdir(currentDirectory)
}

