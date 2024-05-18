require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const auth  = require('./auth');
const jwt = require('jsonwebtoken')//
app.use(express.json())//

app.post('/login', (req, res) => {

    const username = req.body.username

    const user = {name: surname}
    jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
});