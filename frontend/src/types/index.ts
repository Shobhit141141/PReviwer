export type UserStatsType = {
  username: string;
  avatar: string;
  totalRepos: number;
  totalPRs: number;
  totalStars: number;
  followers: number;
  following: number;
  bio: string;
  company: string;  
  location: string;
};

export type ActivePRType = {
  id: string; 
  title: string;
  status: string;
  number: number;
  repo: string;
  created: string;
  commits: number;
  comments: number;
  additions: number;
  deletions: number;
  labels: string[];
  reviewers: string[];
}[];

// Auth Types
export interface User {
  _id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  email: string;
  githubId: string;
  firstTimeUser: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  access_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface ApiError {
  error: string;
  message?: string;
}
