import DataBox from './databox'
import uri from 'urijs'
import co from 'co'
import { take } from 'lodash'
import { Parser } from 'm3u8-parser'

(function () {
    let videoId = '123';
    let url = 'http://pcvideoyf.titan.mgtv.com/c1/2017/07/18_0/1D543C9B67F98D8B8D49FB7E7B01A6EC_20170718_1_1_426_mp4/9B402FA3FE47063447AB09EF17356453.m3u8?pm=f2fM1Y9uj5eaHKgUgcjHGTURXhI8RmoRCXPK9VCv8pm6IOmUnVQ_nox493oj4aNRsej~Kv5eSb~1AWQMftbxf6td_B8V5k~t~AW8p5OAufog6D_XjQW~9c0ZwkVOFDuRdbu79m5Tvw3YTi2Rspi1RYdz0JVF6NhIVpzRFYGfQxdokVrtpGFx8J9XDLREsjFYnO5Tkg9SZffkj2l4G~t4bMGZnfrez2cVSyNNczo8KV9qyPEc6BEYIklRBwMGAMNnDdhisxbIp_lnnNkIZaZ57JjCZYFfCERKgGgTKfiiugU1Cqv8TlD28wvLVcCDmkE7C9YrZuDEmgRTUE84VmOWPlrbjPsx6rFfc5xkU4tiBcU-&arange=0';

    let video = document.getElementById('video');
    let databox = new DataBox('/', videoId);
    // let source = new MediaSource('video/mp2t; codecs="avc1.42E01E"');
    // video.src = URL.createObjectURL(source);

    const fetchSource = (path) => {
        let m3u8 = new uri(url);
        let ts = new uri(path);

        m3u8.filename(ts.filename()).query(ts.query());
        // console.log(m3u8.valueOf());
        return databox.getFile(m3u8)
    }

    document.getElementById('play').addEventListener('click', () => {
        fetch(url).then(res => {
            return res.text();
        }).then(m3u8 => {
            let parser = new Parser();
            parser.push(m3u8);
            parser.end();
            return parser.manifest;
        }).then(m3u8 => {
            // return new Promise((done) => {
            //     setTimeout(function () {
            //         done(Promise.all(m3u8.segments.map(segment => fetchSource(segment.uri))));
            //     }, 2000);
            // })
            return co(function* () {
                for (let segment of take(m3u8.segments, 10)) {
                    let buf = yield fetchSource(segment.uri);
                    // source.addSourceBuffer(new Uint8Array(buf));
                }
            })
        }).catch(err => {
            console.error(err);
        });
    });
})();