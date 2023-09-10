const { contextBridge, ipcRenderer } = require("electron");
let mediaRecorder;
let recordedChunks = [];

const apiObject = {
  getSorces: () => ipcRenderer.send("GET-SOURCES"),
  startRecording: () => mediaRecorder.start(),
  stopRecording: () => mediaRecorder.stop(),
  logoutMain: () => ipcRenderer.send("LOGOUT-MAIN"),
  logoutDash: () => ipcRenderer.send("LOGOUT-DASH"),
  logoutList: () => ipcRenderer.send("LOGOUT-LIST"),
  logoutLive: () => ipcRenderer.send("LOGOUT-LIVE"),
  streamRecording: () => ipcRenderer.send("NavigateRecordingPage"),// dashboard --> recording page 
  streamList: () => ipcRenderer.send("NavigateRecordingList"),// dashboard --> List page 
  streamLive: () => ipcRenderer.send("NavigateRecordingLive"),// dashboard --> Live page 
  backButton: () => ipcRenderer.send("BACKPAGE"),
  minimize: () => ipcRenderer.send("MINIMIZE-WINDOW"),
  toggleMaximize: () => ipcRenderer.send("MAXIMIZE-WINDOW"),
  close: () => ipcRenderer.send("CLOSE-WINDOW"),
  liveStart: () => ipcRenderer.send("Live-Start"), // start stream live when click on button
  liveStop: () => ipcRenderer.send("Live-Stop") // stop live stream
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
  console.log(`Error: ${e}`);
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
