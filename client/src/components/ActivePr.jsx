import { useEffect, useState } from "react";
import { getAllActivePRs } from "../apis/apis";
import { useAuth } from "../context/AuthContext";

function ActivePrs() {
  const [activePrs, setActivePrs] = useState([]);
  const [loading, setLoading] = useState(false);
  const { token } = useAuth();
  const fetchActivePrs = async () => {
    try {
      setLoading(true);
      const response = await getAllActivePRs(token);
      setActivePrs(response);
    } catch (error) {
      console.error("Error fetching active PRs:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (token) {
      fetchActivePrs();
    }
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="w-full md:w-1/2 md:h-[80vh] h-1/2 flex flex-col p-2 bg-[#2b2b2b]">
      <h1>Active Pull Requests</h1>
      <div className="flex flex-wrap gap-2">
        {activePrs.map((pr) => (
          <div
            key={pr.id}
            className="bg-[#151515] p-2 rounded-md flex flex-col justify-between"
          >
            <p>#{pr.number}</p>
            <h2>{pr.title}</h2>
            <p>{pr.body}</p>
            <a href={pr.html_url} target="_blank" rel="noreferrer">
              View on GitHub
            </a>
            <p>{new Date(pr.created_at).toLocaleString()}</p>
            <p>Head :{pr.head.label} </p>
            <p>Base :{pr.base.label} </p>
            <p> Created by : {pr.head.user.login}</p>
          </div>
        ))}
      </div>


    </div>
  );
}

export default ActivePrs;
