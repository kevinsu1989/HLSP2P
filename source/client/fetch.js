export default (url, options) => {
    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();
        let timeout = null;
        let loadTimeout = () => {
            reject(new Error('请求超时'));
            xhr.abort();
        };

        options = Object.assign({}, {
            method: 'GET',
            timeout: 15000,
            responseType: 'text'
        }, options);

        xhr.open(options.method, url, true);
        xhr.onreadystatechange = evet => {
            let xhr = event.currentTarget;
            let readyState = xhr.readyState;
            if (readyState >= 2) {
                clearTimeout(timeout);
                if (readyState === 4) {
                    let status = xhr.status;
                    //successful
                    if (status >= 200 && status < 300) {
                        let data, len;
                        if (options.responseType === 'arraybuffer') {
                            data = xhr.response;
                            len = data.byteLength;
                        } else {
                            data = xhr.responseText;
                            len = data.length;
                        }
                        let response = { url: xhr.responseURL, data, xhr };
                        resolve(response);
                    } else {
                        reject(new Error(xhr.statusText));
                    }
                } else {
                    timeout = setTimeout(loadTimeout, options.timeout);
                }
            }
        }
        xhr.responseType = options.responseType;

        timeout = setTimeout(loadTimeout, options.timeout);

        xhr.send();
    })
}