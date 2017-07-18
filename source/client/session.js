import Peer from './peer'
import md5 from 'blueimp-md5'
import base64 from 'base64-arraybuffer'
import { chunk } from 'lodash'
import { getTime } from 'date-fns'
import { logError, logInfo } from './debugger'
import { Decoder, Encoder, BINARY_EVENT, EVENT, ERROR } from 'em-rtc-parser'

export default class Session extends Peer {
    constructor(id, seed) {
        super(id, seed.signal);
        this.seed = seed;
        this.maxChunkSize = 500;
        this.decoder = new Decoder();

        this.queue = [];
        this.currentTask = null;

        this.on('message', event => {
            try {
                this.decoder.add(event.data);
            }
            catch (err) {
                this.error(err);
            }
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
                    this.seed.findPart(decodedPacket.data.data).then(buf => {
                        console.log(`发送数据块 ${buf.byteLength} : ${decodedPacket.data.data}`);
                        this.sendBinaryResponse(buf, decodedPacket.data.event);
                    }).catch(err => {
                        this.error(err);
                    })
                    break;
                case BINARY_EVENT:
                    let buf = decodedPacket.data.data;
                    if (this.currentTask) this.currentTask.resolve(buf);
                    break;
            }
        })
    }

    sendBinaryResponse(buf, event) {
        let chunkedBuffer = this.bufferToChunked(buf);

        return this.sendEncodedPackets({
            type: BINARY_EVENT,
            data: { event, data: chunkedBuffer }
        })
    }

    sendFetchMessage(part, event) {
        return this.sendEncodedPackets({
            type: EVENT,
            data: { event, data: part }
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

    connect() {
        return new Promise((resolve, reject) => {
            if (this.readyState == this.states.NOT_CONNECTE) {
                this.createDataChannel();
                this.sendOffer();
            }
            resolve(this);
        });
    }

    next() {
        if (this.currentTask == null && this.queue.length > 0 && this.readyState === this.states.CONNECTED) {
            this.currentTask = this.queue.shift();
            this.currentTask.handle();
        }
        //wait
    }

    done() {
        if (this.queue.length === 0 && this.readyState === this.states.CONNECTED) {
            this.closeDataChannel();
        }
    }

    fetch(part) {
        let clearCurrentAndNext = () => {
            this.currentTask = null;
            this.next();
            this.done();
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
                    return this.sendFetchMessage(part, event).catch(err => {
                        reject(err);
                        clearCurrentAndNext();
                    });
                }
            });
            this.next();
        });
    }
}