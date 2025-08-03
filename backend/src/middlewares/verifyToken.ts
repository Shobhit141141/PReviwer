import axios from 'axios';
import { Request, Response, NextFunction } from 'express';
import User from '../models/user.model';
import { UserInfo } from '../types';

export const githubAuthMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid token' });
    return;
  }

  const accessToken = authHeader.split(' ')[1];
  req.accessToken = accessToken;


  try {
    const userRes = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
   
    const user = await User.findOne({
      githubId: userRes.data.id.toString(),
      username: userRes.data.login,
    });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }

    const userInfo: UserInfo = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      username: user.username,
      avatar: user.avatar,
    };

    req.user = userInfo;

    next();
  } catch (err: any) {
    res.status(401).json({ error: 'Invalid GitHub token' });
    return;
  }
};
