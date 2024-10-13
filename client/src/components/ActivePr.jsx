import { useEffect, useState } from "react";
import { getAllActivePRs } from "../apis/apis";
import { useAuth } from "../context/AuthContext";
import { Button, Tag } from "antd";
import { IoLogOutOutline } from "react-icons/io5";
import { ClockCircleOutlined, GithubFilled } from "@ant-design/icons";
import { Badge } from "@radix-ui/themes/dist/cjs/index.js";
import { Link, useNavigate } from "react-router-dom";
import { TbGitPullRequest } from "react-icons/tb";
import { MdOutlineNotificationsActive } from "react-icons/md";

const PRcard = ({ pr,commented }) => {
  const navigate = useNavigate();

  const handleOpenPr = () => {
    navigate("/pr", { state: { pr,commented } });
  };
  const formattedDate = new Date(pr.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return (
    <div className={`bg-[#3d3d3d] w-full p-4 rounded-md shadow-sm border-4 hover:shadow-md hover:translate-x-1 transition-all duration-200 ${commented ? " border-green-400" : "border-[#3d3d3d]"}`}>
      <div className="flex flex-col md:flex-row justify-between items-start">
        <div className="flex items-center gap-2 mb-2 md:mb-0">
          <TbGitPullRequest className="text-2xl text-green-500" />
          <h2 className="text-lg font-semibold text-wrap"> {pr.title.length > 15 ? `${pr.title.slice(0, 10)}...` : pr.title}</h2>
        </div>
        <div className="flex gap-2 items-center">
          <Link to={pr.html_url} className="text-white">
            <GithubFilled className="text-2xl md:text-3xl text-white" />
          </Link>
          <Button color="primary" variant="solid" className="h-[25px] md:h-auto" onClick={handleOpenPr}>
            <IoLogOutOutline className="text-lg" />
            Open
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-4">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-sm text-gray-300">
            <span className="font-bold text-white">#{pr.number}</span>
            <span className="mx-1">opened by</span>
            <span className="font-medium text-white">{pr.head.user.login}</span>
            <span className="mx-1">in</span>
            <span className="font-medium text-white">{pr.base.repo.name}</span>
            <span className="mx-1">repo</span>
          </span>
        </div>

        <div className="mt-2 md:mt-0">
          <Badge
            color="green"
            className="text-gray-300 bg-gray-800 border border-gray-700 px-2 py-1 rounded-lg flex items-center gap-2"
          >
            <ClockCircleOutlined className="text-green-400" />
            {formattedDate}
          </Badge>
        </div>
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
      console.log(response.activePRs);
      setActivePrs(response.activePRs);
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

  // if (loading) {
  //   return (
  //     <div className="md:w-[50%] md:h-[85vh] h-1/2 flex flex-col p-2 bg-[#2b2b2b] justify-center items-center">
  //       . . .
  //     </div>
  //   );
  // }

  return (
    <div className="w-full md:w-[50%] md:h-[85vh] h-1/2 flex flex-col p-2 bg-[#2b2b2b] overflow-y-scroll">
      <h1 className="ml-4 font-bold text-lg flex gap-2 items-center"><MdOutlineNotificationsActive/> Active Pull Requests</h1>

      {loading ? ( 
         <div className=" flex flex-col h-full p-2 bg-[#2b2b2b] justify-center items-center">
         . . .
       </div>
      ) : activePrs.length === 0 ? ( 
        <div className="flex justify-center items-center h-full text-white">
          <p>No active pull requests found.</p>
        </div>
      ) : (
        <div className="flex w-full justify-between px-4 py-2 gap-2">
          {activePrs.map(({pr,commented}) => (
            <PRcard key={pr.id} pr={pr} commented={commented}/>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActivePrs;
