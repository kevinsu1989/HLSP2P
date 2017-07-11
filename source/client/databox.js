import Signal from './signal'
import Seed from './seed'
import Media from './media'
import uri from 'urijs'
import { defaults } from 'lodash'

export default class DataBox {
    constructor(videoId, opt) {
        let defaultOpt = {
            maxChunk: 1024 * 300 //300k
        };
        this.opt = defaults({}, defaultOpt, opt);
        this.videoId = videoId;
        this.medias = {};
        this.isConnected = false;

        this.seedManage = new Seed((peer, sessionId, partName) => {
            //todo
        });

        this.signal = new Signal(videoId, this.seedManage, () => {
            this.isConnected = true;
        });
    }

    getFile(url, onData = () => { }) {
        let name = new uri(url).filename;

        this.medias[name] = new Media(url, this.opt.maxChunk, function (part, blob) {
            onData(blob);
        });

        return this.medias[name].start();
    }

    /**
    * add part you have
    * @param {*} partName 
    */
    addPart(partUrl, blob) {
        // let name = new uri(partUrl).filename;
        // this.parts[name] = {
        //     partUrl,
        //     name,
        //     blob
        // };
        // this.signal.addPart(name);
    }

    findPart(name) {
        return new Promise((resolve, reject) => {
            let found = this.parts[name];
            if (found) {
                resolve(found.blob);
            } else {
                reject(new Error(`没有找到名字为${name}的资源`));
            }
        })
    }
}