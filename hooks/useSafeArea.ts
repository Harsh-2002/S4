import { useState, useEffect } from 'react';

interface SafeAreaInsets {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export const useSafeArea = (): SafeAreaInsets => {
    const [insets, setInsets] = useState<SafeAreaInsets>({
        top: 0,
        bottom: 0,
        left: 0,
        right: 0
    });

    useEffect(() => {
        const updateInsets = () => {
            // Get CSS environment variables
            const computedStyle = getComputedStyle(document.documentElement);

            setInsets({
                top: parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0'),
                bottom: parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0'),
                left: parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0'),
                right: parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0')
            });
        };

        // Initial read
        updateInsets();

        // Update on orientation change
        window.addEventListener('orientationchange', updateInsets);
        window.addEventListener('resize', updateInsets);

        return () => {
            window.removeEventListener('orientationchange', updateInsets);
            window.removeEventListener('resize', updateInsets);
        };
    }, []);

    return insets;
};

export default useSafeArea;
