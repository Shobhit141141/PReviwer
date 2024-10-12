import { useAuth } from "../context/AuthContext";
import {FaGithub} from 'react-icons/fa'
import { Button } from "antd";
const Navbar = () => {
  const { user, connectWithGitHub, disconnectFromGitHub } = useAuth();

  return (
    <nav className="w-full h-[60px] flex justify-between px-4 items-center">
      <h1>My App</h1>
      {user ? (
        <Button color="danger" variant="solid" className="font-bold" onClick={disconnectFromGitHub}>Disconnect</Button>
      ) : (
        <Button color="warning" variant="solid" onClick={connectWithGitHub}><FaGithub/> Connect with GitHub</Button>
      )}
    </nav>
  );
};

export default Navbar;
