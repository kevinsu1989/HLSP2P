import Intercom from './intercom'
import { logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'
import { find, remove, take, random } from 'lodash'

export default class Seed {
    /**
     * @param {function} finder - help others to find part
     */
    constructor(finder = () => null) {
        this.emitter = new EventEmitter2();
        //stores
        this.seeds = [];
        this.connected = [];
        //state
        this.isConnected = false;
        this.finder = finder;
    }

    /**
     * server seeds updated
     * @param {*} seeds 
     */
    addSeed(seed) {
        this.seeds.push(seed);
        this.emitter.emit('update seed', this.seeds);
    }

    removeSeed(id) {
        remove(this.seeds, seed => seed.id == id);
        this.emitter.emit('update seed', this.seeds);
    }

    updatePart(id, partName) {
        let seed = find(this.seeds, ['id', id]);
        seed.parts.push(partName);
        this.emitter.emit('update seed', this.seeds);
    }

    /**
     * create peer connection or find connected you have
     * @param {*} id 
     */
    getConnectedPeer(id, signal) {
        if (this.connected[id]) return this.connected[id];

        let remotePeer = new Intercom(id, signal);
        remotePeer.listen(this.finder.bind(remotePeer));
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

    /**
     * want a part
     * @param {*} part 
     */
    require(part, handle = (last, data) => data) {
        return new Promise((resolve, reject) => {
            let hasPart = this.getSeedsHasPart(part);
            if (hasPart.length == 0) reject(new Error('谁都没有这个资源'));
            let randomSeed = hasPart[random(hasPart.length - 1)];
            let peer = this.getConnectedPeer(randomSeed.id);
            return peer;
        })
            .then(peer => peer.connect())
            .then(peer => peer.require(part, handle.bind(peer)));
    }

    updateSeed(onUpdateSeed = () => { }) {
        this.emitter.on('update seed', onUpdateSeed);
    }
}