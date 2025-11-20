import React, { useRef, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface SwipeAction {
    id: string;
    icon: LucideIcon;
    label: string;
    color: 'red' | 'blue' | 'green' | 'yellow';
}

export interface SwipeableListItemProps {
    children: React.ReactNode;
    onSwipeLeft?: (actionId: string) => void;
    onSwipeRight?: () => void;
    actions?: SwipeAction[];
    disabled?: boolean;
}

const colorMap = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500'
};

export const SwipeableListItem: React.FC<SwipeableListItemProps> = ({
    children,
    onSwipeLeft,
    onSwipeRight,
    actions = [],
    disabled = false
}) => {
    const [swipeX, setSwipeX] = useState(0);
    const [isRevealed, setIsRevealed] = useState(false);
    const actionWidth = 80; // Width of each action button
    const swipeThreshold = 60; // Minimum swipe distance to trigger
    const selectThreshold = 80; // Threshold for right swipe

    const handleDrag = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        setSwipeX(info.offset.x);
    };

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const velocity = info.velocity.x;
        const offset = info.offset.x;

        // Swipe left to reveal actions
        if (offset < -swipeThreshold || velocity < -500) {
            setIsRevealed(true);
            setSwipeX(-(actions.length * actionWidth));

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        }
        // Swipe right to select
        else if (offset > selectThreshold || velocity > 500) {
            onSwipeRight?.();
            setSwipeX(0);
            setIsRevealed(false);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        }
        // Reset
        else {
            setSwipeX(0);
            setIsRevealed(false);
        }
    };

    const handleActionClick = (actionId: string) => {
        onSwipeLeft?.(actionId);
        setSwipeX(0);
        setIsRevealed(false);

        // Stronger haptic for action
        if ('vibrate' in navigator) {
            navigator.vibrate(50);
        }
    };

    if (disabled) {
        return <>{children}</>;
    }

    return (
        <div className="relative overflow-hidden">
            {/* Actions Background (Left Swipe) */}
            {actions.length > 0 && (
                <div className="absolute right-0 top-0 bottom-0 flex">
                    {actions.map((action) => {
                        const Icon = action.icon;
                        return (
                            <button
                                key={action.id}
                                onClick={() => handleActionClick(action.id)}
                                className={`${colorMap[action.color]} text-white flex items-center justify-center transition-all`}
                                style={{ width: `${actionWidth}px` }}
                                title={action.label}
                            >
                                <div className="flex flex-col items-center gap-1">
                                    <Icon size={20} />
                                    <span className="text-xs font-medium">{action.label}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Select Indicator Background (Right Swipe) */}
            {onSwipeRight && swipeX > 0 && (
                <div
                    className="absolute left-0 top-0 bottom-0 bg-blue-500 flex items-center justify-start px-4 transition-all"
                    style={{ width: `${Math.min(swipeX, 100)}px`, opacity: Math.min(swipeX / selectThreshold, 1) }}
                >
                    <div className="w-6 h-6 rounded border-2 border-white flex items-center justify-center">
                        {swipeX > selectThreshold && (
                            <svg className="w-4 h-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                </div>
            )}

            {/* Swipeable Content */}
            <motion.div
                drag="x"
                dragConstraints={{ left: -(actions.length * actionWidth), right: onSwipeRight ? 150 : 0 }}
                dragElastic={{ left: 0.1, right: 0.3 }}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                animate={{ x: swipeX }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="relative bg-background"
            >
                {children}
            </motion.div>
        </div>
    );
};

export default SwipeableListItem;
