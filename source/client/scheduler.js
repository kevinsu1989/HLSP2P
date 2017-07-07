import Peer from './peer'
import Signal from './signal'
import { logError } from './debugger'
import { EventEmitter2 } from 'eventemitter2'
import { find, remove, take, random } from 'lodash'

export default class Scheduler {
    /**
     * @param {string} path - page path
     * @param {function} finder - help others to find part
     */
    constructor(path, finder = () => null) {
        this.emitter = new EventEmitter2();
        this.signal = new Signal(path, this);
        //stores
        this.seeds = [];
        this.connected = [];
        this.parts = [];
        //state
        this.isConnected = false;
        this.finder = finder;

        this.signal.ready(seeds => {
            this.isConnected = true;
            this.seeds = seeds;
            this.emitter.emit('connect');
            this.emitter.emit('update seed', this.seeds);
        });
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
    }

    /**
     * add part you have
     * @param {*} partName 
     */
    addPart(partName) {
        this.signal.addPart(partName);
    }

    /**
     * create peer connection or find connected you have
     * @param {*} id 
     */
    getConnectedPeer(id) {
        if (!this.isConnected) return;
        if (this.connected[id]) return this.connected[id];

        let remotePeer = new Peer(id, this.signal);

        /**
         * receive data when peer ready
         */
        remotePeer.ready(() => {
            remotePeer.data(data => {
                switch (data.type) {
                    case 'want':
                        this.handleWantRequest(remotePeer, data.data);
                        break;
                    case 'give':
                        this.handleGiveRespones(remotePeer.data.data)
                    default:
                }
            })
        });

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
    want(part) {
        let hasPart = this.getSeedsHasPart(part);
        if (hasPart.length == 0) throw new Error('no one have this part');
        let randomSeed = hasPart[random(hasPart.length - 1)];
        let peer = this.getConnectedPeer(randomSeed.id);

        if (!peer.isConnected) {
            peer.sendOffer();
            peer.createDataChannel();
        }

        peer.ready(() => {
            peer.send({
                type: 'want',
                data: part
            });
        });
    }

    /**
     * find part when some one request
     * @param {*} peer 
     * @param {*} partName 
     */
    handleWantRequest(peer, partName) {
        if (this.finder) {
            let wantPart = this.finder(partName);
            let wantPartMaybePromise = Promise.resolve(wantPart);

            wantPartMaybePromise.then(part => {
                if (part == null) throw new Error('get no part');

                peer.send({
                    type: 'give',
                    data: part
                })
            }).catch(logError);
        }
    }

    handleGiveRespones(peer, partData) {
        this.emitter.emit('recive part', partData);
    }


    /**
     * connect callback when connected to signal server
     * @param {*} onConnect 
     */
    connect(onConnect = () => { }) {
        this.emitter.once('connect', onConnect);
        if (this.isConnected) this.emitter.emit('connect');
    }

    recevice(onRecive = () => { }) {
        this.emitter.on('recive part', onRecive);
    }

    updateSeed(onUpdateSeed = () => { }) {
        this.emitter.on('update seed', onUpdateSeed);
    }
}