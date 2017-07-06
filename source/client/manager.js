import Peer from './peer'
import Signal from './signal'
import { EventEmitter2 } from 'eventemitter2'
import { pull } from 'lodash'

export default class Manager {
    constructor() {
        this.connected = {};
        this.peers = [];
        this.isReady = false;

        this.emitter = new EventEmitter2();

        this.signal = new Signal(this);

        this.signal.ready(peers => {
            this.isReady = true;
            this.peers = peers;
            this.emitter.emit('ready');
        });
    }

    getPeer(peerId) {
        if (!this.isReady) return;
        if (this.connected[peerId]) return this.connected[peerId];

        let remotePeer = new Peer(peerId, this.signal);
        this.connected[peerId] = remotePeer;

        return remotePeer;
    }

    newPeer(peer) {
        this.peers.push(peer);
        this.emitter.emit('peerChange');

        return this;
    }

    removePeer(peer) {
        pull(this.peers, peer);
        this.emitter.emit('peerChange');

        return this;
    }

    //callbacks

    ready(onReady = () => { }) {
        this.emitter.once('ready', onReady.bind(this));
        if (this.isReady) this.emitter('ready');
        return this;
    }

    peerChange(onPeerChange = () => { }) {
        this.emitter.on('peerChange', onPeerChange.bind(this));
        return this;
    }
}