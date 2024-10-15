import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

import githubRoutes from './routers/githubRouter.js';
import aiRoutes from './routers/aiRouter.js';
import webhookRoutes from './routers/webhook.js';
import config from './config/constants.js';
import connectDB from './config/db.js';
import { verifyJWT } from './middleware/verifyToken.js';

dotenv.config();
const app = express();
const PORT = config.port|| 8000;
connectDB();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/auth', githubRoutes);
app.use('/api', aiRoutes);
app.use('/webhook', webhookRoutes);
app.get('/', (req, res) => {
  res.status(200).send('Welcome to PReviewer 🔍📃🎉');
});

app.get('/valid-token', verifyJWT, (req, res) => {
  res.status(200).json({ message: 'Token is valid', username: req.username });
});
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
