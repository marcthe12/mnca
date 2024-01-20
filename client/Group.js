import VectorClock from "./VectorClock.js";

export default class Group {
	constructor(userAuth, groupId) {
		this.userAuth = userAuth;
		this.groupId = groupId;
	}
	get db() {
		return this.userAuth.db;
	}
	get replicaId() {
		return this.userAuth.clientID;
	}
	async open() {
		const version = await this.db.get("groupVersion", this.groupId);
		this.version = new VectorClock(version);
		const { users } = await this.getValue();
		await Promise.all([...users].map(elements => this.userAuth.connect.socketMap.addUser(elements)));
		await this.userAuth.connect.socketMap.sendAllClients({
			groupId: this.groupId,
			id: this.replicaId,
			version: this.version.state
		}, ...users);
	}
	async refresh() {
		const { users } = await this.getValue();
		await this.userAuth.connect.socketMap.sendAllClients({
			groupId: this.groupId,
			id: this.replicaId,
			version: this.version.state
		}, ...users);
	}
	async initialize(users) {
		await Promise.all(users.map(elements => this.userAuth.connect.socketMap.addUser(elements)))
		await this.store()
		await this.open()
		await this.userAuth.connect.socketMap.sendAllClients({
			groupId: this.groupId,
			id: this.replicaId,
			version: this.version.state
		}, ...users)
	}
	async delete() {
		await this.db.delete("groupState", this.groupId);
		await this.db.delete("groupVersion", this.groupId);
		const toDelete = await this.db.getAllKeysFromIndex("groupLog", "groupIndex") ?? [];
		const trans = this.db.transaction("groupLog", "readwrite");
		await Promise.all(toDelete.map(k => trans.store.delete(k)));
		await trans.done;
	}

	async getState() {
		return await this.db.get("groupState", this.groupId);
	}
	async getValue() {
		const value = await this.getState()
		value.name = value.name.value
		value.users = new Set(value.users.values())
		value.messages = new Set(value.messages.values())
		return value
	}
	async event(operation, params) {
		const version = this.version.clone()
		const event = {
			groupId: this.groupId,
			date: new Date(),
			id: this.replicaId,
			version,
			OpId: crypto.randomUUID(),
			operation,
			...params
		}
		event.version.increment(event.id)
		this.version.merge(event.version)
		await this.db.put("groupVersion", this.version.state, this.groupId)
		await this.store(event)
		const { users } = await this.getValue();
		await this.userAuth.connect.socketMap.sendAllClients({
			groupId: this.groupId,
			id: event.id,
			version: event.version.state
		}, ...users)
	}
	async pull({ id, version, events }) {
		if (events !== undefined) {
			this.version.merge(version);
			await this.db.put("groupVersion", this.version.state, this.groupId);
			await this.store(...events);
		}

		if (version.compare(this.version) !== 'equal') { //if its a greater version update that?
			const items = await this.db.getAllFromIndex("groupLog", "groupIndex", this.groupId) ?? [];
			await this.userAuth.connect.socketMap.send({
				groupId: this.groupId,
				id: this.replicaId,
				version: this.version.state,
				events: items.filter(event => {
					const time = new VectorClock(event.version);
					return new Set(['concurrent', 'greater']).has(time.compare(version));
				})
			}, id);
		}
	}
	async store(...events) {
		const transx = this.db.transaction("groupLog", "readwrite");
		for (const event of events) {
			await transx.store.add({ ...event, version: event.version.state });
		}
		await transx.done;
		events = await this.db.getAllFromIndex("groupLog", "groupIndex", this.groupId) ?? [];
		console.log(events);
		events.sort((a, b) => {
			const ver_a = new VectorClock(a.version);
			const ver_b = new VectorClock(b.version);
			switch (ver_a.compare(ver_b)) {
				case "less": return -1;
				case "greater": return 1;
				case "equal":
				case "concurrent":
					return 0;
			}
		});
		const group = {
			groupId: this.groupId,
			users: new Map(),
			name: { value: "", timestamp: { time: 0 } },
			messages: new Map()
		};
		for (const event of events) {
			switch (event.operation) {
				case 'rename':
					if (event.timestamp.time > group.name.timestamp.time || (event.timestamp.time === group.name.timestamp.time && event.timestamp.id > group.name.timestamp.id)) {
						group.name.value = event.name
						group.name.timestamp = event.timestamp
					}
					break
				case 'removeUser':
					event.uuids.map(uuid => group.users.delete(uuid))
					break
				case 'addUser':
					group.users.set(event.uuid, event.user)
					break
				case 'addMessage':
					group.messages.set(event.uuid, event.message)
					break
				case 'removeMessage':
					event.uuids.map(uuid => group.messages.delete(uuid))
					break
			}
		}
		await this.db.put("groupState", group)
		await this.userAuth.getGroups()
	}
	async onOnline(user, id) {
		console.log(user)
		if (user == this.userAuth.data.body.user) {
			await this.userAuth.connect.socketMap.send({
				groupId: this.groupId,
				id: this.replicaId,
				version: this.version.state
			}, id);
		}
	}
	async rename(name) {
		await this.event("rename", { name, timestamp: { time: Date.now(), id: this.id } });
	}
	async removeUser(user) {
		const state = await this.getState();
		const uuids = [...state.users].filter(([key, val]) => val === user).map(([key, val]) => key);
		await this.event("removeUser", { uuids });
	}
	async addUser(user) {
		await this.event("addUser", { user, uuid: crypto.randomUUID() });
	}
	async addMessage(message) {
		await this.event("addMessage", { message, uuid: crypto.randomUUID() });
	}
	async removeMessage(messageId) {
		const state = await this.getState();
		const uuids = [...state.messages].filter(([key, val]) => val.messageId === messageId).map(([key, val]) => key);
		await this.event("removeMessage", { uuids });
	}
}