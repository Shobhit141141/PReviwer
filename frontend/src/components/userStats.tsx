
import { GitBranch, Star, Users } from 'lucide-react';

function UserStats() {

    const userStats = {
        username: 'john_dev',
        avatar: 'https://avatars.githubusercontent.com/u/122107079?v=4',
        totalRepos: 24,
        totalPRs: 156,
        totalStars: 1247,
        followers: 89,
        following: 143,
        bio: 'Full Stack Developer with a passion for open source.',
        company: 'Tech Innovations',
        location: 'San Francisco, CA',
    };

    return (
        <div className="space-y-4">


            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Avatar + Info Card */}
                <div className=" rounded-xl p-6 border border-gray-800 lg:col-span-2 lg:row-span-2 flex flex-col justify-between transition-colors" id='glassmorphism'>
                    <div className="flex items-center space-x-4">
                        <img
                            src={userStats.avatar}
                            alt="GitHub Avatar"
                            className="w-16 h-16 rounded-full border border-gray-700"
                        />
                        <div>
                            <p className="text-white text-lg font-semibold">{userStats.username}</p>
                            <p className="text-gray-400 text-sm">@{userStats.username}</p>
                        </div>
                        {/* Toggle Switch */}
                        {/* <div className="flex items-center justify-center gap-3 bg-gray-800 border border-gray-700 rounded-full px-4 py-2 w-fit mx-auto">
                            <div className="flex items-center gap-2">
                                <span className={mode === 'Mentor' ? 'text-white font-semibold' : 'text-gray-500'}>
                                    Mentor
                                </span>
                                <Switch
                                    checked={mode === 'Contributor'}
                                    onCheckedChange={(checked) => setMode(checked ? 'Contributor' : 'Mentor')}
                                />
                                <span className={mode === 'Contributor' ? 'text-white font-semibold' : 'text-gray-500'}>
                                    Contributor
                                </span>
                            </div>
                        </div> */}
                    </div>
                    <div className="mt-6 space-y-1">
                        <p className="text-sm text-gray-400">{userStats.bio}</p>
                        <p className="text-sm text-gray-500">
                            <span className="text-white">Company:</span> {userStats.company || 'N/A'}
                        </p>
                        <p className="text-sm text-gray-500">
                            <span className="text-white">Location:</span> {userStats.location || 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Following */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Following</p>
                            <p className="text-2xl font-bold text-green-400">{userStats.following}</p>
                        </div>
                        <Users className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                {/* Total Repositories */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Repositories</p>
                            <p className="text-2xl font-bold text-blue-400">{userStats.totalRepos}</p>
                        </div>
                        <GitBranch className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                {/* Total Stars */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Total Stars</p>
                            <p className="text-2xl font-bold text-yellow-400">{userStats.totalStars}</p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-400" />
                    </div>
                </div>

                {/* Followers */}
                <div className=" rounded-xl p-6 border border-gray-800" id='glassmorphism'>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-400 text-sm">Followers</p>
                            <p className="text-2xl font-bold text-purple-400">{userStats.followers}</p>
                        </div>
                        <Users className="w-8 h-8 text-purple-400" />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default UserStats;
