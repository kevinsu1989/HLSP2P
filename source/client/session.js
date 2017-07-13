import Peer from './peer'
import md5 from 'blueimp-md5'
import { getTime } from 'date-fns'
import { logError, logInfo } from './debugger'

export default class Session extends Peer {
    constructor(id, seed) {
        super(id, seed.signal);
        this.seed = seed;

        this.on('data', data => {
            if (!data.type) return logError('错误的消息格式:缺少消息类型');
            if (!data.event) return logError('错误的消息格式:缺少应答编号');

            switch (data.type) {
                case 'request':
                    this.seed.findPart(data.msg).then(buf => {
                        this.send({
                            type: 'response',
                            event: data.event,
                            msg: '',
                            data: buf
                        });
                    })
                    break;
                case 'response':
                    this.emit(`data.${data.event}`, data.data);
                    break;
            }
        })
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
            this.send({
                event,
                type: 'request',
                msg: part,
                data: null
            });
        });
    }
}