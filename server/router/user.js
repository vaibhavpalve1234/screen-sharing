const router = require('express').Router()

const users = [{ email: "vap", password: "123" }];


router.post('/login', (req, res) => {
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

router.post('/signup', (req, res) => {
    try {
        const { login_email, login_pass } = req.body;
        users.push({ email: login_email, password: login_pass });
        res.send({ user_id: 1, message: 'User created' });
    } catch (error) {
        console.error('Error in sign-up API: ' + error);
        res.status(500).send({ message: 'Internal server error' });
    }
});

module.exports = router