import api from "./api.js"
import SocketInit from "./SocketInit"
import { openDB } from "idb"
import { blobToBase64, Base64ToBlob } from "./Blob64.js"

export default class UserAuth {
	constructor() {
		this.connect = new SocketInit(this)
		this.connect.socketMap.onRecieve = async message => await this.recieveNewMessage(message)
		this.setToken(localStorage.getItem("token"))
		this.onMessageGroupChange = {}
		this.errormsg = ""
	}
	get token() {
		return this._token
	}

	async setToken(value = null) {
		this._token = value
		if (value) {
			this.connect.connect()
			localStorage.setItem("token", value)
			await this.dbconnect()
			this.onSignin?.(value)
		}
		else {
			this.connect.close()
			this.db?.close()
			this.onSignOut?.()
		}
	}

	get data() {
		return this.token
			? JWTdecode(this.token)
			: null
	}

	async dbconnect() {
		this.db = this.token
			? await openDB(
				this.data.body.user, 3,
				{
					upgrade(db) {
						db.createObjectStore(
							"groups",
							{ "keyPath": "groupId" }
						)
						const messageStore = db.createObjectStore(
							"messages",
							{ "keyPath": "messageId" }
						)
						messageStore.createIndex(
							"groupIndex",
							"groupId",
							{ "unique": false }
						)

					}
				}
			)
			: null
	}
	async getGroups() {
		const message = await this.db?.getAll("groups") ?? []
		console.log(message)
		this.onGroupChange?.(message)
	}

	async addGroup(groupobjects) {
		await this.db.add("groups", groupobjects)
		await this.getGroups()
	}
	async getGroupMessages(groupId) {
		const message = await this.db?.getAllFromIndex(
			"messages",
			"groupIndex",
			groupId
		) ?? []
		message.sort((a, b) => {
			const dateA = new Date(a.date)
			const dateB = new Date(b.date)
			return dateA - dateB

		})

		this.onMessageGroupChange[groupId]?.(message)

	}
	async sendNewMessage(groupId, message, parentId) {
		if (message instanceof File) {
			message = await blobToBase64(message)
		}
		const data = {
			"name": this.data.body.user,
			message,
			"date": new Date(),
			groupId,
			parentId,
			"messageId": crypto.getRandomValues(new Uint8Array(8)).toString()
		}
		await this.connect.socketMap.sendAllClients(data, this.data.body.user)
		return data
	}
	async recieveNewMessage(message) {
		console.log("arq")
		console.log(message)
		message.date = new Date(message.date)
		if (typeof message.message === "object") {
			message.message = await Base64ToBlob(message.message)
		}
		console.log(message)
		await this.db.add("messages", message)
		console.log(this.onMessageGroupChange[message.groupId])
		await this.getGroupMessages(message.groupId)
	}

	async addNewMessage(groupId, message, parent) {
		const msg = await this.sendNewMessage(groupId, message, parent)
		await this.recieveNewMessage(msg)
	}
	async removeMessage(message) {
		this.db.delete("messages", message.messageId)
		await this.getGroupMessages(message.groupId)
	}
	// async signIn(username, password) {
	// 	const loginRequest = api("/login")
	// 	const data = await loginRequest({
	// 		username,
	// 		password
	// 	})
	// 	console.log(data)
	// 	this.setToken( data.token)
	// 	this.errormsg = data.message ?? ""
	// }
	async handleSignIn(data) {
		console.log(data)
		await this.setToken(data.token)
		this.errormsg = data.message ?? ""
	}

	async signIn(username, password) {
		const loginRequest = api("/login")
		const data = await loginRequest({
			username,
			password
		})
		await this.handleSignIn(data)
	}
	async signOut() {
		localStorage.removeItem("token")
		await this.setToken()
	}


}
function JWTdecode(token) {
	const list = token.split(".")
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	}
}
