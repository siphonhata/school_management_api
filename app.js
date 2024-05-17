require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
const auth  = require('./auth');

app.use(bodyParser.json());
app.use(cors());

app.use('/', auth);
// Start the server
const PORT = process.env.APP_PORT || 3000;
app.listen(PORT, () => 
{
    console.log(`Server is running on port ${PORT}`);
});
