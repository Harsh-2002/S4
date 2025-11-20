import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PageTransitionProps {
    children: React.ReactNode;
    direction?: 'slide-left' | 'slide-right' | 'fade';
    duration?: number;
}

const PageTransition: React.FC<PageTransitionProps> = ({
    children,
    direction = 'fade',
    duration = 0.3
}) => {
    const variants = {
        'slide-left': {
            initial: { x: '100%', opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: '-100%', opacity: 0 }
        },
        'slide-right': {
            initial: { x: '-100%', opacity: 0 },
            animate: { x: 0, opacity: 1 },
            exit: { x: '100%', opacity: 0 }
        },
        'fade': {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 }
        }
    };

    return (
        <motion.div
            initial={variants[direction].initial}
            animate={variants[direction].animate}
            exit={variants[direction].exit}
            transition={{ duration, ease: 'easeInOut' }}
            className="w-full h-full"
        >
            {children}
        </motion.div>
    );
};

export default PageTransition;
