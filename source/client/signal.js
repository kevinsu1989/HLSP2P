
import io from 'socket.io-client'

export default class Signal {
    constructor(client, room = 'test', ready = () => { }) {
        this.socket = io();
        this.client = client;

        this.socket.on('connect', () => {

            this.socket.emit('join', room);

            this.socket.on('ready', (id, peerList) => {
                console.log(`join room got id ${id} and ready to go`);
                console.log(`got peer list : ${peerList.join(',')}`);

                ready(id, peerList);

                this.socket.on('newPeer', peer => {
                    client.addPeer(peer);
                    console.log(`got new peer : ${client.peerList.join(',')}`);
                })

                this.socket.on('removePeer', peer => {
                    client.removePeer(peer);
                    console.log(`peer remove : ${client.peerList.join(',')}`);
                })

                this.socket.on('receiveCandidate', (peer, candidate) => {
                    client.peer(peer).addCandidate(candidate);
                    console.log(`receive candidate from ${peer}`);
                });

                this.socket.on('receiveOffer', (peer, offer) => {
                    client.peer(peer).receiveOffer(offer);
                    console.log(`receive offer from ${peer}`);
                })

                this.socket.on('receiveAnswer', (peer, answer) => {
                    client.peer(peer).receiveAnswer(answer);
                    console.log(`receive answer from ${peer}`);
                })
            });
        });
    }

    sendCandidate(id, candidate) {
        console.log(`send candidate to ${id}`);
        this.socket.emit('sendCandidate', id, candidate);
    }

    sendOffer(id, offer) {
        console.log(`send offer to ${id}`);
        this.socket.emit('sendOffer', id, offer);
    }

    sendAnswer(id, answer) {
        console.log(`send answer to ${id}`);
        this.socket.emit('sendAnswer', id, answer);
    }
}