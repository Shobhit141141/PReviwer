import { useEffect, useState } from "react";
import { getAllActivePRs } from "../apis/apis";
import { useAuth } from "../context/AuthContext";
import { Button, Tag } from "antd";
import { IoLogOutOutline } from "react-icons/io5";
import { ClockCircleOutlined } from "@ant-design/icons";
import { Badge } from "@radix-ui/themes/dist/cjs/index.js";
import { useNavigate } from "react-router-dom";
const PRcard = ({ pr }) => {
  const navigate = useNavigate();

  const handleOpenPr = () => {
    navigate('/pr', { state: { pr } });
  };
  const formattedDate = new Date(pr.created_at).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',  // 'short' gives Jan, Feb, etc.
    day: 'numeric',
  });
  return (
    <div className="bg-[#3d3d3d] w-full p-2 rounded-md shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Top Section with PR Number, Title, and Repo Name */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-blue-500 font-semibold text-lg">#{pr.number}</p>
          <h2 className="text-white text-xl font-semibold">{pr.title}</h2>
        </div>
        <p className="text-gray-400 text-sm italic">Repo: {pr.base.repo.name}</p>
      </div>

      {/* PR Details Section */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center gap-4">
          <p className="text-gray-300 text-sm">by <span className="font-medium text-white">{pr.head.user.login}</span></p>
          <Badge
            color="green"
            className="text-gray-300 bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg flex items-center gap-2"
          >
            <ClockCircleOutlined className="text-green-400" />
            {formattedDate}          </Badge>
        </div>

        {/* Open Button */}
        <Button
          color="primary"
          variant="solid"
          onClick={handleOpenPr}
        >
          <IoLogOutOutline className="text-lg" />
          Open
        </Button>
      </div>
    </div>
  );
};

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
      return <div className="md:w-[50%] md:h-[85vh] h-1/2 flex flex-col p-2 bg-[#2b2b2b] justify-center items-center">

  . . .
      </div>;
    }

  return (
    <div className="w-full md:w-[50%] md:h-[85vh] h-1/2 flex flex-col p-2 bg-[#2b2b2b] overflow-y-scroll">
      <h1 className="ml-4">Active Pull Requests</h1>

      <div className="flex w-full justify-between px-4 py-2 gap-2 ">
        {activePrs.map((pr) => (
          // <div
          //   key={pr.id}
          //   className="bg-[#151515] p-2 rounded-md flex flex-col justify-between"
          // >
          //   <p>#{pr.number}</p>
          //   <h2>{pr.title}</h2>
          //   <p>{pr.body}</p>
          //   <a href={pr.html_url} target="_blank" rel="noreferrer">
          //     View on GitHub
          //   </a>
          //   <p>{new Date(pr.created_at).toLocaleString()}</p>
          //   <p>Head :{pr.head.label} </p>
          //   <p>Base :{pr.base.label} </p>
          //   <p> Created by : {pr.head.user.login}</p>
          // </div>
          <PRcard key={pr.id} pr={pr} />
        ))}
      </div>
    </div>
  );
}

export default ActivePrs;
