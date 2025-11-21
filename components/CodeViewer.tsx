import React, { useEffect, useRef } from 'react';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
// Import common language support
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';

interface CodeViewerProps {
    code: string;
    language: string;
    fileName: string;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ code, language, fileName }) => {
    const codeRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (codeRef.current) {
            Prism.highlightElement(codeRef.current);
        }
    }, [code, language]);

    // Map file extensions to Prism language names
    const getLanguage = (lang: string): string => {
        const langMap: Record<string, string> = {
            'js': 'javascript',
            'jsx': 'jsx',
            'ts': 'typescript',
            'tsx': 'tsx',
            'py': 'python',
            'json': 'json',
            'html': 'markup',
            'xml': 'markup',
            'css': 'css',
            'scss': 'scss',
            'sass': 'sass',
            'java': 'java',
            'cpp': 'cpp',
            'c': 'c',
            'sh': 'bash',
            'bash': 'bash',
            'sql': 'sql',
            'yaml': 'yaml',
            'yml': 'yaml',
            'md': 'markdown',
            'go': 'go',
            'rust': 'rust',
            'php': 'php',
            'rb': 'ruby',
            'swift': 'swift',
            'kt': 'kotlin',
        };
        return langMap[lang.toLowerCase()] || 'javascript';
    };

    const prismLanguage = getLanguage(language);

    return (
        <div className="w-full h-full bg-[#2d2d2d] overflow-auto">
            <div className="sticky top-0 bg-[#1e1e1e] border-b border-[#3e3e3e] px-4 py-2 flex items-center justify-between z-10">
                <span className="text-xs text-gray-400 font-mono">{fileName}</span>
                <span className="text-xs text-gray-500 font-mono uppercase">{prismLanguage}</span>
            </div>
            <pre className="!m-0 !bg-transparent">
                <code 
                    ref={codeRef}
                    className={`language-${prismLanguage} !text-sm`}
                >
                    {code}
                </code>
            </pre>
        </div>
    );
};

export default CodeViewer;
