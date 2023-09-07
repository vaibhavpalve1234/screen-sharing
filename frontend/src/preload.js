const { contextBridge, ipcRenderer } = require("electron");

let mediaRecorder;
let recordedChunks = [];

const apiObject = {
  getSorces: () => ipcRenderer.send("GET-SOURCES"),
  startRecording: () => mediaRecorder.start(),
  stopRecording: () => mediaRecorder.stop(),
  login: (email, password) => ipcRenderer.send("LOGIN", email, password),
  signup: (email, password) => ipcRenderer.send("SIGNUP", email, password),
  logout: () => ipcRenderer.send("LOGOUT"),
  minimize: () => ipcRenderer.send("MINIMIZE-WINDOW"),
  toggleMaximize: () => ipcRenderer.send("MAXIMIZE-WINDOW"),
  close: () => ipcRenderer.send("CLOSE-WINDOW"),
};

contextBridge.exposeInMainWorld("electronAPI", apiObject);

ipcRenderer.on("SET_SOURCE", async (event, sourceId) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
        },
      },
      video: {
        mandatory: {
          chromeMediaSource: "desktop",
          chromeMediaSourceId: sourceId,
          minWidth: 12288,
          minHeight: 6480,
        },
      },
    });
    handleStream(stream);
  } catch (e) {
    handleError(e);
  }
});

function handleStream(stream) {
  const video = document.querySelector("video");
  video.srcObject = stream;
  video.onloadedmetadata = (e) => video.play();

  const options = { mimeType: "video/webm; codecs=vp9" };
  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;
}

function handleError(e) {
  console.log(e);
}

function handleDataAvailable(e) {
  console.log("video data available");
  recordedChunks.push(e.data);
}

async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: "video/webm; codecs=vp9",
  });

  const buffer = Buffer.from(await blob.arrayBuffer());
  ipcRenderer.send("SAVE-RECORDING", buffer);
}



// const { contextBridge, ipcRenderer } = require("electron");
// const socket = require("./assets/js/socket");
// const fs = require("fs");

// let mediaRecorder;
// let recordedChunks = [];
// let peerConnection;
// let dataChannel;
// let videoStream;

// const apiObject = {
//   getSorces: () => ipcRenderer.send("GET-SOURCES"),
//   startRecording: () => mediaRecorder.start(),
//   stopRecording: () => mediaRecorder.stop(),
//   login: (email, password) => ipcRenderer.send("LOGIN", email, password),
//   signup: (email, password) => ipcRenderer.send("SIGNUP", email, password),
//   logout: () => ipcRenderer.send("LOGOUT"),
//   minimize: () => ipcRenderer.send("MINIMIZE-WINDOW"),
//   toggleMaximize: () => ipcRenderer.send("MAXIMIZE-WINDOW"),
//   close: () => ipcRenderer.send("CLOSE-WINDOW"),
// };

// contextBridge.exposeInMainWorld("electronAPI", apiObject);

// ipcRenderer.on("SET_SOURCE", async (event, sourceId) => {
//   try {
//     videoStream = await navigator.mediaDevices.getUserMedia({
//       audio: false, // We assume audio is not needed for video streaming
//       video: {
//         mandatory: {
//           chromeMediaSource: "desktop",
//           chromeMediaSourceId: sourceId,
//         },
//       },
//     });
    
//     handleStream(videoStream);
//     socket.emit('screen-data', sourceId); // Send sourceId to the server
//   } catch (e) {
//     handleError(e);
//   }
// });

// function handleStream(stream) {
//   const video = document.querySelector("video");
//   video.srcObject = stream;
//   video.onloadedmetadata = (e) => video.play();

//   // Set up a WebRTC peer connection
//   peerConnection = new RTCPeerConnection();

//   // Create a data channel for video streaming
//   dataChannel = peerConnection.createDataChannel("videoDataChannel");
//   dataChannel.onopen = () => {
//     console.log("Data channel is open");
//   };
//   dataChannel.onclose = () => {
//     console.log("Data channel is closed");
//   };
//   dataChannel.onerror = (error) => {
//     console.error("Data channel error:", error);
//   };

//   // Add the data channel to the peer connection
//   peerConnection.addTrack(stream.getVideoTracks()[0], stream);

//   // Set up WebRTC negotiation and signaling here
//   // ...

//   // Set up the media recorder for recording the video stream
//   const options = { mimeType: "video/webm; codecs=vp9" };
//   mediaRecorder = new MediaRecorder(stream, options);

//   mediaRecorder.ondataavailable = handleDataAvailable;
//   mediaRecorder.onstop = handleStop;
// }

// function handleError(e) {
//   console.log(e);
// }

// function handleDataAvailable(e) {
//   console.log("Video data available");
//   const frame = e.data;
//   dataChannel.send(frame);
// }

// async function handleStop(e) {
//   const blob = new Blob(recordedChunks, {
//     type: "video/webm; codecs=vp9",
//   });

//   const buffer = Buffer.from(await blob.arrayBuffer());

//   // Save the recording locally (you can replace this with your own logic)
//   saveRecordingLocally(buffer);
// }

// function saveRecordingLocally(buffer) {
//   const savePath = `./recordings/${Date.now()}.webm`;
//   fs.writeFile(savePath, buffer, (err) => {
//     if (err) {
//       console.error("Error saving recording:", err);
//     } else {
//       console.log(`Recording saved at: ${savePath}`);
//     }
//   });
// }
