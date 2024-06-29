require('dotenv').config()
import express, { json } from 'express';
const app = express();
import { sign } from 'jsonwebtoken';//
app.use(json())//

app.post('/login', (req, res) => {

    const username = req.body.username

    const user = {name: surname}
    sign(user, process.env.ACCESS_TOKEN_SECRET)
});