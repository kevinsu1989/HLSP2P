import {
    PeerConnection as nativePeerConnection,
    SessionDescription as nativeSessionDescription,
    IceCandidate as nativeIceCandidate
} from './native'
import { iceServers } from './config'

const logError = err => console.error(err);

export default class Peer {
    constructor(id, socket) {
        this.id = id;
        this.socket = socket;


        this.onAddStream = () => { };


        this.connection = new nativePeerConnection({
            iceServers
        });

        this.connection.onicecandidate = event => {
            if (!event.candidate) return;
            this.socket.sendCandidate(this.id, event.candidate);
        };

        this.connection.onaddstream = (event) => {
            this.onAddStream(event.stream)
        };
    }

    stream(onAddStream = () => { }) {
        this.onAddStream = onAddStream;
        return this;
    }

    addStream(stream) {
        this.connection.addStream(stream);
        return this;
    }

    addCandidate(candidate) {
        let remoteCandidate = new nativeIceCandidate(candidate);
        this.connection.addIceCandidate(remoteCandidate);
        return this;
    }

    /**
     * Send SDP Offer
     */
    sendOffer() {
        if (!this.connection) return this;
        this.connection.createOffer(offer => {
            this.connection.setLocalDescription(offer);
            this.socket.sendOffer(this.id, offer);
        }, logError);
        return this;
    }


    receiveOffer(sdp) {
        if (!this.connection) return this;
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription, () => {
            this.sendAnswer();
        }, logError);
        return this;
    }


    /**
     * Send SDP Answer
     */
    sendAnswer() {
        if (!this.connection) return this;
        this.connection.createAnswer(answer => {
            this.connection.setLocalDescription(answer);
            this.socket.sendAnswer(this.id, answer);
        }, logError);
        return this;
    }

    receiveAnswer(sdp) {
        if (!this.connection) return this;
        let remoteSessionDescription = new nativeSessionDescription(sdp);
        this.connection.setRemoteDescription(remoteSessionDescription, () => { }, logError);
        return this;
    }
}