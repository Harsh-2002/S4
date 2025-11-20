import { useState, useRef, useEffect } from 'react';

export interface PinchZoomConfig {
    minZoom?: number;
    maxZoom?: number;
    initialZoom?: number;
    onZoomChange?: (zoom: number) => void;
}

export const usePinchZoom = (config: PinchZoomConfig = {}) => {
    const {
        minZoom = 1,
        maxZoom = 5,
        initialZoom = 1,
        onZoomChange
    } = config;

    const [zoom, setZoom] = useState(initialZoom);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const lastDistance = useRef<number>(0);
    const lastPan = useRef({ x: 0, y: 0 });

    const getDistance = (touch1: React.Touch, touch2: React.Touch) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const getCenter = (touch1: React.Touch, touch2: React.Touch) => {
        return {
            x: (touch1.clientX + touch2.clientX) / 2,
            y: (touch1.clientY + touch2.clientY) / 2
        };
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            lastDistance.current = getDistance(e.touches[0], e.touches[1]);
        } else if (e.touches.length === 1 && zoom > 1) {
            // Panning when zoomed
            lastPan.current = {
                x: e.touches[0].clientX - pan.x,
                y: e.touches[0].clientY - pan.y
            };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const distance = getDistance(e.touches[0], e.touches[1]);

            if (lastDistance.current > 0) {
                const scale = distance / lastDistance.current;
                const newZoom = Math.min(Math.max(zoom * scale, minZoom), maxZoom);
                setZoom(newZoom);
                onZoomChange?.(newZoom);
            }

            lastDistance.current = distance;
        } else if (e.touches.length === 1 && zoom > 1) {
            // Panning
            const newPan = {
                x: e.touches[0].clientX - lastPan.current.x,
                y: e.touches[0].clientY - lastPan.current.y
            };
            setPan(newPan);
        }
    };

    const handleTouchEnd = () => {
        lastDistance.current = 0;
    };

    const resetZoom = () => {
        setZoom(initialZoom);
        setPan({ x: 0, y: 0 });
        onZoomChange?.(initialZoom);
    };

    const zoomTo = (newZoom: number, center?: { x: number; y: number }) => {
        const clampedZoom = Math.min(Math.max(newZoom, minZoom), maxZoom);
        setZoom(clampedZoom);
        onZoomChange?.(clampedZoom);

        if (center && clampedZoom > 1) {
            // TODO: Pan to center point
        }
    };

    return {
        zoom,
        pan,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        resetZoom,
        zoomTo,
        style: {
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
            transition: 'transform 0.1s ease-out'
        }
    };
};
