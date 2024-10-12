import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { server_url } from "../apis/baseApi";

// Create AuthContext
const AuthContext = createContext();

// Provider component to wrap the app
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state

  // Function to handle GitHub OAuth login
  const connectWithGitHub = async () => {
    setLoading(true); // Set loading state before redirect
    window.location.href = `${server_url}/auth/github`;
  };

  // Function to handle GitHub OAuth callback
  const handleGitHubAuthCallback = async (code) => {
    setLoading(true); // Start loading
    try {
      const response = await axios.get(
        `${server_url}/auth/github/callback?code=${code}`
      );
      const { token, userData, userId } = response.data;
      // Store token and userData in localStorage
      setToken(token);
      setUser(JSON.parse(decodeURIComponent(userData))); // Decode and parse userData
      localStorage.setItem("jwtToken", token);
      localStorage.setItem("userData", userData);
    } catch (error) {
      console.error("Error in GitHub OAuth callback:", error);
    } finally {
      setLoading(false); // Stop loading after the operation
    }
  };

  // Function to disconnect from GitHub
  const disconnectFromGitHub = async () => {
    const storedToken = localStorage.getItem("jwtToken");
    if (storedToken) {
      setLoading(true); // Start loading before disconnect
      try {
        const response = await axios.post(
          `${server_url}/auth/disconnect`,
          {},
          {
            headers: {
              Authorization: `Bearer ${storedToken}`,
            },
          }
        );
        if (response.status === 200) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("userData");
        }
      } catch (error) {
        console.error("Failed to disconnect from GitHub:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Function to auto-login if token exists in localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem("jwtToken");
    const storedUserData = localStorage.getItem("userData");

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUserData) {
      setUser(JSON.parse(decodeURIComponent(storedUserData)));
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading, // Expose loading state to components
        connectWithGitHub,
        handleGitHubAuthCallback,
        disconnectFromGitHub,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use AuthContext
export const useAuth = () => useContext(AuthContext);
