import js from "@eslint/js"
import globals from "globals"
import reactRecommended from "eslint-plugin-react/configs/recommended.js"
import reactJSX from "eslint-plugin-react/configs/jsx-runtime.js"
import reactHooks from "eslint-plugin-react-hooks"

const browser = {...globals.browser}
delete browser["AudioWorkletGlobalScope "]

export default [
	js.configs.recommended,
	{
		"rules": {
			"indent": [
				"error",
				"tab"
			],
			"quotes": [
				"error",
				"double"
			],
			"semi": [
				"error",
				"never"
			],
			"no-tabs": ["off"]

		}
	},
	{
		"files": ["server/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
		"languageOptions": {
			"globals": {
				...globals.node
			}
		}
	},
	{
		"files": ["client/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
		...reactRecommended
	},
	{
		"files": ["client/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
		...reactJSX
	},
	{
		"files": ["client/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
		...reactHooks.recommended
	},
	{
		"files": ["client/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
		"settings": {
			"react": {
				"version": "detect"
			}
		},
		"languageOptions": {
			"parserOptions": {
				"ecmaFeatures": {
					"jsx": true
				}
			},
			"globals": {
				...browser
			}
		},
		"rules": {
			"react/prop-types": ["off"]
		}

	}
]

