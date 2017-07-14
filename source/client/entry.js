import DataBox from './databox'
import uri from 'urijs'
import co from 'co'
import { take } from 'lodash'
import { Parser } from 'm3u8-parser'

(function () {
    let videoId = '123';
    let url = 'http://pcvideoyf.titan.mgtv.com/c1/2017/07/07_0/C8767E84E67BA6562E37A7E0CDC46602_20170707_1_1_482_mp4/94EFB30F98A179E7D27A244526171284.m3u8?pm=GgmMTGBDnTIcIjOUXzB9l254tpPflJdZtWiWc5oWOMpV9VNB~ugWV1SBgLHPR~dRHPh1TJYNhb_i4y1JEyUPuBppPZtGACdWumy9XK2DJMYJaj7urgOaVw55XiDKlxxzA47h~y7NSJzvA4YcCGwbieV6pOY9nvwH0n_ucp0LYRTY7vf6sDp2aDDnW2kX~Kr5YTMduu27_5YwgfQnGMrM3Nm6YJ6ZpbkfBg7O32ol9l1LgmjiNHaJAL1TSuE7MvBzVIXuAN4FJsosw46PnkkeKMUjLc05J0cvz_4jZqGfC19cmSCf_QkPEO4BD9_URbzFfvcYISU6HmKo2usGGURe_ChyZ7BBX1jtO2WhfsPL97U-&arange=0';

    let video = document.getElementById('video');
    let databox = new DataBox(videoId);

    const fetchSource = (path) => {
        let m3u8 = new uri(url);
        let ts = new uri(path);

        m3u8.filename(ts.filename()).query(ts.query());
        // console.log(m3u8.valueOf());
        return databox.getFile(m3u8)
    }


    fetch(url, {
        mode: 'cors',
        credentials: 'same-origin'
    }).then(res => {
        return res.text();
    }).then(m3u8 => {
        let parser = new Parser();
        parser.push(m3u8);
        parser.end();
        return parser.manifest;
    }).then(m3u8 => {
        return new Promise((done) => {
            setTimeout(function () {
                done(Promise.all(m3u8.segments.map(segment => fetchSource(segment.uri))));
            }, 2000);
        })
        // return co(function* () {
        //     for (let segment of take(m3u8.segments, 10)) {
        //         let data = yield fetchSource(segment.uri);
        //     }
        // })
    }).catch(err => {
        console.error(err);
    });
})();