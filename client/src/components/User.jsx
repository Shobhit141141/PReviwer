import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

function User() {
  const { user, loading } = useAuth();

  // useEffect(() => {
  //   if (loading) {
  //     return <div className="w-full md:w-1/2 p-4 flex justify-center items-center h-full">Loading...</div>;
  //   }
  // }, [loading]);

  // Ensure that the UI updates when the user state changes
  return (
    <div className="w-full md:w-1/2 p-4 bg-[#232323]">
      {user ? (
        <div>
          <p>Username: {user.login}</p>
          <p>Email: {user.name}</p>
          <img
            src={user.avatar_url}
            alt="User Avatar"
            className="w-20 h-20 rounded-full"
          />
          <p>Followers: {user.followers}</p>
          <p>Following: {user.following}</p>
          <p>Public Repos: {user.public_repos}</p>
          <a href={user.html_url}>Github</a>
          <p>Bio: {user.bio} </p>
        </div>
      ) : (
        <p>No user data available. Please log in.</p>
      )}
    </div>
  );
}

export default User;
