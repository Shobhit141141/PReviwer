import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { CONSTANTS } from './src/config/constants.js';
import bodyParser from 'body-parser';
import registerRoutes from './src/routes/index.js';
import { logInfo } from './src/utils/logger.js';
import connectDB from './src/config/db.js';
import { handleResponse } from './src/utils/responseHandler.js';
import { errorHandler } from './src/middlewares/errorhandler.js';
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Bodyparser
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Connect to database
await connectDB();

// Default route
app.get('/', (_, res) => {
  handleResponse(res, 200, true, 'Welcome to API');
});

// Register routes
registerRoutes(app);
app.use(errorHandler);

const PORT = CONSTANTS.PORT;

// Start server
app.listen(PORT, () => {
  logInfo(`Server running on port ${PORT}`);
});
