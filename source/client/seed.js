import Session from './fetch'
import Signal from './signal'
import { logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'
import { find, remove, take, random } from 'lodash'

export default class Seed {
    /**
     * @param {function} finder - help others to find part
     */
    constructor(host, id) {
        this.id = id;
        this.emitter = new EventEmitter2();
        //stores
        this.seeds = [];
        this.connected = [];
        this.parts = {};

        this.signal = new Signal(host, id, this);
    }

    addPart(url, name, buf) {
        this.parts[name] = {
            url,
            name,
            data: buf
        };
        this.signal.addPart(name);
    }

    findPart(name) {
        return new Promise((resolve, reject) => {
            let found = this.parts[name];
            if (found) {
                resolve(found.data);
            } else {
                reject(new Error(`没有找到名字为${name}的资源`));
            }
        })
    }

    /**
     * server seeds updated
     * @param {*} seeds 
     */
    addSeed(seed) {
        this.seeds.push(seed);
    }

    removeSeed(id) {
        remove(this.seeds, seed => seed.id == id);
    }

    updatePart(id, part) {
        let seed = find(this.seeds, seed => seed.id == id);
        seed.parts.push(part);
    }

    /**
     * create peer connection or find connected you have
     * @param {*} id 
     */
    getConnectedPeer(id) {
        if (this.connected[id]) return this.connected[id];
        let remotePeer = new Session(id, this);
        this.connected[id] = remotePeer;
        return remotePeer;
    }

    /**
     * filter peers have part you want
     * @param {*} partName 
     */
    getSeedsHasPart(partName) {
        return this.seeds.filter(seed => {
            return seed.parts.indexOf(partName) >= 0;
        });
    }

    getRandomPeerHasPart(partName) {
        let hasPart = this.getSeedsHasPart(partName);
        if (hasPart.length == 0) return Promise.reject(new Error('谁都没有这个资源'));
        let randomSeed = hasPart[random(hasPart.length - 1)];
        return Promise.resolve(this.getConnectedPeer(randomSeed.id));
    }
}