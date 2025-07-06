export interface UserInfo {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      accessToken?: string;
    }
  }
}