
const setParts = (totalSize, chunkSize) => {
    let start = 0;
    let end = chunkSize;
    let partNo = 0;
    while (start < totalSize) {
        this.parts.push({
            start,
            end,
            partNo,
            state: 'need',
            chunk: null
        });
        start = end;
        end = start + chunkSize > totalSize ? totalSize : start + chunkSize;
        partNo++;
    }
}

export default class Media {
    constructor(url, chunkSize, onData = () => { }) {
        this.chunkSize = chunkSize;
        this.url = url;

        this.totalSize = 0;
        this.parts = [];

        this.isComplete = false;
        this.onData = onData.bind(this);

        this.setPromise = this.getFileHeaderRes(url);
    }

    getFileHeaderRes() {
        let options = {
            headers: {
                method: 'HEAD'
            }
        };
        return fetch(this.url, options).then(res => {
            this.totalSize = res.headers.get('content-length');
            setParts.call(this, totalSize, this.chunkSize);
        });
    }

    start() {
        return this.setPromise.then(this.getPart(0));
    }

    getPart(partNum) {
        return this.getPartFromCDN(partNum);
    }

    getPartFromCDN(partNum) {
        if (partNum > this.parts.length - 1) return this.isComplete = true;
        let part = this.parts[partNum];
        if (!part) return Promise.reject(new Error('没有找到碎片信息'));
        if (!part.state == 'downloaded') return Promise.resolve(part.chunk);
        let options = {
            headers: {
                'Range': `bytes=${part.start}-${part.end}`
            }
        }
        return fetch(this.url, options).then(res => {
            return res.blob();
        }).then(blob => {
            part.chunk = blob;
            part.state = 'downloaded';
            this.onData(partNum, blob);
            return blob;
        })
    }
}