import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import ActivePrs from "../components/ActivePr";
import { Button } from "@radix-ui/themes/dist/cjs/index.js";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const userData = params.get("userData");

    if (token) {
      localStorage.setItem("jwtToken", token);
    }
    if (userData) {
      localStorage.setItem("userData", userData);
    }
    window.history.replaceState(null, "", window.location.pathname);
    navigate("/");
  }, [navigate]);

  const {user, connectWithGitHub,loading} =useAuth()

  if (!loading && !user) {
    return (
      <div className="w-full h-screen flex flex-col bg-[#232323] justify-center items-center gap-6 absolute top-0 left-0">
        <h1 className="text-white text-3xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 bg-clip-text text-transparent">Welcome to PReviewer</h1>
        <p className="text-gray-300 text-lg">Automate your PR reviews seamlessly.</p>
        <div className="bg-[#3d3d3d] rounded-md p-6 shadow-lg w-3/4 md:w-1/2">
          <h2 className="text-yellow-500 text-2xl font-semibold mb-4">About the System</h2>
          <p className="text-gray-200 mb-4">
            The integration with Gemini and GitHub streamlines code reviews for improved quality and efficiency.
          </p>
          <h3 className="text-lg font-semibold text-yellow-400">Features:</h3>
          <ul className="list-disc list-inside text-gray-200 space-y-1">
            <li>🚀 Instant feedback on PRs</li>
            <li>🔍 Automated code analysis</li>
            <li>💬 In-line commenting</li>
            <li>🛠️ Customizable review rules</li>
            <li>📈 Performance insights</li>
            <li>🔗 GitHub integration</li>
          </ul>
          <p className="text-yellow-400 mt-4">Connect to Github and enhance your development workflow today!</p>
        </div>
      </div>
    );
  }
  

  return (
    <div>
      <div className="w-full flex flex-col-reverse md:flex-row gap-2 p-4">
      <ActivePrs/>
      <User />
      </div>
    </div>
  );
};

export default Home;
