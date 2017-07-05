import Client from './client'


(function () {
    const client = new Client();

    const renderPeerList = peerList => {
        let peerlistDom = document.querySelectorAll('.peer-list ul')[0];
        peerlistDom.innerHTML = '';
        for (let peer of peerList) {

            let peerItem = document.createElement('li');
            let peerLink = document.createElement('a');
            peerLink.innerHTML = peer;
            peerItem.appendChild(peerLink);

            peerItem.addEventListener('click', () => {
                navigator.getUserMedia({ audio: true, video: true }, (stream) => {
                    client.peer(peer).addStream(stream).sendOffer();
                }, (err) => {
                    console.error(err);
                });
            });
            peerlistDom.appendChild(peerItem);
        }
    }


    client.join().ready(function () {
        renderPeerList(this.peerList);
    }).peerChange(function () {
        renderPeerList(this.peerList);
    }).stream((peer, stream) => {
        let url = URL.createObjectURL(stream);
        document.getElementById('video').src = url;
    });
})();