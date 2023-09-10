const express = require('express');
const app = express();
const router = express.Router();
const webrtc = require('wrtc');

app.use(express.static('public'));
app.use(express.json()); // Add JSON parsing middleware

let senderStream;
let peerConnections = [];

router.post('/broadcast', async (req, res) => {
    try {
        const { sdp } = req.body; // Parse the SDP from the JSON request body
        const peer = createPeer();
        peer.ontrack = (e) => handleTrackEvent(e, peer);
        console.log(peer)
        const desc = new webrtc.RTCSessionDescription(sdp); // Use the parsed SDP
        await peer.setRemoteDescription(desc);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }
        peerConnections.push(peer);
        res.json(payload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

router.get('/consumer', (req, res) => {
    res.sendFile('viewer.html', { root: './public' });
});

router.post("/consumer", async (req, res) => {
    try {
        const { sdp } = req.body; // Parse the SDP from the JSON request body
        const peer = createPeer();
        const desc = new webrtc.RTCSessionDescription(sdp); // Use the parsed SDP
        await peer.setRemoteDescription(desc);
        senderStream.getTracks().forEach(track => peer.addTrack(track, senderStream));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        const payload = {
            sdp: peer.localDescription
        }
        peerConnections.push(peer);
        res.json(payload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Server error" });
    }
});

async function handleTrackEvent(e, peer) {
    senderStream = e.streams[0];
}

function createPeer() {
    const peer = new webrtc.RTCPeerConnection({
        iceServers: [
            {
                urls: "stun:stun.stunprotocol.org"
            }
        ]
    });
    peer.oniceconnectionstatechange = () => {
        if (peer.iceConnectionState === 'disconnected' || peer.iceConnectionState === 'closed') {
            // Peer connection closed, remove it from the array
            const index = peerConnections.indexOf(peer);
            if (index !== -1) {
                peerConnections.splice(index, 1);
            }
            // Clean up resources
            peer.close();
        }
    };
    return peer;
}

// Cleanup peer connections when the server is shut down
process.on('SIGINT', () => {
    console.log("Server is shutting down.");
    peerConnections.forEach(peer => {
        peer.close();
    });
    process.exit();
});

module.exports = router;
