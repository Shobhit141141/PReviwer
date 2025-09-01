
import { Calendar1, GitBranch, Users } from 'lucide-react';
import { UserStatsType } from '@/types';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Skeleton } from './ui/skeleton';
import { formatDate } from '@/utils/formatDate';
import { RefreshButton } from './RefreshButton';
import Image from 'next/image';

function UserStats() {


    const [userStats, setUserStats] = useState<UserStatsType | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    const fetchUserAnalytics = async () => {
        try {
            setLoading(true);
            const res = await api.getUserAnalytics();
            setUserStats(res);
        } catch (error) {
            console.error("Error setting user stats:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUserAnalytics();
    }, []);

    const handleRefreshComplete = async () => {
        // Refetch user analytics data after cache is cleared
        await fetchUserAnalytics();
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Avatar + Info Card */}
                    <Skeleton className=" rounded-xl p-6 border border-gray-800 lg:col-span-2 lg:row-span-2 flex flex-col justify-between transition-colors h-[227.18px] max-sm:h-[205px]" id='glassmorphism'>

                    </Skeleton>

                    {[1, 2, 3, 4].map((item) => (
                        <Skeleton key={item} className=" rounded-xl p-6 border border-gray-800 max-sm:h-[101.5px]" id='glassmorphism'></Skeleton>
                    ))}
                </div>
            </div>
        );
    }
    return (
        <div className="space-y-4">
            {/* Header with refresh button */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">User Statistics</h3>
                <RefreshButton
                    onRefreshComplete={handleRefreshComplete}
                    className="h-8 px-3 text-xs"
                />
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Avatar + Info Card */}
                <div className=" rounded-xl p-6 border border-gray-800 lg:col-span-2 lg:row-span-2 flex flex-col justify-between transition-colors" id='glassmorphism'>
                    <div className="flex items-center space-x-4">
                        <Image
                            src={userStats?.avatar || "/default-avatar.png"}
                            alt="GitHub Avatar"
                            className="w-16 h-16 rounded-full border border-gray-700"
                        />
                        <div>
                            <p className="text-white text-lg font-semibold">{userStats?.username}</p>
                            <p className="text-gray-400 text-sm">@{userStats?.username}</p>
                        </div>
                    </div>
                    <div className="mt-6 space-y-1">
                        <p className="text-sm text-gray-400">{userStats?.bio}</p>
                        <p className="text-sm text-gray-500">
                            <span className="text-white">Company:</span> {userStats?.company || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                            <span className="text-white">Location:</span> {userStats?.location || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Following */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Following</p>
                            <p className="text-2xl font-bold text-green-400">{userStats?.following}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                {/* Total Repositories */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Repositories</p>
                            <p className="text-2xl font-bold text-blue-400">{userStats?.publicRepos}</p>
                        </div>
                        <GitBranch className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                {/* Total Stars */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Joined On</p>
                            <p className="text-lg font-bold text-yellow-400">
                                {formatDate(userStats?.joinedOn || '')}
                            </p>
                        </div>
                        <Calendar1 className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>

                {/* Followers */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Followers</p>
                            <p className="text-2xl font-bold text-purple-400">{userStats?.followers}</p>
                        </div>
                        <Users className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserStats;
