import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import auth from './auth.js'; // Update the path if necessary
import { PrismaClient } from '@prisma/client';
import authMiddleware from './Auth/AuthMiddleWare.js';
export const prisma = new PrismaClient();


const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(authMiddleware);
app.use('/', auth);

// Start the server
const PORT = process.env.APP_PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
