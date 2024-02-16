import { openDB } from "idb";
import api from "./api.js";
import { blobToBase64 } from "./Blob64.js";
import FileTable from "./FileTable.js";
import GroupMap from "./GroupMap.js";
import SocketInit from "./SocketInit";
import { JWTdecode } from "./utils.js";

export class UserAuth {
	constructor() {
		this.connect = null;
		this.setToken(localStorage.getItem("token"));
		this.onMessageGroupChange = {};
	}
	get token() {
		return this._token;
	}

	async setToken(value = null) {
		this._token = value;
		if (value) {
			await this.dbconnect();
			var client = await this.db?.getAll("id");
			if (client.length === 0) {
				client = [crypto.randomUUID()];
				await this.db.add("id", client[0], client[0]);
			}
			this.clientID = client[0];
			this.groupMap = new GroupMap(this);
			this.connect = new SocketInit(this);
			this.filetable = new FileTable(this);
			await this.groupMap.open();
			this.connect.socketMap.onConnect = (user, id) => this.groupMap.onOnline(user, id);
			this.connect.socketMap.onRecieve = data => this.handleRecieve(data);
			localStorage.setItem("token", value);
			await this.getGroups();
			this.onSignin?.(value);
		}
		else {
			this.clientID = null;
			this.groupMap = null;
			this.filetable = null;
			this.connect?.close();
			this.db?.close();
			this.onSignOut?.();
		}

	}

	get data() {
		return this.token ? JWTdecode(this.token) : null;
	}
	async dbconnect() {
		this.db = this.token ? await openDB(this.data.body.user, 6,
			{
				upgrade(db) {
					db.createObjectStore(
						"id"
					);
					db.createObjectStore(
						"groupMapState",
					);
					db.createObjectStore( //events
						"groupMapLog",
						{ "keyPath": "OpId" }
					);
					db.createObjectStore( //vector clock
						"groupMapVersion",
					);
					db.createObjectStore(
						"groupState",
						{ "keyPath": "groupId" }
					);
					const groupLogs = db.createObjectStore(
						"groupLog",
						{ "keyPath": "OpId" }
					);
					groupLogs.createIndex(
						"groupIndex",
						"groupId",
						{ "unique": false }
					);
					db.createObjectStore(
						"groupVersion"
					);
					db.createObjectStore(
						"files"
					);
					db.createObjectStore(
						"groupUserHint",
					);
				}
			}
		) : null;
	}
	async handleRecieve(data) {
		if (data.file) {
			switch (data.action) {
			case "request":{
				this.connect.socketMap.send({
					ref: data.replyId,
					id: this.clientID,
					ack: await this.filetable.has(data.hash),
					hash: data.hash
				}, data.id);
				break;
			}
			case "retrive": {
				let file = await this.filetable.get(data.hash);
				if (file instanceof File) {
					file = await blobToBase64(file);
				}
				this.connect.socketMap.send({
					ref: data.replyId,
					id: this.clientID,
					hash: data.hash,
					file
				}, data.id);
				break;
			}
			}

			return;
		}
		return await this.groupMap.pull(data);
	}
	async getGroups() {
		const group = await this.groupMap?.getValue() ?? [];
		this.onGroupChange?.(group);
	}
	async addGroupCall(user, group) {
		await this.connect.sendNormal({ action: "join", user, group: { users: [...group.users], groupId: group.groupId } });
	}
	async createGroup(groupobjects) {
		await this.groupMap.createGroup(groupobjects);
	}
	async addGroup(groupobjects) {
		await this.groupMap.joinGroup(groupobjects);
	}
	async addUser(user, groupobjects) {
		this.connect.socketMap.addUser(user);
		await this.groupMap.addUser(groupobjects.groupId, user);
	}
	async removeUser(user, groupobjects) {
		this.connect.socketMap.removeUser(user);
		await this.groupMap.removeUser(groupobjects.groupId, user);
	}

	async renameGroup(name, groupobjects) {
		await this.groupMap.rename(groupobjects.groupId, name);
	}

	async deleteGroupCall(user, id) {
		await this.connect.sendNormal({ action: "leave", user, groupId: id });
	}

	async deleteGroup(id) {
		await this.groupMap.leaveGroup(id);
	}

	async addNewMessage(group, message, parentId) {
		const id = crypto.randomUUID()
		const digest = await this.filetable.add(message,id);
		const msg = {
			name: this.data.body.user,
			message: digest,
			date: new Date(),
			groupId: group.groupId,
			parentId,
			messageId: id
		};
		await this.groupMap.addMessage(msg.groupId, msg);
	}
	async removeMessage(message) {
		await this.groupMap.removeMessage(message.groupId, message.messageId);
	}

	async signIn(username, password) {
		const loginRequest = api("/login");
		const persist = await navigator.storage.persist();
		if (!persist) {
			alert("Need Persist Storage Permission to Continue.");
			return;
		}
		const data = await loginRequest({
			username,
			password
		});
		console.log(data)
		await this.setToken(data.token);
		return data;
	}

	async signOut() {
		localStorage.removeItem("token");
		await this.setToken();
	}
}
