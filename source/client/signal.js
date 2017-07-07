
import io from 'socket.io-client'
import { logInfo } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export default class Signal {
    constructor(
        path = './',
        scheduler
    ) {
        this.socket = io();
        this.emitter = new EventEmitter2();

        this.socket.on('connect', () => {

            this.socket.emit('join', path);

            this.socket.on('ready', seeds => {

                this.emitter.emit('ready', seeds);

                this.socket.on('addSeed', seed => {
                    scheduler.addSeed(seed);
                });

                this.socket.on('removeSeed', id => {
                    scheduler.removeSeed(id);
                });

                this.socket.on('updatePart', (id, partName) => {
                    scheduler.updatePart(id, partName);
                })

                this.socket.on('receiveCandidate', (peer, candidate) => {
                    scheduler.getConnectedPeer(peer).receiveIceCandidate(candidate);
                    logInfo(`receive candidate from ${peer}`);
                });

                this.socket.on('receiveOffer', (peer, offer) => {
                    scheduler.getConnectedPeer(peer).receiveOffer(offer);
                    logInfo(`receive offer from ${peer}`);
                })

                this.socket.on('receiveAnswer', (peer, answer) => {
                    scheduler.getConnectedPeer(peer).receiveAnswer(answer);
                    logInfo(`receive answer from ${peer}`);
                })
            });
        });
    }

    ready(onReady = () => { }) {
        this.emitter.once('ready', onReady);
    }

    addPart(part) {
        this.socket.emit('addPart', part);
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