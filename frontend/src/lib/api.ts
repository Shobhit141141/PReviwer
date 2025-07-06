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
}

export interface RefreshTokenResponse {
  access_token: string;
}

export interface ApiErrorResponse {
  error: string;
  message?: string;
}

class ApiError extends Error {
  constructor(message: string, public status: number, public data?: any) {
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
    const error = urlParams.get("error");

    if (error) {
      throw new ApiError(`Authentication failed: ${error}`, 400);
    }

    if (userData && accessToken) {
      try {
        const user = JSON.parse(decodeURIComponent(userData));
        return { message: "Login successful", user, access_token: accessToken };
      } catch (err) {
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

    const response = await fetch(`${API_BASE_URL}/api/github/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
    const token = localStorage.getItem("github_access_token");
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

  // Token Management
  setAccessToken: (token: string) => {
    localStorage.setItem("github_access_token", token);
  },

  getAccessToken: (): string | null => {
    return localStorage.getItem("github_access_token");
  },

  removeAccessToken: () => {
    localStorage.removeItem("github_access_token");
  },

  // Check if token is valid
  isTokenValid: async (): Promise<boolean> => {
    try {
      const token = api.getAccessToken();
      if (!token) return false;

      await api.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  },
};

export { ApiError };
