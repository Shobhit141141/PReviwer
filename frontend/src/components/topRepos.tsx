import { githubApi } from "@/lib/api";
import { RepoStats } from "@/types";
import { GitBranch, GitPullRequest, Star, Users, Code2, ActivitySquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import { formatDate } from "@/utils/formatDate";

function TopRepos() {
  const [repoStats, setRepoStats] = useState<RepoStats[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTopRepos = async () => {
    try {
      const response = await githubApi.getTopRepos();

      setRepoStats(response);

    } catch (error) {
      console.error("Error fetching top repositories:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopRepos();
  }, []);

 
  if (loading) return (
    <Skeleton className="h-124 w-full rounded-xl" />

  );

  return (
    <div className="rounded-xl border border-gray-800" id="glassmorphism">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Top Repositories</h2>
      </div>
      <div className="divide-y divide-gray-800">
        {repoStats?.map((repo) => (
          <div
            key={repo.name}
            className="p-6 shadow-sm transition-colors hover:bg-black/15"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-blue-400 hover:text-blue-300 cursor-pointer transition">
                {repo.name}
              </h3>
              <div className="flex items-center gap-1 text-sm text-yellow-400">
                <Star className="w-4 h-4" />
                <span>{repo.stars}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between text-sm text-gray-300 gap-y-2">
              <div className="flex flex-wrap items-center gap-4">
                <span className="flex items-center gap-1">
                  <GitBranch className="w-4 h-4 text-purple-400" />
                  <span>{repo.forks}</span>
                </span>
                <span className="flex items-center gap-1">
                  <GitPullRequest className="w-4 h-4 text-orange-400" />
                  <span>{repo.openPRs}</span>
                </span>
                <span className="flex items-center gap-1">
                  <ActivitySquare className="w-4 h-4 text-pink-400" />
                  <span>{repo.commits} commits</span>
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>{repo.contributors} contributors</span>
                </span>
                <span className="flex items-center gap-1">
                  <Code2 className="w-4 h-4 text-green-400" />
                  <span>{repo.language ?? "Unknown"}</span>
                </span>
              </div>

              <span className="text-xs text-gray-400 italic">
                Last commit: {formatDate(repo.lastCommit)}
              </span>
            </div>
          </div>

        ))}
      </div>
    </div>
  );
}

export default TopRepos;
