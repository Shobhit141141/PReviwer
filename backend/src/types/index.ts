export interface UserInfo {
  id: string;
  email: string;
  name: string;
  username: string;
  avatar: string;
  bio?: string;
  company?: string;
  location?: string;
  followers?: number;
  following?: number;
  createdAt?: string;
  updatedAt?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: UserInfo;
      accessToken?: string;
    }
  }
}
