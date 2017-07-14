import {
    PeerConnection as nativePeerConnection,
    SessionDescription as nativeSessionDescription,
    IceCandidate as nativeIceCandidate
} from './native'
import { iceServers } from './config'
import { logInfo, logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

const NOT_CONNECTE = 0;
const CONNECTING = 1;
const CONNECTED = 2;

export default class Peer {
    constructor(id, signal) {
        this.id = id;
        this.signal = signal;
        this.emitter = new EventEmitter2();
        this.readyState = NOT_CONNECTE;

        this.states = {
            NOT_CONNECTE,
            CONNECTING,
            CONNECTED
        };

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
            this.handleDataChannel(this.datachannel);
        };
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
        logError(err);
        this.emit('err', err);
        return Promise.reject(err);
    }

    /**
     * Send data to remote
     * @param {*} data 
     * @param {*} label 
     * @param {*} opt 
     */
    send(data) {
        let readyState = this.datachannel.readyState;
        if ('open' === readyState) {
            this.datachannel.send(data);
        } else {
            throw new Error('P2P通道还未打开');
        }
    }

    /**
     * create peer datachannel
     * @param {*} label 
     * @param {*} opt 
     */
    createDataChannel() {
        //RTCDataChannel
        this.datachannel = this.connection.createDataChannel('data');
        this.datachannel.binaryType = "arraybuffer";
        this.handleDataChannel(this.datachannel);
    }

    /**
     * set datachannel events
     * @param {*} datachannel 
     */
    handleDataChannel(datachannel) {
        //RTCDataChannel events
        datachannel.onopen = () => {
            let readyState = datachannel.readyState;
            this.changeState(this.states.CONNECTED);
        }
        datachannel.onmessage = event => {
            this.emit('message', event);
        }
        datachannel.onclose = () => {
            this.closeDataChannel();
        };
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
        this.changeState(this.states.CONNECTING);
        this.connection.createOffer().then(offer => {
            this.connection.setLocalDescription(offer);
            this.signal.sendOffer(this.id, offer);
        }, err => {
            this.changeState(this.states.NOT_CONNECTE);
            this.error(err)
        });
    }

    /**
     * Receive Offer from remote
     * @param {*} sdp 
     */
    receiveOffer(sdp) {
        if (!this.connection) return this;
        this.changeState(this.states.CONNECTING);
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).then(() => {
            this.sendAnswer();
        }).catch(err => {
            this.changeState(this.states.NOT_CONNECTE);
            this.error(err)
        });
    }


    /**
     * Send SDP Answer
     */
    sendAnswer() {
        if (!this.connection) return this;
        this.changeState(this.states.CONNECTING);
        this.connection.createAnswer().then(answer => {
            this.connection.setLocalDescription(answer);
            this.signal.sendAnswer(this.id, answer);
        }).catch(err => {
            this.changeState(this.states.NOT_CONNECTE);
            this.error(err)
        });
    }

    /**
     * Receive Answer from remote
     * @param {*} sdp 
     */
    receiveAnswer(sdp) {
        if (!this.connection) return this;
        this.changeState(this.states.CONNECTING);
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription).catch(err => {
            this.changeState(this.states.NOT_CONNECTE);
            this.error(err)
        });
    }

    closeDataChannel() {
        if (!this.datachannel) return;
        this.datachannel.close();
        this.datachannel = null;
        this.emit('channelclose');
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
        this.closeDataChannel();
        this.connection.close();
        this.connection = null;
        this.changeState(this.states.NOT_CONNECTE);
    }
}