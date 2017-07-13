import DataBox from './databox'
import uri from 'urijs'
import co from 'co'
import { take } from 'lodash'
import { Parser } from 'm3u8-parser'


(function () {
    let videoId = '123';
    let url = 'http://pcvideoyf.titan.mgtv.com/c1/2017/07/10_0/6C2AA3DA4EE5EC35E9F86A616D92EC37_20170710_1_1_482_mp4/22BEF97F781427F9D86ECEC83316695E.m3u8?pm=9Du_ZbWEd8s6LIcPQqLrK5YFtqqX3JGa~l~1VgBIZeJc59~QIx0ArJ9dzBGHVzti7Mp6rhGbvS41liQ~AYFemOQd4SPtlAHGtkzCfDTCwhVcD9zsh~FTsqH6CRJfYqUAN~igzgtviEnqWTgCGSaTrlNInEuyg_5A0J4Cz7NtPTSR4GwF5tJSMTNvYv_IXacc36PJGvgX9oWA3fqJlIrKQA~0emFC6el2WRtOHVVIZyNTt9z4JCAPTcOpiYQoAi5Dt6nE_mucwq~hvYQrIc3gBDuOtBckT2jEnJgmG7IY17W7G8TBNrXyvQ2rXGR62xRy7oP9lqDT0WKA0q7CmyI17dao95Rym4OtKsyeuiUxMHQ-&arange=0';

    let video = document.getElementById('video');
    let databox = new DataBox(videoId);

    const fetchSource = (path) => {
        let m3u8 = new uri(url);
        let ts = new uri(path);

        m3u8.filename(ts.filename()).query(ts.query());
        // console.log(m3u8.valueOf());
        return databox.getFile(m3u8)
    }


    fetch(url).then(res => {
        return res.text();
    }).then(m3u8 => {
        let parser = new Parser();
        parser.push(m3u8);
        parser.end();
        return parser.manifest;
    }).then(m3u8 => {
        return co(function* () {
            for (let segment of take(m3u8.segments, 10)) {
                let data = yield fetchSource(segment.uri);
            }
        })
    });
})();