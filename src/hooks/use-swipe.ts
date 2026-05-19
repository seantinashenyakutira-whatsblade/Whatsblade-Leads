'use client';

import { useState, useCallback, useRef } from 'react';
import { useDrag } from '@use-gesture/react';

interface SwipeState {
  direction: 'left' | 'right' | null;
  progress: number;
}

interface UseSwipeOptions {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export function useSwipe({
  onSwipeRight,
  onSwipeLeft,
  threshold = 100,
  disabled = false,
}: UseSwipeOptions = {}) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    direction: null,
    progress: 0,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bind = useDrag(
    ({ down, movement: [mx], direction: [dx], distance: [, d], cancel }) => {
      if (disabled) return;

      if (d > threshold) {
        if ((dx as number) > 0) {
          onSwipeRight?.();
        } else {
          onSwipeLeft?.();
        }
        cancel();
        return;
      }

      if (down && Math.abs(mx) > 10) {
        const direction: 'left' | 'right' = mx > 0 ? 'right' : 'left';
        const progress = Math.min(Math.abs(mx) / threshold, 1);

        setSwipeState({ direction, progress });

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          setSwipeState({ direction: null, progress: 0 });
        }, 150);
      }

      if (!down) {
        setSwipeState({ direction: null, progress: 0 });
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      preventScroll: false,
      rubberband: true,
    }
  );

  const resetSwipe = useCallback(() => {
    setSwipeState({ direction: null, progress: 0 });
  }, []);

  return { bind, swipeState, resetSwipe };
}
