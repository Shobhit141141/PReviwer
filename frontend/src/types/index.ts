export type UserStatsType = {
  username: string;
  avatar: string;
  publicRepos: number;
  totalPRs: number;
  totalStars: number;
  followers: number;
  following: number;
  bio: string;
  company: string;
  location: string;
  joinedOn: string;
};

export interface ActivePRType {
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
  creator: {
    username: string;
    avatar: string;
  };
}

export interface RepoStats {
  name: string;
  stars: number;
  forks: number;
  openPRs: number;
  commits: number;
  language: string | null;
  lastCommit: string;
  contributors: number;
  score: number;
}

export interface RecentActivityType {
  id: string;
  type: string;
  repo: string;
  created_at: string;
  action: string;
  title?: string;
  commits?: { message: string; url: string }[];
  url?: string;
}

export interface PRDetailsType {
  id: string;
  number: number;
  title: string;
  description: string;
  state: "open" | "closed" | "merged";
  author: {
    login: string;
    avatar_url: string;
    name: string;
  };
  assignees: {
    login: string;
    avatar_url: string;
    name: string;
  }[];
  reviewers: {
    login: string;
    avatar_url: string;
    name: string;
    type: "requested" | "reviewed";
  }[];
  labels: {
    name: string;
    color: string;
  }[];
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  base: {
    ref: string;
    repo: {
      name: string;
      full_name: string;
    };
  };
  head: {
    ref: string;
    repo: {
      name: string;
      full_name: string;
    };
  };
  stats: {
    commits: number;
    additions: number;
    deletions: number;
    changed_files: number;
    comments: number;
  };
  mergeable: boolean | null;
  merge_conflict: boolean;
  draft: boolean;
  can_merge: boolean;
  merge_status: "clean" | "conflicts" | "unknown";
  files: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
    patch?: string;
  }[];
  commits: {
    sha: string;
    message: string;
    author: {
      login: string;
      avatar_url: string;
      name: string;
    };
    date: string;
    url: string;
  }[];
  reviews: {
    id: number;
    state: string;
    body: string | null;
    user: {
      login: string;
      avatar_url: string;
      name: string;
    };
    submitted_at: string | null;
  }[];
}

export interface Report {
  _id: string;
  prIdentifier: string;
  prMetadata: string;
  playgroundConfig: {
    provider: string;
    model: string;
    systemPrompt: string;
    userPrompt: string;
    maxTokens?: number;
    temperature?: number;
  };
  reportTitle: string;
  savedAt: string;
  updatedAt: string;
  createdAt: string;
}
// Mock PR Report Data Type
export interface MockPRReport {
  _id: string;
  summary: {
    score: number;
    complexity: string;
    risk_level: string;
    estimated_review_time: string;
  };
  analysis: {
    code_quality: {
      score: number;
      issues: string[];
      strengths: string[];
    };
    security: {
      score: number;
      vulnerabilities: string[];
      recommendations: string[];
    };
    performance: {
      score: number;
      concerns: string[];
      optimizations: string[];
    };
  };
  files_analysis: Array<{
    filename: string;
    changes: { additions: number; deletions: number };
    complexity: string;
    issues: string[];
    rating: number;
  }>;
  recommendations: string[];
}
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
