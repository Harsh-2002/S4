import { useRef, useState } from 'react';

export interface EdgeSwipeConfig {
    onSwipeComplete: () => void;
    threshold?: number; // distance to trigger action (px)
    edgeZone?: number; // width of edge detection zone (px)
    enabled?: boolean;
}

export const useEdgeSwipe = (config: EdgeSwipeConfig) => {
    const {
        onSwipeComplete,
        threshold = 100,
        edgeZone = 50,
        enabled = true
    } = config;

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const [swipeProgress, setSwipeProgress] = useState(0);
    const [isEdgeSwipe, setIsEdgeSwipe] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (!enabled) return;

        const touch = e.touches[0];

        // Check if touch started in edge zone (left edge)
        if (touch.clientX <= edgeZone) {
            setIsEdgeSwipe(true);
            touchStart.current = {
                x: touch.clientX,
                y: touch.clientY,
                time: Date.now()
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!enabled || !isEdgeSwipe || !touchStart.current) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = Math.abs(touch.clientY - touchStart.current.y);

        // Only track horizontal swipes from left edge
        if (deltaX > 0 && deltaY < 50) {
            const progress = Math.min(deltaX / threshold, 1);
            setSwipeProgress(progress);

            // Prevent default if we're actively swiping
            if (deltaX > 10) {
                e.preventDefault();
            }
        } else if (deltaY > 50) {
            // Reset if vertical movement is too much
            setIsEdgeSwipe(false);
            setSwipeProgress(0);
            touchStart.current = null;
        }
    };

    const handleTouchEnd = () => {
        if (!enabled || !isEdgeSwipe) return;

        if (swipeProgress >= 1) {
            // Trigger action
            onSwipeComplete();

            // Haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }

        // Reset
        setIsEdgeSwipe(false);
        setSwipeProgress(0);
        touchStart.current = null;
    };

    return {
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        swipeProgress,
        isEdgeSwipe
    };
};
