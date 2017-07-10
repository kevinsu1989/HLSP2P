import Peer from './peer'
import md5 from 'blueimp-md5'
import { getTime } from 'date-fns'
import { logError, logInfo } from './debugger'

export default class Intercom extends Peer {
    constructor(id, signal) {
        super(id, signal);
        this.talks = {};
    }

    connect() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                this.createDataChannel();
                this.sendOffer();
                this.emitter.once('connected', resolve);
            } else {
                resolve();
            }
        });
    }

    listen(onListen = () => null) {
        this.emitter.on('data', data => {
            if (!data.type) return logError('错误的消息格式:缺少消息类型');

            switch (data.type) {
                case 'req':
                    return this.handleRequest(data, onListen);
                case 'res':
                    return this.handleResponse(data);
            }
        });
    }

    require(path, handleData = (lastData, data) => data) {
        let sendPromies = new Promise((resolve, reject) => {
            let now = getTime(new Date());
            let talkId = md5(now + this.id);
            let request = {
                id: talkId,
                type: 'req',
                data: path
            };

            this.talks[talkId] = {
                job: sendPromies,
                handleData,
                resolve,
                reject,
                req: request,
                res: null
            };

            this.send(request);
        });
        return sendPromies;
    }

    append(id, data) {
        let response = {
            id,
            type: 'res',
            data: data,
            end: false
        }

        this.send(response);
        return this;
    }

    end(id) {
        let response = {
            id,
            type: 'res',
            end: true
        }

        this.send(response);
        return this;
    }

    handleRequest(data, onListen) {
        onListen(data.id, data.data);
    }

    handleResponse(data) {
        if (!data.id) return logError('错误的消息格式:缺少应答编号');
        let talkJob = this.talks[data.id];
        if (!talkJob) return logError(`未找到编号为${data.id}的会话`);

        let lastData = talkJob.response ? talkJob.response.data : null;

        if (data.end) {
            if (lastData) {
                talkJob.resolve(lastData);
            } else {
                talkJob.reject(new Error('会话以无数据结束'));
            }
            delete this.talks[data.id];
        } else {
            let solveData = talkJob.handleData(lastData, data.data);
            data.data = solveData;
            talkJob.response = data;
        }
    }
}