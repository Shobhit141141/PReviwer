"use client";
import React from 'react';
import {
  GitPullRequest,
  Users,
  TrendingUp,
} from 'lucide-react';
import ActivePullRequests from '@/components/activePullRequests';
import UserStats from '@/components/userStats';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import WeeklyActivity from '@/components/weeklyActivity';
import TopRepos from '@/components/topRepos';
import RecentActivity from '@/components/recentActivity';
import PlaygroundCard from '@/components/playgroundCard';

const Dashboard = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen text-white relative bg-gray-900">

      <div className="fixed pointer-events-none top-[10%] left-[5%] w-[400px] h-[400px] bg-purple-500 rounded-full blur-[160px] opacity-50"></div>
      <div className="fixed pointer-events-none top-[20%] right-[5%] w-[300px] h-[300px] bg-pink-500 rounded-full blur-[140px] opacity-35"></div>
      <div className="fixed pointer-events-none bottom-[15%] left-[20%] w-[350px] h-[350px] bg-blue-500 rounded-full blur-[150px] opacity-30"></div>
      <div className="fixed pointer-events-none bottom-[10%] right-[15%] w-[400px] h-[400px] bg-fuchsia-500 rounded-full blur-[180px] opacity-35"></div>
      <div className="fixed pointer-events-none top-[40%] left-[40%] w-[300px] h-[300px] bg-indigo-500 rounded-full blur-[120px] opacity-25"></div>

      {/* Header */}


      <div className="container mx-auto px-6 py-8">
        <ProtectedRoute requireAuth={false}>
          {isAuthenticated ? (
            <>
              <UserStats />

              {/* Recent Activity - Full Width Horizontal */}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Active Pull Requests - spans 2 columns */}
                <div className="lg:col-span-2 space-y-8">
                  <PlaygroundCard />
                  <RecentActivity />
                  <ActivePullRequests />
                </div>

                {/* Repository Stats - spans 1 column */}
                <div className="lg:col-span-1 space-y-8">
                  {/* Top Repositories */}
                  <TopRepos />

                  {/* Weekly Activity */}
                  <WeeklyActivity />
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