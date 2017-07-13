import Seed from './seed'
import uri from 'urijs'
import { defaults } from 'lodash'
import { logInfo, logError } from './debugger'

export default class DataBox {
    constructor(id) {
        this.id = id;
        this.parts = {};
        this.seed = new Seed(id);
    }

    get isConnected() {
        return this.seed.signal.isConnected;
    }

    getFile(url, range = '') {
        return this.getFileFromP2P(url, range).catch(err => {
            logError(err.message);
            return this.getFileFromCDN(url, range);
        }).then(buf => {
            let partName = this.partName(this.id, url, range);
            this.seed.addPart(url, partName, buf);
            return buf;
        });
    }

    getFileFromCDN(url, range = '') {
        let options = {};
        if (range !== '') {
            options.headers = {
                'Range': `bytes=${range}`
            };
        }
        return fetch(url, options).then(res => {
            return res.arrayBuffer();
        }).then(buf => {
            console.log('从CDN获取模块', buf.byteLength);
            return buf;
        });
    }

    getFileFromP2P(url, range = '') {
        if (!this.isConnected) return Promise.reject(new Error('还没连上P2P服务'));

        let part = this.partName(this.id, url, range);
        return this.seed.getRandomPeerHasPart(part)
            .then(session => {
                return session.connect();
            }).then(session => {
                return session.fetch(part);
            }).then(buf => {
                console.log('从P2P获取模块', buf.byteLength);
                return buf;
            })
    }

    partName(video, url, range = '') {
        let filename = new uri(url).filename();
        return video + ':' + filename + ':' + range;
    }
}