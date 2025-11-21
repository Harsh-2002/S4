import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface HexViewerProps {
    url: string;
    fileName: string;
}

const HexViewer: React.FC<HexViewerProps> = ({ url, fileName }) => {
    const [data, setData] = useState<Uint8Array | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const MAX_BYTES = 1024 * 1024; // 1MB limit for performance

    useEffect(() => {
        const loadBinary = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch file');
                
                const arrayBuffer = await response.arrayBuffer();
                const bytes = new Uint8Array(arrayBuffer.slice(0, MAX_BYTES));
                setData(bytes);
                setLoading(false);
            } catch (err: any) {
                setError(err.message || 'Failed to load file');
                setLoading(false);
            }
        };

        loadBinary();
    }, [url]);

    const toHex = (byte: number): string => {
        return byte.toString(16).toUpperCase().padStart(2, '0');
    };

    const toASCII = (byte: number): string => {
        return byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full bg-background">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500 dark:text-blue-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center bg-background">
                <AlertCircle className="w-12 h-12 text-destructive mb-2" />
                <p className="text-destructive font-medium">Error loading file</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-muted-foreground">
                Empty file
            </div>
        );
    }

    const BYTES_PER_ROW = 16;
    const rows = Math.ceil(data.length / BYTES_PER_ROW);

    return (
        <div className="w-full h-full overflow-auto bg-background p-4">
            <div className="font-mono text-xs md:text-sm">
                {/* Header */}
                <div className="flex gap-4 pb-2 border-b border-border mb-2 text-muted-foreground font-semibold sticky top-0 bg-background z-10">
                    <div className="w-20 md:w-24">Offset</div>
                    <div className="flex-1 min-w-0">
                        <div className="hidden md:flex gap-2">
                            {Array.from({ length: 16 }).map((_, i) => (
                                <span key={i} className="w-6 text-center">{toHex(i)}</span>
                            ))}
                        </div>
                        <div className="md:hidden">Hex</div>
                    </div>
                    <div className="w-32 md:w-40 hidden sm:block">ASCII</div>
                </div>

                {/* Data rows */}
                {Array.from({ length: rows }).map((_, rowIdx) => {
                    const offset = rowIdx * BYTES_PER_ROW;
                    const rowBytes = data.slice(offset, offset + BYTES_PER_ROW);

                    return (
                        <div key={rowIdx} className="flex gap-4 py-1 hover:bg-secondary/30 transition-colors">
                            {/* Offset */}
                            <div className="w-20 md:w-24 text-blue-500">
                                {offset.toString(16).toUpperCase().padStart(8, '0')}
                            </div>

                            {/* Hex bytes */}
                            <div className="flex-1 min-w-0">
                                <div className="hidden md:flex gap-2 flex-wrap">
                                    {Array.from({ length: BYTES_PER_ROW }).map((_, byteIdx) => {
                                        const byte = rowBytes[byteIdx];
                                        return (
                                            <span
                                                key={byteIdx}
                                                className={`w-6 text-center ${byte !== undefined ? 'text-foreground' : 'text-muted-foreground/30'}`}
                                            >
                                                {byte !== undefined ? toHex(byte) : '  '}
                                            </span>
                                        );
                                    })}
                                </div>
                                {/* Mobile: compact hex view */}
                                <div className="md:hidden text-foreground break-all">
                                    {Array.from(rowBytes).map(toHex).join(' ')}
                                </div>
                            </div>

                            {/* ASCII */}
                            <div className="w-32 md:w-40 text-muted-foreground hidden sm:block">
                                {Array.from(rowBytes).map(toASCII).join('')}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 text-xs text-muted-foreground text-center pb-4">
                Showing {Math.min(data.length, MAX_BYTES).toLocaleString()} bytes
                {data.length >= MAX_BYTES && ' (truncated for performance)'}
            </div>
        </div>
    );
};

export default HexViewer;
