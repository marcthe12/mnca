import VectorClock from "./VectorClock.js";
import notifyUserChange from "./notifyUserChange.js";
import isDefined from "./isDefined.js";

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
			version: this.version.state ?? []
		}, ...users);
	}
	async refresh() {
		const { users } = await this.getValue();
		await this.userAuth.connect.socketMap.sendAllClients({
			groupId: this.groupId,
			id: this.replicaId,
			version: this.version.state ?? []
		}, ...users);
	}
	async initialize(users) {
		await Promise.all(users.map(elements => this.userAuth.connect.socketMap.addUser(elements)));
		//refresh and initialize 
		await this.store();
		await this.open();
		await this.userAuth.connect.socketMap.sendAllClients({//fallback when set of users are sent to initialize
			//until successful
			groupId: this.groupId,
			id: this.replicaId,
			version: this.version.state ?? []
		}, ...users);

	}
	async delete() {
		await this.db.delete("groupState", this.groupId);
		await this.db.delete("groupVersion", this.groupId);
		await this.db.delete("groupUserHint", this.groupId);
		const toDelete = await this.db.getAllKeysFromIndex("groupLog", "groupIndex") ?? [];
		const trans = this.db.transaction("groupLog", "readwrite");
		await Promise.all(toDelete.map(k => trans.store.delete(k)));
		await trans.done;
	}
	//lightbulb if user==0 then
	//if(no users??)
	//if count(groupLog where groupID) == 0
	//other place : set of users for fallback here.... so if we figure out code
	//we'll be able to fix the fallback issue
	//put this in UI!!!!!(!imp) disable somestuff until its fixed...
	//one more condition, other problem will be able to soleve:when log is deleted, use this to reset

	async getState() {
		const groupstate = await this.db.get("groupState", this.groupId);
		const groupversion = new VectorClock(await this.db.get("groupVersion", this.groupId));
		if (isDefined(groupstate)&& groupversion.count!=0) {
			return groupstate; // when there are no logs, no version but there is state...
		}
		else {
			const newstate = {
				groupId: this.groupId,
				users: new Map(),
				name: { value: "", timestamp: { time: 0 } },
				messages: new Map()
			};
			if ((await this.db.getAllFromIndex("groupLog", "groupIndex", this.groupId) ?? []).length === 0) {
				//from db import setofusers being stored
				//add each one to the map.(key,value) being the same
				const users = await this.db.get("groupUserHint", this.groupId) ?? [];
				users.forEach(user => newstate.users.set(user, user));
			}
			
			return newstate;
		}
	}
	async getValue() {
		const value = await this.getState();
		value.name = value.name.value;
		value.users = new Set(value.users.values());
		value.messages = new Set(value.messages.values());
		return value;
	}
	async event(operation, params) {
		const version = this.version.clone();
		const event = {
			groupId: this.groupId,
			date: new Date(),
			id: this.replicaId,
			version,
			OpId: crypto.randomUUID(),
			operation,
			...params
		};
		event.version.increment(event.id);
		this.version.merge(event.version);
		await this.db.put("groupVersion", this.version.state, this.groupId);
		await this.store(event);
		const { users } = await this.getValue();
		await this.userAuth.connect.socketMap.sendAllClients({
			groupId: this.groupId,
			id: event.id,
			version: event.version.state
		}, ...users);
	}
	async pull({ id, version, events=[] }) {
		this.version ??= new VectorClock();
		const storedEvents = await this.db.getAllFromIndex("groupLog", "groupIndex", this.groupId) ?? [];
		events = events.filter(event => !storedEvents.some(storedEvent => storedEvent.OpId === event.OpId)); // Assuming OpId is unique identifier for events
		if (events.length !== 0) {//add && condition if events are not empty
			await this.store(...events);//!!!
			this.version.merge(version);//!!!
			await this.db.put("groupVersion", this.version.state, this.groupId);//!!!
		} //2 things to check
		// 1. do we use this.version in store
		//125 and 126 critical
		if (version.compare(this.version) !== "equal") { //if its a greater version update that?
			const items = await this.db.getAllFromIndex("groupLog", "groupIndex", this.groupId) ?? [];
			await this.userAuth.connect.socketMap.send({
				groupId: this.groupId,
				id: this.replicaId,
				version: this.version.state ?? [],
				events: items.filter(event => {
					const time = new VectorClock(event.version);
					return new Set(["concurrent", "greater"]).has(time.compare(version));
				})
			}, id);
		}
	}
	async store(...events) {
		const old = await this.getValue();
		const transx = this.db.transaction("groupLog", "readwrite");// deadly
		for (const event of events) {
			
			await transx.store.add({ ...event, version: event.version.state });
		}//marked...critical
	
		await transx.done;
		events = await this.db.getAllFromIndex("groupLog", "groupIndex", this.groupId) ?? [];
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
			case "rename":
				if (
					event.timestamp.time > group.name.timestamp.time
						|| ( event.timestamp.time === group.name.timestamp.time && event.timestamp.id > group.name.timestamp.id
						)
				) {
					group.name.value = event.name;
					group.name.timestamp = event.timestamp;
				}
				break;
			case "removeUser":
				event.uuids.map(uuid => group.users.delete(uuid));
				break;
			case "addUser":
				group.users.set(event.uuid, event.user);
				break;
			case "addMessage":
				group.messages.set(event.uuid, event.message);
				break;
			case "removeMessage":
				event.uuids.map(uuid => group.messages.delete(uuid));
				break;
			}
		}
		//message.message is the hash
		await this.db.put("groupState", group);
		const newvar = await this.getValue();
		const newMessages = [...newvar.messages].filter(newMessage => ![...old.messages].some(oldMessage => newMessage.messageId === oldMessage.messageId));
		const removedMessages = [...old.messages].filter(oldMessage => ![...newvar.messages].some(newMessage => newMessage.messageId === oldMessage.messageId));
		const newUsers = [...newvar.users].filter(user => !old.users.has(user));
		const removedUsers = [...old.users].filter(user => !newvar.users.has(user));
		for (const message of removedMessages) {
			await this.userAuth.filetable.delete(message.message,message.messageId);
		}
		for (const message of newMessages) {
			await this.userAuth.filetable.inc(message.message,message.messageId);
		}

		newUsers.forEach(user => notifyUserChange(`User ${user} has entered ${newvar.name}`));
		removedUsers.forEach(user => notifyUserChange(`User ${user} has left ${newvar.name}`));
		newMessages.forEach(msg => notifyUserChange(`New Message from ${msg.name} in ${newvar.name}`));
		await this.userAuth.getGroups();
	}
	async onOnline(user, id) {
		if (user == this.userAuth.data.body.user) {
			await this.userAuth.connect.socketMap.send({
				groupId: this.groupId,
				id: this.replicaId,
				version: this.version.state ??[]
			}, id);
		}
	}
	async rename(name) {
		await this.event("rename", { name, timestamp: { time: Date.now(), id: this.id } });
	}
	async removeUser(user) {
		const state = await this.getState();
		const uuids = [...state.users].filter(([, value]) => value === user).map(([key]) => key);
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
		const uuids = [...state.messages].filter(([, value]) => value.messageId === messageId).map(([key]) => key);
		await this.event("removeMessage", { uuids });
	}
}
 