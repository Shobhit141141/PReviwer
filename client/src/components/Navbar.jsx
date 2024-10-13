import { useAuth } from "../context/AuthContext";
import { FaGithub } from "react-icons/fa";
import { Button } from "antd";
import { Link, useNavigate } from "react-router-dom";
import { VscDebugDisconnect } from "react-icons/vsc";

const Navbar = () => {
  const { user, connectWithGitHub, disconnectFromGitHub,loading } = useAuth();
  const navigate = useNavigate();
  const disconnect = async () => {
    await disconnectFromGitHub();
    navigate("/");
  }
  return (
    <nav className="w-full h-[60px] mb-4 flex justify-between px-4 items-center fixed z-50 glassmorphism-bg ">
      <Link to="/" className="text-2xl font-bold text-white">
        <div className="flex gap-2 items-center">
          <img src="/git.png" alt="" className="w-[40px]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            PReviewer
          </h1>
        </div>
      </Link>
      {user ? (
        <Button
          color="danger"
          variant="solid"
          className="font-bold"
          onClick={disconnect}
        >
          <VscDebugDisconnect className="text-[22px]"/> Disconnect
        </Button>
      ) : (
        <Button color="warning" variant="solid" onClick={connectWithGitHub}>
          <FaGithub /> Connect with GitHub
        </Button>
      )}
    </nav>
  );
};

export default Navbar;
