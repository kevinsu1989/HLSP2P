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
                client.peer(peer).sendOffer();
            });

            peerlistDom.appendChild(peerItem);
        }
    }


    client.join().ready(function () {
        renderPeerList(this.peers);
    }).peerChange(function () {
        renderPeerList(this.peers);
    }).receive(peer => {
        navigator.getUserMedia({ audio: true, video: true }, (stream) => {
            peer.addStream(stream);
        }, (err) => {
            console.error(err);
        });
    }).stream((peer, stream) => {
        document.getElementById('video').srcObject = stream;
    });

    window.appClient = client;
})();