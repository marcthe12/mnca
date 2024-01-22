import VectorClock from "./VectorClock"
import Group from "./Group.js"
import { waitUntilMapValue } from "./utils.js"

export default class GroupMap {
	constructor(userAuth) {
		this.userAuth = userAuth
	}
	async open() {
		const version = await this.db.get("groupMapVersion", 1)
		this.version = new VectorClock(version)
		await this.userAuth.connect.socketMap.sendAllClients({
			id: this.replicaId,
			version: this.version.state
		}, this.userAuth.data.body.user)
		const gids = new Set(await this.db.getAll("groupMapState"))
		this.map = new Map(await Promise.all([...gids].map(async (gid) => {
			const groups = new Group(this.userAuth, gid)
			await groups.open()
			return [gid, groups]
		})))
		await this.userAuth.getGroups()
	}
	async refresh() {
		await this.userAuth.connect.socketMap.sendAllClients({
			id: this.replicaId,
			version: this.version.state
		}, this.userAuth.data.body.user)
		await Promise.all([...this.map.values()].map(group => group.refresh()))
	}
	get db() {
		return this.userAuth.db
	}
	get replicaId() {
		return this.userAuth.clientID
	}
	async event(operation, params) {
		const version = this.version.clone()
		const event = {
			id: this.replicaId,
			date: new Date(),
			version,
			OpId: crypto.randomUUID(),
			operation,
			...params
		}
		event.version.increment(event.id)
		this.version.merge(event.version)
		await this.db.put("groupMapVersion", this.version.state, 1)
		await this.store(event)
		await this.userAuth.connect.socketMap.sendAllClients({
			id: event.id,
			version: event.version.state
		}, this.userAuth.data.body.user)
	}
	async pull({ id, groupId, version, events }) {
		version = new VectorClock(version)
		events = events?.map(event => {
			event.version = new VectorClock(event.version)
			event.date = new Date(event.date)
			if(event.message !== undefined){
				event.message.date = new Date(event.message.date)
			}
			return event
		})
		if (groupId !== undefined) {
			await this.map.get(groupId)?.pull({ id, version, events })
			return
		}
		if (events !== undefined) {
			this.version.merge(version)
			await this.db.put("groupMapVersion", this.version.state, 1)
			await this.store(...events)
		}
		if (version.compare(this.version) !== "equal") { //if its a greater version update that?
			const items = await this.db.getAll("groupMapLog") ?? []

			await this.userAuth.connect.socketMap.send({
				id: this.replicaId,
				version: this.version.state,
				events: items.filter(event => {
					const time = new VectorClock(event.version)
					return new Set(["concurrent", "greater"]).has(time.compare(version))
				})
			}, id)
		}
	}
	async store(...events) {
		const transx = this.db.transaction("groupMapLog", "readwrite")
		for (const event of events) {
			await transx.store.add({ ...event, version: event.version.state })
		}
		await transx.done
		events = await this.db.getAll("groupMapLog")
		events.sort((a, b) => {
			const ver_a = new VectorClock(a.version)
			const ver_b = new VectorClock(b.version)
			switch (ver_a.compare(ver_b)) {
			case "less": return -1
			case "greater": return 1
			case "equal":
			case "concurrent":
				return 0
			}
		})
		const map = new Map()
		const transy = this.db.transaction("groupMapState", "readwrite")
		await transy.store.clear()
		for (const event of events) {
			switch (event.operation) {
			case "join":
				await transy.store.add(event.groupId, event.uuid)
				map.set(event.uuid, {
					groupId: event.groupId,
					users: event.users,
				})
				break
			case "leave":
				await Promise.all(event.uuids.map(uuid => transy.store.delete(uuid)))
				event.uuids.map(uuid => map.delete(uuid))
				break
			}
		}
		await transy.done
		const gState = [...map.values()].reduce((acc, current) => {
			if (acc.has(current.groupId)) {
				const existingEntry = acc.get(current.groupId)
				existingEntry.users = new Set([...existingEntry.users, ...current.users])
			} else {
				acc.set(current.groupId, current)
			}
			return acc
		}, new Map())
		await Promise.all([...this.map].filter(([k, v]) => !gState.has(k)).map(([k, v]) => v.delete()))
		await Promise.all([...gState].filter(([k, v]) => !this.map.has(k)).map(async ([k, v]) => {
			const group = new Group(this.userAuth, k)
			this.map.set(k, group)
			await group.initialize(v.users)
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
	async onOnline(user, id) {
		if (user == this.userAuth.data.body.user) {
			await this.userAuth.connect.socketMap.send({
				id: this.replicaId,
				version: this.version.state
			}, id)
		}
		const value = await this.getValue()
		const groups = value.filter(({ users }) => users.has(user)).map(group => this.map.get(group.groupId))
		await Promise.all(groups.map(group => group.onOnline(user, id)))
	}
	async createGroup(group) {
		await this.joinGroup(group)
		await waitUntilMapValue(this.map, group.groupId)
		await Promise.all([...group.users].map(user => this.addUser(group.groupId, user)))
		await this.rename(group.groupId, group.name)
	}

	async joinGroup(group) {
		await this.event("join", {
			groupId: group.groupId,
			users: [...group.users],
			uuid: crypto.randomUUID()
		})
	}
	async leaveGroup(id) {
		const state = await this.getState()
		const uuids = [...state].filter(([key, val]) => val === id).map(([key, val]) => key)
		await this.event("leave", { uuids })
	}
	async rename(id, name) {
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
