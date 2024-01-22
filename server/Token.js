import jwt from "jsonwebtoken"
import config from "./config.js"

class Token {
	constructor(secretKey = config.secret) {
		this.secret = secretKey
	}

	async sign(token, options) {
		return await new Promise((resolve, reject) => {
			jwt.sign(token, this.secret, options, (err, result) => {
				if (err) {
					reject(err)
				} else {
					resolve(result)
				}
			})
		})
	}

	async verify(token, options) {
		return await new Promise((resolve, reject) => {
			jwt.verify(token, this.secret, options, (err, result) => {
				if (err) {
					reject(err)
				} else {
					resolve(result)
				}
			})
		})
	}
}

const tokenHandler = new Token()

export default tokenHandler
