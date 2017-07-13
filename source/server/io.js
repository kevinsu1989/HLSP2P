import { without } from 'lodash'

//资源情况
const parts = {};

export default io => {
    io.on('connection', socket => {

        socket.on('join', room => {
            //加入房间  用来区分不同资源
            socket.join(room, () => {

                io.to(room).clients((err, clients) => {
                    let othersInroom = without(clients, socket.id);
                    //返回已加入房间通知  这里同时返回了同房间其他人的资源情况
                    socket.emit('ready', othersInroom.map(other => {
                        return {
                            id: other,
                            parts: parts[other] || []
                        }
                    }));
                    //告诉其他人有个新boy加入了
                    socket.broadcast.emit('addSeed', {
                        id: socket.id,
                        parts: parts[socket.id] || []
                    });
                });

                //提交资源
                socket.on('addPart', part => {
                    parts[socket.id] = parts[socket.id] || [];
                    if (parts[socket.id].indexOf(part) >= 0) return;
                    parts[socket.id].push(part);
                    socket.broadcast.emit('updatePart', socket.id, part);
                });

                //失联
                socket.on('disconnect', () => {
                    delete parts[socket.id];
                    socket.broadcast.emit('removeSeed', socket.id);
                })
            });
        });


        //signaling 一部分
        socket.on('sendCandidate', (id, candidate) => {
            socket.to(id).emit('receiveCandidate', socket.id, candidate);
        });
        //signaling 一部分
        socket.on('sendOffer', (id, offer) => {
            socket.to(id).emit('receiveOffer', socket.id, offer);
        })
        //signaling 一部分
        socket.on('sendAnswer', (id, answer) => {
            socket.to(id).emit('receiveAnswer', socket.id, answer);
        })
    })
}