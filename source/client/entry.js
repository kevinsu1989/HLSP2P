import DataBox from './databox'

(function () {
    const videoId = '1234';
    const url = 'http://pcvideoyf.titan.mgtv.com/c1/2017/07/10_0/E0BDBCAB6D39F6098BC7B8118AFF40B8_20170710_1_1_295.mp4?pm=uCKd_KxYOnuMKGcXQVANhKKxtrOFPFajfdlep~BbVNhFDfGjT_t5WRtQf66y0pE_CiHqBaH63Xx5vGG6ChpheZW2nCa2Fy5kbc0dOFWQYTmPQdIHCZrs4oXBNzts0Yok8vcR0U32F0oHowY4l5ld3dmrjsvG4LQNKnxB9G71Xba73C~SOzoWDZ5sX3YTsHF3pcFQMFrD9oOfUCghf9ugn1zbNtob7fjfNWfguHnuFOJ7pAqlr2ku8t3VBYkFJGPaPZue1u9hyAzhxpB9osvoO4OpfDYQ9OyFUeDDMNoRF4PuokzC1IOUzHqWdPdvq5DHi8x0P8~2Ov1yxHgafFD3j6MUr9D~cWUwoypJiiRMlzc-&arange=0'
    const Box = new DataBox(videoId);

    document.getElementById('play').addEventListener('click', () => {
        Box.getFile(url, blob => {
            let src = URL.createObjectURL(blob);
            document.getElementById('video').src = src;
        })
    })
})();