import api from "./api.js"
import { SocketInit } from "./SocketInit"
import { openDB } from "idb"
import { blobToBase64, Base64ToBlob } from "./Blob64.js"

class GCounter {
	constructor(iterable) {
		this.counters = new Map(iterable);
	}
	increment(replica) {
		this.counters.set(replica, (this.counters.get(replica) ?? 0) + 1)
	}
	get count() {
		return [...this.counters.values()].reduce((sum, count) => sum + count, 0)
	}
	get state() {
		return [...this.counters.entries()]
	}
	merge(otherCounter) {
		otherCounter.counters.forEach((count, replica) => {
			this.counters.set(replica, Math.max(this.counters.get(replica) ?? 0, count))
		})
	}
}

class VectorClock extends GCounter {
	compare(otherClock) {
		const allKeys = new Set([...this.counters.keys(), ...otherClock.counters.keys()]);
		return [...allKeys].reduce((prev, replica) => {
			const va = this.counters.get(replica) ?? 0;
			const vb = otherClock.counters.get(replica) ?? 0;

			switch (prev) {
				case "equal":
					return va > vb ? "greater" : va < vb ? "less" : prev;
				case "less":
					return va > vb ? "concurrent" : prev;
				case "greater":
					return va < vb ? "concurrent" : prev;
				default:
					return prev;
			}
		}, "equal");
	}
	delta(otherClock) {
		const counter = new GCounter()
		const allKeys = new Set([...this.counters.keys(), ...otherClock.counters.keys()])
		allKeys.forEach(key => {
			const value1 = this.counters.get(key) ?? 0
			const value2 = otherClock.counters.get(key) ?? 0
			counter.counters.set(key, value1 - value2)
		})
		return counter
	}
	clone() {
		const ret = new VectorClock()
		ret.merge(this)
		return ret
	}
}

class GroupMap {
	constructor(userAuth) {
		this.userAuth = userAuth
	}
	async loadVersion() {
		const state = await this.userAuth.db.get("groupsVersion", 1)
		this.version = new VectorClock(state)
	}
	get replicaId() {
		return this.userAuth.clientID
	}
	async event(operation, params) {
		const version = this.version.clone()
		const event = { id: this.replicaId, version, OpId: crypto.randomUUID(), operation, ...params }
		event.version.increment(event.id)
		this.version.merge(event.version)
		await this.userAuth.db.put("groupsVersion", this.version.state, 1)
		await this.store(event)
	}
	async store(...events) {
		await Promise.all(events.map(event => this.userAuth.db.add("groupsLog", { ...event, version: event.version.state })))
		//To do: fix sort and replay
		for (const event of events) {
			switch (event.operation) {
				case 'join':
					this.userAuth.db.add("groups", event.group)
					break
				case 'leave':
					await this.userAuth.db.delete("groups", event.groupId)
					break
			}
		}
		await this.userAuth.getGroups()
	}
	async joinGroup(group) {
		await this.event("join", { group })
	}
	async leaveGroup(id) {
		await this.event("leave", { groupId: id })
	}
}

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
			this.groupMap.loadVersion()
			this.connect = new SocketInit(this)
			this.connect.socketMap.onRecieve = async message => await this.recieveNewMessage(message)
			localStorage.setItem("token", value)
			this.onSignin?.(value)
		}
		else {
			this.clientID = null
			this.groupMap = null
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
							"groups",
							{ "keyPath": "groupId" }
						)
						db.createObjectStore( //events
							"groupsLog",
							{ "keyPath": "OpId" }
						)
						db.createObjectStore( //vector clock
							"groupsVersion",
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
						const messageLogs = db.createObjectStore(
							"messagesLogs",
							{ "keyPath": "OpId" }
						)
						messageLogs.createIndex(
							"groupIndex",
							"groupId",
							{ "unique": false }
						)
						db.createObjectStore(
							"messagesVersion",
							{ "keyPath": "groupId" }
						)
						db.createObjectStore(
							"files",
							{ "keyPath": "hash" }
						)
					}
				}
			)
			: null
	}
	async getGroups() {
		const group = await this.db?.getAll("groups") ?? []
		this.onGroupChange?.(group)
	}

	async addGroupCall(user, groupobjects) {
		this.connect.sendNormal({ action: "join", user, group: groupobjects })
	}

	async addGroup(groupobjects) {
		// await this.db.add("groups", groupobjects)
		// await this.getGroups()
		await this.groupMap.joinGroup(groupobjects)
	}
	async addUser(user, groupobjects) {
		await this.db.put("groups", groupobjects)
		this.connect.socketMap.addUser(user)
		await this.getGroups()
	}
	async removeUser(user, groupobjects) {
		await this.db.put("groups", groupobjects)
		this.connect.socketMap.removeUser(user)
		await this.getGroups()
	}
	async renameGroup(name, groupobjects) {
		await this.db.put("groups", groupobjects)
		await this.getGroups()
	}

	async deleteGroupCall(user, id) {
		this.connect.sendNormal({ action: "leave", user, groupId: id })
	}

	async deleteGroup(id) {
		//await this.db.delete("groups", id)
		//await this.getGroups()
		await this.groupMap.leaveGroup(id)
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
	async sendNewMessage(group, message, parentId) {
		if (message instanceof File) {
			message = await blobToBase64(message)
		}
		const data = {
			"name": this.data.body.user,
			message,
			"date": new Date(),
			groupId: group.groupId,
			parentId,
			"messageId": crypto.randomUUID()
		}
		await this.connect.socketMap.sendAllClients(data, ...group.users)
		return data
	}
	async recieveNewMessage(message) {
		message.date = new Date(message.date)
		if (typeof message.message === "object") {
			message.message = await Base64ToBlob(message.message)
		}
		await this.db.add("messages", message)
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
function JWTdecode(token) {

	const list = token.split(".")
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	}

}
