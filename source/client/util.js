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