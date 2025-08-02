import { githubApi } from "@/lib/api";
import { JSX, useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";
import {
  GitCommit,
  GitPullRequest,
  GitBranch,
  AlertCircle,
  Activity,
} from "lucide-react";
import { formatDate } from "@/utils/formatDate";
import { RecentActivityType } from "@/types";



const ICONS: Record<string, JSX.Element> = {
  PushEvent: (
    <div className="p-2 rounded-full bg-pink-500">
      <GitCommit className="w-5 h-5 text-white" />
    </div>
  ),
  PullRequestEvent: (
    <div className="p-1 rounded-full bg-orange-400">
      <GitPullRequest className="w-5 h-5 text-white" />
    </div>
  ),
  IssuesEvent: (
    <div className="p-1 rounded-full bg-red-500">
      <AlertCircle className="w-5 h-5 text-white" />
    </div>
  ),
  CreateEvent: (
    <div className="p-1 rounded-full bg-purple-400">
      <GitBranch className="w-5 h-5 text-white" />
    </div>
  ),
  Default: (
    <div className="p-1 rounded-full bg-gray-500">
      <Activity className="w-5 h-5 text-white" />
    </div>
  ),
};


export default function RecentActivity() {
  const [activity, setActivity] = useState<RecentActivityType[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRecentActivity = async () => {
    try {
      const response = await githubApi.getRecentActivity();
      setActivity(response?.recentActivities || []);
    } catch (error) {
      console.error("Error fetching activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentActivity();
  }, []);

  if (loading) return <Skeleton className="h-64 w-full rounded-xl" />;

  if (!activity || activity.length === 0)
    return <p className="text-gray-400 italic">No recent activity</p>;

  return (
    <div className="rounded-xl border border-gray-800" id="glassmorphism">
      <div className="p-6 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Recent GitHub Activity</h2>
      </div>

      <div className="divide-y divide-gray-800">
        {activity.map((item) => (
          <div key={item.id} className="p-6 flex flex-col gap-2 hover:bg-black/10 transition-colors">
            <div className="flex items-center gap-3 text-sm font-medium">
              {ICONS[item.type] || ICONS.Default}
              <span className="text-white">{item.action}</span>
            </div>

            <div className="text-sm text-gray-300 ml-8">
              <div className="italic">
                Repo: <span className="text-blue-400">{item.repo}</span>
              </div>

              {item.commits && item.commits.length > 0 && (
                <div className="mt-1">
                  {item.commits.slice(0, 1).map((commit, idx) => (
                    <div key={idx} className="text-xs text-gray-400 italic">
                      Commit: &quot;{commit.message.length > 70 ? commit.message.slice(0, 70) + "..." : commit.message}&quot;
                    </div>
                  ))}
                </div>
              )}

              {item.title && (
                <div className="text-xs text-gray-400 italic mt-1">
                  {item.title}
                </div>
              )}

              <div className="text-xs text-gray-500 mt-1">
                {formatDate(item.created_at)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
