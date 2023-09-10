const express = require('express');
const http = require('http');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const server = http.createServer(app);
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


//server
const serverPort = process.env.PORT || 5000;
server.listen(serverPort, () => {
    console.log('Server started on port: ' + serverPort);
});
