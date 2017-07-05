import Peer from './peer'
import Signal from './signal'
import { pull } from 'lodash'

export default class Client {
    constructor() {
        this.id = null;
        this.socket = null;
        this.connectedPeers = {};
        this.peerList = [];
        this.isReady = false;

        this.onReady = () => { };
        this.onPeerChange = () => { };
        this.onStream = () => { };
    }

    join(room) {
        this.socket = new Signal(this, room, (id, peerList) => {
            this.isReady = true;
            this.id = id;
            this.peerList = peerList;
            this.ready(this.onReady);
        })
        return this;
    }

    peer(peerId) {
        if (!this.isReady) return;
        if (this.connectedPeers[peerId]) return this.connectedPeers[peerId];

        let remotePeer = new Peer(peerId, this.socket);
        remotePeer.stream((stream) => {
            this.onStream.apply(this, [remotePeer, stream]);
        })
        this.connectedPeers[peerId] = remotePeer;
        return remotePeer;
    }

    addPeer(peerId) {
        this.peerList.push(peerId);
        this.onPeerChange.call(this);
        return this.peerList;
    }

    removePeer(peerId) {
        pull(this.peerList, peerId);
        this.onPeerChange.call(this);
        return this.peerList;
    }

    //callbacks

    ready(onReady = () => { }) {
        this.onReady = onReady;
        if (this.isReady) onReady.call(this);
        return this;
    }

    peerChange(onPeerChange = () => { }) {
        this.onPeerChange = onPeerChange;
        return this;
    }

    stream(onStream = () => { }) {
        this.onStream = onStream;
        return this;
    }
}