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