import { useCallback, useRef, useState, useEffect } from 'react';

interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  pullThreshold?: number;
  refreshThreshold?: number;
  disabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
  canRefresh: boolean;
}

export function usePullToRefresh(config: PullToRefreshConfig) {
  const {
    onRefresh,
    pullThreshold = 60,
    refreshThreshold = 80,
    disabled = false
  } = config;

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false,
    canRefresh: false
  });

  const touchStartRef = useRef<{ y: number; scrollTop: number } | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (disabled || !elementRef.current) return;

    const touch = e.touches[0];
    const scrollTop = elementRef.current.scrollTop;

    // Only allow pull-to-refresh when at the top of the scrollable area
    if (scrollTop <= 0) {
      touchStartRef.current = {
        y: touch.clientY,
        scrollTop
      };
    }
  }, [disabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (disabled || !touchStartRef.current || !elementRef.current) return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartRef.current.y;
    const scrollTop = elementRef.current.scrollTop;

    // Only process if we're still at the top and pulling down
    if (scrollTop <= 0 && deltaY > 0) {
      e.preventDefault(); // Prevent native pull-to-refresh

      const pullDistance = Math.min(deltaY * 0.4, refreshThreshold + 20); // Damping effect
      const canRefresh = pullDistance >= refreshThreshold;

      setState(prev => ({
        ...prev,
        isPulling: true,
        pullDistance,
        canRefresh
      }));
    }
  }, [disabled, refreshThreshold]);

  const handleTouchEnd = useCallback(async () => {
    if (disabled || !touchStartRef.current) return;

    const { canRefresh } = state;

    if (canRefresh && !state.isRefreshing) {
      setState(prev => ({ ...prev, isRefreshing: true }));
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull-to-refresh failed:', error);
      } finally {
        setState(prev => ({
          ...prev,
          isRefreshing: false,
          isPulling: false,
          pullDistance: 0,
          canRefresh: false
        }));
      }
    } else {
      setState(prev => ({
        ...prev,
        isPulling: false,
        pullDistance: 0,
        canRefresh: false
      }));
    }

    touchStartRef.current = null;
  }, [disabled, state.canRefresh, state.isRefreshing, onRefresh]);

  const attachPullToRefreshListeners = useCallback((element: HTMLElement | null) => {
    elementRef.current = element;
    
    if (!element) return () => {};

    element.addEventListener('touchstart', handleTouchStart, { passive: false });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    ...state,
    attachPullToRefreshListeners,
    pullThreshold,
    refreshThreshold
  };
} 