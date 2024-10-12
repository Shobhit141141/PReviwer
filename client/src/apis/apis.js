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
