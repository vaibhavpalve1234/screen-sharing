const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

const users = [{email:"vap", password:"123"}];

const videoDirectory = path.join(__dirname, 'videos');

if (!fs.existsSync(videoDirectory)) {
    fs.mkdirSync(videoDirectory);
}

app.get('/get', (req, res) => {
    res.sendFile(path.join(__dirname, '/display.html'));
});

app.post('/login', (req, res) => {
    try {
        const { login_email, login_pass } = req.body;
        const loggedInUser = users.find(user => user.email === login_email && user.password === login_pass);

        if (loggedInUser) {
            res.send({ message: 'User logged in', user_id: 1 });
        } else {
            res.status(401).send({ message: 'Invalid email or password' });
        }
    } catch (error) {
        console.error('Error in login API: ' + error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

app.post('/signup', (req, res) => {
    try {
        const { login_email, login_pass } = req.body;
        users.push({ email: login_email, password: login_pass });
        console.log(users, req.body);
        res.send({ user_id: 1, message: 'User created' });
    } catch (error) {
        console.error('Error in sign-up API: ' + error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

app.get('/getVideoList', (req, res) => {
    fs.readdir(videoDirectory, (err, files) => {
        if (err) {
            console.error('Error reading video directory:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(files);
        }
    });
});


io.on('connection', socket => {
    console.log("A client connected");
    socket.on('saveRecording', async (buffer) => {
        try {
            console.log(buffer)
            if (!buffer || buffer.length === 0) {
                console.error('Received empty buffer.');
                socket.emit('videoSaved', { message: 'Error: Received empty buffer' });
                return;
            }

            console.log("Received data from client:", data.userId, data.uniqueId, buffer.length, 'bytes');
            
            // Ensure you handle the received file data correctly here.
            // For example, you can write it to a file.
            const savePath = path.join(videoDirectory, data.uniqueId + '.mp4');
            fs.writeFileSync(savePath, buffer);

            // Emit the 'videoSaved' event to confirm that the video has been saved
            socket.emit('videoSaved', { message: 'Video saved successfully' });

            console.log(`Video saved at: ${savePath}`);
        } catch (error) {
            console.error('Error saving video:', error);
            socket.emit('videoSaved', { message: 'Error saving video: ' + error.message });
        }
    });
});


//live stram logic 

const viewers = new Set();

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("createDataChannel", () => {
    console.log("Data channel created");
  });

  // Handle incoming video frames from the Electron client
  socket.on("videoDataChannel", (frame) => {
    // Broadcast the frame to all connected viewers
    viewers.forEach((viewerSocket) => {
        console.log(viewerSocket)
      viewerSocket.emit("videoFrame", frame);
    });
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    // Remove the disconnected viewer
    viewers.delete(socket);
  });

  // Add the viewer to the viewers set
  viewers.add(socket);
});




const serverPort = process.env.YOUR_PORT || process.env.PORT || 5000;
http.listen(serverPort, () => {
    console.log('Server started on port: ' + serverPort);
});
