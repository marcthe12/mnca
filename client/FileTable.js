import { isDefined } from "./utils.js";
import { Base64ToBlob } from "./Blob64.js";

export default class FileTable {
	constructor(userAuth) {
		this.values = new Map();
		this.userAuth = userAuth;
	}
	get db() {
		return this.userAuth.db;
	}
	get replicaId() {
		return this.userAuth.clientID;
	}
	async hash(data) {
		let view;
		if (typeof data === "string") {
			const encoder = new TextEncoder();
			view = encoder.encode(data);
		}
		else if (data instanceof File) {
			const encoder = new TextEncoder();
			const encoded = encoder.encode(data.type);
			const fname = encoder.encode(data.name);
			const buffer = new Uint8Array(await data.arrayBuffer());
			const size = encoded.length + fname.length + buffer.length + 2;
			view = new Uint8Array(size);
			view.set(encoded);
			view.set([0], encoded.length);
			view.set(fname, encoded.length + 1);
			view.set([0], encoded.length + fname.length + 1);
			view.set(buffer, fname.length + encoded.length + 2);
		}
		const digest = [...new Uint8Array(await crypto.subtle.digest("SHA-256", view))];
		return digest.map(b => b.toString(16).padStart(2, "0")).join("");

	}
	async verify(hash, value) {
		return hash === await this.hash(value);
	}
	async requestFile(hash, users, onDone = async _ => { }) {
		const ref = crypto.randomUUID();
		this.userAuth.connect.socketMap.registerCallAll(async (data, unsubscribe) => {
			const ref = crypto.randomUUID();
			if (data.ack) {
				this.userAuth.connect.socketMap.registerCall(data.id, async (data, unsubscribe) => {
					unsubscribe();
					if (typeof data.file === "object") {
						data.file = await Base64ToBlob(data.file);
					}
					if (await this.verify(data.hash, data.file)) {
						await this.add(data.file);
						await this.inc(data.hash);
						await onDone(data.file);
					}
				}, ref);
				await this.userAuth.connect.socketMap.send({
					action: "retrive",
					file: true,
					id: this.replicaId,
					replyId: ref,
					hash: data.hash
				}, data.id);
				unsubscribe();
			}
		}, ref, ...users);
		await this.userAuth.connect.socketMap.sendAllClients({
			id: this.replicaId,
			replyId: ref,
			file: true,
			hash,
			action: "request"
		}, ...users);
	}
	async get(hash) {
		return (await this.db.get("files", hash))?.value;
	}

	async add(value) {
		const key = await this.hash(value);
		const data = await this.db.get("files", key) ?? { value, count: 0 };
		await this.db.put("files", data, key);
		return key;
	}
	async inc(hash) {
		const data = await this.db.get("files", hash);
		if (isDefined(data)) {
			data.count += 1;
			await this.db.put("files", data, hash);
			return true;
		}
		return false;
	}
	async has(hash) {
		const data = await this.db.get("files", hash);
		return isDefined(data) && data.count > 0;
	}
	async delete(hash) {
		const data = await this.db.get("files", hash);
		if (!isDefined(data)) {
			return; //false
		}
		data.count -= 1;
		if (data.count <= 0) {
			await this.db.delete("files", hash);//false
		} else {
			await this.db.put("files", data, hash);//true
		}
	}
}
