import React, { useState, useRef, useCallback } from 'react';
import { FileObject } from '../types';

interface LongPressDragConfig {
    onDragStart?: (file: FileObject) => void;
    onDragEnd?: (file: FileObject, targetFolder: FileObject | null) => void;
    longPressDelay?: number;
}

interface DragState {
    isDragging: boolean;
    draggedFile: FileObject | null;
    dragPosition: { x: number; y: number };
    dropTarget: FileObject | null;
}

export const useLongPressDrag = (config: LongPressDragConfig = {}) => {
    const { onDragStart, onDragEnd, longPressDelay = 500 } = config;

    const [dragState, setDragState] = useState<DragState>({
        isDragging: false,
        draggedFile: null,
        dragPosition: { x: 0, y: 0 },
        dropTarget: null
    });

    const longPressTimer = useRef<NodeJS.Timeout | null>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const hasMoved = useRef(false);

    const handleTouchStart = useCallback((e: React.TouchEvent, file: FileObject) => {
        const touch = e.touches[0];
        touchStartPos.current = { x: touch.clientX, y: touch.clientY };
        hasMoved.current = false;

        // Start long-press timer
        longPressTimer.current = setTimeout(() => {
            // Trigger drag start
            setDragState({
                isDragging: true,
                draggedFile: file,
                dragPosition: { x: touch.clientX, y: touch.clientY },
                dropTarget: null
            });

            onDragStart?.(file);

            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate([50, 30, 50]); // Pattern: vibrate-pause-vibrate
            }
        }, longPressDelay);
    }, [onDragStart, longPressDelay]);

    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!touchStartPos.current) return;

        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPos.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPos.current.y);

        // Cancel long-press if moved too much before timer completes
        if (!dragState.isDragging && (deltaX > 10 || deltaY > 10)) {
            if (longPressTimer.current) {
                clearTimeout(longPressTimer.current);
                longPressTimer.current = null;
            }
            hasMoved.current = true;
        }

        // Update drag position if dragging
        if (dragState.isDragging) {
            e.preventDefault();
            setDragState(prev => ({
                ...prev,
                dragPosition: { x: touch.clientX, y: touch.clientY }
            }));
        }
    }, [dragState.isDragging]);

    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
        // Clear timer
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }

        // If dragging, handle drop
        if (dragState.isDragging && dragState.draggedFile) {
            onDragEnd?.(dragState.draggedFile, dragState.dropTarget);

            // Haptic feedback on drop
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        }

        // Reset state
        setDragState({
            isDragging: false,
            draggedFile: null,
            dragPosition: { x: 0, y: 0 },
            dropTarget: null
        });
        touchStartPos.current = null;
        hasMoved.current = false;
    }, [dragState, onDragEnd]);

    const setDropTarget = useCallback((folder: FileObject | null) => {
        setDragState(prev => ({ ...prev, dropTarget: folder }));
    }, []);

    return {
        dragState,
        handlers: {
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd
        },
        setDropTarget
    };
};

export default useLongPressDrag;
