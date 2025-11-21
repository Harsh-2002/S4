import React, { useState, useEffect, useRef } from 'react';
import { renderAsync } from 'docx-preview';
import { Loader2, AlertCircle } from 'lucide-react';

interface DocxPreviewProps {
  url: string;
  fileName: string;
}

const DocxPreview: React.FC<DocxPreviewProps> = ({ url, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadDocx = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch document');

        const arrayBuffer = await response.arrayBuffer();

        if (containerRef.current) {
          // Clear previous content
          containerRef.current.innerHTML = '';
          
          await renderAsync(arrayBuffer, containerRef.current, undefined, {
            className: 'docx-wrapper',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: true,
            experimental: false,
            trimXmlDeclaration: true,
            useBase64URL: true,
          });
        }

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load DOCX file');
        setLoading(false);
      }
    };

    loadDocx();
  }, [url]);

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
        <p className="text-destructive font-medium">Error loading document</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full overflow-auto p-4 md:p-8 bg-background">
      <style>{`
        .docx-wrapper {
          background: var(--background);
          color: var(--foreground);
          max-width: 850px;
          margin: 0 auto;
        }
        .docx-wrapper section.docx {
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          margin-bottom: 1.5rem;
          padding: 2rem;
          box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
        }
        .docx-wrapper p {
          margin: 0.5rem 0;
          color: var(--foreground);
        }
        .docx-wrapper table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        .docx-wrapper table td,
        .docx-wrapper table th {
          border: 1px solid var(--border);
          padding: 0.5rem;
        }
        .docx-wrapper img {
          max-width: 100%;
          height: auto;
        }
        .docx-wrapper h1, .docx-wrapper h2, .docx-wrapper h3,
        .docx-wrapper h4, .docx-wrapper h5, .docx-wrapper h6 {
          margin: 1rem 0 0.5rem 0;
          color: var(--foreground);
        }
      `}</style>
      <div
        ref={containerRef}
        className="docx-container"
      />
    </div>
  );
};

export default DocxPreview;
