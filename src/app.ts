import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import auth from './auth.js'; // Update the path if necessary

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.use('/', auth);

// Start the server
const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
