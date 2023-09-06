import jwt from "jsonwebtoken"

class Token {

	constructor (secretKey = process.env.SECRET) {

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
