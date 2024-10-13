import { Badge, Button } from "@radix-ui/themes/dist/cjs/index.js";
import { FaGithub } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchAnalysisReport, postComment } from "../apis/apis";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { marked } from "marked";
import toast from "react-hot-toast";
import ReactQuill from "react-quill"; // Import React Quill
import "react-quill/dist/quill.snow.css"; // Import Quill's stylesheet

const PR = () => {
  const location = useLocation();

  const [analysisReport, setAnalysisReport] = useState(null);
  const [analysisloading, setanalysisLoading] = useState(false);
  const [editableReport, setEditableReport] = useState("");

  const [commentLoading, setCommentLoading] = useState(false);
  const { token, user, loading } = useAuth();
  const navigate = useNavigate();

  if (!loading && !user) {
    <div className="w-full md:w-[50%] p-4 bg-[#232323] h-1/2 flex justify-center items-center">
      <p className="text-white">Please login to view this page</p>
    </div>;
  }

  const { pr, commented } = location.state;
  const getCommentOnPr = async () => {
    try {
      setanalysisLoading(true);
      const response = await fetchAnalysisReport(
        token,
        pr.base.repo.name,
        pr.number
      );

      setAnalysisReport(response.review);
      setEditableReport(marked(response.review));
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
        editableReport
      );

      toast.success("Commented on PR successfully");
    } catch (error) {
      console.error(error);
      toast.error("Error in commenting on PR");
    } finally {
      setCommentLoading(false);
    }
  };

  const handleReportChange = (value) => {
    setEditableReport(value);
  };

  

  return (
    <div className="w-full p-4 text-white hide-scrollbar">
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

          {/* Head */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Head Branch</span>
            <Badge color="cyan" className="w-fit" size={"3"}>
              {pr.head.label}
            </Badge>
          </div>

          {/* Base */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Base Branch</span>
            <Badge color="crimson" className="w-fit" size={"3"}>
              {pr.base.label}
            </Badge>{" "}
          </div>

          {/* Created At */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Created At</span>
            <p className="text-lg">
              {new Date(pr.created_at).toLocaleString()}
            </p>
          </div>
          {/* Creator */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Created By</span>
            <p className="text-lg">{pr.head.user.login}</p>
          </div>

          {/* Commented */}
          <div className="flex flex-col">
            <span className="text-yellow-500 font-medium">Commented?</span>
            {commented ? (
              <p className="w-fit text-green-500" size={"3"}>
                Yes
              </p>
            ) : (
              <p className="w-fit text-red-500" size={"3"}>
                No
              </p>
            )}
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
        {editableReport && (
          <div className="bg-[#1f1f1f] p-4 rounded-md mt-4">
            <h2 className="text-yellow-500 font-medium">Analysis Report</h2>
            <ReactQuill
              value={editableReport} // Bind value to editableReport
              onChange={handleReportChange} // Handle changes
              theme="snow" // You can change the theme to 'bubble' if you prefer
              className="h-fit" // Adjust height as needed
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PR;
