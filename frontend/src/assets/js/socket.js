const { API } = require("./constant");
const socketIoClient = require("socket.io-client");

const serverUrl = API; // Change this to your Socket.IO server URL
const socket = new socketIoClient.connect(serverUrl);

module.exports = socket