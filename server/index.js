const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const bodyParser = require('body-parser');
const cors = require('cors');
require('ejs')

//middlerwares
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use('/uploads', express.static('uploads'));
app.use(cors("*"));
const userRouter = require('./router/user');
const RecordingRouter = require('./router/recording')
const liveRouter = require('./router/liveStream')

// routers urls
app.use("/", userRouter);
app.use('/', RecordingRouter)
app.use('/', liveRouter)

const activeStreams = new Set();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('startStream', () => {
    // Handle screen sharing start request
    // For simplicity, we're not managing individual user sessions in this example
    activeStreams.add(socket.id);
    console.log(socket.id)
    socket.broadcast.emit('userStartedStream', socket.id);
  });

  socket.on('stopStream', () => {
    // Handle screen sharing stop request
    activeStreams.delete(socket.id);
    socket.broadcast.emit('userStoppedStream', socket.id);
  });

  socket.on('disconnect', () => {
    // Handle user disconnect
    activeStreams.delete(socket.id);
    socket.broadcast.emit('userDisconnected', socket.id);
    console.log('A user disconnected');
  });
});


//server
const serverPort = process.env.PORT || 5000;
server.listen(serverPort, () => {
    console.log('Server started on port: ' + serverPort);
});
