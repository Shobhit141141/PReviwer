import { ActivePRType } from "@/types";
import { AlertCircle, CheckCircle, Clock, Filter, GitCommit, GitPullRequest, MessageSquare, Minus, MoreHorizontal, Plus } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import PlaygroundCard from "./playgroundCard";

function ActivePullRequests({
  activePRs,
  selectedRepo,
  setSelectedRepo
}: {
  activePRs: ActivePRType;
  selectedRepo: string;
  setSelectedRepo: (repo: string) => void;
}) {
  interface StatusColorMap {
    [key: string]: string;
  }
  type PRStatusType = 'open' | 'draft' | 'ready' | string;

  const getStatusColor = (status: PRStatusType): string => {
    const colorMap: StatusColorMap = {
      open: 'text-green-500',
      draft: 'text-gray-500',
      ready: 'text-blue-500'
    };
    return colorMap[status] || 'text-gray-500';
  };

  type PRStatus = 'open' | 'draft' | 'ready' | string;

  const getStatusIcon = (status: PRStatus): React.ReactElement => {
    switch (status) {
      case 'open': return <GitPullRequest className="w-4 h-4" />;
      case 'draft': return <AlertCircle className="w-4 h-4" />;
      case 'ready': return <CheckCircle className="w-4 h-4" />;
      default: return <GitPullRequest className="w-4 h-4" />;
    }
  };

  return (
    <div className="lg:col-span-2" >
      <PlaygroundCard />
      <div className="rounded-xl border border-gray-800" id="glassmorphism">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Active Pull Requests</h2>
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                <Filter className="w-4 h-4" />
              </button>
                <div className="w-48">
                <Select value={selectedRepo} onValueChange={setSelectedRepo}>
                  <SelectTrigger className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm">
                  <SelectValue placeholder="Select Repository" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-950 border border-gray-700 text-gray-200">
                  <SelectItem value="all">All Repositories</SelectItem>
                  <SelectItem value="web-app">web-app</SelectItem>
                  <SelectItem value="ui-components">ui-components</SelectItem>
                  <SelectItem value="api-server">api-server</SelectItem>
                  </SelectContent>
                </Select>
                </div>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-800">
          {activePRs.map((pr) => (
            <div key={pr.id} className="p-6 hover:bg-black/20 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`flex items-center space-x-1 ${getStatusColor(pr.status)}`}>
                      {getStatusIcon(pr.status)}
                      <span className="text-sm font-medium capitalize">{pr.status}</span>
                    </span>
                    <span className="text-gray-400 text-sm">#{pr.number}</span>
                    <span className="text-gray-400 text-sm">in {pr.repo}</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2 hover:text-blue-400 cursor-pointer">
                    {pr.title}
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Created {pr.created}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <GitCommit className="w-4 h-4" />
                      <span>{pr.commits} commits</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <MessageSquare className="w-4 h-4" />
                      <span>{pr.comments} comments</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1 text-green-400">
                      <Plus className="w-3 h-3" />
                      <span>{pr.additions}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-red-400">
                      <Minus className="w-3 h-3" />
                      <span>{pr.deletions}</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mt-3">
                    {pr.labels.map((label) => (
                      <span
                        key={label}
                        className="px-2 py-1 bg-gray-800 text-gray-300 rounded-full text-xs"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex -space-x-2">
                    {pr.reviewers.map((reviewer, index) => (
                      <div
                        key={reviewer}
                        className="w-8 h-8 rounded-full bg-gray-700 border-2 border-gray-900 flex items-center justify-center text-xs font-medium"
                      >
                        {reviewer.charAt(0).toUpperCase()}
                      </div>
                    ))}
                  </div>
                  <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ActivePullRequests;