import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import User from "../components/User";
import { useAuth } from "../context/AuthContext";
import ActivePrs from "../components/ActivePr";

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

  const {user} =useAuth()

  return (
    <div>
      <h1>Welcome to the Home Page</h1>
      <div className="w-full flex flex-col md:flex-row gap-2">
      <ActivePrs/>
      <User />
      </div>
    </div>
  );
};

export default Home;
