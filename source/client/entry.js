import DataBox from './databox'
import uri from 'urijs'
import co from 'co'
import { take } from 'lodash'
import { Parser } from 'm3u8-parser'


(function () {
    let videoId = '123';
    let url = 'http://175.6.15.44/c1/2017/07/10_0/6C2AA3DA4EE5EC35E9F86A616D92EC37_20170710_1_1_482_mp4/22BEF97F781427F9D86ECEC83316695E.m3u8?t=596634c3&pno=1121&sign=eba8b15ccd3c2543df61ef952b2afe5d&win=600&srgid=278&urgid=1556&srgids=278&nid=2237&payload=usertoken%3Dhit%3D1%5Eruip%3D2095616650&rdur=21600&limitrate=0&fid=6C2AA3DA4EE5EC35E9F86A616D92EC37&ver=0x03&uuid=d186e4fc92714c4e97ea5e0cf470b213&arange=0';

    let video = document.getElementById('video');
    let databox = new DataBox(videoId);

    const fetchSource = (path) => {
        let m3u8 = new uri(url);
        let ts = new uri(path);

        m3u8.filename(ts.filename()).query(ts.query());
        console.log(m3u8.valueOf());
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
                console.log(data.byteLength);
            }
        })
    });
})();