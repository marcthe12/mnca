import fs from "fs/promises"

const default_cfg = {
	port: process.env.PORT ?? 3000,
	mongo_url: process.env.MONGO_URL,
	secret: process.env.SECRET
}

async function readJSON(file) {
	let data
	try {
		data = await fs.readFile(file, "utf8")
	} catch (err) {
		console.error("Error reading the config file:", err.message)
		return {}
	}
	return JSON.parse(data)
}

export default { 
	...default_cfg, 
	...await readJSON(process.env.CONFIG ?? "./config.json") 
}
