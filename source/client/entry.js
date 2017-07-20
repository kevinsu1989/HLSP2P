import uri from 'urijs'
import co from 'co'
import { take } from 'lodash'
import { Parser } from 'm3u8-parser'

(function () {
    let videoId = '123';
    let url = 'http://pcvideogs.titan.mgtv.com/c1/2017/07/19_0/2DB406E014BB4884CE93F749E8605AF1_20170719_1_1_314_mp4/89CE23C9522D06BD927B1BA1573B8D71.m3u8?pm=Ml4OxwI7Sg0JAqqFLx8SY9fSvjswpOYlsDHTKPyyFzTqyVlKg31oSel~j8QYba2uAIMOs9h39BBYE3XFSQeqM3r0Tt1sosRHze_BJrlEO_SmdJuebt8gx2vKTPtvDcyEbPUJuwzGB7kz~efuJhID4eL_pSumni5wcZ1hMeHdPxFgS3OpXKfgC2b0mg3q4TwZSPkC1FjOcOpAMoNSjv3vZIsaYf77ba5iZwxCfn~X5fGIMdZ4hX8dHERiUJLNGIetDSeGeBFWzxH1uaAsoaorJ_0od7~iYKTM6gIEbOHgEbL9IDLPxcUDUte8yjIP~PKCOA9TrWiKw~TJtYGHz38TRk9POeMiznkHTYilrb4Ghfo-&arange=0';

    let video = document.getElementById('video');
    let databox = new fetchSource('/', videoId);
    // let source = new MediaSource('video/mp2t; codecs="avc1.42E01E"');
    // video.src = URL.createObjectURL(source);

    const getSource = (path) => {
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
                    let buf = yield getSource(segment.uri);
                    // source.addSourceBuffer(new Uint8Array(buf));
                }
            })
        }).catch(err => {
            console.error(err);
        });
    });
})();