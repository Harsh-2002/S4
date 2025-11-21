import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Loader2, AlertCircle } from 'lucide-react';

interface XlsxPreviewProps {
  url: string;
  fileName: string;
}

const XlsxPreview: React.FC<XlsxPreviewProps> = ({ url, fileName }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheets, setSheets] = useState<{ name: string; data: any[][] }[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);

  useEffect(() => {
    const loadXlsx = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch spreadsheet');

        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        const sheetData = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          return { name: sheetName, data: data as any[][] };
        });

        setSheets(sheetData);
        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load XLSX file');
        setLoading(false);
      }
    };

    loadXlsx();
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
        <p className="text-destructive font-medium">Error loading spreadsheet</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  const currentSheet = sheets[activeSheet];
  if (!currentSheet || currentSheet.data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground bg-background">
        Empty spreadsheet
      </div>
    );
  }

  // Get max columns across all rows
  const maxCols = Math.max(...currentSheet.data.map(row => row.length));
  
  // Column headers (A, B, C, ...)
  const columnHeaders = Array.from({ length: maxCols }, (_, i) => {
    let col = '';
    let num = i;
    while (num >= 0) {
      col = String.fromCharCode(65 + (num % 26)) + col;
      num = Math.floor(num / 26) - 1;
    }
    return col;
  });

  return (
    <div className="h-full w-full flex flex-col bg-background">
      {/* Sheet Tabs */}
      {sheets.length > 1 && (
        <div className="flex gap-2 px-4 py-2 border-b border-border overflow-x-auto bg-background">
          {sheets.map((sheet, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSheet(idx)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                idx === activeSheet
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
              }`}
            >
              {sheet.name}
            </button>
          ))}
        </div>
      )}

      {/* Header with file info */}
      <div className="px-4 py-2 border-b border-border bg-background">
        <h3 className="text-sm font-semibold text-foreground">{fileName}</h3>
        <p className="text-xs text-muted-foreground">
          {currentSheet.data.length} rows × {maxCols} columns
          {currentSheet.data.length > 1000 && ' (showing first 1000 rows)'}
        </p>
      </div>

      {/* Spreadsheet View */}
      <div className="flex-1 overflow-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead className="bg-secondary sticky top-0 z-10">
              <tr>
                {/* Row number header */}
                <th className="sticky left-0 z-20 px-3 py-2 text-xs font-semibold text-muted-foreground bg-secondary border-r border-b border-border min-w-[3rem] text-center">
                  #
                </th>
                {/* Column headers */}
                {columnHeaders.map((header, idx) => (
                  <th
                    key={idx}
                    className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b border-border min-w-[120px] text-left whitespace-nowrap"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-background">
              {currentSheet.data.slice(0, 1000).map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-secondary/30 transition-colors">
                  {/* Row number */}
                  <td className="sticky left-0 z-10 px-3 py-2 text-xs text-muted-foreground bg-secondary/50 border-r border-b border-border text-center font-mono">
                    {rowIdx + 1}
                  </td>
                  {/* Cells */}
                  {Array.from({ length: maxCols }, (_, cellIdx) => {
                    const cell = row[cellIdx];
                    return (
                      <td
                        key={cellIdx}
                        className="px-3 py-2 text-sm text-foreground border-b border-border whitespace-nowrap overflow-hidden text-ellipsis max-w-xs"
                        title={cell != null ? String(cell) : ''}
                      >
                        {cell ?? ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default XlsxPreview;
