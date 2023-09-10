const path = require("path");
const { desktopCapturer } = require("electron");
const { v4: uuidv4 } = require("uuid");
const webrtc = require('wrtc');
const socketIoClient = require("socket.io-client");
const FormData = require('form-data');
const axios = require('axios')
const fs = require("fs");
const { callNotification } = require("./notification");
const { API } = require("./constant");
const serverUrl = API ; // Change this to your Socket.IO server URL
const socket = socketIoClient.connect(serverUrl);
const folderPath = path.join(__dirname, `../../../files/`);
const uploadedFiles = new Set();

let isStreaming = false;
let peerConnection = null;
let localStream = null;

const getInputSources = async () => {
  try {
    const inputSources = await desktopCapturer.getSources({
      types: ["window", "screen"],
    });
    return inputSources;
  } catch (error) {
    console.error("Error getting input sources:", error);
    throw error;
  }
};

const selectSource = (source, mainWindow) => {
  mainWindow.webContents.send("SET_SOURCE", source.id);
};

const setSourceAsEntireScreen = (mainWindow) => {
  getInputSources()
    .then((sources) => {
      if (sources.length > 0) {
        selectSource(sources[0], mainWindow);
      } else {
        console.error("No input sources found.");
      }
    })
    .catch((error) => {
      console.error("Error selecting source:", error);
    });
};

// After creating the socket connection
socket.on('connect', () => {
  console.log('Connected to server');
});

const sendRecordingToServer = async (buffer, userId) => {
  try {
    const uniqueId = uuidv4();
    const vidPath = path.join(__dirname, `../../../files/${Date.now()}.mp4`);

    await fs.writeFileSync(vidPath, buffer);
    if (!fs.existsSync(vidPath)) {
      console.log("wait....")
    }
    const formData = {
      title: "sth",
      userId: userId,
      file: fs.createReadStream(vidPath),
      buffer
    };
    console.log("Sending recording to server...");
    sendRecordingFiles(formData, buffer)
  } catch (error) {
    console.error("Error sending recording to server:", error);
  }
};

const sendRecordingFiles = async (data, buffer) => {
  try {
    if (!buffer || buffer.length === 0) {
      console.error('Received empty buffer.');
      return;
    }
    socket.emit('saveRecording', data)
  } catch (error) {
    callNotification("error", "file not send to server")
  }
}

function getUniqueIdentifier(filePath) {
  // You can use the uuid library or another method to generate a unique identifier
  return uuidv4(); // Using uuidv4 from the uuid library
}

const watchedFolder = fs.watch(folderPath, (eventType, filename) => {
  if (eventType === 'rename' && filename) {
    const filePath = path.join(folderPath, filename);

    // Check if the file exists and is a regular file
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const fileIdentifier = getUniqueIdentifier(filePath);

      // Check if the file has not been uploaded before
      if (!uploadedFiles.has(fileIdentifier)) {
        // Send the file to the backend server
        sendFileToServer(filePath, fileIdentifier);
        uploadedFiles.add(fileIdentifier);
      }
    }
  }
});

function sendFileToServer(filePath) {
  const formData = new FormData();
  const fileStream = fs.createReadStream(filePath);

  formData.append('file', fileStream);

  axios
    .post(`${API}/upload`, formData)
    .then((response) => {
      callNotification("succefully", `File "${filePath}" successfully uploaded to the server.`);
    })
    .catch((error) => {
      callNotification("error", `Error uploading file "${filePath}":`, error);
    });
}

socket.on("videoSaved", (response) => {
  console.log("Recording saved successfully:", response.message);
  callNotification("Record", "Video saved successfully");
});



// async function liveStreamToggle(stream) {
//   try {
//     if (!peerConnection) {
//       startLiveStream(stream);
//     } else {
//       stopLiveStream();
//     }
//   } catch (e) {
//     console.log(e)
//     callNotification("error Live Stream", e);
//   }
// }

function createPeer() {
  const peer = new webrtc.RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org"
      }
    ]
  });
  peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

  return peer;
}

function liveStremStop() {
  if (peerConnection) {
    localStream.getTracks().forEach((track) => track.stop());
    peerConnection.close();
    peerConnection = null;
    localStream = null;
    console.log('Live stream stopped.');
  }
}


async function liveStremStart(stream) {
  try {
    localStream = stream;
    peerConnection = createPeer();
    return peerConnection
  } catch (e) {
    console.log(e);
    callNotification("error Live start Stream", e);
  }
}

async function handleNegotiationNeededEvent(peer) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const payload = {
    sdp: peer.localDescription,
  };
  try {
    const { data } = await axios.post(`${API}/broadcast`, payload);
    const desc = new webrtc.RTCSessionDescription(data.sdp);
    peer.setRemoteDescription(desc);
  } catch (error) {
    console.log("Error setting remote description:", error);
  }
}


module.exports = {
  getInputSources,
  selectSource,
  setSourceAsEntireScreen,
  sendRecordingToServer,
  liveStremStart,
  liveStremStop,
};




/**
 * const { ipcRenderer } = require("electron");
let isStreaming = false;
let peerConnection = null;
let localStream = null;


const startVideoStream = async (stream) => {
  try {
    if (!isStreaming) {
      startLiveStream(stream)
    }
    else {
      stopLiveStream()
    }
  } catch (e) {
    handleError(e)
  }
};
function createPeer() {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.stunprotocol.org"
      }
    ]
  });
  peer.onnegotiationneeded = () => handleNegotiationNeededEvent(peer);

  return peer;
}

function stopLiveStream() {
  if (isStreaming) {
    localStream.getTracks().forEach(track => track.stop());
    peerConnection.close();
    document.getElementById("video").srcObject = null;

    isStreaming = false;
    document.getElementById('startLiveStream').innerText = 'Start Live Stream';
    document.getElementById('stopLiveStream').style.display = 'none';
  }
}


async function startLiveStream(stream) {
  try {
    localStream = stream;
    peerConnection = createPeer();
    stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
    isStreaming = true;
  } catch (e) {
    handleError(e)
  }
}

const handleError = (e) => {
  console.log(`Error: ${e}`);
};

async function handleNegotiationNeededEvent(peer) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const payload = {
    sdp: peer.localDescription
  };

  const { data } = await axios.post('http://localhost:5000/broadcast', payload);
  const desc = new RTCSessionDescription(data.sdp);
  peer.setRemoteDescription(desc).catch(e => console.log(e));
}

const handleDataAvailable = (e) => {
  console.log("video data available");
  recordedChunks.push(e.data);
};

const handleStop = async (e) => {
  const blob = new Blob(recordedChunks, {
    type: "video/mp4; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  ipcRenderer.send("SAVE-RECORDING", buffer);
};

module.exports = { startVideoStream };

 */