import md5 from 'js-md5'
import getTime from 'date-fns/get_time'

export const chunkBuffer = (buf, chunkSize) => {
    let result = [];
    if (buf instanceof ArrayBuffer) {
        let len = buf.byteLength;
        let i = 0;
        while (i < len) {
            result.push(buf.slice(i, i += chunkSize));
        }
    }
    return result;
}

export const timeCounter = (task, timeout = 1500) => {
    let timeoutPromise = new Promise((result, reject) => {
        setTimeout(() => {
            reject(new Error('请求超时'));
        }, timeout);
    });

    let taskPromise = Promise.resolve(task);

    return Promise.race([timeoutPromise, taskPromise]);
}

export const MD5Buffer = buf => {
    return md5(buf);
}

export const MD5Now = (id, part) => {
    return md5(getTime(new Date()) + id + part);
}

export const filename = url => {
    if (url) {
        var m = url.toString().match(/.*\/(.+?)\./);
        if (m && m.length > 1) {
            return m[1];
        }
    }
    return "";
}