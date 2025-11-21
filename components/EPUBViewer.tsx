import React, { useState, useEffect, useRef } from 'react';
import ePub, { Book, Rendition } from 'epubjs';
import { ChevronLeft, ChevronRight, Loader2, Book as BookIcon } from 'lucide-react';

interface EPUBViewerProps {
    url: string;
    fileName: string;
    data?: ArrayBuffer;
}

const EPUBViewer: React.FC<EPUBViewerProps> = ({ url, fileName, data }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentLocation, setCurrentLocation] = useState<string>('');
    const viewerRef = useRef<HTMLDivElement>(null);
    const bookRef = useRef<Book | null>(null);
    const renditionRef = useRef<Rendition | null>(null);

    useEffect(() => {
        if (!viewerRef.current) return;

        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        let cancelled = false;

        const loadBook = async () => {
            try {
                setLoading(true);
                setError(null);

                timeoutId = setTimeout(() => {
                    if (!cancelled) {
                        setError('EPUB loading timeout. The file may be too large or corrupted.');
                        setLoading(false);
                    }
                }, 30000);

                // Create book instance. Use ArrayBuffer when available to avoid refetching signed URLs.
                const book = data ? ePub(data) : ePub(url);
                bookRef.current = book;

                // Set proper book width for readability
                const maxWidth = window.innerWidth > 768 ? 800 : window.innerWidth - 32;
                const containerHeight = viewerRef.current!.clientHeight || 600;
                
                const rendition = book.renderTo(viewerRef.current!, {
                    width: maxWidth,
                    height: containerHeight,
                    spread: 'none',
                    flow: 'paginated',
                });
                renditionRef.current = rendition;

                // Apply reader-friendly styling
                rendition.themes.default({
                    'body': {
                        'color': '#2d2d2d !important',
                        'background': '#fdfdf8 !important',
                        'font-family': 'Georgia, "Times New Roman", serif !important',
                        'font-size': '18px !important',
                        'line-height': '1.6 !important',
                        'padding': '20px !important',
                    },
                    'p': {
                        'margin-bottom': '1em !important',
                        'text-align': 'justify !important',
                    },
                    'h1, h2, h3, h4, h5, h6': {
                        'color': '#1a1a1a !important',
                        'margin-top': '1.5em !important',
                        'margin-bottom': '0.5em !important',
                    },
                    'a': {
                        'color': '#3b82f6 !important',
                    }
                });

                // Dark mode styling
                const isDark = document.documentElement.classList.contains('dark');
                if (isDark) {
                    rendition.themes.default({
                        'body': {
                            'color': '#e4e4e4 !important',
                            'background': '#1a1a1a !important',
                        },
                        'h1, h2, h3, h4, h5, h6': {
                            'color': '#f5f5f5 !important',
                        },
                        'a': {
                            'color': '#60a5fa !important',
                        }
                    });
                }

                // Set up a hook to hide loading only when content is actually rendered
                rendition.hooks.content.register((contents: any) => {
                    // Content is being rendered in the iframe
                    if (timeoutId && !cancelled) {
                        clearTimeout(timeoutId);
                        setLoading(false);
                    }
                });

                // Display from page 2 (skip cover/title page)
                try {
                    const spine = book.spine as any;
                    if (spine && spine.items && spine.items.length > 1) {
                        // Display second item in spine (page 2)
                        await rendition.display(spine.items[1].href);
                    } else {
                        // Fallback to first page if only one page exists
                        await rendition.display();
                    }
                } catch {
                    // Fallback to first page on error
                    await rendition.display();
                }

                rendition.on('relocated', (location: any) => {
                    if (!book.locations) return;
                    const { start } = location;
                    if (start) {
                        try {
                            const currentLoc = book.locations.locationFromCfi(start.cfi);
                            const totalLocs = book.locations.length();
                            if (typeof currentLoc === 'number' && currentLoc > 0 && totalLocs > 0) {
                                setCurrentLocation(`${currentLoc} / ${totalLocs}`);
                            }
                        } catch {
                            /* ignore */
                        }
                    }
                });

                book.locations.generate(1024).catch((err) => {
                    console.warn('Could not generate locations:', err);
                });
            } catch (err: any) {
                if (timeoutId) clearTimeout(timeoutId);
                if (cancelled) return;
                console.error('Error loading EPUB:', err);
                setError(err.message || 'Failed to load EPUB file');
                setLoading(false);
            }
        };

        loadBook();

        // Cleanup
        return () => {
            cancelled = true;
            if (timeoutId) clearTimeout(timeoutId);
            if (renditionRef.current) {
                renditionRef.current.destroy();
            }
            if (bookRef.current) {
                bookRef.current.destroy();
            }
        };
    }, [url, data]);

    const goToPrevPage = () => {
        if (renditionRef.current) {
            renditionRef.current.prev();
        }
    };

    const goToNextPage = () => {
        if (renditionRef.current) {
            renditionRef.current.next();
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-secondary/10">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border shrink-0">
                <div className="flex items-center gap-3">
                    <BookIcon size={18} className="text-primary" />
                    <span className="text-sm font-medium truncate max-w-[200px]" title={fileName}>
                        {fileName}
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevPage}
                        disabled={loading}
                        className="p-2 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    {currentLocation && (
                        <span className="text-xs text-muted-foreground min-w-[60px] text-center">
                            {currentLocation}
                        </span>
                    )}
                    <button
                        onClick={goToNextPage}
                        disabled={loading}
                        className="p-2 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* EPUB Content */}
            <div className="flex-1 relative overflow-hidden bg-[#fdfdf8] dark:bg-[#1a1a1a]">
                {loading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Loader2 className="animate-spin" size={20} />
                            <span className="text-sm">Loading EPUB...</span>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center text-destructive">
                            <p className="font-medium">Failed to load EPUB</p>
                            <p className="text-xs text-muted-foreground mt-1">{error}</p>
                        </div>
                    </div>
                )}

                <div
                    ref={viewerRef}
                    className="w-full h-full flex items-center justify-center"
                    style={{ display: loading || error ? 'none' : 'flex' }}
                />
            </div>
        </div>
    );
};

export default EPUBViewer;
