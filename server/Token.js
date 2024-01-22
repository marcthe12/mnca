import jwt from "jsonwebtoken"
import config from "./config.js"

class Token {
	constructor (secretKey = config.secret) {
		this.secret = secretKey
	}

	sign (token, options) {
		return jwt.sign(
			token,
			this.secret,
			options
		)
	}

	verify (token, options) {
		return jwt.verify(
			token,
			this.secret,
			options
		)
	}

}
const tokenHandler = new Token()

export default tokenHandler
