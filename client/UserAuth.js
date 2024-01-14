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
class Group {
	constructor(userAuth, groupId) {
		this.userAuth = userAuth
		this.groupId = groupId
	}
	get db() {
		return this.userAuth.db
	}
	get replicaId() {
		return this.userAuth.clientID
	}
	async open() {
		const version = await this.db.get("groupVersion", this.groupId)
		this.version = new VectorClock(version)
	}
	async initialize(users) {
	//	await this.db.add("groupState", { groupId: this.groupId, users, name: "", messages: [] })
	await this.store()
	}
	async delete() {
		await this.db.delete("groupState", this.groupId)
		await this.db.delete("groupVersion", this.groupId)
		const toDelete = await this.db.getAllKeysFromIndex("groupLogs", "groupIndex") ?? []
		const trans = this.db.transaction("groupLog", "readwrite")
		await Promise.all(toDelete.map(k => trans.store.delete(k)))
		await trans.done
	}

	async getState() {
		return await this.db.get("groupState", this.groupId)
	}
	async getValue() {
		const value = await this.getState()
		value.name = value.name.value
		value.users = new Set(value.users.values())
		value.messages = [...new Set(value.messages.values())]
		return value
	}
	async event(operation, params) {
		const version = this.version.clone()
		const event = {
			groupId: this.groupId,
			id: this.replicaId,
			version,
			OpId: crypto.randomUUID(),
			operation,
			...params
		}
		event.version.increment(event.id)
		this.version.merge(event.version)
		await this.db.put("groupVersion", this.version.state, 1)
		await this.store(event)
	}
	async store(...events) {
		const transx = this.db.transaction("groupLog", "readwrite")
		await Promise.all([...events.map(event => transx.store.add({ ...event, version: event.version.state })), transx.done])
		events = await this.db.getAll("groupLog")
		events.sort((a, b) => {
			const ver_a = new VectorClock(a.version)
			const ver_b = new VectorClock(b.version)
			switch (ver_a.compare(ver_b)) {
				case "less": return -1
				case "greater": return 1
				case "equal":
				case "concurrent":
					return 0;
			}
		})
		const group = {
			groupId: this.groupId,
			users: new Map(),
			name: { value: "", timestamp: { time: 0 } },
			messages: new Map()
		}
		for (const event of events) {
			switch (event.operation) {
				case 'rename':
					if(event.timestamp.time > group.name.timestamp.time || (event.timestamp.time === group.name.timestamp.time && event.timestamp.id > group.name.timestamp.id)){
						group.name.value = event.name
						group.name.timestamp = event.timestamp
					}
					break
				case 'removeUser':
					event.uuids.map(uuid => group.users.delete(uuid))
					break
				case 'addUser':
					group.users.set(event.uuid,event.user)
					break
				case 'addMessage':
					group.messages.set(event.uuid,event.message)
					break
				case 'removeMessage':
					event.uuids.map(uuid => group.messages.delete(uuid))
					break
			}
		}
		await this.db.put("groupState", group)
		await this.userAuth.getGroups()
	}
	async rename(name) {
		await this.event("rename", { name, timestamp: { time: Date.now(), id: this.id } })
	}
	async removeUser(user) {
		const state = await this.getState()
		const uuids = [...state.users].filter(([key, val]) => val === user).map(([key, val]) => key)
		await this.event("removeUser", { uuids })
	}
	async addUser(user) {
		await this.event("addUser", { user, uuid: crypto.randomUUID() })
	}
	async addMessage(message) {
		await this.event("addMessage", { message, uuid: crypto.randomUUID() })
	}
	async removeMessage(messageId) {
		const state = await this.getState()
		const uuids = [...state.messages].filter(([key, val]) => val === messageId).map(([key, val]) => key)
		await this.event("removeMessage", { uuids })
	}
}

class GroupMap {
	constructor(userAuth) {
		this.userAuth = userAuth
	}
	async open() {
		const version = await this.db.get("groupMapVersion", 1)
		this.version = new VectorClock(version)
		const gids = new Set(await this.db.getAll("groupMapState"))
		this.map = new Map(await Promise.all([...gids].map(async gid => {
			const groups = new Group(this.userAuth, gid)
			await groups.open()
			return [gid, groups]
		})))
	}
	get db() {
		return this.userAuth.db
	}
	get replicaId() {
		return this.userAuth.clientID
	}
	async event(operation, params) {
		const version = this.version.clone()
		const event = { id: this.replicaId, version, OpId: crypto.randomUUID(), operation, ...params }
		event.version.increment(event.id)
		this.version.merge(event.version)
		await this.db.put("groupMapVersion", this.version.state, 1)
		await this.store(event)
	}
	async store(...events) {
		const transx = this.db.transaction("groupMapLog", "readwrite")
		await Promise.all([...events.map(event => transx.store.add({ ...event, version: event.version.state })), transx.done])
		events = await this.db.getAll("groupMapLog")
		events.sort((a, b) => {
			const ver_a = new VectorClock(a.version)
			const ver_b = new VectorClock(b.version)
			switch (ver_a.compare(ver_b)) {
				case "less": return -1
				case "greater": return 1
				case "equal":
				case "concurrent":
					return 0;
			}
		})
		const map = new Map()
		const transy = this.db.transaction("groupMapState", "readwrite")
		await transy.store.clear()
		for (const event of events) {
			switch (event.operation) {
				case 'join':
					await transy.store.add(event.groupId, event.uuid)
					map.set(event.uuid, {
						groupId: event.groupId,
						users: event.users,
					})
					break
				case 'leave':
					await Promise.all(event.uuids.map(uuid => transy.store.delete(uuid)))
					event.uuids.map(uuid => map.delete(uuid))
					break
			}
		}
		await transy.done
		const gState = [...map.values()].reduce((acc, current) => {
			if (acc.has(current.groupId)) {
				const existingEntry = acc.get(current.groupId)
				existingEntry.users = new Set([...existingEntry.users, ...current.users]);
			} else {
				acc.set(current.groupId, current);
			}
			return acc;
		}, new Map())

		console.log(gState)
		console.log(this.map)
		await Promise.all([...this.map].filter(([k, v]) => !gState.has(k)).map(([k, v]) => v.delete()))
		await Promise.all([...gState].filter(([k, v]) => !this.map.has(k)).map(async ([k, v]) => {
			const group = new Group(this.userAuth, k)
			await group.open()
			await group.initialize(v.users)
			this.map.set(k, group)
		}))
		await this.userAuth.getGroups()
	}
	async getState() {
		const trans = this.db.transaction("groupMapState", "readonly")
		const [keys, values] = await Promise.all([
			trans.store.getAllKeys(),
			trans.store.getAll(),
		])
		await trans.done
		return new Map(keys.map((key, i) => [key, values[i]]))
	}

	async getValue() {
		const groupIds = new Set((await this.getState()).values())
		const group = await Promise.all([...groupIds].map(async (k, v) => await this.map?.get(k)?.getValue()))
		return group.filter(v => v !== undefined)
	}

	async joinGroup(group) {
		await this.event("join", {
			groupId: group.groupId,
			users: group.users,
			uuid: crypto.randomUUID()
		})
	}

	async leaveGroup(id) {
		const state = await this.getState()
		const uuids = [...state].filter(([key, val]) => val === id).map(([key, val]) => key)
		await this.event("leave", { uuids })
	}
	async rename(id, name) {
		console.log(id)
		console.log(this.map)
		return await this.map.get(id).rename(name)
	}
	async removeUser(id, user) {
		return await this.map.get(id).removeUser(user)
	}
	async addUser(id, user) {
		return await this.map.get(id).addUser(user)
	}
	async addMessage(id, message) {
		return await this.map.get(id).addMessage(message)
	}
	async removeMessage(id, messageId) {
		return await this.map.get(id).removeMessage(messageId)
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
			this.groupMap.open()
			this.connect = new SocketInit(this)
			this.connect.socketMap.onRecieve = async message => await this.recieveNewMessage(message)
			localStorage.setItem("token", value)
			await this.getGroups()
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
							"files",
							{ "keyPath": "hash" }
						)
					}
				}
			)
			: null
	}
	async getGroups() {
		const group = await this.groupMap?.getValue() ?? []
		this.onGroupChange?.(group)
	}

	async addGroupCall(user, group) {
		this.connect.sendNormal({ action: "join", user, group: { users: [...group.users], groupId: group.groupId } })
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
		this.connect.sendNormal({ action: "leave", user, groupId: id })
	}

	async deleteGroup(id) {
		await this.groupMap.leaveGroup(id)
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
		await this.groupMap.addMessage(message.groupId, message)
	}
	//1. In groupMap, create a method that takes groupId and data such as user, message etc, 
	//2. Add a method in group class that does the actual work in the DB. The groupMap method calls this method by 
	//the use of this.map.get(groupId) (retrive the instance of group)
	async addNewMessage(groupId, message, parent) {
		const msg = await this.sendNewMessage(groupId, message, parent)
		await this.recieveNewMessage(msg)

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

function JWTdecode(token) {

	const list = token.split(".")
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	}

}
