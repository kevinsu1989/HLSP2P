
import io from 'socket.io-client/dist/socket.io.slim'
import { logInfo } from './debugger'
import { EventEmitter2 } from 'eventemitter2'

export default class Signal {
    constructor(host = '/', room = './', seedBank) {
        this.emitter = new EventEmitter2();
        this.host = host;
        this.room = room;
        this.isConnected = false;

        this.socket = io(host);

        this.socket.on('connect', () => {
            this.socket.emit('join', this.room);

            this.socket.on('ready', seeds => {
                seeds.forEach(function (seed) {
                    logInfo(`${seed.id} 加入`);
                    seedBank.addSeed(seed);
                });

                this.socket.on('addSeed', seed => {
                    logInfo(`${seed.id} 加入`);
                    seedBank.addSeed(seed);
                });

                this.socket.on('removeSeed', id => {
                    logInfo(`${id} 离开`);
                    seedBank.removeSeed(id);
                });

                this.socket.on('updatePart', (id, partName) => {
                    logInfo(`${id} 更新 ${partName} 数据模块信息`);
                    seedBank.updatePart(id, partName);
                })

                this.socket.on('receiveCandidate', (peer, candidate) => {
                    seedBank.getConnectedPeer(peer).receiveIceCandidate(candidate);
                    logInfo(`收到来自 ${peer} 的candidate`);
                });

                this.socket.on('receiveOffer', (peer, offer) => {
                    seedBank.getConnectedPeer(peer).receiveOffer(offer);
                    logInfo(`收到来自 ${peer} 连接描述`);
                })

                this.socket.on('receiveAnswer', (peer, answer) => {
                    seedBank.getConnectedPeer(peer).receiveAnswer(answer);
                    logInfo(`收到来自 ${peer} 的应答`);
                })

                logInfo('P2P服务已连接');

                this.isConnected = true;
            });
        });
    }

    addPart(part) {
        if (!this.isConnected) return;
        this.socket.emit('addPart', part);
        logInfo(`添加数据模块信息`);
    }

    sendCandidate(id, candidate) {
        if (!this.isConnected) return;
        this.socket.emit('sendCandidate', id, candidate);
        logInfo(`发送candidate给 ${id}`);
    }

    sendOffer(id, offer) {
        if (!this.isConnected) return;
        this.socket.emit('sendOffer', id, offer);
        logInfo(`发送描述请求给 ${id}`);
    }

    sendAnswer(id, answer) {
        if (!this.isConnected) return;
        this.socket.emit('sendAnswer', id, answer);
        logInfo(`发送描述回复给 ${id}`);
    }
}