import {
    PeerConnection as nativePeerConnection,
    SessionDescription as nativeSessionDescription,
    IceCandidate as nativeIceCandidate
} from './native'
import { iceServers } from './config'
import { logInfo, logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export default class Peer {
    constructor(id, signal) {
        this.id = id;
        this.signal = signal;
        this.emitter = new EventEmitter2();
        this.isConnected = false;

        //PeerRTCConnection
        this.connection = new nativePeerConnection({
            iceServers
        });

        //PeerConnection events
        this.connection.onicecandidate = event => {
            if (!event.candidate) return;
            this.signal.sendCandidate(this.id, event.candidate);
        };

        this.connection.ondatachannel = event => {
            //store the channel
            this.datachannel = event.channel;
            this.handleDataChannel();
        };
    }

    /**
     * Send data to remote
     * @param {*} data 
     * @param {*} label 
     * @param {*} opt 
     */
    send(data, label = '*', opt = {}) {
        let readyState = this.datachannel.readyState;
        if ('open' === readyState) {
            this.datachannel.send(JSON.stringify(data));
        } else {
            throw new Error('channel not open');
        }
    }

    /**
     * create peer datachannel
     * @param {*} label 
     * @param {*} opt 
     */
    createDataChannel(label = '*', opt = {}) {
        //RTCDataChannel
        this.datachannel = this.connection.createDataChannel(this.id);
        this.handleDataChannel();

        return this.datachannel;
    }

    /**
     * set datachannel events
     * @param {*} datachannel 
     */
    handleDataChannel(datachannel) {
        //RTCDataChannel events
        this.datachannel.onopen = () => {
            let readyState = this.datachannel.readyState;
            this.isConnected = true;

            logInfo(`receive channel[${this.datachannel.id}] state : ${readyState}`);
            this.emitter('ready');
        }
        this.datachannel.onmessage = event => {
            this.emitter.emit('data', JSON.parse(event.data));
        }
        this.datachannel.onclose = () => {
            this.closeDataChannel();
        };
    }

    /**
     * add recevied icecandidate
     * @param {*} candidate 
     */
    receiveIceCandidate(candidate) {
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

    closeDataChannel() {
        if (!this.datachannel) return;
        this.datachannel.close();
        this.datachannel = null;
        this.emitter.emit('channelclose');
    }

    /**
     * close connection
     */
    hunup() {
        if (!this.connection) return;
        this.closeDataChannel();
        this.connection.close();
        this.connection = null;
        this.isConnected = false;
    }

    /** callbacks */
    ready(onReady = () => { }) {
        this.emitter.once('ready', onReady);
        if (this.datachannel && this.datachannel.readyState == 'open') this.emitter.emit('ready');
        return this;
    }

    data(onData = () => { }) {
        this.emitter.on('data', onData);
        return this;
    }
}