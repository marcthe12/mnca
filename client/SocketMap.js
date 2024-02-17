import config from "./config.js";
export default class SocketMap {
    constructor(conn) {
        this.mapping = new Map();
        this.userIndex = new Map();
        this.ws = conn;
        this.addUser(conn.getuserauth.data.body.user, []);
    }
    async addUser(user) {
        if (!this.userIndex.has(user)) {
            if (typeof user !== "string") {
                throw new Error(`Invalid argument (${user}) provided to method. Expected a string`);
            }
            this.userIndex.set(user, []);
            await this.ws.sendNormal({ action: "subscribe", user });
        }
    }
    async removeUser(user) {
        if (this.userIndex.delete(user)) {
            await this.ws.sendNormal({ action: "unsubscribe", user });
        }
    }
    get(key) {
        return this.mapping.get(key);
    }
    has(key) {
        return this.mapping.has(key);
    }
    create(recv, user, sendSignal, polite = true) {
        let makingOffer = false;
        let ignoreOffer = false;
        const conn = {
            callbackMap: new Map(),
            id: recv,
            user,
            rtc: new RTCPeerConnection({
                iceServers: config.iceProxies
            }),
            sendSignal,
            close() {
                this.rtc.close();
            },
            async onOffer(offer) {
                const offerCollision = offer.type === "offer" && (makingOffer || this.rtc.signalingState !== "stable");
                ignoreOffer = !polite && offerCollision;
                if (ignoreOffer) {
                    return;
                }
                await this.rtc.setRemoteDescription(offer);
                if (offer.type === "offer") {
                    await this.rtc.setLocalDescription();
                    await this.sendSignal({
                        action: "offer",
                        offer: this.rtc.localDescription
                    });
                }
            },
            async onIceCandidate(candidate) {
                try {
                    await this.rtc.addIceCandidate(candidate);
                } catch (err) {
                    if (!ignoreOffer) {
                        throw err;
                    }
                }
            },
            onRecieve: (...args) => this.handleRecieve(...args),
            onConnect: (...args) => this.handleConnect(...args),
            receivedChunks: new Map(),
            setupDataChannel(channel) {
                channel.addEventListener("open", async () => {
                    this.channel = channel;
                    await this.onConnect(this.user, this.id);
                });
                channel.addEventListener("message", async (event) => {
                    const message = JSON.parse(event.data);
                    console.log(message);
                    //
                    if (message.chunkId !== undefined && message.totalChunks !== undefined) {
                        // This is a chunked message
                        if (!receivedChunks.has(message.id)) {
                            receivedChunks.set(message.id, Array(message.totalChunks).fill(null));
                        }
                        receivedChunks.get(message.id)[message.chunkId] = message.data;
                        // Check if all chunks have been received
                        if (receivedChunks.get(message.id).every(chunk => chunk !== null)) {
                            const originalMessage = receivedChunks.get(message.id).join('');
                            delete receivedChunks.delete(message.id);
                            // await this.onRecieve(JSON.parse(originalMessage));
                            if (message.ref && this.callbackMap.has(message.ref)) {
                                this.callbackMap.get(message.ref)(
                                    message,
                                    () => this.callbackMap.delete(message.ref)
                                );//chunking and reply...
                                //outside map of functions the msgid can figre out
                                //store a function with an identifier so i eauto exceute it when i recieve a reply/new chunk etc... 
                                // a correlated message can now work.

                            } else {
                                await this.onRecieve(message);
                            }
                        }
                        //how do you know this chunk is linked to the same message. How do you know its 
                        //recieved on the other side?: stop and wait
                    }
                });
            },
            async send(data) {
                try {
                    //store chunk in an array
                    //send each one , random identifier for (same), total chunk
                    const msg = JSON.stringify(data);
                    const id = crypto.randomUUID();
                    const chunkSize = 64; // Define your chunk size
                    const chunks = [];
                    for (let index = 0; index < msg.length; index += chunkSize) {
                        chunks.push(msg.slice(index, index + chunkSize));
                    }
                    for (const [chunkId,chunk] of chunks.entries()) {
                        const msg = JSON.stringify({
                            chunkId: chunkId,
                            totalChunks: chunk.length,
                            data: chunk
                        });
                        await new Promise((resolve) => {
                            const checkValue = () => {
                                if (this.channel !== undefined) {
                                    resolve(this.channel);
                                } else {
                                    setTimeout(checkValue, 100);
                                }
                            };
                            checkValue();
                        });
                        console.log(msg);
                        this.channel.send(msg);
                    }
                } catch (e) {
                    console.error(e);
                }
            }
        };
        this.mapping.set(recv, conn);
        if (!this.userIndex.has(user)) {
            this.userIndex.set(user, []);
        }
        this.userIndex.get(user).push(conn);
        this.handleChange();
        conn.rtc.addEventListener("negotiationneeded", async function () {
            try {
                makingOffer = true;
                await this.setLocalDescription();
                await conn.sendSignal({
                    action: "offer",
                    offer: this.localDescription
                });
            } finally {
                makingOffer = false;
            }
        });
        conn.rtc.addEventListener("icecandidate", async function ({ candidate }) {
            if (candidate !== null) {
                await conn.sendSignal({
                    action: "icecandidate",
                    candidate,
                });
            }
        });
        conn.rtc.addEventListener("connectionstatechange", () => {
            this.handleChange();
        });
        conn.rtc.addEventListener("oniceconnectionstatechange", function () {
            if (this.iceConnectionState === "failed") {
                this.restartIce();
            }
        });
        conn.rtc.addEventListener("datachannel", async function ({ channel }) {
            conn.setupDataChannel(channel);
        });
        return conn;
    }
    registerCall(id, callback, ref = crypto.randomUUID()) {
        this.mapping.get(id).callbackMap.set(ref, callback);
    }
    async send(data, id) {
        await this.mapping.get(id).send(data);
    }
    registerCallAll(callback, ref, ...users) {
        this.getAllClients(...users).forEach(client => client.callbackMap.set(ref, callback));
    }
    async sendAllClients(data, ...user) {
        await Promise.all(this.getAllClients(...user).map((client) => client.send(data)));
    }
    getAllClients(...users) {
        return users.flatMap(user => this.userIndex.get(user) ?? []);
    }
    handleChange() {
        this.onChange?.(this.values);
    }
    async handleConnect(user, id) {
        await this.onConnect?.(user, id);
    }
    async handleRecieve(message) {
        await this.onRecieve?.(message);
    }
    delete(key) {
        const socket = this.get(key);
        socket.close();
        if (this.mapping.delete(key)) {
            const userSockets = this.userIndex.get(socket.user);
            userSockets.splice(userSockets.indexOf(socket), 1);
            this.handleChange();
        }
    }
    clear() {
        this.mapping.forEach((_val, key) => this.delete(key));
    }
    get values() {
        return Array.from(this.mapping.values());
    }
}