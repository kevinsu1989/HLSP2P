import Peer from './peer'
import md5 from 'blueimp-md5'
import base64 from 'base64-arraybuffer'
import { chunk } from 'lodash'
import { getTime } from 'date-fns'
import { logError, logInfo } from './debugger'
import { Encoder, BINARY_EVENT, EVENT, ERROR } from 'socket.io-p2p-parser'

export default class Session extends Peer {
    constructor(id, seed) {
        super(id, seed.signal);
        this.seed = seed;
        this.maxChunkSize = 20000;

        this.on('data', data => {
            if (data.type === ERROR) return this.error(new Error(data.data));
            if (!data.data.event) return this.error(new Error('错误的消息格式:缺少应答编号'));

            switch (data.type) {
                case EVENT:
                    this.seed.findPart(data.data.part).then(buf => {
                        console.log(`发送数据块 ${buf.byteLength} : ${data.data.part}`);
                        this.sendBinaryResponse(buf, data.data.event);
                    })
                    break;
                case BINARY_EVENT:
                    let buf = data.data.data;//!!!!!
                    this.emit(`data.${data.data.event}`, buf);
                    break;
            }
        });
    }

    sendBinaryResponse(buf, event) {
        let chunkedBuffer = this.bufferToChunked(buf);

        return this.sendEncodedPackets({
            type: BINARY_EVENT,
            data: { event, chunks: chunkedBuffer }
        });
    }

    sendFetchMessage(part, event) {
        return this.sendEncodedPackets({
            type: EVENT,
            data: { event, part }
        });
    }

    sendEncodedPackets(data) {
        return new Promise((resolve, reject) => {
            let encoder = new Encoder();
            encoder.encode(data, encodedPackets => {
                for (let packet of encodedPackets) {
                    try {
                        this.send(packet);
                    } catch (err) {
                        reject(err);
                    }
                }
                resolve();
            });
        });
    }

    bufferToChunked(buf) {
        let result = [];
        if (buf instanceof ArrayBuffer) {
            let len = buf.byteLength;
            let i = 0;
            while (i < len) {
                result.push(buf.slice(i, i += this.maxChunkSize));
            }
        }
        return result;
    }

    chunkToBuffer(chunks) {
        return new Uint8Array(chunks).buffer;
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                this.createDataChannel();
                this.sendOffer();
                this.emitter.on('connected', () => {
                    resolve(this);
                });
            } else {
                resolve(this);
            }
        });
    }

    fetch(part) {
        return new Promise((resolve, reject) => {
            let event = md5(getTime(new Date()) + this.id);
            this.emitter.once(`data.${event}`, data => {
                resolve(data);
            });
            this.sendFetchMessage(part, event).catch(err => reject);
        });
    }
}