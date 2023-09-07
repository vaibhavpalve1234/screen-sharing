const path = require("path");
const { desktopCapturer, screen } = require("electron");
const { v4: uuidv4 } = require("uuid");
const socketIoClient = require("socket.io-client");
const fs = require("fs");
const { callNotification } = require("./notification");
const { API } = require("./constant");

// Replace with your server URL
const serverUrl = "http://localhost:5000"; // Change this to your Socket.IO server URL
const socket = socketIoClient.connect(serverUrl);

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
      if(!fs.existsSync(vidPath)){
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


const sendRecordingFiles= async(data, buffer)=>{
  try {
    if (!buffer || buffer.length === 0) {
      console.error('Received empty buffer.');
      return;
    }
    console.log('heelo')
    socket.emit('saveRecording', data)
  } catch (error) {
    callNotification("error", "file not send to server")
  }
}

socket.on("videoSaved", (response) => {
  console.log("Recording saved successfully:", response.message);
  callNotification("Record", "Video saved successfully");
});

module.exports = {
  getInputSources,
  selectSource,
  setSourceAsEntireScreen,
  sendRecordingToServer,
};
