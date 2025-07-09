"use client";
import React, { useState } from 'react';
import {
  GitPullRequest,
  Users,
  Star,
  GitBranch,
  Clock,
  CheckCircle,
  AlertCircle,
  GitCommit,
  Calendar,
  TrendingUp,
  Github,
  Settings,
  Bell,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Plus,
  Minus
} from 'lucide-react';
import Navbar from '@/components/navbar';
import ActivePullRequests from '@/components/activePullRequests';
import UserStats from '@/components/userStats';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';

const Dashboard = () => {
  const { user, isLoading, isAuthenticated } = useAuth();
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');
  const [selectedRepo, setSelectedRepo] = useState('all');

  // Dummy data - in a real app, this would come from the authenticated user
  const userStats = {
    username: user?.username || "john_dev",
    avatar: user?.avatar || "https://avatars.githubusercontent.com/u/122107079?v=4",
    totalRepos: 24,
    totalPRs: 156,
    totalStars: 1247,
    followers: 89,
    following: 143,
    bio: user?.bio || "Full Stack Developer with a passion for open source.",
    company: "Tech Innovations",
    location: "San Francisco, CA"
  };

  const activePRs = [
    {
      id: "1",
      title: "Fix authentication middleware bug",
      repo: "web-app",
      author: "john_dev",
      number: 142,
      status: "open",
      created: "2 hours ago",
      updated: "30 minutes ago",
      comments: 3,
      reviewers: ["alice_dev", "bob_coder"],
      labels: ["bug", "priority-high"],
      additions: 45,
      deletions: 12,
      commits: 4
    },
    {
      id: "2",
      title: "Add dark mode toggle component",
      repo: "ui-components",
      author: "alice_dev",
      number: 87,
      status: "draft",
      created: "1 day ago",
      updated: "4 hours ago",
      comments: 8,
      reviewers: ["john_dev"],
      labels: ["feature", "ui"],
      additions: 234,
      deletions: 23,
      commits: 12
    },
    {
      id: "3",
      title: "Update API documentation",
      repo: "api-server",
      author: "bob_coder",
      number: 203,
      status: "ready",
      created: "3 days ago",
      updated: "1 hour ago",
      comments: 15,
      reviewers: ["john_dev", "alice_dev"],
      labels: ["documentation"],
      additions: 156,
      deletions: 67,
      commits: 8
    }
  ];

  const repoStats = [
    {
      name: "web-app",
      stars: 342,
      forks: 89,
      openPRs: 12,
      language: "TypeScript",
      lastCommit: "2 hours ago",
      contributors: 8
    },
    {
      name: "ui-components",
      stars: 567,
      forks: 143,
      openPRs: 5,
      language: "React",
      lastCommit: "1 day ago",
      contributors: 12
    },
    {
      name: "api-server",
      stars: 234,
      forks: 67,
      openPRs: 8,
      language: "Node.js",
      lastCommit: "3 hours ago",
      contributors: 6
    }
  ];

  const weeklyActivity = [
    { day: 'Mon', commits: 12, prs: 3 },
    { day: 'Tue', commits: 8, prs: 2 },
    { day: 'Wed', commits: 15, prs: 4 },
    { day: 'Thu', commits: 6, prs: 1 },
    { day: 'Fri', commits: 20, prs: 5 },
    { day: 'Sat', commits: 4, prs: 1 },
    { day: 'Sun', commits: 7, prs: 2 }
  ];

  interface PR {
    id: number;
    title: string;
    repo: string;
    author: string;
    number: number;
    status: 'open' | 'draft' | 'ready' | string;
    created: string;
    updated: string;
    comments: number;
    reviewers: string[];
    labels: string[];
    additions: number;
    deletions: number;
    commits: number;
  }



  return (
    <div className="h-screen text-white overflow-y-auto relative bg-gray-900">
      <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
      <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
      <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>
      <div className="fixed pointer-events-none bottom-[10%] right-[15%] w-[400px] h-[400px] bg-fuchsia-500 rounded-full blur-[180px] opacity-35"></div>
      <div className="fixed pointer-events-none top-[40%] left-[40%] w-[300px] h-[300px] bg-indigo-500 rounded-full blur-[120px] opacity-25"></div>

      {/* Header */}
      <Navbar userStats={userStats} />

      <div className="container mx-auto px-6 py-8">
        <ProtectedRoute requireAuth={false}>
          {isAuthenticated ? (
            <>
              <UserStats />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Active Pull Requests */}
                <ActivePullRequests
                  activePRs={activePRs}
                  selectedRepo={selectedRepo}
                  setSelectedRepo={setSelectedRepo}
                />

                {/* Repository Stats */}
                <div className="space-y-8">
                  
                  {/* Top Repositories */}
                  <div className=" rounded-xl border border-gray-800" id='glassmorphism'>
                    <div className="p-6 border-b border-gray-800">
                      <h2 className="text-xl font-semibold">Top Repositories</h2>
                    </div>
                    <div className="divide-y divide-gray-800">
                      {repoStats.map((repo) => (
                        <div key={repo.name} className="p-6 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium text-blue-400 cursor-pointer hover:text-blue-300">
                              {repo.name}
                            </h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-400">
                              <Star className="w-4 h-4" />
                              <span>{repo.stars}</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-400">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center space-x-1">
                                <GitBranch className="w-4 h-4" />
                                <span>{repo.forks}</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <GitPullRequest className="w-4 h-4" />
                                <span>{repo.openPRs}</span>
                              </span>
                              <span className="text-blue-400">{repo.language}</span>
                            </div>
                            <span className="text-xs">{repo.lastCommit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Activity */}
                  <div className=" rounded-xl border border-gray-800" id='glassmorphism'>
                    <div className="p-6 border-b border-gray-800">
                      <h2 className="text-xl font-semibold">Weekly Activity</h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-7 gap-2">
                        {weeklyActivity.map((day) => (
                          <div key={day.day} className="text-center">
                            <div className="text-xs text-gray-400 mb-2">{day.day}</div>
                            <div className="space-y-1">
                              <div className="h-2 bg-blue-500 rounded" style={{ height: `${day.commits * 2}px` }}></div>
                              <div className="h-2 bg-green-500 rounded" style={{ height: `${day.prs * 4}px` }}></div>
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
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-8">
                    <div className=" rounded-xl border border-gray-800" id='glassmorphism'>
                      <div className="p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold">Recent Activity</h2>
                      </div>
                      <div className="divide-y divide-gray-800">
                        <div className="p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                              <GitCommit className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Pushed to main</p>
                              <p className="text-xs text-gray-400">web-app • 2 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                              <GitPullRequest className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Opened PR #142</p>
                              <p className="text-xs text-gray-400">ui-components • 4 hours ago</p>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 hover:bg-gray-800/50 transition-colors">
                          <div className="flex items-start space-x-3">
                            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                              <Star className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Starred repository</p>
                              <p className="text-xs text-gray-400">react-query • 1 day ago</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>


              </div>
            </>
          ) : (
            // Welcome screen for unauthenticated users
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-center max-w-2xl">
                <div className="mb-8">
                  <img src="/git.png" alt="GitHub" className="w-24 h-24 mx-auto mb-6" />
                  <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    Welcome to PReviewer
                  </h1>
                  <p className="text-xl text-gray-300 mb-6">
                    AI-powered PR review system that helps you manage and review pull requests efficiently.
                  </p>
                  <p className="text-gray-400 mb-8">
                    Connect your GitHub account to get started and access your repositories, pull requests, and more.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="p-6 border border-gray-700 rounded-lg">
                    <GitPullRequest className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Smart PR Reviews</h3>
                    <p className="text-sm text-gray-400">AI-powered analysis of your pull requests</p>
                  </div>
                  <div className="p-6 border border-gray-700 rounded-lg">
                    <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Analytics</h3>
                    <p className="text-sm text-gray-400">Track your development progress and metrics</p>
                  </div>
                  <div className="p-6 border border-gray-700 rounded-lg">
                    <Users className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <h3 className="font-semibold mb-2">Team Collaboration</h3>
                    <p className="text-sm text-gray-400">Enhanced collaboration tools for teams</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ProtectedRoute>
      </div>
    </div>
  );
};

export default Dashboard;