const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const videoDirectory = path.join(__dirname, '../uploads');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.get('/', (req, res) => {
    fs.readdir(videoDirectory, (err, videos) => {
        if (err) {
            console.error('Error reading video directory:', err);
            res.status(500).send('Internal Server Error');
        } else {
            res.status(200).send(videos);
        }
    });
});

router.get('/videos', async (req, res) => {
    try {
        res.sendFile(__dirname + '/index.ejs');
    } catch (error) {
        res.status(500).send(error);
    }
});

router.post('/upload', upload.single('file'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            console.error('No file received.');
            res.status(400).send({ message: 'No file received' });
            return;
        }

        const targetPath = path.join(videoDirectory, file.originalname);
        fs.renameSync(file.path, targetPath);

        res.send({ message: 'File uploaded successfully' });
    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router