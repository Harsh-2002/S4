import React, { useRef, useState } from 'react';

export interface SwipeGestureConfig {
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onSwipeUp?: () => void;
    onSwipeDown?: () => void;
    threshold?: number; // minimum distance in px
    velocityThreshold?: number; // minimum velocity
}

export const useSwipeGesture = (config: SwipeGestureConfig) => {
    const {
        onSwipeLeft,
        onSwipeRight,
        onSwipeUp,
        onSwipeDown,
        threshold = 50,
        velocityThreshold = 0.3
    } = config;

    const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);
    const [isSwiping, setIsSwiping] = useState(false);

    const handleTouchStart = (e: React.TouchEvent) => {
        const touch = e.touches[0];
        touchStart.current = {
            x: touch.clientX,
            y: touch.clientY,
            time: Date.now()
        };
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!touchStart.current) return;

        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;

        // If we've moved enough, we're swiping
        if (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10) {
            setIsSwiping(true);
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (!touchStart.current) return;

        const touch = e.changedTouches[0];
        const deltaX = touch.clientX - touchStart.current.x;
        const deltaY = touch.clientY - touchStart.current.y;
        const deltaTime = Date.now() - touchStart.current.time;

        // Calculate velocity
        const velocityX = Math.abs(deltaX) / deltaTime;
        const velocityY = Math.abs(deltaY) / deltaTime;

        // Determine swipe direction
        const absX = Math.abs(deltaX);
        const absY = Math.abs(deltaY);

        if (absX > absY) {
            // Horizontal swipe
            if (absX > threshold && velocityX > velocityThreshold) {
                if (deltaX > 0 && onSwipeRight) {
                    onSwipeRight();
                } else if (deltaX < 0 && onSwipeLeft) {
                    onSwipeLeft();
                }
            }
        } else {
            // Vertical swipe
            if (absY > threshold && velocityY > velocityThreshold) {
                if (deltaY > 0 && onSwipeDown) {
                    onSwipeDown();
                } else if (deltaY < 0 && onSwipeUp) {
                    onSwipeUp();
                }
            }
        }

        touchStart.current = null;
        setIsSwiping(false);
    };

    return {
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        isSwiping
    };
};
