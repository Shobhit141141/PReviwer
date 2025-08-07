"use client";
import React from 'react';

import ActivePullRequests from '@/components/activePullRequests';
import UserStats from '@/components/userStats';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import WeeklyActivity from '@/components/weeklyActivity';
import TopRepos from '@/components/topRepos';
import RecentActivity from '@/components/recentActivity';
import PlaygroundCard from '@/components/playgroundCard';
import LandingPage from './landing/page';

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


      <div className="">
        <ProtectedRoute requireAuth={false}>
          {isAuthenticated ? (
            <div className='container mx-auto  px-6 py-8'>
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
            </div>
          ) : (
            <LandingPage/>
          )}
        </ProtectedRoute>
      </div>
    </div>
  );
};

export default Dashboard;