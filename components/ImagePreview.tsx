import React, { useRef } from 'react';
import { usePinchZoom } from '../hooks/usePinchZoom';
import { useSwipeGesture } from '../hooks/useSwipeGesture';

interface ImagePreviewProps {
    src: string;
    alt: string;
    onSwipeLeft?: () => void;
    onSwipeRight?: () => void;
    onClose?: () => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ src, alt, onSwipeLeft, onSwipeRight, onClose }) => {
    const { zoom, handlers: pinchHandlers, style: pinchStyle, resetZoom, zoomTo } = usePinchZoom({
        minZoom: 1,
        maxZoom: 4
    });

    const { handlers: swipeHandlers } = useSwipeGesture({
        onSwipeLeft: () => {
            if (zoom === 1 && onSwipeLeft) onSwipeLeft();
        },
        onSwipeRight: () => {
            if (zoom === 1 && onSwipeRight) onSwipeRight();
        },
        onSwipeUp: () => {
            if (zoom === 1 && onClose) onClose();
        },
        onSwipeDown: () => {
            if (zoom === 1 && onClose) onClose();
        }
    });

    const lastTap = useRef<number>(0);

    const handleDoubleTap = (e: React.TouchEvent | React.MouseEvent) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
            // Double tap
            if (zoom > 1) {
                resetZoom();
            } else {
                zoomTo(2.5);
            }
        }
        lastTap.current = now;
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        pinchHandlers.onTouchStart(e);
        swipeHandlers.onTouchStart(e);
        handleDoubleTap(e);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        pinchHandlers.onTouchMove(e);
        swipeHandlers.onTouchMove(e);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        pinchHandlers.onTouchEnd();
        swipeHandlers.onTouchEnd(e);
    };

    return (
        <div
            className="w-full h-full flex items-center justify-center overflow-hidden touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <img
                src={src}
                alt={alt}
                className="max-w-full max-h-full object-contain"
                style={{
                    ...pinchStyle,
                    willChange: 'transform'
                }}
                draggable={false}
            />
        </div>
    );
};

export default ImagePreview;
