import express, {Router} from "express"
import path from "node:path"
import fs from "node:fs/promises"

const environment = process.env.NODE_ENV

function assetExtensionRegex () {

	const supportedAssets = [
		"svg",
		"png",
		"jpg",
		"png",
		"jpeg",
		"mp4",
		"ogv"
	]
	const formattedExtensionList = supportedAssets.join("|")

	return new RegExp(`/.+\.(${formattedExtensionList})$`)

}

function asset () {

	const router = Router()

	router.get(
		assetExtensionRegex(),
		(req, res) => {

			res.redirect(
				303,
				`http://localhost:5173/client${req.path}`
			)

		}
	)

	return router

}

async function parseManifest () {

	if (environment !== "production") {

		return {}

	}

	const manifestPath = path.join(
		path.resolve(),
		"dist",
		"manifest.json"
	)
	return await readJsonFile(manifestPath)

}

async function readJsonFile (Path) {

	const file = await fs.readFile(
		Path,
		{"encoding": "utf-8"}
	)

	return JSON.parse(file)

}

export default function () {

	const router = Router()

	if (process.env.NODE_ENV === "production") {

		router.use(express.static(path.join(
			path.resolve(),
			"dist"
		)))

	} else {

		router.use(express.static(path.join(
			path.resolve(),
			"public"
		)))
		router.use(
			"/client",
			asset()
		)

	}

	router.get(
		"/",
		async (_req, res) => {

			const data = {
				environment,
				"manifest": await parseManifest()
			}

			res.render(
				"index.html.ejs",
				data
			)

		}
	)

	return router

}
