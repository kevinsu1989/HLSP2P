import Signal from './signal'
import Seed from './seed'
import uri from 'urijs'

export default class DataBox {
    constructor(videoId) {
        this.videoId = videoId;
        this.parts = {};
        this.isConnected = false;
        this.seedManage = new Seed(function (requestId, partName) {
            this.findPart(partName).then(data => {
                this.append(requestId, data);
                this.end();
                //todo chunk data;
            }).catch(err=>{
                this.end();
            });
        });
        this.signal = new Signal(videoId, this.seedManage, () => {
            this.isConnected = true;
        });
    }

    getPart(partUrl) {
        if (!this.isConnected) return this.getPartFromCDN(partUrl);
        return getPartFromP2P(partUrl).catch(err => this.getPartFromCDN(partUrl));
    }

    getPartFromCDN(partUrl) {
        return fetch(partUrl, data => {
            this.addPart(partUrl, data);
            return data;
        });
    }

    getPartFromP2P(partUrl) {
        return this.seedManage.require(partUrl, (last, data) => {
            return data;
        }).then(data => {
            this.addPart(partUrl, data);
            return data;
        });
    }

    /**
    * add part you have
    * @param {*} partName 
    */
    addPart(partUrl, data) {
        let name = new uri(partUrl).filename;
        this.parts[name] = {
            partUrl,
            name,
            data
        };
        this.signal.addPart(name);
    }

    findPart(name) {
        return new Promise((resolve, reject) => {
            let found = this.parts[name];
            if(found){
                resolve(found.data);
            } else{
                reject(new Error(`没有找到名字为${name}的资源`));
            }
        })
    }
}