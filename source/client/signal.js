
import io from 'socket.io-client'
import { logInfo } from './debugger'

export default class Signal {
    constructor(manager, room = 'test', ready = () => { }) {
        this.socket = io();
        this.manager = manager;

        this.socket.on('connect', () => {

            this.socket.emit('join', room);

            this.socket.on('ready', (id, peers) => {
                logInfo(`join room got id ${id} and ready to go`);
                logInfo(`got peer list : ${peers.join(',')}`);

                ready(id, peers);

                this.socket.on('newPeer', peer => {
                    manager.addPeer(peer);
                    logInfo(`got new peer : ${manager.peers.join(',')}`);
                })

                this.socket.on('removePeer', peer => {
                    manager.removePeer(peer);
                    logInfo(`peer remove : ${manager.peers.join(',')}`);
                })

                this.socket.on('receiveCandidate', (peer, candidate) => {
                    manager.peer(peer).addIceCandidate(candidate);
                    logInfo(`receive candidate from ${peer}`);
                });

                this.socket.on('receiveOffer', (peer, offer) => {
                    manager.peer(peer).receiveOffer(offer);
                    logInfo(`receive offer from ${peer}`);
                })

                this.socket.on('receiveAnswer', (peer, answer) => {
                    manager.peer(peer).receiveAnswer(answer);
                    logInfo(`receive answer from ${peer}`);
                })
            });
        });
    }

    sendCandidate(id, candidate) {
        logInfo(`send candidate to ${id}`);
        this.socket.emit('sendCandidate', id, candidate);
    }

    sendOffer(id, offer) {
        logInfo(`send offer to ${id}`);
        this.socket.emit('sendOffer', id, offer);
    }

    sendAnswer(id, answer) {
        logInfo(`send answer to ${id}`);
        this.socket.emit('sendAnswer', id, answer);
    }
}