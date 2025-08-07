"use client";
import {  Github, LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Loading } from "./ui/loading";
import { Error } from "./ui/error";

function Navbar() {
  const { user, isLoading, isAuthenticated, error, login, logout, clearError } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <img src="/git.png" alt="" className="w-[40px]" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent hidden sm:block font-mono">
                PReviewer <span className="text-xs 
                text-white 
                bg-white/15 
                p-2 py-1 rounded-full
                ">v1.5</span>
              </h1>
            </div>
            {/* <div className="hidden md:flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search repositories, PRs..."
                className="bg-transparent border-none outline-none text-sm w-64"
              />
            </div> */}
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="absolute top-full left-0 right-0 z-50">
              <Error 
                message={error} 
                onDismiss={clearError}
                className="mx-6 mt-2"
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            {/* <button className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
            </button>
            <button className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button> */}

            {/* User Profile Section */}
            {isLoading ? (
              <Loading size="sm" text="" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                {/* User Avatar and Info */}
                <div className="flex items-center space-x-2">
                  <img 
                    src={user.avatar} 
                    alt={user.name} 
                    className="w-10 h-10 rounded-full "
                  />
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">@{user.username}</p>
                  </div>
                </div>

                {/* Disconnect Button */}
                <Button 
                  onClick={handleLogout}
                  className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white rounded-lg px-3 py-2"
                  disabled={isLoading}
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </div>
            ) : (
              /* Connect Button */
              <Button 
                onClick={login}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-2"
                disabled={isLoading}
              >
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;