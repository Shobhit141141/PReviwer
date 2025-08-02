import { githubApi } from "@/lib/api";
import { useEffect, useState } from "react";
import { Skeleton } from "./ui/skeleton";

type DaySummary = {
  day: string;
  date: string;
  commits: number;
  prs: number;
  repos: number;
};

function WeeklyActivity() {
  const [dailySummary, setDailySummary] = useState<DaySummary[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeeklyActivity = async () => {
    try {
      const response = await githubApi.getWeeklyActivity();
      setDailySummary(response.dailySummary);
    } catch (error: unknown) {
      console.error("Error fetching weekly activity:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeeklyActivity();
  }, []);

  if (loading) {
    return <Skeleton className="h-64 w-full rounded-lg" />;
  }

  const totalCommits = dailySummary?.reduce((sum, d) => sum + d.commits, 0) ?? 0;
  const totalPRs = dailySummary?.reduce((sum, d) => sum + d.prs, 0) ?? 0;
  const totalRepos = dailySummary?.reduce((sum, d) => sum + d.repos, 0) ?? 0;

  return (
    <div className="rounded-xl border border-gray-800" id="glassmorphism">
      <div className="p-6">
        <h2 className="text-xl font-semibold">Weekly Activity</h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-7 gap-2">
          {dailySummary?.map((day) => (
            <div key={day.date} className="text-center">
              <div className="text-xs text-gray-400 mb-2">{day.day}</div>
              <div className="space-y-1">
                <div
                  className="bg-blue-500 rounded"
                  style={{ height: `${day.commits * 10}px` }}
                ></div>
                <div
                  className="bg-green-500 rounded"
                  style={{ height: `${day.prs * 10}px` }}
                ></div>
                <div
                  className="bg-yellow-500 rounded"
                  style={{ height: `${day.repos * 10}px` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center space-x-4 mt-4 text-sm">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Commits</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>PRs</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Repos</span>
          </div>
        </div>

        <div className="flex justify-center gap-8 mt-6">
          <div className="flex flex-col items-center bg-blue-600/40 rounded-lg px-3 py-2 shadow">
            <span className="text-xs text-gray-400 mb-1">Commits</span>
            <span className="text-2xl font-bold text-blue-400">{totalCommits}</span>
          </div>
          <div className="flex flex-col items-center bg-green-600/40 rounded-lg px-6 py-2 shadow">
            <span className="text-xs text-gray-400 mb-1">PRs</span>
            <span className="text-2xl font-bold text-green-400">{totalPRs}</span>
          </div>
          <div className="flex flex-col items-center bg-yellow-600/40 rounded-lg px-6 py-2 shadow">
            <span className="text-xs text-gray-400 mb-1">Repos</span>
            <span className="text-2xl font-bold text-yellow-400">{totalRepos}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WeeklyActivity;
