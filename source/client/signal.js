
import io from 'socket.io-client'
import { logInfo } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export default class Signal {
    constructor(manager, room = 'test') {
        this.socket = io();
        this.manager = manager;
        this.emitter = new EventEmitter2();

        this.socket.on('connect', () => {

            this.socket.emit('join', room);

            this.socket.on('ready', (peers) => {
                logInfo(`got peer list : ${peers.join(',')}`);

                this.emitter.emit('ready', peers);

                this.socket.on('newPeer', peer => {
                    manager.newPeer(peer);
                    logInfo(`got new peer : ${manager.peers.join(',')}`);
                })

                this.socket.on('removePeer', peer => {
                    manager.removePeer(peer);
                    logInfo(`peer remove : ${manager.peers.join(',')}`);
                })

                this.socket.on('receiveCandidate', (peer, candidate) => {
                    manager.getPeer(peer).addIceCandidate(candidate);
                    logInfo(`receive candidate from ${peer}`);
                });

                this.socket.on('receiveOffer', (peer, offer) => {
                    manager.getPeer(peer).receiveOffer(offer);
                    logInfo(`receive offer from ${peer}`);
                })

                this.socket.on('receiveAnswer', (peer, answer) => {
                    manager.getPeer(peer).receiveAnswer(answer);
                    logInfo(`receive answer from ${peer}`);
                })
            });
        });
    }

    ready(onReady = () => { }) {
        this.emitter.once('ready', onReady);
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