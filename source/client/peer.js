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

        //RTCConnection
        this.connection = new nativePeerConnection({
            iceServers
        });

        this.connection.onicecandidate = event => {
            if (!event.candidate) return;
            this.signal.sendCandidate(this.id, event.candidate);
        };

        this.connection.onaddstream = (event) => {
            this.emitter.emit('stream', event.stream);
        };
    }    

    addIceCandidate(candidate) {
        let remoteCandidate = new nativeIceCandidate(candidate);
        this.connection.addIceCandidate(remoteCandidate).catch(logError);
        return this;
    }

    addStream(stream) {
        this.connection.addStream(stream);
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

    receiveAnswer(sdp) {
        if (!this.connection) return this;
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).catch(logError);
        return this;
    }

    hunup() {
        if (!this.connection) return this;
        this.connection.close();
        this.connection = null;
    }

    //callbacks

    stream(onAddStream = () => { }) {
        this.emitter.on('stream', onAddStream.bind(this));
        return this;
    }
}