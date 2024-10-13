import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import morgan from 'morgan';
import dotenv from 'dotenv';

import githubRoutes from './routers/githubRouter.js';
import aiRoutes from './routers/aiRouter.js';
import config from './config/constants.js';
import connectDB from './config/db.js';

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

app.get('/', (req, res) => {
  res.status(200).send('Welcome to PReviewer 🔍📃🎉');
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
