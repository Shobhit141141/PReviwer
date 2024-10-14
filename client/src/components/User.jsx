import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "@radix-ui/themes/dist/cjs/index.js";
import { FaGithub } from "react-icons/fa";
import { MdOutlineNotificationsActive } from "react-icons/md";
import RepoWebHook from "./RepoWebhook";

function User() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="w-full md:w-[50%] p-4 bg-[#232323] h-1/2 flex justify-center items-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full h-[85vh] md:w-[50%] justify-between gap-2">
      <div className="w-full h-[65%] p-6 bg-[#232323] rounded-lg shadow-lg flex flex-col items-center">
        {user ? (
          <div className="w-full flex flex-col items-center space-y-6">
            <div className="w-full flex justify-center">
              <img
                src={user.avatar_url}
                alt="User Avatar"
                className="w-24 h-24 rounded-full"
              />
            </div>
            <div className="w-full grid grid-cols-2 gap-4 text-sm text-gray-300">
              <p className="font-semibold">Username:</p>
              <p>{user.login}</p>
              <p className="font-semibold">Email:</p>
              <p>{user.name}</p>
              <p className="font-semibold">Followers:</p>
              <p>{user.followers}</p>
              <p className="font-semibold">Following:</p>
              <p>{user.following}</p>
              <p className="font-semibold">Public Repos:</p>
              <p>{user.public_repos}</p>
              <p className="font-semibold">Bio:</p>
              <p>{user.bio}</p>
            </div>
            <Button color="primary" variant="surface">
              <a
                href={user.html_url}
                className="font-medium no-underline flex justify-center items-center gap-2"
              >
                <FaGithub /> View Github Profile
              </a>
            </Button>
          </div>
        ) : (
          <p className="text-center text-white">
            No user data available. Please log in.
          </p>
        )}
      </div>

    <RepoWebHook/>
    </div>
  );
}

export default User;
