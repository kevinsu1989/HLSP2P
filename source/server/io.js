import { without } from 'lodash'

export default io => {
    io.on('connection', socket => {

        socket.on('join', (room) => {
            socket.join(room, () => {
                io.to(room).clients((err, clients) => {
                    socket.emit('ready', socket.id, without(clients, socket.id));
                    socket.broadcast.emit('newPeer', socket.id);
                });
            })
        });

        socket.on('disconnect', () => {
            socket.broadcast.emit('removePeer', socket.id);
        })

        socket.on('sendCandidate', (id, candidate) => {
            socket.to(id).emit('receiveCandidate', socket.id, candidate);
        });

        socket.on('sendOffer', (id, offer) => {
            socket.to(id).emit('receiveOffer', socket.id, offer);
        })

        socket.on('sendAnswer', (id, answer) => {
            socket.to(id).emit('receiveAnswer', socket.id, answer);
        })
    })
}