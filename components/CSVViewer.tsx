import React, { useState, useEffect, useRef, useMemo } from 'react';
import Papa from 'papaparse';
import { Loader2, AlertCircle } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface CSVViewerProps {
    url: string;
    fileName: string;
}

const CSVViewer: React.FC<CSVViewerProps> = ({ url, fileName }) => {
    const [data, setData] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const parentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        let isMounted = true;
        let headerCaptured = false;
        let firstChunkRendered = false;

        setLoading(true);
        setError(null);
        setData([]);
        setHeaders([]);

        const loadData = async () => {
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);
                const text = await response.text();

                if (!isMounted) return;

                Papa.parse(text, {
                    worker: true,
                    skipEmptyLines: true,
                    chunk: (results) => {
                        if (!isMounted) return;
                        const rows = results.data as string[][];
                        if (!rows.length) return;

                        let rowsToAppend = rows;
                        if (!headerCaptured) {
                            setHeaders(rows[0] || []);
                            headerCaptured = true;
                            rowsToAppend = rows.slice(1);
                        }

                        if (rowsToAppend.length) {
                            setData(prev => [...prev, ...rowsToAppend]);
                        }

                        if (!firstChunkRendered && (rowsToAppend.length > 0 || headerCaptured)) {
                            setLoading(false);
                            firstChunkRendered = true;
                        }
                    },
                    complete: () => {
                        if (!isMounted) return;
                        setLoading(false);
                    },
                    error: (err) => {
                        if (!isMounted) return;
                        setError(err.message);
                        setLoading(false);
                    }
                });
            } catch (err: any) {
                if (!isMounted) return;
                setError(err.message || 'Failed to load CSV');
                setLoading(false);
            }
        };

        loadData();

        return () => {
            isMounted = false;
        };
    }, [url]);

    const rowVirtualizer = useVirtualizer({
        count: data.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 40,
        overscan: 10,
    });

    // Dynamic grid columns based on header count
    // First column (index) is fixed 60px, others are minmax(150px, 1fr)
    const gridTemplateColumns = useMemo(() => {
        if (headers.length === 0) return '60px 1fr';
        return `60px repeat(${headers.length}, minmax(150px, 1fr))`;
    }, [headers.length]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-background gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-muted-foreground animate-pulse">Processing CSV data...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-background">
                <AlertCircle className="w-12 h-12 text-destructive mb-2" />
                <p className="text-destructive font-medium">Error loading CSV</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Empty CSV file
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full w-full bg-background">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-secondary/20 text-xs text-muted-foreground shrink-0">
                <span className="font-medium text-foreground">{fileName}</span>
                <span>{data.length.toLocaleString()} rows • {headers.length} columns</span>
            </div>

            <div 
                ref={parentRef} 
                className="flex-1 overflow-auto relative"
            >
                {/* Sticky Header */}
                <div 
                    className="sticky top-0 z-10 grid bg-secondary border-b border-border shadow-sm"
                    style={{ 
                        gridTemplateColumns,
                        minWidth: 'max-content',
                        width: 'max-content'
                    }}
                >
                    <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-r border-border bg-secondary flex items-center justify-center sticky left-0 z-20">
                        #
                    </div>
                    {headers.map((header, idx) => (
                        <div
                            key={idx}
                            className="px-4 py-2 text-xs font-semibold text-muted-foreground whitespace-nowrap border-r border-border last:border-r-0 overflow-hidden text-ellipsis"
                            title={header}
                        >
                            {header || `Column ${idx + 1}`}
                        </div>
                    ))}
                </div>

                {/* Virtualized Rows */}
                <div
                    style={{
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        width: 'max-content',
                        minWidth: 'max-content',
                        position: 'relative',
                    }}
                >
                    {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                        const row = data[virtualRow.index];
                        return (
                            <div
                                key={virtualRow.index}
                                className="absolute top-0 left-0 grid w-full hover:bg-secondary/30 transition-colors border-b border-border/50"
                                style={{
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    gridTemplateColumns,
                                }}
                            >
                                <div className="px-3 py-2 text-xs text-muted-foreground font-mono border-r border-border bg-secondary/10 flex items-center justify-end sticky left-0 z-10">
                                    {virtualRow.index + 1}
                                </div>
                                {row.map((cell, cellIdx) => (
                                    <div
                                        key={cellIdx}
                                        className="px-4 py-2 text-sm text-foreground whitespace-nowrap border-r border-border/50 last:border-r-0 overflow-hidden text-ellipsis flex items-center"
                                        title={cell}
                                    >
                                        {cell}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CSVViewer;
