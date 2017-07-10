
import io from 'socket.io-client'
import { logInfo } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export default class Signal {
    constructor(
        path = './',
        seedManage,
        onReady = () => { }
    ) {
        this.socket = io();
        this.emitter = new EventEmitter2();

        this.socket.on('connect', () => {

            this.socket.emit('join', path);

            this.socket.on('ready', seeds => {
                seeds.forEach(function (seed) {
                    seedManage.addSeed(seed);
                });

                this.socket.on('addSeed', seed => {
                    seedManage.addSeed(seed);
                });

                this.socket.on('removeSeed', id => {
                    seedManage.removeSeed(id);
                });

                this.socket.on('updatePart', (id, partName) => {
                    seedManage.updatePart(id, partName);
                })

                this.socket.on('receiveCandidate', (peer, candidate) => {
                    seedManage.getConnectedPeer(peer).receiveIceCandidate(candidate);
                    logInfo(`receive candidate from ${peer}`);
                });

                this.socket.on('receiveOffer', (peer, offer) => {
                    seedManage.getConnectedPeer(peer).receiveOffer(offer);
                    logInfo(`receive offer from ${peer}`);
                })

                this.socket.on('receiveAnswer', (peer, answer) => {
                    seedManage.getConnectedPeer(peer).receiveAnswer(answer);
                    logInfo(`receive answer from ${peer}`);
                })

                this.onReady();
            });
        });
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