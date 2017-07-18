import Peer from './peer'
import { chunkBuffer, timeCounter, MD5Buffer, MD5Now } from './util'
import { logError, logInfo } from './debugger'
import { Decoder, Encoder, BINARY_EVENT, ACK, ERROR } from 'em-rtc-parser'

export default class Fetch extends Peer {
    constructor(id, seed) {
        super(id, seed.signal);
        this.seed = seed;
        this.chunkSize = 2000;

        this.queue = [];
        this.messageChannel = null;

        this.connection.ondatachannel = event => {
            let channel = event.channel;
            if (channel.label == 'message') {
                this.setMessageChannelEvent(channel);
            } else {
                this.setDataChannelReceiveEvent(channel);
            }
        }
    }

    createChannel(label, binaryType = 'arraybuffer') {
        let channel = this.connection.createDataChannel(label);
        channel.binaryType = binaryType;
        return channel;
    }

    //message part
    createMessageChannel() {
        if (this.messageChannel) return this.messageChannel;
        let channel = this.createChannel('message');
        this.setMessageChannelEvent(channel);
    }

    setMessageChannelEvent(channel) {
        let decoder = new Decoder();

        //handle message
        decoder.on('decoded', decodedPacket => {
            //handle Error message
            //do nothing ? 
            if (ERROR === decodedPacket.type)
                return this.error(new Error(decodedPacket.data));

            let part = decodedPacket.data.data;
            let seq = decodedPacket.data.seq;

            logInfo(`收到需要模块${part} 编号${seq}的请求`);

            this.seed.findPart(part).then(buf => {
                return this.sendBinaryData(seq, buf);
            }).catch(err => {
                this.sendError(seq, err);
            });
        });

        channel.onopen = () => {
            this.next();
        }

        channel.onmessage = event => {
            //receive message data
            decoder.add(event.data);
        }

        channel.onclose = () => {
            this.messageChannel = null;
        }
        this.messageChannel = channel;
    }

    //data part
    createDataChannel(seq) {
        return new Promise((resolve, reject) => {
            let channel = this.createChannel(seq, 'arraybuffer');
            channel.onopen = () => {
                resolve(channel);
            };
        });
    }

    setDataChannelReceiveEvent(channel) {
        let decoder = new Decoder();
        //可能的Seq
        let propSeq = channel.label;

        decoder.on('decoded', decodedPacket => {
            channel.close();
            if (ERROR === decodedPacket.type) return this.emit(`${propSeq}`, new Error(decodedPacket.data), null);
            let seq = decodedPacket.data.seq;
            let buf = decodedPacket.data.data;
            let md5 = decodedPacket.data.md5;

            if (!seq) return this.emit(`${propSeq}`, new Error('为获取到会话编号'), null);
            if (!(buf instanceof ArrayBuffer) || buf.byteLength == 0) return this.emit(`${propSeq}`, new Error('数据类型错误'), null);
            if (!md5) return this.emit(`${propSeq}`, new Error('缺少MD5验签'), null);


            let md5Recevice = MD5Buffer(buf);
            if (md5Recevice !== md5) return this.emit(`${propSeq}`, new Error('MD5验签不通过'), null);

            logInfo(`收到模块 编号 ${seq} 的数据 ${buf.byteLength} byte`);
            this.emit(`${seq}`, null, buf);
        });
        channel.onmessage = event => {
            decoder.add(event.data);
        }
        channel.onclose = () => {
            this.emit(`${propSeq}`, new Error('数据通道已关闭'), null);
        }
    }

    //sending
    sendRequestMessage(part) {
        let seq = MD5Now(this.id, part);
        let message = {
            type: ACK,
            data: {
                seq,
                data: part
            }
        }
        logInfo(`发送请求`, seq, part);
        return this.sendEncodeMessage(message, this.messageChannel).then(() => seq);
    }

    sendBinaryData(seq, buf) {
        return this.createDataChannel(seq).then(channel => {
            let chunks = chunkBuffer(buf, this.chunkSize);
            let md5 = MD5Buffer(buf);
            let chunkData = {
                type: BINARY_EVENT,
                data: {
                    seq,
                    md5,
                    data: chunks
                }
            };
            logInfo(`发送模块数据`, seq, buf.byteLength);
            return this.sendEncodeMessage(chunkData, channel);
        });
    }

    sendError(seq, err) {
        return this.createDataChannel(seq).then(channel => {
            let errorMessage = {
                type: ERROR,
                data: {
                    seq,
                    data: err
                }
            };
            return this.sendEncodeMessage(errorMessage, channel);
        })
    }

    sendEncodeMessage(message, channel) {
        let encoder = new Encoder();
        return new Promise((resolve, reject) => {
            encoder.encode(message, encodedPackets => {
                for (let packet of encodedPackets) {
                    try {
                        if (channel.readyState === 'open') {
                            channel.send(packet);
                        } else {
                            throw new Error('通道未打开');
                        }
                    } catch (err) {
                        reject(err);
                        return;
                    }
                }
                resolve();
            });
        })
    }

    next() {
        if (this.messageChannel.readyState == 'open'
            && this.queue.length > 0) {
            let task = this.queue.shift();
            task();
        }
    }

    //public methods
    fetch(part, timeout = 500) {
        let fetcher = new Promise((resolve, reject) => {
            //channel build first!!
            if (!this.messageChannel) {
                this.createMessageChannel();
            }
            //not connected then connect
            if (this.connection.iceConnectionState == 'new') {
                this.sendOffer();
            }

            let task = () => {
                return this.sendRequestMessage(part).then(seq => {
                    this.emitter.once(`${seq}`, function (err, buf) {
                        if (err) return reject(err);
                        resolve(buf);
                    });
                }).catch(err => {
                    reject(err);
                });
            };

            this.queue.push(task);
            //try to exec immediately
            this.next();
        });

        let counter = timeCounter(fetcher, timeout);

        return counter.then(buf => {
            this.next();
            return buf;
        }, err => {
            this.next();
            throw err;
        })
    }
}