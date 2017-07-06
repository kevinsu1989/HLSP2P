import Manager from './Manager'


(function () {
    const client = new Manager();

    const renderPeerList = peerList => {
        let peerlistDom = document.querySelectorAll('.peer-list ul')[0];
        peerlistDom.innerHTML = '';
        for (let peer of peerList) {
            let peerItem = document.createElement('li');
            let peerLink = document.createElement('a');
            peerLink.innerHTML = peer;
            peerItem.appendChild(peerLink);

            peerItem.addEventListener('click', () => {
                client.getPeer(peer).sendOffer().ready(function () {
                    console.log('connect');
                });
            });

            peerlistDom.appendChild(peerItem);
        }
    }

    const media = () => {
        var video = document.querySelector('video');
        var mimeCodec = 'video/mp4; codecs="avc1.42E01E, mp4a.40.2"';
        var src = 'http://pcvideoyf.titan.mgtv.com/c1/2017/06/11_0/45F93ABB506F3769BC8FD8D04D51494C_20170611_1_1_219.mp4?pm=dTYv~9vPOUlpv9Kgr6E5TFgJIZSvUsMnykcyIOFzPDWpPaAYUuzFhOT~xzWNUXZrzXz5xplwKdpvpFr9odhbTNjG~vf_uEScOdYUpaSO2LcXsSGM9oat2MWy5QJKrwtRX0hkezTXC1qBEsMXZurNvqp7mmyv50_spTlnVze566cZIgJPNty_iGCjiKU9AGnAA_gN9lbwfV_uh8yHrEOu~3X2W6Qi9Ep9jywjkyMKKFbjoTM5cXnxWmI0JUQwfMJbThLrJ_QJZg5szYI5OfhTj32Z7X8WEynGdJwBhyCLz~K_MVYdP4LH3q63MJbD~IUuwvJRhITaVboH102l9k7QDu3dkmDkYyqohdK4loa~YdU-&amp;arange=0'
    }


    client.ready(function () {
        renderPeerList(this.peers);
    }).peerChange(function () {
        renderPeerList(this.peers);
    });
})();