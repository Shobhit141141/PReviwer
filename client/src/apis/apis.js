import axios from "axios";
import { server_url } from "./baseApi";

export const getAllActivePRs = async (token) => {
  try {
    const response = await axios.get(`${server_url}/auth/active/prs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching active PRs:", error);
    return [];
  }
};

export const fetchAnalysisReport = async (token, repo_name , prNumber) => {
  try {
    const response = await axios.post(
      `${server_url}/auth/pr/analysis`,
      {
        repo: repo_name,
        pullNumber: prNumber,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
   return response.data;
  } catch (error) {
    console.error("Error fetching analysis report:", error);
    return "No report available";
  }
};

export const postComment = async (token, repo_name, prNumber, comment) => {
  try {
    const response = await axios.post(
      `${server_url}/auth/pr/comment`,
      {
        repo: repo_name,
        pullNumber: prNumber,
        comment,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error posting comment:", error);
    return "Failed to post comment";
  }
}
