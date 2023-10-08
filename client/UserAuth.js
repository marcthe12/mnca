import api from "./api.js";
import { SocketInit } from "./SocketInit";
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
			this.connect = new SocketInit(this.token)
		}
		
	}

	get "data"() {
		return this.token
			? JWTdecode(this.token)
			: null;

	}

	async signIn(username, password) {
		const loginRequest = api("/login");
		const data = await loginRequest({
			username,
			password
		});
		this.token = data.token;
		localStorage.setItem("token", this.token);
		this?.onSignin(data.token);
	}

	async signOut() {
		localStorage.removeItem("token");
		this.token = null;
		this.connect.close();
		this?.onSignOut();
		
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
