import {
    PeerConnection as nativePeerConnection,
    SessionDescription as nativeSessionDescription,
    IceCandidate as nativeIceCandidate
} from './native'
import { iceServers } from './config'
import { logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export default class Peer {
    constructor(id, signal) {
        this.id = id;
        this.signal = signal;
        this.emitter = new EventEmitter2();
        this.isReady = false;

        //PeerRTCConnection
        this.connection = new nativePeerConnection({
            iceServers
        });

        //PeerConnection events
        this.connection.onicecandidate = event => {
            if (!event.candidate) return;
            this.signal.sendCandidate(this.id, event.candidate);
        };

        //RTCDataChannel
        this.datachannel = this.connection.createDataChannel(this.id);

        //RTCDataChannel events
        this.datachannel.onopen = () => {
            this.isReady = true;
            this.emitter.emit('ready');
        };

        this.datachannel.onmessage = event => {
            this.emitter.emit('data', event.data);
        };

        this.datachannel.onclose = () => {
            this.isReady = false;
            this.emitter.emit('channelclose');
        };        
    }

    send(message) {
        if ('open' === this.connection.readyState) {
            this.datachannel.send(message);
        }
    }

    /**
     * add recevied icecandidate
     * @param {*} candidate 
     */
    addIceCandidate(candidate) {
        let remoteCandidate = new nativeIceCandidate(candidate);
        this.connection.addIceCandidate(remoteCandidate).catch(logError);
        return this;
    }

    /**
     * Send SDP Offer
     */
    sendOffer() {
        if (!this.connection) return this;
        this.connection.createOffer().then(offer => {
            this.connection.setLocalDescription(offer);
            this.signal.sendOffer(this.id, offer);
        }, logError);
        return this;
    }

    /**
     * Receive Offer from remote
     * @param {*} sdp 
     */
    receiveOffer(sdp) {
        if (!this.connection) return this;
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).then(() => {
            this.sendAnswer();
        }).catch(logError);
        return this;
    }


    /**
     * Send SDP Answer
     */
    sendAnswer() {
        if (!this.connection) return this;
        this.connection.createAnswer().then(answer => {
            this.connection.setLocalDescription(answer);
            this.signal.sendAnswer(this.id, answer);
        }).catch(logError);
        return this;
    }

    /**
     * Receive Answer from remote
     * @param {*} sdp 
     */
    receiveAnswer(sdp) {
        if (!this.connection) return this;
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).catch(logError);
        return this;
    }

    /**
     * close connection
     */
    hunup() {
        if (!this.connection) return this;
        this.connection.close();
        this.connection = null;
    }

    /** callbacks */
    ready(onReady = () => { }) {
        this.emitter.once('ready', onReady.bind(this));
        if (this.isReady) this.emitter.emit('ready');
    }

    data(onData = () => { }) {
        this.emitter.on('data', onData.bind(this));
    }
}