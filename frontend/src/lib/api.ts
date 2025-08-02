const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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
  refresh_token: string;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: ApiErrorResponse
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new ApiError(
      errorData.error || `HTTP error! status: ${response.status}`,
      response.status,
      errorData
    );
  }
  return response.json();
};

export const api = {
  // GitHub Authentication
  githubLogin: () => {
    window.location.href = `${API_BASE_URL}/api/github/login`;
  },

  // Note: The callback is handled by the backend, not the frontend
  // The backend will redirect back to the frontend with user data
  handleAuthRedirect: async (): Promise<AuthResponse | null> => {
    const urlParams = new URLSearchParams(window.location.search);
    const userData = urlParams.get("user");
    const accessToken = urlParams.get("token");
    const refreshToken = urlParams.get("refresh_token");
    const error = urlParams.get("error");

    if (error) {
      throw new ApiError(`Authentication failed: ${error}`, 400);
    }

    if (userData && accessToken) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        return {
          message: "Login successful",
          user,
          access_token: accessToken,
          refresh_token: refreshToken || "",
        };
      } catch (err) {
        console.error("Failed to parse user data:", err);
        throw new ApiError("Invalid user data received", 400);
      }
    }

    return null;
  },

  refreshAccessToken: async (): Promise<RefreshTokenResponse> => {
    const token = localStorage.getItem("github_access_token");
    if (!token) {
      throw new ApiError("No access token found", 401);
    }

    const refreshToken = api.getRefreshToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };
    if (refreshToken) {
      headers["x-refresh-token"] = refreshToken;
    }

    const response = await fetch(`${API_BASE_URL}/api/github/refresh`, {
      method: "POST",
      headers,
    });
    return handleResponse(response);
  },

  disconnectFromGitHub: async (): Promise<{ message: string }> => {
    const token = localStorage.getItem("github_access_token");
    if (!token) {
      throw new ApiError("No access token found", 401);
    }

    const response = await fetch(`${API_BASE_URL}/api/github/disconnect`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // User Management
  getCurrentUser: async (): Promise<User> => {
    const token = api.getAccessToken();
    if (!token) {
      throw new ApiError("No access token found", 401);
    }

    const response = await fetch(`${API_BASE_URL}/api/user/profile`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // User Analytics
  getUserAnalytics: async () => {
    const token = api.getAccessToken();
    if (!token) {
      throw new ApiError("No access token found", 401);
    }
    const response = await fetch(`${API_BASE_URL}/api/user/analytics`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  // Token Management
  setAccessToken: (token: string) => {
    localStorage.setItem("github_access_token", token);
  },

  setRefreshToken: (token: string) => {
    localStorage.setItem("github_refresh_token", token);
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem("github_access_token");
  },

  getRefreshToken: (): string | null => {
    return localStorage.getItem("github_refresh_token");
  },

  removeAccessToken: () => {
    localStorage.removeItem("github_access_token");
  },

  removeRefreshToken: () => {
    localStorage.removeItem("github_refresh_token");
  },

  // Check if token is valid
  isTokenValid: async (): Promise<boolean> => {
    try {
      const token = api.getAccessToken();
      if (!token) return false;

      await api.getCurrentUser();
      return true;
    } catch (error) {
      console.error("Failed to validate token:", error);
      return false;
    }
  },
};

// Playground API
export const playgroundApi = {
  configureModel: async (data: unknown) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(`${API_BASE_URL}/api/playground/configure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  testModelConnection: async (data: unknown) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/test-connection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },
  testSystemPrompt: async (data: unknown) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/test-system-prompt`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },
  abTestPrompts: async (data: unknown) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(`${API_BASE_URL}/api/playground/ab-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
  savePrompts: async (data: unknown) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/save-prompts`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },
  getPlaygroundConfig: async () => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(`${API_BASE_URL}/api/playground/config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },
  generateAnalysisReport: async (data: {
    owner: string;
    repo: string;
    pull_number: number;
    analysis_type?: string;
  }) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/generate-analysis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },

  // New template-based API functions
  getTemplateVariables: async () => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/template-variables`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return handleResponse(response);
  },

  previewTemplate: async (data: { systemPromptTemplate: string }) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/preview-template`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },

  generateTemplatedAnalysis: async (data: {
    prData: {
      owner: string;
      repo: string;
    };
    systemPromptTemplate: string;
    llm_provider?: string;
    llm_model?: string;
    llm_api_key?: string;
    validateOnly?: boolean;
  }) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/playground/generate-templated-analysis`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }
    );
    return handleResponse(response);
  },
};

export const githubApi = {
  getActivePullRequests: async () => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/github/active-pull-requests`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return handleResponse(response);
  },

  getWeeklyActivity: async () => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(`${API_BASE_URL}/api/github/weekly-activity`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  getTopRepos: async () => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(`${API_BASE_URL}/api/github/top-repos`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  getRecentActivity: async () => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(`${API_BASE_URL}/api/github/recent-activity`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  },

  getPRDetails: async (
    owner: string,
    repo: string,
    prNumber: string | number
  ) => {
    const token = api.getAccessToken();
    if (!token) throw new ApiError("No access token found", 401);
    const response = await fetch(
      `${API_BASE_URL}/api/github/pr-details/${owner}/${repo}/${prNumber}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return handleResponse(response);
  },
};

export { ApiError };
