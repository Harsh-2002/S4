import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { X } from 'lucide-react';

export interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    height?: 'auto' | 'half' | 'full';
    showDragHandle?: boolean;
    closeOnBackdropClick?: boolean;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
    isOpen,
    onClose,
    children,
    title,
    height = 'auto',
    showDragHandle = true,
    closeOnBackdropClick = true
}) => {
    const sheetRef = useRef<HTMLDivElement>(null);

    // Prevent body scroll when sheet is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        // Close if dragged down more than 100px or with high velocity
        if (info.offset.y > 100 || info.velocity.y > 500) {
            onClose();
            // Haptic feedback
            if ('vibrate' in navigator) {
                navigator.vibrate(30);
            }
        }
    };

    const getHeightClass = () => {
        switch (height) {
            case 'half':
                return 'max-h-[50vh]';
            case 'full':
                return 'h-[calc(100vh-env(safe-area-inset-top)-2rem)]';
            default:
                return 'max-h-[85vh]';
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        onClick={closeOnBackdropClick ? onClose : undefined}
                    />

                    {/* Bottom Sheet */}
                    <motion.div
                        ref={sheetRef}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: 'spring',
                            damping: 30,
                            stiffness: 300
                        }}
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={{ top: 0, bottom: 0.5 }}
                        onDragEnd={handleDragEnd}
                        className={`fixed left-0 right-0 bottom-0 bg-background rounded-t-3xl shadow-2xl z-50 flex flex-col ${getHeightClass()}`}
                        style={{
                            paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))'
                        }}
                    >
                        {/* Drag Handle */}
                        {showDragHandle && (
                            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
                                <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full" />
                            </div>
                        )}

                        {/* Header */}
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                                <h2 className="text-lg font-semibold">{title}</h2>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default BottomSheet;
