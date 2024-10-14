import React, { useEffect, useState } from "react";
import axios from "axios";
import { MdOutlineNotificationsActive } from "react-icons/md";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { PRcard } from "./ActivePr";

function RepoWebHook() {
  const [repos, setRepos] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [connectedRepo, setConnectedRepo] = useState(null);
  const [hookId, setHookId] = useState(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [activePRs, setActivePRs] = useState([]);
  const { token } = useAuth();
  const axiosInstance = axios.create({
    baseURL: "https://previwer-server.vercel.app",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  useEffect(() => {
    const fetchConnectedRepo = async () => {
      try {
        const response = await axiosInstance.get("/webhook/connected-repo");
        setConnectedRepo(response.data.hookedRepo);
      } catch (error) {
        console.error("Error fetching connected repo:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchConnectedRepo();
    fetchRepos();
  }, []);

  const fetchRepos = async () => {
    try {
      const response = await axiosInstance.get("/auth/repos");
      setRepos(response.data);
    } catch (error) {
      console.error("Error fetching repos:", error.message);
      toast.error("Failed to fetch repositories");
    }
  };

  const checkConnectedWebhook = async () => {
    try {
      if (!connectedRepo) {
        return;
      }
      const response = await axiosInstance.post("/webhook/check", {
        repo: connectedRepo,
      });

      if (!response.data.webhook) {
        disconnectWebhook();
      }
    } catch (error) {
      console.error("Error checking webhook:", error.message);
    }
  };

  const connectWebhook = async () => {
    try {
      const response = await axiosInstance.post("/webhook/connect-webhook", {
        repo: selectedRepo,
      });
      setConnectedRepo(selectedRepo);
      setHookId(response.data.hookId);
      toast.success("Webhook connected successfully");
    } catch (error) {
      console.error("Error connecting webhook:", error.message);
      toast.error("Failed to connect webhook");
    }
  };

  const disconnectWebhook = async () => {
    setDisconnecting(true);
    try {
      await axiosInstance.post("/webhook/disconnect-webhook");
      setConnectedRepo(null);
      setActivePRs([]);
    } catch (error) {
      console.error("Error disconnecting webhook:", error);
    } finally {
      setDisconnecting(false);
    }
  };

  const getPrEvents = async () => {
    try {
      const response = await axiosInstance.post("/webhook/pr-events");
      setActivePRs(response.data.activePRs);
    } catch (error) {
      console.error("Error getting PR events:", error);
    }
  };

  useEffect(() => {
    checkConnectedWebhook();
    if (connectedRepo) {
      getPrEvents();
    }
  }, [connectedRepo]);

  return (
    <div className="h-[100] md:h-[40%] w-full bg-[#272626] rounded-md p-4 overflow-y-scroll">
      <h1 className="font-bold text-lg flex gap-2 items-center text-white">
        <MdOutlineNotificationsActive /> Focused Repo PRs (via webhook)
      </h1>
      <div className="mt-4 text-white">
        {connectedRepo ? (
          <div className="flex gap-2 items-center">
            <p>
              Connected to: <span className="font-bold">{connectedRepo}</span>
            </p>
            <button
              onClick={disconnectWebhook}
              className="bg-red-500 px-2 py-1 mt-2 rounded-md text-white"
            >
              Disconnect Webhook
            </button>
          </div>
        ) : (
          <div className="">
            <select
              value={selectedRepo}
              onChange={(e) => setSelectedRepo(e.target.value)}
              className="p-2 bg-[#393939] rounded-md text-white"
            >
              <option value="" disabled>
                Select a repository
              </option>
              {repos?.map((repo, index) => (
                <option key={index} value={repo}>
                  {repo}
                </option>
              ))}
            </select>
            <button
              onClick={connectWebhook}
              disabled={!selectedRepo}
              className="bg-green-500 px-4 py-2 mt-2 rounded-md text-white"
            >
              Connect Webhook
            </button>
          </div>
        )}

{activePRs.length > 0 ? (
  <div className="mt-4">
    <h2 className="font-bold text-lg">Active PRs</h2>
    <ul className="list-disc list-inside text-white">
      {activePRs.map(({ pr, commented }, index) => (
        <PRcard key={index} pr={pr} commented={commented} />
      ))}
    </ul>
  </div>
) : (
  <div className="bg-[#2979ce] w-full p-4 rounded-md shadow-sm hover:shadow-md transition-all duration-200 mt-2">
    {connectedRepo ? (
      <p>No active PRs</p>
    ) : (
      <p>Connect a webhook to view active PRs</p>
    )}
  </div>
)}

      </div>
    </div>
  );
}

export default RepoWebHook;
