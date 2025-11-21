import React, { useEffect, useRef } from 'react';
import { EditorState, Compartment } from '@codemirror/state';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap, drawSelection, dropCursor, highlightSpecialChars, rectangularSelection } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldKeymap } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap, autocompletion, completionKeymap } from '@codemirror/autocomplete';
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search';
import { oneDark } from '@codemirror/theme-one-dark';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { java } from '@codemirror/lang-java';
import { cpp } from '@codemirror/lang-cpp';
import { yaml } from '@codemirror/lang-yaml';
import { markdown } from '@codemirror/lang-markdown';
import { php } from '@codemirror/lang-php';

interface CodeEditorProps {
    value: string;
    language: string;
    onChange: (value: string) => void;
    fileName: string;
    readOnly?: boolean;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, language, onChange, fileName, readOnly = false }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const viewRef = useRef<EditorView | null>(null);

    const getLanguageExtension = (lang: string) => {
        const langMap: Record<string, any> = {
            'js': javascript({ jsx: false }),
            'jsx': javascript({ jsx: true }),
            'ts': javascript({ jsx: false, typescript: true }),
            'tsx': javascript({ jsx: true, typescript: true }),
            'py': python(),
            'html': html(),
            'css': css(),
            'json': json(),
            'sql': sql(),
            'java': java(),
            'cpp': cpp(),
            'c': cpp(),
            'yaml': yaml(),
            'yml': yaml(),
            'md': markdown(),
            'php': php(),
        };
        return langMap[lang.toLowerCase()] || javascript();
    };

    useEffect(() => {
        if (!editorRef.current) return;

        const languageConf = new Compartment();

        const state = EditorState.create({
            doc: value,
            extensions: [
                // Basic editor setup
                lineNumbers(),
                highlightActiveLineGutter(),
                highlightSpecialChars(),
                history(),
                foldGutter(),
                drawSelection(),
                dropCursor(),
                EditorState.allowMultipleSelections.of(true),
                indentOnInput(),
                syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
                bracketMatching(),
                closeBrackets(),
                autocompletion(),
                rectangularSelection(),
                highlightActiveLine(),
                highlightSelectionMatches(),
                keymap.of([
                    ...closeBracketsKeymap,
                    ...defaultKeymap,
                    ...searchKeymap,
                    ...historyKeymap,
                    ...foldKeymap,
                    ...completionKeymap,
                    indentWithTab,
                ]),
                // Language support
                languageConf.of(getLanguageExtension(language)),
                // Theme
                oneDark,
                // Custom change listener
                EditorView.updateListener.of((update) => {
                    if (update.docChanged) {
                        onChange(update.state.doc.toString());
                    }
                }),
                // Read-only mode
                EditorView.editable.of(!readOnly),
                // Custom styling
                EditorView.theme({
                    '&': {
                        height: '100%',
                        fontSize: '14px',
                    },
                    '.cm-scroller': {
                        fontFamily: '"Fira Code", "Monaco", "Courier New", monospace',
                        lineHeight: '1.5',
                    },
                    '.cm-gutters': {
                        backgroundColor: '#1e1e1e',
                        color: '#858585',
                        border: 'none',
                    },
                    '.cm-activeLineGutter': {
                        backgroundColor: '#2d2d2d',
                    },
                    '.cm-activeLine': {
                        backgroundColor: '#2d2d2d33',
                    },
                }),
            ],
        });

        const view = new EditorView({
            state,
            parent: editorRef.current,
        });

        viewRef.current = view;

        return () => {
            view.destroy();
        };
    }, [language]); // Only recreate when language changes

    // Update content when value changes externally
    useEffect(() => {
        if (viewRef.current && viewRef.current.state.doc.toString() !== value) {
            viewRef.current.dispatch({
                changes: {
                    from: 0,
                    to: viewRef.current.state.doc.length,
                    insert: value,
                },
            });
        }
    }, [value]);

    return (
        <div className="w-full h-full flex flex-col bg-[#1e1e1e]">
            <div className="bg-[#1e1e1e] border-b border-[#3e3e3e] px-4 py-2 flex items-center justify-between shrink-0">
                <span className="text-xs text-gray-400 font-mono">{fileName}</span>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 font-mono uppercase">{language}</span>
                    {readOnly && <span className="text-xs text-blue-400 font-semibold">READ-ONLY</span>}
                    {!readOnly && <span className="text-xs text-green-400 font-semibold">EDITING</span>}
                </div>
            </div>
            <div ref={editorRef} className="flex-1 overflow-auto" />
        </div>
    );
};

export default CodeEditor;
