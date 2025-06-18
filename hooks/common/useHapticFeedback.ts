import { useCallback } from 'react';

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

interface HapticFeedbackHook {
  triggerHaptic: (pattern?: HapticPattern) => void;
  isSupported: boolean;
}

export function useHapticFeedback(): HapticFeedbackHook {
  const isSupported = typeof window !== 'undefined' && 'vibrate' in navigator;

  const triggerHaptic = useCallback((pattern: HapticPattern = 'light') => {
    if (!isSupported) return;

    // Different vibration patterns for different feedback types
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [30],
      success: [10, 10, 10],
      warning: [20, 20],
      error: [30, 10, 30]
    };

    try {
      // Use modern Vibration API if available
      if ('vibrate' in navigator) {
        navigator.vibrate(patterns[pattern]);
      }
    } catch (error) {
      // Silently fail on devices that don't support vibration
      console.debug('Haptic feedback not available:', error);
    }
  }, [isSupported]);

  return {
    triggerHaptic,
    isSupported
  };
} 