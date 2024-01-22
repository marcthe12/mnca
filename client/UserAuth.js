import { openDB } from "idb"
import api from "./api.js"
import { Base64ToBlob } from "./Blob64.js"
import FileTable from "./FileTable.js"
import GroupMap from "./GroupMap.js"
import SocketInit from "./SocketInit"
import { isDefined, JWTdecode } from "./utils.js"

export class UserAuth {
	constructor() {
		this.connect = null
		this.setToken(localStorage.getItem("token"))
		this.onMessageGroupChange = {}
	}
	get token() {
		return this._token
	}

	async setToken(value = null) {
		this._token = value
		if (value) {
			await this.dbconnect()
			var client = await this.db?.getAll("id")
			if (client.length === 0) {
				client = [crypto.randomUUID()]
				await this.db.add("id", client[0], client[0])
			}
			this.clientID = client[0]
			this.groupMap = new GroupMap(this)
			this.connect = new SocketInit(this)
			this.filetable = new FileTable(this)
			await this.groupMap.open()
			this.connect.socketMap.onConnect = (user, id) => this.groupMap.onOnline(user, id)
			this.connect.socketMap.onRecieve = data => this.handleRecieve(data) 
			localStorage.setItem("token", value)
			await this.getGroups()
			this.onSignin?.(value)
		}
		else {
			this.clientID = null
			this.groupMap = null
			this.filetable= null
			this.connect?.close()
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
				this.data.body.user,
				5,
				{
					upgrade(db) {
						db.createObjectStore(
							"id"
						)
						db.createObjectStore(
							"groupMapState",
						)
						db.createObjectStore( //events
							"groupMapLog",
							{ "keyPath": "OpId" }
						)
						db.createObjectStore( //vector clock
							"groupMapVersion",
						)
						db.createObjectStore(
							"groupState",
							{ "keyPath": "groupId" }
						)
						const groupLogs = db.createObjectStore(
							"groupLog",
							{ "keyPath": "OpId" }
						)
						groupLogs.createIndex(
							"groupIndex",
							"groupId",
							{ "unique": false }
						)
						db.createObjectStore(
							"groupVersion"
						)
						db.createObjectStore(
							"files"
						)
					}
				}
			)
			: null
	}
	async handleRecieve(data) {
		if(isDefined(data.file)){
			console.log(data)
			return
		}
		return await this.groupMap.pull(data)
	}
	async getGroups() {
		const group = await this.groupMap?.getValue() ?? []
		this.onGroupChange?.(group)
	}
	async addGroupCall(user, group) {
		await this.connect.sendNormal({ action: "join", user, group: { users: [...group.users], groupId: group.groupId } })
	}
	async createGroup(groupobjects) {
		await this.groupMap.createGroup(groupobjects)
	}
	async addGroup(groupobjects) {
		await this.groupMap.joinGroup(groupobjects)
	}
	async addUser(user, groupobjects) {
		this.connect.socketMap.addUser(user)
		await this.groupMap.addUser(groupobjects.groupId, user)
	}
	async removeUser(user, groupobjects) {
		this.connect.socketMap.removeUser(user)
		await this.groupMap.removeUser(groupobjects.groupId, user)
	}

	async renameGroup(name, groupobjects) {
		await this.groupMap.rename(groupobjects.groupId, name)
	}

	async deleteGroupCall(user, id) {
		await this.connect.sendNormal({ action: "leave", user, groupId: id })
	}

	async deleteGroup(id) {
		await this.groupMap.leaveGroup(id)
	}

	async sendNewMessage(group, message, parentId) {
		await this.filetable.add(message)
		// if (message instanceof File) {
		// 	message = await blobToBase64(message)
		// }
		const data = {
			"name": this.data.body.user,
			message,
			"date": new Date(),
			groupId: group.groupId,
			parentId,
			"messageId": crypto.randomUUID()
		}
		return data
	}
	async recieveNewMessage(message) {
		message.date = new Date(message.date)
		if (typeof message.message === "object") {
			message.message = await Base64ToBlob(message.message)
		}
		await this.groupMap.addMessage(message.groupId, message)
	}

	async addNewMessage(group, message, parentId) {
		const digest = await this.filetable.add(message)
		// if (message instanceof File) {
		// 	message = await blobToBase64(message)
		// }
		const msg = {
			name: this.data.body.user,
			message: digest,
			date: new Date(),
			groupId: group.groupId,
			parentId,
			messageId: crypto.randomUUID()
		}
		// if (typeof msg.message === "object") {
		// 	msg.message = await Base64ToBlob(msg.message)
		// }
		await this.groupMap.addMessage(msg.groupId, msg)
	}
	async removeMessage(message) {
		await this.groupMap.removeMessage(message.groupId, message.messageId)
	}

	async signIn(username, password) {
		const loginRequest = api("/login")
		const data = await loginRequest({
			username,
			password
		})
		await this.setToken(data.token)
	}

	async signOut() {
		localStorage.removeItem("token")
		await this.setToken()
	}
}
