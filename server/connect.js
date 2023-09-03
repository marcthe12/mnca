import Token from './Token.js'

export default function (socket) {
    if (Token.verify(socket.handshake.query.token)) {
        console.log('test')
    } else {
        socket.disconnect()
    }
}