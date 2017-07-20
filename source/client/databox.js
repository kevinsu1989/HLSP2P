import Seed from './seed'
import { filename } from './util'
import { defaults } from 'lodash'
import { isWebRTCSupported } from 'detectrtc'
import { logInfo, logError } from './debugger'

const forceCDN = false;

export default class DataBox {
    constructor(host, id) {
        this.id = id;
        this.parts = {};
        this.seed = null;
        if (isWebRTCSupported || !forceCDN)
            this.seed = new Seed(host, id);
    }

    get isConnected() {
        return this.seed.signal.isConnected;
    }

    getFile(url, range = '') {
        return this.getFileFromP2P(url, range).catch(err => {
            logError(err);
            return this.getFileFromCDN(url, range);
        }).then(buf => {
            if (isWebRTCSupported) {
                let partName = this.partName(this.id, url, range);
                this.seed.addPart(url, partName, buf);
            }
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
        if (forceCDN) return Promise.reject(new Error('强制使用CDN'));
        if (!isWebRTCSupported) return Promise.reject(new Error('WebRTC不支持'));
        if (!this.isConnected) return Promise.reject(new Error('还没连上P2P服务'));

        let part = this.partName(this.id, url, range);
        return this.seed.getRandomPeerHasPart(part)
            .then(session => {
                return session.fetch(part);
            }).then(buf => {
                console.log('从P2P获取模块', buf.byteLength);
                return buf;
            });
    }

    partName(video, url, range = '') {
        let name = filename(url);
        return video + ':' + name + ':' + range;
    }
}