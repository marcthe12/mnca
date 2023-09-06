import {defineConfig, splitVendorChunkPlugin} from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
	"build": {
		"manifest": true,
		"rollupOptions": {
			"input": "./client/main.jsx"
		}
	},
	"plugins": [
		react(),
		splitVendorChunkPlugin()
	]
})
