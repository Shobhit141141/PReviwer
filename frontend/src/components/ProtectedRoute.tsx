'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Error } from './ui/error';
import { Github, Loader2, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requireAuth = true
}) => {
  const { isLoading, isAuthenticated, error, login, clearError } = useAuth();

  if (!isLoading) {
    return(
      <div className="flex h-screen w-full">
       <div className="space-y-4">


            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Avatar + Info Card */}
                <Skeleton className=" rounded-xl p-6 border border-gray-800 lg:col-span-2 lg:row-span-2 flex flex-col justify-between transition-colors" id='glassmorphism'>
            
                    <Skeleton className="mt-6 space-y-1">
                       
                    </Skeleton>
                </Skeleton>

                {[1, 2, 3, 4].map((_, index) => (
                    <Skeleton key={index} className=" rounded-xl p-6 border border-gray-800 w-[300px] h-[120px]" id='glassmorphism'>
                        
                    </Skeleton>
                ))}
            </div>
        </div>
      </div>


    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <Error
            message={error}
            onDismiss={clearError}
            className="mb-4"
          />
          <Button onClick={login} className="flex items-center space-x-2 mx-auto">
            <Github className="w-4 h-4" />
            <span>Try Again</span>
          </Button>
        </div>
      </div>
    );
  }

  if (requireAuth && !isAuthenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Please connect your GitHub account to access this feature.
            </p>
          </div>
          <Button
            onClick={login}
            className="flex items-center space-x-2 mx-auto bg-green-600 hover:bg-green-700"
          >
            <Github className="w-4 h-4" />
            <span>Connect GitHub</span>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook for conditional rendering based on auth state
export const useAuthGuard = () => {
  const { isLoading, isAuthenticated } = useAuth();

  return {
    isLoading,
    isAuthenticated,
    canAccess: !isLoading && isAuthenticated,
  };
}; 