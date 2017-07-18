import {
    PeerConnection as nativePeerConnection,
    SessionDescription as nativeSessionDescription,
    IceCandidate as nativeIceCandidate
} from './native'
import { iceServers } from './config'
import { logInfo, logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export const NOT_CONNECTE = 0;
export const CONNECTING = 1;
export const CONNECTED = 2;

export default class Peer {
    constructor(id, signal) {
        this.id = id;
        this.signal = signal;
        this.emitter = new EventEmitter2();
        this.readyState = NOT_CONNECTE;

        //PeerRTCConnection
        this.connection = new nativePeerConnection({
            iceServers
        });

        //PeerConnection events
        this.connection.onicecandidate = event => {
            if (!event.candidate) return;
            this.signal.sendCandidate(this.id, event.candidate);
        };

        this.connection.onconnectionstatechange = event => {
            switch (this.connection.connectionState) {
                case "connected":
                    this.changeState(CONNECTED);
                    break;
                case "disconnected":
                case "failed":
                    this.changeState(NOT_CONNECTE);
                    break;
                case "closed":
                    this.changeState(NOT_CONNECTE);
                    break;
            }
        }
    }

    get on() {
        return this.emitter.on.bind(this.emitter);
    }

    get emit() {
        return this.emitter.emit.bind(this.emitter);
    }

    get off() {
        return this.emitter.off.bind(this.emitter);
    }

    error(err) {
        this.emit('error', err);
    }

    /**
     * add recevied icecandidate
     * @param {*} candidate 
     */
    receiveIceCandidate(candidate) {
        let remoteCandidate = new nativeIceCandidate(candidate);
        this.connection.addIceCandidate(remoteCandidate).catch(err => this.error(err));
    }

    /**
     * Send SDP Offer
     */
    sendOffer() {
        if (!this.connection) return this;
        this.changeState(CONNECTING);
        this.connection.createOffer().then(offer => {
            this.connection.setLocalDescription(offer);
            this.signal.sendOffer(this.id, offer);
        }, err => {
            this.changeState(NOT_CONNECTE);
            this.error(err)
        });
    }

    /**
     * Receive Offer from remote
     * @param {*} sdp 
     */
    receiveOffer(sdp) {
        if (!this.connection) return this;
        this.changeState(CONNECTING);
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).then(() => {
            this.sendAnswer();
        }).catch(err => {
            this.changeState(NOT_CONNECTE);
            this.error(err)
        });
    }


    /**
     * Send SDP Answer
     */
    sendAnswer() {
        if (!this.connection) return this;
        this.changeState(CONNECTING);
        this.connection.createAnswer().then(answer => {
            this.connection.setLocalDescription(answer);
            this.signal.sendAnswer(this.id, answer);
        }).catch(err => {
            this.changeState(NOT_CONNECTE);
            this.error(err)
        });
    }

    /**
     * Receive Answer from remote
     * @param {*} sdp 
     */
    receiveAnswer(sdp) {
        if (!this.connection) return this;
        this.changeState(CONNECTING);
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).catch(err => {
            this.changeState(NOT_CONNECTE);
            this.error(err)
        });
    }

    changeState(state) {
        if (this.readyState != state) {
            this.readyState = state;
            this.emit('statechange', state);
        }
    }

    /**
     * close connection
     */
    close() {
        if (!this.connection) return;
        this.connection.close();
        this.connection = null;
        this.changeState(NOT_CONNECTE);
    }
}