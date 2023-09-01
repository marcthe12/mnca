import mongoose from "mongoose"
import crypto from "node:crypto"

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, index: { unique: true } },
    password: { type: String },
    salt: { type: String }
}, {
    methods: {
        setPassword(password) {
            this.salt = crypto.randomBytes(16).toString('hex')
            this.password = crypto.pbkdf2Sync(password, this.salt,
                1000, 64, `sha512`).toString(`hex`)
        },
        validPassword(password) {
            var hash = crypto.pbkdf2Sync(password,
                this.salt, 1000, 64, `sha512`).toString(`hex`)
            return this.password === hash
        }
    }
})

export const User = mongoose.model('User', userSchema)
