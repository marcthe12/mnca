import api from "./api.js";
import { SocketInit } from "./SocketInit";
import {openDB} from "idb"

export class UserAuth {
	constructor() {
		this.connect = null
		this.token = localStorage.getItem("token");
		this.onMessageGroupChange = {}
	}
	get token() {
		return this._token;
	}

	set token(value) {
		this._token = value
		if (value){
			this.connect = new SocketInit(this)
			localStorage.setItem("token", value);
			this.dbconnect()
			this.onSignin?.(value);
		}
		else {
			this.connect?.close();
			this.db?.close()
			this.onSignOut?.();
		}
		
	}

	get "data"() {
		return this.token
			? JWTdecode(this.token)
			: null;

	}
	dbconnect(){
		this.db = this.token
		? openDB(
			this.data.body.user,
			3,
			{
				upgrade (db) {

					db.createObjectStore(
						"groups",
						{"keyPath": "groupId"}
					)
					const messageStore = db.createObjectStore(
						"messages",
						{"keyPath": "messageId"}
					)
					messageStore.createIndex(
						"groupIndex",
						"groupId",
						{"unique": false}
					)

				}
			}
		)
		: null
	}
	async getGroups(){
		const db = await this.db
		const message = await db?.getAll("groups") ?? []
		this.onGroupChange?.(message);
	}

	async addGroup(groupobjects){
		const db = await this.db
		db?.add(
			"groups",
			{				
				"groupId": crypto.getRandomValues(new Uint8Array(8)).toString(),
				...groupobjects
			}
		)
		await this.getGroups()
	}
	async getGroupMessages(groupId) {
		const db = await this.db
		const message = await db?.getAllFromIndex(
			"messages",
			"groupIndex",
			groupId
		) ?? []
		message.sort((a,b) => {
			const dateA = new Date(a.date);
			const dateB = new Date(b.date);
			return dateA - dateB;

		})

		this.onMessageGroupChange[groupId]?.(message)

	}

	async addNewMessage(groupId,message) {
		
		const db = await this.db
		db.add(
			"messages",
			{
				"name": this.data.body.user,
				message,
				"date": new Date(),
				"groupId": groupId,
				"messageId": crypto.getRandomValues(new Uint8Array(8)).toString()
			}
		)
		await this.getGroupMessages(groupId)

	}
	async signIn(username, password) {
		const loginRequest = api("/login");
		const data = await loginRequest({
			username,
			password
		});
		this.token = data.token;
	}

	async signOut() {
		localStorage.removeItem("token");
		this.token = null;
	}

	
}
function JWTdecode(token) {

	const list = token.split(".");
	return {
		"header": JSON.parse(atob(list[0])),
		"body": JSON.parse(atob(list[1])),
		"signature": list[2]
	};

}
