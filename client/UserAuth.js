import api from "./api.js";
import { SocketInit } from "./SocketInit";
import {openDB} from "idb"

export class UserAuth {
	constructor() {
		this.connect = null
		this.token = localStorage.getItem("token");
		
	}
	get token() {
		return this._token;
	}

	set token(value) {
		this._token = value
		if (value){
			this.connect = new SocketInit(value)
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
