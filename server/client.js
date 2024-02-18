import express, { Router } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import wrap from "./wrap.js";

const environment = process.env.NODE_ENV;

function generateHTML(manifest) {
	let files = "";
	if (environment === "production") {
		const manifest_val = Object.values(manifest);
		files = manifest_val.map(({ css, file }) => {
			let out = "";
			if (css) {
				out += css.map(cssFile => `<link rel="stylesheet" href="${cssFile}">`).join("");
			}
			if (file.endsWith(".js")) {
				out += `<script type="module" src="${file}"></script>`;
			} else if (file.endsWith(".svg")) {
				out += `<link rel="icon" type="image/svg+xml" href="${file}">`;
			}
			return out;
		}).join("");
	} else {
		files = `<link rel="icon" type="image/svg+xml" href="/client/assets/icon.svg" />
		<script type="module" src="http://localhost:5173/@vite/client"></script>
		<script type="module">
			import RefreshRuntime from "http://localhost:5173/@react-refresh";
			RefreshRuntime.injectIntoGlobalHook(window);
			window.$RefreshReg$ = () => {};
			window.$RefreshSig$ = () => (type) => type;
			window.__vite_plugin_react_preamble_installed__ = true;
		</script>
		<script type="module" src="http://localhost:5173/client/main.jsx"></script>
		`;
	}
	return `<!DOCTYPE html><html lang=en><head><meta charset=utf8>
		<meta name="viewport" content="width=device-width, initial-scale=1.0"><title>MNCA</title>${files}</head></html>`;
}


function assetExtensionRegex() {
	const supportedAssets = [
		"svg",
		"png",
		"jpg",
		"png",
		"jpeg",
		"mp4",
		"ogv"
	];
	const formattedExtensionList = supportedAssets.join("|");
	return new RegExp(`/.+\\.(${formattedExtensionList})$`);
}

function asset() {
	const router = Router();
	router.get(
		assetExtensionRegex(),
		(req, res) => {
			res.redirect(303, `http://localhost:5173/client${req.path}`);
		}
	);
	return router;
}

async function parseManifest() {
	if (environment !== "production") {
		return {};
	}

	const manifestPath = path.join(
		path.resolve(),
		"dist",
		".vite",
		"manifest.json"
	);
	return await readJsonFile(manifestPath);
}

async function readJsonFile(Path) {
	const file = await fs.readFile(Path, { "encoding": "utf-8" });
	return JSON.parse(file);
}

async function root(_req, res) {
	const manifest = await parseManifest();
	res.send(generateHTML(manifest));
}

export default function() {
	const router = Router();
	if (process.env.NODE_ENV === "production") {
		router.use(express.static(path.join(path.resolve(), "dist")));
	} else {
		router.use(express.static(path.join(path.resolve(), "public")));
		router.use("/client", asset());
	}

	router.get("/", wrap(root));
	return router;
}
