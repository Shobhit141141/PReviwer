import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ApiError, cacheApi } from '@/lib/api';

interface RefreshButtonProps {
  onRefreshComplete?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  showClearText?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefreshComplete,
  variant = 'outline',
  size = 'default',
  className = '',
  disabled = false,
  showClearText = true,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);

    try {
      // Clear analysis and PR data caches
      const result = await cacheApi.clearAnalysisAndPRData();

      toast.success(
        `Cache cleared! ${result.clearedCount} entries removed. Data will be refreshed.`,
        {
          duration: 4000,
          icon: '🔄',
        }
      );

      // Call the callback if provided to trigger data refetch
      if (onRefreshComplete) {
        await onRefreshComplete();
      }

    } catch (error: unknown) {
      console.error('Error clearing cache:', error);
      toast.error(
        (error as ApiError).message || 'Failed to clear cache. Please try again.',
        {
          duration: 4000,
          icon: '❌',
        }
      );
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={disabled || isRefreshing}
      variant={variant}
      size={size}
      className={`${className} ${isRefreshing ? 'opacity-70' : ''}`}
    >
      <RefreshCw
        className={`w-4 h-4 ${showClearText ? 'mr-2' : ''} ${isRefreshing ? 'animate-spin' : ''}`}
      />
      {showClearText && (
        isRefreshing ? 'Refreshing...' : 'Refresh Data'
      )}
    </Button>
  );
};

interface ClearSpecificPRButtonProps {
  owner: string;
  repo: string;
  prNumber: string | number;
  onClearComplete?: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
}

export const ClearSpecificPRButton: React.FC<ClearSpecificPRButtonProps> = ({
  owner,
  repo,
  prNumber,
  onClearComplete,
  variant = 'outline',
  size = 'sm',
  className = '',
  disabled = false,
}) => {
  const [isClearing, setIsClearing] = useState(false);

  const handleClearPR = async () => {
    setIsClearing(true);

    try {
      await cacheApi.clearSpecificPRCache(owner, repo, prNumber);

      toast.success(
        `PR cache cleared for ${owner}/${repo}#${prNumber}`,
        {
          duration: 3000,
          icon: '🗑️',
        }
      );

      if (onClearComplete) {
        await onClearComplete();
      }

    } catch (error: unknown) {
      console.error('Error clearing PR cache:', error);
      toast.error(
        (error as ApiError).message || 'Failed to clear PR cache.',
        {
          duration: 4000,
          icon: '❌',
        }
      );
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Button
      onClick={handleClearPR}
      disabled={disabled || isClearing}
      variant={variant}
      size={size}
      className={`${className} ${isClearing ? 'opacity-70' : ''}`}
      
    >
      <Trash2 className={`w-4 h-4 ${isClearing ? 'animate-pulse' : ''}`} />
    </Button>
  );
};

export default RefreshButton;
