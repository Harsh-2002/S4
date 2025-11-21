import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';

// Set worker from CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
    url: string;
    fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ url, fileName }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [scale, setScale] = useState<number>(1.0);
    const [loading, setLoading] = useState(true);

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages(numPages);
        setLoading(false);
    };

    const goToPrevPage = () => {
        setPageNumber(prev => Math.max(1, prev - 1));
    };

    const goToNextPage = () => {
        setPageNumber(prev => Math.min(numPages, prev + 1));
    };

    const zoomIn = () => {
        setScale(prev => Math.min(3, prev + 0.2));
    };

    const zoomOut = () => {
        setScale(prev => Math.max(0.5, prev - 0.2));
    };

    return (
        <div className="w-full h-full flex flex-col bg-secondary/10">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-4 py-3 bg-background border-b border-border shrink-0">
                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPrevPage}
                        disabled={pageNumber <= 1}
                        className="p-2 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-medium min-w-[80px] text-center">
                        {pageNumber} / {numPages || '?'}
                    </span>
                    <button
                        onClick={goToNextPage}
                        disabled={pageNumber >= numPages}
                        className="p-2 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={zoomOut}
                        className="p-2 rounded-md hover:bg-secondary transition-colors"
                        title="Zoom out"
                    >
                        <ZoomOut size={18} />
                    </button>
                    <span className="text-xs font-mono text-muted-foreground min-w-[45px] text-center">
                        {Math.round(scale * 100)}%
                    </span>
                    <button
                        onClick={zoomIn}
                        className="p-2 rounded-md hover:bg-secondary transition-colors"
                        title="Zoom in"
                    >
                        <ZoomIn size={18} />
                    </button>
                </div>
            </div>

            {/* PDF Content */}
            <div className="flex-1 overflow-auto flex items-start justify-center p-4">
                {loading && (
                    <div className="flex items-center gap-2 text-muted-foreground mt-8">
                        <Loader2 className="animate-spin" size={20} />
                        <span className="text-sm">Loading PDF...</span>
                    </div>
                )}
                <Document
                    file={url}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading=""
                    error={
                        <div className="text-center text-destructive mt-8">
                            <p className="font-medium">Failed to load PDF</p>
                            <p className="text-xs text-muted-foreground mt-1">{fileName}</p>
                        </div>
                    }
                    className="shadow-2xl"
                >
                    <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        className="shadow-lg"
                    />
                </Document>
            </div>
        </div>
    );
};

export default PDFViewer;
