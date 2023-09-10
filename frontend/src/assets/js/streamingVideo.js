
//recording
const startRecording = document.getElementById("startRecording");
const stopRecording = document.getElementById("stopRecording");
const getSorces = document.getElementById("getSorces");

const startLiveStream = document.getElementById('startLiveStream')
const stopLiveStream = document.getElementById("stopLiveStream")

//top buttons
const minimizeWindow = document.getElementById("minimizeWindow");
const closeWindow = document.getElementById("closeWindow");
const maximizeWindow = document.getElementById("maximizeWindow");
const backButton = document.getElementById("backPage")



if (minimizeWindow) {
  minimizeWindow.addEventListener("click", () => {
    electronAPI.minimize();
  });
}

if (closeWindow) {
  closeWindow.addEventListener("click", () => {
    electronAPI.close();
  });
}

if (maximizeWindow) {
  maximizeWindow.addEventListener("click", () => {
    electronAPI.toggleMaximize();
  });
}

if (getSorces) {
  getSorces.addEventListener("click", () => {
    electronAPI.getSorces();
  });
}

if (startRecording) {
  startRecording.addEventListener("click", () => {
    electronAPI.startRecording();
  });
}

if (stopRecording) {
  stopRecording.addEventListener("click", () => {
    electronAPI.stopRecording();
  });
}

if (backButton) {
  backButton.addEventListener("click", () => {
    electronAPI.backButton()
  })
}

if (startLiveStream) {
  startLiveStream.addEventListener("click", () => {
    electronAPI.liveStart()
  })
}
if (stopLiveStream) {
  stopLiveStream.addEventListener("click", () => {
    electronAPI.liveStop()
  })
}


async function init() {
  const mediaStreamConstraints = {
    audio: false, // You can set this to true if you want to capture audio.
    video: true,
  };

  try {
    const sourceInfos = await navigator.mediaDevices.enumerateDevices();
    let defaultSourceId;

    for (const sourceInfo of sourceInfos) {
      console.log(sourceInfo)
      if (sourceInfo.kind === 'videoinput') {
        defaultSourceId = sourceInfo.deviceId;
        break; // Found the default video source, exit the loop.
      }
    }

    if (defaultSourceId) {
      mediaStreamConstraints.video = {
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: defaultSourceId,
          minWidth: 1280,
          minHeight: 720,
        },
      };
    }

    const stream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);

    // Now you have the default video source captured in the 'stream' variable.
    console.log(stream)
  } catch (error) {
    console.error('Error accessing media devices:', error);
  }
}

// Call the init function to start capturing the default video source.
init();



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

async function handleNegotiationNeededEvent(peer) {
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const payload = {
    sdp: peer.localDescription
  };

  const { data } = await axios.post('/broadcast', payload);
  const desc = new RTCSessionDescription(data.sdp);
  peer.setRemoteDescription(desc).catch(e => console.log(e));
}

