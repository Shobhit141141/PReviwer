import { useAuth } from "../context/AuthContext";
import { FaGithub } from "react-icons/fa";
import { Button } from "antd";
import { Link } from "react-router-dom";
const Navbar = () => {
  const { user, connectWithGitHub, disconnectFromGitHub } = useAuth();

  return (
    <nav className="w-full h-[60px] mb-4 flex justify-between px-4 items-center">
      <Link to="/" className="text-2xl font-bold text-white">
        <div className="flex gap-2 items-center">
          <img src="/git.png" alt="" className="w-[40px]" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            PReviewer
          </h1>{" "}
        </div>
      </Link>
      {user ? (
        <Button
          color="danger"
          variant="solid"
          className="font-bold"
          onClick={disconnectFromGitHub}
        >
          Disconnect
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
