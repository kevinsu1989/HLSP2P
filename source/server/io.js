import { without } from 'lodash'

const parts = {};

export default io => {
    io.on('connection', socket => {

        socket.on('join', room => {

            socket.join(room, () => {

                io.to(room).clients((err, clients) => {
                    let othersInroom = without(clients, socket.id);

                    socket.emit('ready', othersInroom.map(other => {
                        return {
                            id: other,
                            parts: parts[other.id] || []
                        }
                    }));

                    socket.broadcast.emit('addSeed', {
                        id: socket.id,
                        parts: parts[socket.id] || []
                    });
                });

                socket.on('addPart', part => {
                    parts[socket.id] = parts[socket.id] || [];
                    if (parts[socket.id].indexOf(part) >= 0) return;
                    parts[socket.id].push(part);
                    socket.broadcast.emit('updatePart', socket.id, part);
                });

                socket.on('disconnect', () => {
                    socket.broadcast.emit('removeSeed', socket.id);
                })
            });
        });



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