import Peer from './peer'
import md5 from 'blueimp-md5'
import base64 from 'base64-arraybuffer'
import { chunk } from 'lodash'
import { getTime } from 'date-fns'
import { logError, logInfo } from './debugger'
import { Decoder, Encoder, BINARY_EVENT, EVENT, ERROR } from 'socket.io-p2p-parser'

export default class Session extends Peer {
    constructor(id, seed) {
        super(id, seed.signal);
        this.seed = seed;
        this.maxChunkSize = 20000;
        this.decoder = new Decoder();

        this.queue = [];
        this.currentTask = null;

        this.onConnected = () => { };

        this.on('message', event => {
            this.decoder.add(event.data);
        });

        this.on('error', err => {
            if (this.currentTask) this.currentTask.reject(err);
        })

        this.on('statechange', state => {
            if (state === this.states.CONNECTED) {
                this.next();
            }
        });

        this.decoder.on('decoded', decodedPacket => {
            if (decodedPacket.type === ERROR) return this.error(new Error(decodedPacket.data));
            if (!decodedPacket.data.event) return this.error(new Error('错误的消息格式:缺少应答编号'));

            switch (decodedPacket.type) {
                case EVENT:
                    this.seed.findPart(decodedPacket.data.part).then(buf => {
                        console.log(`发送数据块 ${buf.byteLength} : ${decodedPacket.data.part}`);
                        this.sendBinaryResponse(buf, decodedPacket.data.event);
                    })
                    break;
                case BINARY_EVENT:
                    let buf = decodedPacket.data.data;//!!!!!
                    if (this.currentTask) this.currentTask.resolve(buf);
                    break;
            }
        })
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
            if (this.readyState == this.states.NOT_CONNECTE) {
                this.createDataChannel();
                this.sendOffer();
                this.onConnected = resolve;
            } else if (this.readyState === this.states.CONNECTED) {
                resolve(this);
            } else if (this.readyState === this.states.CONNECTING) {
                resolve(this);
            } else {
                resolve(this);
            }
        });
    }

    next() {
        if (this.currentTask == null && this.queue.length > 0 && this.readyState === this.states.CONNECTED) {
            this.currentTask = this.queue.shift();
            this.currentTask.handle();
        }
        //wait
    }

    fetch(part) {
        let clearCurrentAndNext = () => {
            this.currentTask = null;
            this.next();
        }
        return new Promise((resolve, reject) => {
            this.queue.push({
                resolve: result => {
                    resolve(result);
                    clearCurrentAndNext();
                },
                reject: reason => {
                    reject(reason);
                    clearCurrentAndNext();
                },
                handle: () => {
                    let event = md5(getTime(new Date()) + this.id);
                    this.sendFetchMessage(part, event).catch(err => reject);
                }
            });
            this.next();
        });
    }
}