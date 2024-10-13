import jwt from 'jsonwebtoken';
import config from '../config/constants.js';
import {getTokenByUsername} from '../utils/github.js';
export const verifyJWT = async (req, res, next) => {
  try {
    const jwttoken = req.headers.authorization.split(' ')[1];
    if (!jwttoken) {
      return res.status(401).send('Unauthorized');
    }
    const decoded = jwt.verify(jwttoken, config.jwtSecret);
    req.username = decoded.username;


    req.accessToken = await getTokenByUsername(req.username);
    next();
  } catch (error) {
    console.error('JWT verification failed:', error.message);
    res.status(401).send('Unauthorized');
  }
};