import { Button } from "@radix-ui/themes/dist/cjs/index.js";
import { FaGithub } from "react-icons/fa";
import { useLocation } from "react-router-dom";
import { fetchAnalysisReport, postComment } from "../apis/apis";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import ReactMarkdown from "react-markdown";
import toast from "react-hot-toast";

const PR = () => {
  const location = useLocation();
  const { pr } = location.state;

  const [analysisReport, setAnalysisReport] = useState(null);
  const [analysisloading, setanalysisLoading] = useState(false);
  const [commentLoading, setCommentLoading] = useState(false);
  const { token } = useAuth();
  const getCommentOnPr = async () => {
    try {
      setanalysisLoading(true);
      const response = await fetchAnalysisReport(
        token,
        pr.base.repo.name,
        pr.number
      );

      setAnalysisReport(response.review);
      toast.success("Fetched analysis report successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error in fetching analysis report");
    } finally {
      setanalysisLoading(false);
    }
  };

  const postcommentonpr = async () => {
    try {
      setCommentLoading(true);
      const response = await postComment(
        token,
        pr.base.repo.name,
        pr.number,
        analysisReport
      );

      toast.success("Commented on PR successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error in commenting on PR");
    } finally {
      setCommentLoading(false);
    }
  };

  return (
    <div className="w-full p-4 text-white">
      <div
        key={pr.id}
        className="bg-[#1f1f1f] p-4 rounded-md flex flex-col gap-4"
      >
        <div className="flex flex-col">
          <span className="text-yellow-500 font-medium">PR title</span>
          <p className="text-2xl">{pr.title}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* Number */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">PR Number</span>
            <p className="text-lg">#{pr.number}</p>
          </div>

          {/* Repo Name */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Repository</span>
            <p className="text-lg">{pr.base.repo.name}</p>
          </div>

          {/* PR Body */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Description</span>
            <p className="text-base">{pr.body || "No description provided."}</p>
          </div>

          {/* GitHub Link */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">GitHub Link</span>
            <div className="flex justify-start mt-2">
              <Button color="primary" variant="surface" className="w-[250px]">
                <a
                  href={pr.html_url}
                  className="font-medium no-underline flex justify-center items-center gap-2 w-full"
                >
                  <FaGithub /> View on GitHub
                </a>
              </Button>
            </div>
          </div>

          {/* Created At */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Created At</span>
            <p className="text-lg">
              {new Date(pr.created_at).toLocaleString()}
            </p>
          </div>

          {/* Head */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Head Branch</span>
            <p className="text-lg">{pr.head.label}</p>
          </div>

          {/* Base */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Base Branch</span>
            <p className="text-lg">{pr.base.label}</p>
          </div>

          {/* Creator */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Created By</span>
            <p className="text-lg">{pr.head.user.login}</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-start gap-2">
          <Button color="primary" variant="solid" onClick={getCommentOnPr}>
            {analysisloading ? "Fetching..." : "Fetch Analysis Report"}
          </Button>

          <Button
            color="green"
            variant="solid"
            disabled={!analysisReport}
            onClick={postcommentonpr}
          >
            {commentLoading ? "Posting..." : "Post Comment"}
          </Button>
        </div>{" "}
        {analysisReport && (
          <div className="bg-[#1f1f1f] p-4 rounded-md mt-4">
            <h2 className="text-yellow-500 font-medium">Analysis Report</h2>
            <div className="markdown-body">
              <ReactMarkdown>{analysisReport}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PR;
