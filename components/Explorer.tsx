
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Folder, FileText, Image as ImageIcon, Music, Video, Code, Archive,
    MoreVertical, Download, Trash2, Share2, ChevronRight, Home,
    ArrowLeft, Search, X, Upload, Check, Loader2, Copy,
    ChevronLeft, ChevronRight as ChevronRightIcon, Edit2, Save,
    Database, FilePlus, Move, CheckSquare, Link, Eye,
    Film, Package, FileCode, File as FileIcon, RefreshCw, List, Grid,
    AlertTriangle, AlertCircle, PenTool, BookOpen, MousePointer2, CheckCircle2,
    ShieldAlert, Lock, FolderInput, TerminalSquare, HardDrive, UploadCloud,
    FileJson, FileSpreadsheet, Terminal, Binary
} from 'lucide-react';
import { S3Service, formatBytes } from '../services/s3Service';
import { FileObject, BucketObject, ViewMode } from '../types';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import BottomSheet from './BottomSheet';
import SwipeableListItem from './SwipeableListItem';
import ImagePreview from './ImagePreview';
import { useIsMobile } from '../hooks/useIsMobile';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { usePinchZoom } from '../hooks/usePinchZoom';
import { useEdgeSwipe } from '../hooks/useEdgeSwipe';
import { useSafeArea } from '../hooks/useSafeArea';
import { useDebounce } from '../hooks/useDebounce';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useLongPressDrag } from '../hooks/useLongPressDrag';

interface ExplorerProps {
    s3: S3Service;
    bucketName: string;
    onUpload: (file: File, prefix: string, onComplete: () => void) => void;
    onBackToBuckets?: () => void;
    readOnly?: boolean;
}

// Helper to extract clean error messages from AWS SDK objects
const getAwsErrorMessage = (err: any) => {
    if (!err) {
        return {
            title: "Unknown Error",
            message: "An unknown error occurred.",
            details: "",
            docLink: ""
        };
    }

    const code = err.name || err.Code || "Error";
    const message = err.message || "Something went wrong.";

    // Handle Network / CORS Errors explicitly
    if (message === 'Failed to fetch' || code === 'TypeError') {
        return {
            title: "Connection Failed (CORS)",
            message: "The browser was blocked from connecting to your bucket.",
            details: `This is almost always caused by missing CORS(Cross - Origin Resource Sharing) configuration on your bucket.\n\nTo fix this, go to the 'Permissions' tab of your bucket in the AWS Console, scroll to 'Cross-origin resource sharing (CORS)', and paste this configuration: \n\n[\n    { \n        "AllowedHeaders": ["*"], \n        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"], \n        "AllowedOrigins": ["*"], \n        "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"]\n } \n]`,
            docLink: "https://docs.aws.amazon.com/AmazonS3/latest/userguide/ManageCorsUsing.html"
        };
    }

    if (code === 'AccessDenied' || err.$metadata?.httpStatusCode === 403) {
        return {
            title: "Access Denied",
            message: "You do not have sufficient permissions to perform this action.",
            details: `Error Code: ${code} \nMessage: ${message} \n\nTo fix this, please check: \n1.IAM User Policy: Ensure you have 's3:ListBucket' and 's3:GetObject' permissions.\n2.Bucket Policy: Ensure there are no 'Deny' statements blocking your user.\n3.Public Access Settings: If this is a public bucket, ensure 'Block all public access' is unchecked.`,
            docLink: "https://aws.amazon.com/premiumsupport/knowledge-center/s3-troubleshoot-403/"
        };
    }

    return {
        title: code === 'Error' ? 'Operation Failed' : code,
        message: message,
        details: JSON.stringify(err, null, 2),
        docLink: ""
    };
};

const Explorer: React.FC<ExplorerProps> = ({ s3, bucketName, onUpload, onBackToBuckets, readOnly = false }) => {
    const [currentPrefix, setCurrentPrefix] = useState('');
    const [files, setFiles] = useState<FileObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewError, setViewError] = useState<{ title: string, message: string, code?: string, docLink?: string, details?: string } | null>(null);
    const [editorPreviewHtml, setEditorPreviewHtml] = useState('');

    const isMobile = useIsMobile();

    // Edge swipe for back navigation
    const { handlers: edgeSwipeHandlers, swipeProgress, isEdgeSwipe } = useEdgeSwipe({
        onSwipeComplete: () => {
            if (currentPrefix) {
                handleUp();
            } else if (onBackToBuckets) {
                onBackToBuckets();
            }
        },
        enabled: isMobile
    });

    // Initialize S3 and load files, setViewMode] = useState<ViewMode>(ViewMode.LIST);
    const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST);
    const [searchInput, setSearchInput] = useState('');
    const search = useDebounce(searchInput, 300); // Debounced search
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Safe area insets
    const safeArea = useSafeArea();

    // Long-press drag for mobile
    const { dragState, handlers: dragHandlers, setDropTarget } = useLongPressDrag({
        onDragStart: (file) => {
            console.log('Drag started:', file.name);
        },
        onDragEnd: async (file, targetFolder) => {
            if (targetFolder && targetFolder.isFolder) {
                // Move file to folder
                setProcessingState(`Moving ${file.name}...`);
                try {
                    const newKey = `${targetFolder.key}${file.name}`;
                    if (file.isFolder) {
                        await s3.moveFolder(bucketName, file.key, bucketName, newKey);
                    } else {
                        await s3.moveObject(bucketName, file.key, bucketName, newKey);
                    }
                    setRefreshTrigger(p => p + 1);
                    setNotification(`Moved ${file.name} to ${targetFolder.name}`);
                } catch (e) {
                    console.error('Move failed:', e);
                    setNotification('Move failed');
                } finally {
                    setProcessingState(null);
                }
            }
        }
    });

    // Preview
    const [previewFile, setPreviewFile] = useState<{ file: FileObject, url: string, content?: string } | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [editorScrollTop, setEditorScrollTop] = useState(0);
    const [mdTab, setMdTab] = useState<'write' | 'preview'>('write');

    // Selection
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

    // Long-press context menu
    const [contextMenu, setContextMenu] = useState<{ show: boolean, file: FileObject | null, x: number, y: number }>({
        show: false, file: null, x: 0, y: 0
    });
    const longPressTimer = useRef<NodeJS.Timeout | null>(null);

    // Modals
    const [shareModal, setShareModal] = useState<{ show: boolean, file: FileObject | null, url: string | null, duration: number }>({
        show: false, file: null, url: null, duration: 3600
    });
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean, isBulk?: boolean }>({ show: false });
    const [createFileModal, setCreateFileModal] = useState<{ show: boolean, filename: string, content: string }>({
        show: false, filename: '', content: ''
    });
    const [moveModal, setMoveModal] = useState<{ show: boolean, targetBucket: string, targetPrefix: string, bucketList: BucketObject[] }>({
        show: false, targetBucket: bucketName, targetPrefix: currentPrefix, bucketList: []
    });
    const [actionError, setActionError] = useState<{ show: boolean, title: string, message: string, details?: string, docLink?: string } | null>(null);

    // UI State
    const [processingState, setProcessingState] = useState<string | null>(null);
    const [notification, setNotification] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Pull to refresh
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = useRef(0);
    const listRef = useRef<HTMLDivElement>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (listRef.current && listRef.current.scrollTop === 0) {
            pullStartY.current = e.touches[0].clientY;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!listRef.current || listRef.current.scrollTop > 0 || pullStartY.current === 0) return;

        const currentY = e.touches[0].clientY;
        const diff = currentY - pullStartY.current;

        if (diff > 0) {
            setIsPulling(true);
            // Add resistance
            setPullDistance(Math.min(diff * 0.5, 80));
        }
    };

    const handleTouchEnd = async () => {
        if (isPulling && pullDistance > 50) {
            await loadFiles();
        }
        setIsPulling(false);
        setPullDistance(0);
        pullStartY.current = 0;
    };

    useEffect(() => {
        setCurrentPrefix('');
        setSelectedKeys(new Set());
        setSelectionMode(false);
        setViewError(null);
    }, [bucketName]);

    useEffect(() => {
        loadFiles();
    }, [currentPrefix, refreshTrigger, bucketName]);

    // Notification Timer
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Listen for Command Palette Events
    useEffect(() => {
        const toggleViewHandler = () => setViewMode(v => v === ViewMode.LIST ? ViewMode.GRID : ViewMode.LIST);
        const triggerUploadHandler = () => fileInputRef.current?.click();
        const triggerCreateHandler = () => setCreateFileModal(prev => ({ ...prev, show: true }));

        window.addEventListener('s4:toggle-view', toggleViewHandler);
        window.addEventListener('s4:trigger-upload', triggerUploadHandler);
        window.addEventListener('s4:create-file', triggerCreateHandler);

        return () => {
            window.removeEventListener('s4:toggle-view', toggleViewHandler);
            window.removeEventListener('s4:trigger-upload', triggerUploadHandler);
            window.removeEventListener('s4:create-file', triggerCreateHandler);
        };
    }, []);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Delete
            if (e.key === 'Backspace' || e.key === 'Delete') {
                if (selectedKeys.size > 0 && !readOnly && !isEditing && !previewFile && !createFileModal.show && !actionError?.show && !moveModal.show) {
                    setDeleteConfirmation({ show: true, isBulk: true });
                }
            }
            // Escape
            if (e.key === 'Escape') {
                if (actionError?.show) setActionError(null);
                else if (previewFile) closePreview();
                else if (createFileModal.show) setCreateFileModal(prev => ({ ...prev, show: false }));
                else if (moveModal.show) setMoveModal(prev => ({ ...prev, show: false }));
                else if (deleteConfirmation.show) setDeleteConfirmation({ show: false });
                else if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedKeys(new Set());
                } else if (selectedKeys.size > 0) {
                    setSelectedKeys(new Set());
                }
            }
            // Navigation in Lightbox
            if (previewFile && !isEditing) {
                if (e.key === 'ArrowRight') navigatePreview(1);
                if (e.key === 'ArrowLeft') navigatePreview(-1);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedKeys, readOnly, previewFile, isEditing, selectionMode, createFileModal.show, deleteConfirmation.show, actionError, moveModal.show]);

    const loadFiles = async () => {
        setLoading(true);
        setViewError(null);
        try {
            const data = await s3.listFiles(currentPrefix);
            setFiles(data);
            setSelectedKeys(new Set());
        } catch (err: any) {
            console.error(err);
            const errorInfo = getAwsErrorMessage(err);
            setViewError({
                title: errorInfo.title,
                message: errorInfo.message,
                code: err.name || "Error",
                docLink: errorInfo.docLink,
                details: errorInfo.details
            });
        } finally {
            setLoading(false);
        }
    };

    const handleNavigate = (prefix: string) => {
        setCurrentPrefix(prefix);
        setSearchInput('');
        // Always clear selection on navigation
        setSelectedKeys(new Set());
    };

    const handleUp = () => {
        if (!currentPrefix) {
            if (onBackToBuckets) onBackToBuckets();
            return;
        }
        const parts = currentPrefix.split('/').filter(Boolean);
        parts.pop();
        setCurrentPrefix(parts.length > 0 ? parts.join('/') + '/' : '');
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));

    // --- INTERACTION LOGIC ---

    const toggleSelectionMode = () => {
        const newMode = !selectionMode;
        setSelectionMode(newMode);
        if (!newMode) {
            setSelectedKeys(new Set());
        }
    };

    // Long-press handlers
    const handleLongPressStart = (file: FileObject, e: React.TouchEvent | React.MouseEvent) => {
        const touch = 'touches' in e ? e.touches[0] : e;
        longPressTimer.current = setTimeout(() => {
            setContextMenu({ show: true, file, x: touch.clientX, y: touch.clientY });
            // Haptic feedback if available
            if ('vibrate' in navigator) {
                navigator.vibrate(50);
            }
        }, 500); // 500ms long press
    };

    const handleLongPressEnd = () => {
        if (longPressTimer.current) {
            clearTimeout(longPressTimer.current);
            longPressTimer.current = null;
        }
    };

    const handleItemClick = (file: FileObject, e: React.MouseEvent) => {
        e.stopPropagation();

        if (selectionMode) {
            // Selection Mode: Toggle selection only
            const newSelected = new Set(selectedKeys);
            if (newSelected.has(file.key)) {
                newSelected.delete(file.key);
            } else {
                newSelected.add(file.key);
            }
            setSelectedKeys(newSelected);
        } else {
            // Default Mode: Navigate or Preview
            if (file.isFolder) {
                handleNavigate(file.key);
            } else {
                handlePreview(file);
            }
        }
    };

    // Bulk Actions
    const handleBulkDelete = async () => {
        setDeleteConfirmation({ show: false });
        if (readOnly || selectedKeys.size === 0) return;

        setProcessingState(`Deleting ${selectedKeys.size} items...`);
        try {
            for (const key of selectedKeys) {
                const file = files.find(f => f.key === key);
                if (file?.isFolder) await s3.deleteFolder(key);
                else await s3.deleteFile(key);
            }
            setRefreshTrigger(p => p + 1);
            setSelectionMode(false); // Exit selection mode after action
            setSelectedKeys(new Set());
        } catch (e: any) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Delete Failed",
                message: errInfo.message,
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        } finally {
            setProcessingState(null);
        }
    };

    const handleBulkDownload = async () => {
        if (selectedKeys.size === 0) return;

        const filesToDownload = files.filter(f => selectedKeys.has(f.key) && !f.isFolder);

        if (filesToDownload.length === 1) {
            handleDownload(filesToDownload[0]);
            return;
        }

        setProcessingState("Zipping files...");
        try {
            const blob = await s3.downloadFilesAsZip(filesToDownload);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `files_archive.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setSelectionMode(false);
            setSelectedKeys(new Set());
        } catch (e: any) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Download Failed",
                message: "Could not generate zip file.",
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        } finally {
            setProcessingState(null);
        }
    };

    const handleDownload = async (file: FileObject) => {
        if (file.isFolder) {
            if (!confirm(`Prepare download for folder "${file.name}" ? This will fetch all files.`)) return;
            setProcessingState("Zipping folder...");
            try {
                const blob = await s3.downloadFolderAsZip(file.key);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${file.name.replace(/\/$/, '')}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e: any) {
                const errInfo = getAwsErrorMessage(e);
                setActionError({
                    show: true,
                    title: "Folder Download Failed",
                    message: errInfo.message,
                    details: errInfo.details,
                    docLink: errInfo.docLink
                });
            } finally {
                setProcessingState(null);
            }
        } else {
            setProcessingState("Downloading...");
            try {
                const url = await s3.getPresignedUrl(file.key, { download: true });
                const a = document.createElement('a');
                a.href = url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            } catch (e: any) {
                const errInfo = getAwsErrorMessage(e);
                setActionError({
                    show: true,
                    title: "Download Failed",
                    message: errInfo.message,
                    details: errInfo.details,
                    docLink: errInfo.docLink
                });
            } finally {
                setProcessingState(null);
            }
        }
    };

    const handleCopyS3Path = async (file: FileObject) => {
        const path = `s3://${bucketName}/${file.key}`;
        try {
            await navigator.clipboard.writeText(path);
            setNotification("S3 URI copied to clipboard");
        } catch (e) {
            console.error("Failed to copy", e);
        }
    };

    const openMoveModal = async () => {
        setProcessingState("Fetching buckets...");
        try {
            // We need to fetch available buckets for the destination dropdown
            const buckets = await s3.listBuckets();
            setMoveModal({
                show: true,
                targetBucket: bucketName,
                targetPrefix: currentPrefix,
                bucketList: buckets
            });
        } catch (e) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Cannot Load Buckets",
                message: "Unable to list buckets for destination selection.",
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        } finally {
            setProcessingState(null);
        }
    };

    const handleMoveSelected = async () => {
        const { targetBucket, targetPrefix } = moveModal;
        if (!targetBucket) return;

        setProcessingState(`Moving ${selectedKeys.size} items...`);
        try {
            for (const key of selectedKeys) {
                const file = files.find(f => f.key === key);
                if (!file) continue;

                if (file.isFolder) {
                    await s3.moveFolder(bucketName, key, targetBucket, targetPrefix + file.name);
                } else {
                    await s3.moveObject(bucketName, key, targetBucket, targetPrefix + file.name);
                }
            }

            setMoveModal(prev => ({ ...prev, show: false }));
            setRefreshTrigger(p => p + 1);
            setSelectionMode(false);
            setSelectedKeys(new Set());
            setNotification(`Moved ${selectedKeys.size} items successfully.`);
        } catch (e: any) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Move Failed",
                message: errInfo.message,
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        } finally {
            setProcessingState(null);
        }
    };

    // Create File
    const handleCreateFile = async () => {
        if (!createFileModal.filename.trim()) return;

        setProcessingState("Creating file...");
        try {
            const key = `${currentPrefix}${createFileModal.filename.trim()}`;

            // Basic mime detection for text files
            const ext = createFileModal.filename.split('.').pop()?.toLowerCase();
            let mimeType = 'text/plain';
            if (ext === 'json') mimeType = 'application/json';
            else if (ext === 'js') mimeType = 'application/javascript';
            else if (ext === 'ts') mimeType = 'application/typescript';
            else if (ext === 'html') mimeType = 'text/html';
            else if (ext === 'css') mimeType = 'text/css';
            else if (ext === 'md') mimeType = 'text/markdown';
            else if (ext === 'xml') mimeType = 'application/xml';
            else if (ext === 'yml' || ext === 'yaml') mimeType = 'text/yaml';

            await s3.saveFileContent(key, createFileModal.content, mimeType);
            setCreateFileModal({ show: false, filename: '', content: '' });
            setRefreshTrigger(p => p + 1);
        } catch (e: any) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Failed to Create File",
                message: errInfo.message,
                details: errInfo.details,
                docLink: errInfo.docLink
            });
            // We do NOT close the create modal here, so user doesn't lose their content
        } finally {
            setProcessingState(null);
        }
    };

    // Preview & Editing
    // Update editor preview when tab changes or content changes
    useEffect(() => {
        const updatePreview = async () => {
            if (mdTab === 'preview' && isEditing) {
                try {
                    const html = await marked.parse(editorContent);
                    setEditorPreviewHtml(html);
                } catch (e) {
                    console.error("Failed to parse markdown", e);
                }
            }
        };
        updatePreview();
    }, [mdTab, isEditing, editorContent]);

    const handlePreview = async (file: FileObject) => {
        if (file.isFolder) return;
        setIsPreviewLoading(true);
        setIsEditing(false);
        setEditorContent('');
        setEditorScrollTop(0); // Reset scroll
        setMdTab('write');
        try {
            const url = await s3.getPresignedUrl(file.key);
            let content = undefined;

            if (file.name.endsWith('.md')) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const text = await res.text();
                        const html = await marked.parse(text);
                        setPreviewFile({ file, url, content: html });
                    }
                } catch (e) {
                    console.error("Could not fetch markdown content", e);
                }
            } else if (file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        content = await res.text();
                        setEditorContent(content);
                    }
                } catch (e) {
                    console.error("Could not fetch code content", e);
                }
                setPreviewFile({ file, url, content });
            } else if (file.mimeType?.match(/text|json|javascript|xml|sql|css|html/)) {
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        content = await res.text();
                        setEditorContent(content);
                    }
                } catch (e) {
                    console.error("Could not fetch text content", e);
                }
                setPreviewFile({ file, url, content });
            } else if (file.mimeType === 'application/pdf' || file.name.endsWith('.pdf')) {
                // Fetch PDF as blob to bypass X-Frame-Options
                try {
                    const res = await fetch(url);
                    if (res.ok) {
                        const blob = await res.blob();
                        const blobUrl = URL.createObjectURL(blob);
                        setPreviewFile({ file, url: blobUrl, content });
                    } else {
                        setPreviewFile({ file, url, content });
                    }
                } catch (e) {
                    console.error("Could not fetch PDF", e);
                    setPreviewFile({ file, url, content });
                }
            } else {
                setPreviewFile({ file, url, content });
            }
        } catch (e) {
            // If getting presigned URL fails (likely 403)
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Preview Unavailable",
                message: errInfo.message,
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        } finally {
            setIsPreviewLoading(false);
        }
    };

    const navigatePreview = (direction: number) => {
        if (!previewFile) return;
        const currentIndex = filteredFiles.findIndex(f => f.key === previewFile.file.key);
        let nextIndex = currentIndex + direction;

        // Skip folders in preview
        while (nextIndex >= 0 && nextIndex < filteredFiles.length && filteredFiles[nextIndex].isFolder) {
            nextIndex += direction;
        }

        if (nextIndex >= 0 && nextIndex < filteredFiles.length) {
            handlePreview(filteredFiles[nextIndex]);
        }
    };

    const saveEditedContent = async () => {
        if (!previewFile || !editorContent) return;
        setProcessingState("Saving changes...");
        try {
            await s3.saveFileContent(previewFile.file.key, editorContent, previewFile.file.mimeType);
            if (previewFile?.file.name.endsWith('.md')) {
                const html = await marked.parse(editorContent);
                setPreviewFile(prev => prev ? { ...prev, content: html } : null);
            } else {
                setPreviewFile(prev => prev ? { ...prev, content: editorContent } : null);
            }
            setIsEditing(false);
            setRefreshTrigger(p => p + 1);
        } catch (e: any) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Save Failed",
                message: errInfo.message,
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        } finally {
            setProcessingState(null);
        }
    };

    const closePreview = () => {
        setPreviewFile(null);
        setIsEditing(false);
        setMdTab('write');
    };

    // Share Functionality
    const openShareModal = (file: FileObject) => {
        setShareModal({ show: true, file, url: null, duration: 3600 });
    };

    const generateShareLink = async () => {
        if (!shareModal.file) return;
        try {
            const url = await s3.getPresignedUrl(shareModal.file.key, { expiresIn: shareModal.duration });
            setShareModal(prev => ({ ...prev, url }));
        } catch (e: any) {
            const errInfo = getAwsErrorMessage(e);
            setActionError({
                show: true,
                title: "Share Failed",
                message: "Could not generate public link.",
                details: errInfo.details,
                docLink: errInfo.docLink
            });
        }
    };

    // UI Helpers
    const getIcon = (file: FileObject, size: number = 20, className: string = "") => {
        const c = (cls: string) => `${cls} ${className}`;

        if (file.isFolder) return <Folder className={c("text-blue-500 fill-blue-500/10 dark:text-blue-400 dark:fill-blue-400/20")} size={size} />;
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext)) return <ImageIcon className={c("text-purple-500 dark:text-purple-400")} size={size} />;
        if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) return <Film className={c("text-rose-500")} size={size} />;
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return <Package className={c("text-amber-600")} size={size} />;
        if (['js', 'ts', 'json', 'html', 'css', 'md', 'py', 'java'].includes(ext)) return <FileCode className={c("text-blue-500 dark:text-blue-400")} size={size} />;
        if (['mp3', 'wav', 'ogg'].includes(ext)) return <Music className={c("text-green-500 dark:text-green-400")} size={size} />;
        return <FileIcon className={c("text-muted-foreground")} size={size} />;
    };

    const renderContent = () => {
        if (!previewFile) return null;
        const isMarkdown = previewFile.file.name.endsWith('.md');

        // If editing
        if (isEditing) {
            if (isMarkdown && mdTab === 'preview') {
                // Live Preview while editing
                return (
                    <div className="w-full h-full bg-background overflow-auto p-8 transition-colors">
                        <div
                            className="prose dark:prose-invert prose-sm max-w-3xl mx-auto"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorPreviewHtml) }}
                        />
                    </div>
                );
            }

            // Code Editor with Line Numbers
            const lineCount = editorContent.split('\n').length;
            const lines = Array.from({ length: lineCount }, (_, i) => i + 1);

            return (
                <div className="w-full h-full flex bg-background overflow-hidden font-mono">
                    {/* Line Numbers */}
                    <div
                        className="w-12 bg-muted/30 border-r border-border text-muted-foreground text-right py-4 pr-3 select-none text-sm overflow-hidden shrink-0"
                    >
                        <div style={{ transform: `translateY(-${editorScrollTop}px)` }}>
                            {lines.map(l => (
                                <div key={l} className="h-6 leading-6 text-xs opacity-50">{l}</div>
                            ))}
                        </div>
                    </div>

                    {isMarkdown && mdTab === 'preview' ? (
                        <div className="flex-1 h-full bg-background overflow-auto p-8 transition-colors">
                            <div
                                className="prose dark:prose-invert prose-sm max-w-3xl mx-auto"
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(editorPreviewHtml) }}
                            />
                        </div>
                    ) : (
                        <textarea
                            className="flex-1 h-full bg-background text-foreground text-sm p-4 outline-none resize-none transition-colors leading-6 whitespace-pre"
                            value={editorContent}
                            onChange={(e) => setEditorContent(e.target.value)}
                            onScroll={(e) => setEditorScrollTop(e.currentTarget.scrollTop)}
                            spellCheck={false}
                            placeholder="Start typing..."
                            autoFocus
                            wrap="off"
                        />
                    )}
                </div>
            );
        }

        // Not editing (View Mode)
        if (previewFile.content !== undefined) {
            if (isMarkdown) {
                // Markdown View Mode
                return (
                    <div className="w-full h-full bg-background overflow-auto p-8 transition-colors">
                        <div
                            className="prose dark:prose-invert prose-sm max-w-3xl mx-auto"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewFile.content) }}
                        />
                    </div>
                );
            }
            // Text View Mode
            return (
                <div className="w-full h-full bg-background overflow-auto p-4 transition-colors">
                    <pre className="font-mono text-sm text-foreground whitespace-pre-wrap">{previewFile.content}</pre>
                </div>
            );
        }

        // Media/Binary Preview
        return (
            <div className="w-full h-full flex items-center justify-center p-4 bg-secondary/10 transition-colors">
                {previewFile.file.mimeType?.startsWith('image') ? (
                    <ImagePreview
                        src={previewFile.url}
                        alt="Preview"
                        onSwipeLeft={() => navigatePreview(1)}
                        onSwipeRight={() => navigatePreview(-1)}
                        onClose={closePreview}
                    />
                ) : previewFile.file.mimeType?.startsWith('video') ? (
                    <video src={previewFile.url} controls className="max-w-full max-h-full shadow-2xl rounded-sm" />
                ) : previewFile.file.mimeType?.startsWith('audio') ? (
                    <audio src={previewFile.url} controls className="w-full max-w-md" />
                ) : previewFile.file.mimeType === 'application/pdf' || previewFile.file.name.endsWith('.pdf') ? (
                    <iframe
                        src={previewFile.url}
                        className="w-full h-full border-0 rounded-sm shadow-2xl"
                        title="PDF Preview"
                    />
                ) : (
                    <div className="text-center text-muted-foreground">
                        <FileIcon size={64} className="mx-auto mb-4 opacity-20" />
                        <p className="mb-2">{previewFile.file.name}</p>
                        <p className="text-xs mb-4">Preview not available for this file type</p>
                        <button onClick={() => handleDownload(previewFile.file)} className="mt-4 text-blue-500 hover:underline text-sm">Download File</button>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div
            className="flex flex-col h-full relative bg-background select-none transition-colors duration-300"
            {...edgeSwipeHandlers}
        >
            {/* Edge Swipe Back Indicator */}
            {isEdgeSwipe && (
                <div className="fixed left-0 top-0 bottom-0 z-[200] flex items-center justify-start pl-4 pointer-events-none bg-gradient-to-r from-black/10 to-transparent w-24 transition-opacity" style={{ opacity: swipeProgress }}>
                    <div className="bg-background/80 backdrop-blur-md rounded-full p-3 shadow-lg border border-border transform transition-transform" style={{ transform: `scale(${0.5 + swipeProgress * 0.5})` }}>
                        <ArrowLeft size={24} className="text-foreground" />
                    </div>
                </div>
            )}

            {/* Drag Preview */}
            {dragState.isDragging && dragState.draggedFile && (
                <div
                    className="fixed z-[250] pointer-events-none"
                    style={{
                        left: `${dragState.dragPosition.x}px`,
                        top: `${dragState.dragPosition.y}px`,
                        transform: 'translate(-50%, -50%)'
                    }}
                >
                    <div className="bg-background/90 backdrop-blur-md border-2 border-primary rounded-xl p-3 shadow-2xl flex items-center gap-3 animate-pulse">
                        <div className="text-primary">
                            {getIcon(dragState.draggedFile, 24)}
                        </div>
                        <span className="font-medium text-sm max-w-[200px] truncate">
                            {dragState.draggedFile.name}
                        </span>
                    </div>
                </div>
            )}
            {/* Toast Notification */}
            {notification && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[150] animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="bg-foreground text-background px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium">
                        <CheckCircle2 size={16} className="text-green-500" />
                        {notification}
                    </div>
                </div>
            )}

            {/* Processing Overlay */}
            {processingState && (
                <div className="absolute inset-0 z-[60] bg-background/50 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
                    <div className="bg-card border border-border px-6 py-4 rounded-lg shadow-xl flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span className="font-medium">{processingState}</span>
                    </div>
                </div>
            )}

            {/* Action Error Modal */}
            {actionError?.show && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setActionError(null)}>
                    <div className="bg-card border border-destructive/50 rounded-lg shadow-2xl max-w-lg w-full overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="bg-destructive/10 p-4 border-b border-destructive/20 flex items-center gap-3">
                            <div className="p-2 bg-destructive/20 rounded-full">
                                <AlertCircle className="text-destructive w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-destructive">{actionError.title}</h3>
                            </div>
                            <button onClick={() => setActionError(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-foreground font-medium whitespace-pre-line">{actionError.message}</p>

                            {actionError.details && (
                                <div className="bg-secondary/50 rounded-md p-3 border border-border">
                                    <label className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold block mb-1">Details / Configuration</label>
                                    <pre className="text-xs font-mono text-muted-foreground whitespace-pre-wrap break-all overflow-auto max-h-40 select-all">
                                        {actionError.details}
                                    </pre>
                                </div>
                            )}

                            {actionError.docLink && (
                                <div className="mt-2">
                                    <a
                                        href={actionError.docLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-blue-500 hover:text-blue-400 hover:underline flex items-center gap-1"
                                    >
                                        <Link size={12} /> View Troubleshooting Documentation
                                    </a>
                                </div>
                            )}
                        </div>
                        <div className="p-4 bg-secondary/30 border-t border-border flex justify-end">
                            <button onClick={() => setActionError(null)} className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {/* Move Modal */}
            {moveModal.show && (
                isMobile ? (
                    <BottomSheet
                        isOpen={moveModal.show}
                        onClose={() => setMoveModal({ ...moveModal, show: false })}
                        title="Move Items"
                        height="auto"
                    >
                        <div className="space-y-6 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <FolderInput className="text-blue-500 w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Moving {selectedKeys.size} items</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-2">Destination Bucket</label>
                                    <select
                                        className="w-full bg-secondary border border-input rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                                        value={moveModal.targetBucket}
                                        onChange={(e) => setMoveModal({ ...moveModal, targetBucket: e.target.value })}
                                    >
                                        {moveModal.bucketList.map(b => (
                                            <option key={b.name} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-2">Destination Folder Path</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-secondary border border-input rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:border-foreground font-mono"
                                            placeholder="folder/subfolder/"
                                            value={moveModal.targetPrefix}
                                            onChange={(e) => setMoveModal({ ...moveModal, targetPrefix: e.target.value })}
                                        />
                                        <Folder size={16} className="absolute left-3.5 top-3.5 text-muted-foreground" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1.5 ml-1">Leave empty to move to root. Use trailing slash for folders.</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button onClick={handleMoveSelected} className="w-full bg-blue-600 text-white py-3.5 rounded-xl text-base font-medium hover:bg-blue-500 transition-colors shadow-sm active:scale-[0.98] transition-transform">Move Items</button>
                                <button onClick={() => setMoveModal({ ...moveModal, show: false })} className="w-full bg-secondary text-foreground py-3.5 rounded-xl text-base font-medium hover:bg-secondary/80 transition-colors active:scale-[0.98] transition-transform">Cancel</button>
                            </div>
                        </div>
                    </BottomSheet>
                ) : (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setMoveModal({ ...moveModal, show: false })}>
                        <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                    <FolderInput className="text-blue-500 w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold">Move Items</h3>
                                    <p className="text-xs text-muted-foreground">Moving {selectedKeys.size} items</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-6">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Destination Bucket</label>
                                    <select
                                        className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm outline-none focus:border-foreground"
                                        value={moveModal.targetBucket}
                                        onChange={(e) => setMoveModal({ ...moveModal, targetBucket: e.target.value })}
                                    >
                                        {moveModal.bucketList.map(b => (
                                            <option key={b.name} value={b.name}>{b.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1.5">Destination Folder Path</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-secondary border border-input rounded-md pl-8 pr-3 py-2 text-sm outline-none focus:border-foreground font-mono"
                                            placeholder="folder/subfolder/"
                                            value={moveModal.targetPrefix}
                                            onChange={(e) => setMoveModal({ ...moveModal, targetPrefix: e.target.value })}
                                        />
                                        <Folder size={14} className="absolute left-2.5 top-2.5 text-muted-foreground" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-1">Leave empty to move to root. Use trailing slash for folders.</p>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button onClick={() => setMoveModal({ ...moveModal, show: false })} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                                <button onClick={handleMoveSelected} className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm">Move Items</button>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Create File Modal */}
            {createFileModal.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setCreateFileModal({ ...createFileModal, show: false })}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-2xl w-full p-6 flex flex-col h-[600px] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4 shrink-0">
                            <h3 className="text-lg font-semibold flex items-center gap-2"><FilePlus size={20} className="text-blue-500" /> Create New File</h3>
                            <button onClick={() => setCreateFileModal({ ...createFileModal, show: false })}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
                        </div>

                        <div className="space-y-4 flex-1 flex flex-col min-h-0">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Filename</label>
                                <input
                                    type="text"
                                    className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none"
                                    placeholder="example.txt, script.js, readme.md..."
                                    value={createFileModal.filename}
                                    onChange={(e) => setCreateFileModal({ ...createFileModal, filename: e.target.value })}
                                    autoFocus
                                />
                            </div>
                            <div className="flex-1 flex flex-col min-h-0">
                                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Content</label>
                                <textarea
                                    className="flex-1 w-full bg-background border border-input rounded-md p-4 text-sm font-mono text-foreground focus:border-foreground outline-none resize-none leading-relaxed"
                                    placeholder="Type your content here..."
                                    value={createFileModal.content}
                                    onChange={(e) => setCreateFileModal({ ...createFileModal, content: e.target.value })}
                                    spellCheck={false}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6 shrink-0">
                            <button onClick={() => setCreateFileModal({ ...createFileModal, show: false })} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                            <button
                                onClick={handleCreateFile}
                                disabled={!createFileModal.filename.trim()}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50"
                            >
                                Create File
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.show && (
                isMobile ? (
                    <BottomSheet
                        isOpen={deleteConfirmation.show}
                        onClose={() => setDeleteConfirmation({ show: false })}
                        title={`Delete ${selectedKeys.size > 1 ? `${selectedKeys.size} Items` : 'Item'}`}
                        height="auto"
                    >
                        <div className="space-y-6 pb-4">
                            <div className="flex flex-col items-center justify-center py-4 text-destructive gap-2">
                                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
                                    <AlertTriangle className="w-8 h-8" />
                                </div>
                            </div>
                            <p className="text-center text-muted-foreground">
                                Are you sure you want to delete the selected items? This action cannot be undone.
                            </p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleBulkDelete} className="w-full bg-destructive text-destructive-foreground py-3.5 rounded-xl text-base font-medium hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98] transition-transform">Delete</button>
                                <button onClick={() => setDeleteConfirmation({ show: false })} className="w-full bg-secondary text-foreground py-3.5 rounded-xl text-base font-medium hover:bg-secondary/80 transition-colors active:scale-[0.98] transition-transform">Cancel</button>
                            </div>
                        </div>
                    </BottomSheet>
                ) : (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setDeleteConfirmation({ show: false })}>
                        <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="text-destructive w-5 h-5" />
                                </div>
                                <h3 className="text-lg font-semibold">Delete {selectedKeys.size > 1 ? `${selectedKeys.size} Items` : 'Item'}</h3>
                            </div>
                            <p className="text-muted-foreground text-sm mb-6">
                                Are you sure you want to delete the selected items? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setDeleteConfirmation({ show: false })} className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors">Cancel</button>
                                <button onClick={handleBulkDelete} className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity shadow-sm">Delete</button>
                            </div>
                        </div>
                    </div>
                )
            )}

            {/* Share Modal */}
            {shareModal.show && shareModal.file && (
                isMobile ? (
                    <BottomSheet
                        isOpen={shareModal.show}
                        onClose={() => setShareModal({ show: false, file: null, url: null, duration: 3600 })}
                        title="Share File"
                        height="auto"
                    >
                        {!shareModal.url ? (
                            <div className="space-y-6 pb-4">
                                <p className="text-sm text-muted-foreground">Generate a temporary public link for <span className="font-medium text-foreground">{shareModal.file.name}</span>.</p>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-2">Expiration</label>
                                    <select
                                        className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none appearance-none"
                                        value={shareModal.duration}
                                        onChange={(e) => setShareModal(prev => ({ ...prev, duration: Number(e.target.value) }))}
                                    >
                                        <option value={3600}>1 Hour</option>
                                        <option value={86400}>1 Day</option>
                                        <option value={604800}>7 Days</option>
                                    </select>
                                </div>
                                <button onClick={generateShareLink} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-base font-medium hover:opacity-90 transition-opacity shadow-sm active:scale-[0.98] transition-transform">Generate Link</button>
                            </div>
                        ) : (
                            <div className="space-y-6 pb-4">
                                <div className="flex flex-col items-center justify-center py-4 text-green-500 gap-2">
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                        <Check size={24} />
                                    </div>
                                    <p className="font-medium">Link Generated!</p>
                                </div>
                                <div className="bg-secondary p-4 rounded-xl break-all text-xs font-mono text-muted-foreground border border-border">
                                    {shareModal.url}
                                </div>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(shareModal.url!);
                                        setNotification("Link copied to clipboard");
                                    }}
                                    className="w-full bg-foreground text-background py-3.5 rounded-xl text-base font-medium transition-colors flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-transform"
                                >
                                    <Copy size={18} /> Copy to Clipboard
                                </button>
                            </div>
                        )}
                    </BottomSheet>
                ) : (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setShareModal({ show: false, file: null, url: null, duration: 3600 })}>
                        <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Share File</h3>
                                <button onClick={() => setShareModal({ show: false, file: null, url: null, duration: 3600 })}><X size={18} className="text-muted-foreground hover:text-foreground" /></button>
                            </div>

                            {!shareModal.url ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-muted-foreground">Generate a temporary public link for <span className="font-medium text-foreground">{shareModal.file.name}</span>.</p>
                                    <div>
                                        <label className="text-xs font-medium text-muted-foreground">Expiration</label>
                                        <select
                                            className="w-full mt-1 bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none"
                                            value={shareModal.duration}
                                            onChange={(e) => setShareModal(prev => ({ ...prev, duration: Number(e.target.value) }))}
                                        >
                                            <option value={3600}>1 Hour</option>
                                            <option value={86400}>1 Day</option>
                                            <option value={604800}>7 Days</option>
                                        </select>
                                    </div>
                                    <button onClick={generateShareLink} className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:opacity-90 transition-opacity">Generate Link</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-green-500 flex items-center gap-2"><Check size={14} /> Link Generated!</p>
                                    <div className="bg-secondary p-3 rounded-md break-all text-xs font-mono text-muted-foreground border border-border">
                                        {shareModal.url}
                                    </div>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareModal.url!);
                                            setNotification("Link copied to clipboard");
                                        }}
                                        className="w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-md text-sm font-medium transition-colors border border-border flex items-center justify-center gap-2"
                                    >
                                        <Copy size={14} /> Copy to Clipboard
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            )}

            {/* Preview Modal (Lightbox) */}
            {previewFile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background backdrop-blur-sm animate-in fade-in duration-200 transition-colors" onClick={closePreview}>
                    {/* Navigation Controls */}
                    <button onClick={(e) => { e.stopPropagation(); navigatePreview(-1) }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all z-50 hover:scale-110 hidden md:block shadow-sm border border-border/50"><ChevronLeft size={32} /></button>
                    <button onClick={(e) => { e.stopPropagation(); navigatePreview(1) }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all z-50 hover:scale-110 hidden md:block shadow-sm border border-border/50"><ChevronRightIcon size={32} /></button>

                    <div className="relative w-full h-full flex flex-col" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-background z-40">
                            <div className="flex flex-col min-w-0 mr-4">
                                <span className="font-medium text-foreground text-sm truncate">{previewFile.file.name}</span>
                                <span className="text-xs text-muted-foreground">{formatBytes(previewFile.file.size)}</span>
                            </div>

                            {/* Markdown Tabs */}
                            {isEditing && previewFile.file.name.endsWith('.md') && (
                                <div className="absolute left-1/2 top-16 md:top-1/2 -translate-x-1/2 md:-translate-y-1/2 flex bg-secondary rounded-lg p-0.5 mt-2 md:mt-0 z-50 border border-border">
                                    <button
                                        onClick={() => setMdTab('write')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${mdTab === 'write' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <PenTool size={12} /> Write
                                    </button>
                                    <button
                                        onClick={() => setMdTab('preview')}
                                        className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-2 ${mdTab === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        <BookOpen size={12} /> Preview
                                    </button>
                                </div>
                            )}

                            <div className="flex items-center gap-2">
                                {previewFile.content !== undefined && !readOnly && (
                                    isEditing ? (
                                        <button onClick={saveEditedContent} className="px-3 py-1.5 bg-green-600 text-white rounded text-xs font-medium flex items-center gap-2 hover:bg-green-500 shadow-sm"><Save size={14} /> Save</button>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="px-3 py-1.5 bg-secondary text-foreground rounded text-xs font-medium flex items-center gap-2 hover:bg-secondary/80 border border-border"><Edit2 size={14} /> Edit</button>
                                    )
                                )}
                                <button onClick={() => openShareModal(previewFile.file)} className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Share"><Share2 size={18} /></button>
                                <button onClick={() => handleDownload(previewFile.file)} className="p-2 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors" title="Download"><Download size={18} /></button>
                                <button onClick={closePreview} className="p-2 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Close"><X size={18} /></button>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-hidden flex items-center justify-center relative bg-background transition-colors">
                            {renderContent()}
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div
                className="h-14 md:h-16 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 gap-2 bg-background/80 backdrop-blur sticky top-0 z-10"
                style={{ paddingTop: `${safeArea.top}px`, paddingLeft: `${Math.max(16, safeArea.left)}px`, paddingRight: `${Math.max(16, safeArea.right)}px` }}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex items-center gap-2 md:gap-4 flex-1 min-w-0">
                    <button
                        onClick={handleUp}
                        disabled={!currentPrefix && !onBackToBuckets}
                        className="p-2 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
                    >
                        <ArrowLeft size={18} />
                    </button>

                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm overflow-x-auto whitespace-nowrap mask-linear-fade no-scrollbar">
                        <span
                            className={`cursor-pointer transition-colors font-mono flex items-center gap-2 ${!currentPrefix ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setCurrentPrefix('')}
                        >
                            <Database size={14} className="opacity-50 shrink-0" />
                            <span className="leading-none">{bucketName}</span>
                        </span>
                        <span className="mx-1.5 text-muted-foreground/50"><ChevronRight size={14} /></span>
                        {currentPrefix.split('/').filter(Boolean).map((part, idx, arr) => (
                            <React.Fragment key={idx}>
                                <span
                                    className={`cursor-pointer transition-colors font-mono ${idx === arr.length - 1 ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'}`}
                                    onClick={() => {
                                        const newPath = arr.slice(0, idx + 1).join('/') + '/';
                                        setCurrentPrefix(newPath);
                                    }}
                                >
                                    {part}
                                </span>
                                {idx < arr.length - 1 && <span className="mx-1.5 text-muted-foreground/50"><ChevronRight size={14} /></span>}
                            </React.Fragment>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 ml-auto">
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-2.5 text-muted-foreground w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Filter..."
                            className="bg-secondary border border-transparent hover:border-border focus:border-foreground rounded-md pl-9 pr-8 py-1.5 text-sm outline-none w-40 lg:w-56 transition-all"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                        {searchInput && (
                            <button
                                onClick={() => setSearchInput('')}
                                className="absolute right-2 top-2 p-0.5 hover:bg-secondary-foreground/10 rounded-full text-muted-foreground"
                                title="Clear search"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={toggleSelectionMode}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 ${selectionMode ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-secondary'}`}
                        title={selectionMode ? "Exit Selection Mode" : "Enter Selection Mode"}
                    >
                        {selectionMode ? <CheckCircle2 size={18} /> : <CheckSquare size={18} />}
                        <span className="text-xs font-medium hidden sm:inline">{selectionMode ? 'Done' : 'Select'}</span>
                    </button>

                    <button onClick={() => setRefreshTrigger(p => p + 1)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors">
                        <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
                    </button>

                    <div className="hidden sm:flex bg-secondary rounded-md p-0.5 border border-border">
                        <button onClick={() => setViewMode(ViewMode.LIST)} className={`p-1.5 rounded-sm transition-all ${viewMode === ViewMode.LIST ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <List size={16} />
                        </button>
                        <button onClick={() => setViewMode(ViewMode.GRID)} className={`p-1.5 rounded-sm transition-all ${viewMode === ViewMode.GRID ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
                            <Grid size={16} />
                        </button>
                    </div>

                    {!readOnly && (
                        <>
                            <button
                                onClick={() => setCreateFileModal({ show: true, filename: '', content: '' })}
                                className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                                title="New File"
                            >
                                <FilePlus size={18} />
                            </button>

                            <label className="cursor-pointer bg-foreground hover:opacity-90 text-background px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all shadow-sm active:scale-95">
                                <Upload size={14} />
                                <span className="hidden sm:inline">Upload</span>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    multiple
                                    className="hidden"
                                    onChange={(e) => {
                                        if (e.target.files) Array.from(e.target.files).forEach(f => onUpload(f, currentPrefix, () => setRefreshTrigger(p => p + 1)));
                                        // Reset input so same file can be selected again if needed
                                        if (e.target) e.target.value = '';
                                    }}
                                />
                            </label>
                        </>
                    )}
                </div>
            </div>

            {/* Pull Refresh Spinner */}
            <div className="absolute top-14 md:top-16 left-0 right-0 flex justify-center z-0 pointer-events-none">
                <Loader2 className={`w-6 h-6 text-blue-500 transition-all duration-200 ${isPulling ? 'opacity-100' : 'opacity-0'} ${pullDistance > 50 ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
            </div>

            {/* File Area */}
            <div
                ref={listRef}
                className="flex-1 overflow-y-auto bg-background overscroll-none pb-4 md:pb-20 relative z-10 transition-transform duration-200 ease-out"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: isPulling ? `translateY(${pullDistance}px)` : 'none' }}
            >
                {/* Permission Denied / Error View */}
                {viewError ? (
                    <div className="flex flex-col items-center justify-center h-[60vh] p-8 text-center animate-in fade-in duration-500 select-text">
                        <div className="w-20 h-20 bg-destructive/10 rounded-3xl flex items-center justify-center mb-6 ring-4 ring-destructive/5">
                            <Lock size={40} className="text-destructive opacity-80" />
                        </div>
                        <h2 className="text-2xl font-bold text-foreground mb-2">{viewError.title}</h2>
                        <p className="text-muted-foreground max-w-md mb-6 leading-relaxed whitespace-pre-line">
                            {viewError.message}
                        </p>

                        {viewError.details && (
                            <div className="bg-secondary/50 p-4 rounded-md border border-border text-left max-w-lg w-full mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                        <ShieldAlert size={14} />
                                        <span>Configuration / Details</span>
                                    </div>
                                    <button onClick={() => navigator.clipboard.writeText(viewError.details!)} className="text-[10px] text-blue-500 hover:underline">Copy</button>
                                </div>
                                <pre className="block text-xs font-mono text-muted-foreground/80 break-all whitespace-pre-wrap overflow-auto max-h-48 p-1">
                                    {viewError.details}
                                </pre>
                            </div>
                        )}

                        <div className="flex gap-4">
                            {viewError.docLink && (
                                <a
                                    href={viewError.docLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-4 py-2 border border-border rounded-full text-sm font-medium hover:bg-secondary transition-colors flex items-center gap-2"
                                >
                                    <Link size={14} /> Troubleshooting Guide
                                </a>
                            )}

                            <button
                                onClick={() => setRefreshTrigger(p => p + 1)}
                                className="px-6 py-2 bg-foreground text-background rounded-full text-sm font-medium hover:opacity-90 transition-opacity shadow-lg"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                ) : (
                    !loading && (
                        <div className="p-2 md:p-6 min-h-full">
                            {filteredFiles.length === 0 && search && (
                                <div className="text-center text-muted-foreground py-12">
                                    <Search size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">No results found for "{search}"</p>
                                    <p className="text-sm">Try adjusting your search or clearing the filter.</p>
                                </div>
                            )}
                            {filteredFiles.length === 0 && !search && (
                                <div className="text-center text-muted-foreground py-12">
                                    <FileIcon size={48} className="mx-auto mb-4 opacity-30" />
                                    <p className="text-lg font-medium">This folder is empty.</p>
                                    {!readOnly && <p className="text-sm">Upload files or create a new one to get started.</p>}
                                </div>
                            )}

                            {viewMode === ViewMode.LIST ? (
                                isMobile ? (
                                    <div className="flex flex-col divide-y divide-border pb-20">
                                        {filteredFiles.map((file) => {
                                            const isSelected = selectedKeys.has(file.key);
                                            return (
                                                <SwipeableListItem
                                                    key={file.key}
                                                    actions={[
                                                        { id: 'share', icon: Share2, label: 'Share', color: 'blue' },
                                                        { id: 'move', icon: FolderInput, label: 'Move', color: 'yellow' },
                                                        { id: 'delete', icon: Trash2, label: 'Delete', color: 'red' }
                                                    ]}
                                                    onSwipeLeft={(actionId) => {
                                                        if (actionId === 'share') openShareModal(file);
                                                        if (actionId === 'move') {
                                                            setSelectedKeys(new Set([file.key]));
                                                            openMoveModal();
                                                        }
                                                        if (actionId === 'delete') {
                                                            setSelectedKeys(new Set([file.key]));
                                                            setDeleteConfirmation({ show: true });
                                                        }
                                                    }}
                                                    onSwipeRight={() => {
                                                        const newSelected = new Set(selectedKeys);
                                                        if (newSelected.has(file.key)) {
                                                            newSelected.delete(file.key);
                                                        } else {
                                                            newSelected.add(file.key);
                                                        }
                                                        setSelectedKeys(newSelected);
                                                    }}
                                                >
                                                    <div
                                                        className={`p-4 flex items-center gap-4 bg-background active:bg-secondary/50 transition-colors ${isSelected ? 'bg-blue-500/10' : ''}`}
                                                        onClick={(e) => handleItemClick(file, e)}
                                                    >
                                                        <div className="shrink-0 text-muted-foreground">
                                                            {getIcon(file, 24)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`font-medium truncate text-sm ${isSelected ? 'text-blue-500' : 'text-foreground'}`}>{file.name}</p>
                                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                                <span>{file.lastModified.toLocaleDateString()}</span>
                                                                {!file.isFolder && (
                                                                    <>
                                                                        <span>•</span>
                                                                        <span>{formatBytes(file.size)}</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {isSelected && <CheckCircle2 size={20} className="text-blue-500 shrink-0" />}
                                                    </div>
                                                </SwipeableListItem>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-lg border border-border overflow-hidden bg-card/50">
                                        {filteredFiles.length > 0 && (
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-secondary border-b border-border text-muted-foreground font-medium">
                                                    <tr>
                                                        {selectionMode && (
                                                            <th className="px-4 py-3 font-medium w-12">
                                                                <div className="w-4 h-4 rounded border border-muted-foreground/50 flex items-center justify-center"><div className="w-2 h-2 bg-transparent"></div></div>
                                                            </th>
                                                        )}
                                                        <th className="px-4 py-3 font-medium">Name</th>
                                                        <th className="px-4 py-3 font-medium hidden sm:table-cell">Size</th>
                                                        <th className="px-4 py-3 font-medium hidden md:table-cell">Modified</th>
                                                        <th className="px-4 py-3 w-[120px]"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-border">
                                                    {filteredFiles.map((file, index) => {
                                                        const isSelected = selectedKeys.has(file.key);
                                                        return (
                                                            <tr
                                                                key={file.key}
                                                                className={`
                                                  group transition-colors cursor-pointer select-none
                                                  ${isSelected ? 'bg-blue-500/10 border-blue-500/20' : 'hover:bg-secondary/50'}
                                              `}
                                                                onClick={(e) => handleItemClick(file, e)}
                                                                onTouchStart={(e) => handleLongPressStart(file, e)}
                                                                onTouchEnd={(e) => {
                                                                    handleLongPressEnd();
                                                                    e.preventDefault();
                                                                    handleItemClick(file, e as any);
                                                                }}
                                                                onTouchMove={handleLongPressEnd}
                                                                onMouseDown={(e) => handleLongPressStart(file, e)}
                                                                onMouseUp={handleLongPressEnd}
                                                                onMouseLeave={handleLongPressEnd}
                                                            >
                                                                {selectionMode && (
                                                                    <td className="px-2 sm:px-4 py-3">
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-muted-foreground/30 bg-background'}`}>
                                                                            {isSelected && <Check size={10} className="text-white" />}
                                                                        </div>
                                                                    </td>
                                                                )}
                                                                <td className="px-2 sm:px-4 py-3">
                                                                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                                                        <div className="shrink-0">{getIcon(file, 18)}</div>
                                                                        <span className={`font-medium truncate min-w-0 flex-1 block text-sm ${isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-foreground'}`}>{file.name}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 sm:px-4 py-3 text-muted-foreground font-mono text-xs hidden sm:table-cell whitespace-nowrap">{!file.isFolder && formatBytes(file.size)}</td>
                                                                <td className="px-2 sm:px-4 py-3 text-muted-foreground text-xs hidden md:table-cell whitespace-nowrap">{file.lastModified.toLocaleDateString()}</td>
                                                                <td className="px-2 sm:px-4 py-3">
                                                                    {!selectionMode && (
                                                                        <div className="flex items-center justify-end gap-0.5 sm:gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                                                            <button onClick={(e) => { e.stopPropagation(); handleDownload(file) }} className="p-1 sm:p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground" title="Download"><Download size={14} className="sm:w-4 sm:h-4" /></button>
                                                                            <button onClick={(e) => { e.stopPropagation(); openShareModal(file) }} className="p-1 sm:p-1.5 hover:bg-secondary rounded text-muted-foreground hover:text-foreground hidden sm:inline-flex" title="Share"><Share2 size={14} className="sm:w-4 sm:h-4" /></button>
                                                                        </div>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        )}
                                    </div>
                                )
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                    {filteredFiles.map((file, index) => {
                                        const isSelected = selectedKeys.has(file.key);

                                        return (
                                            <div
                                                key={file.key}
                                                onClick={(e) => handleItemClick(file, e)}
                                                onTouchStart={(e) => handleLongPressStart(file, e)}
                                                onTouchEnd={(e) => {
                                                    handleLongPressEnd();
                                                    e.preventDefault();
                                                    handleItemClick(file, e as any);
                                                }}
                                                onTouchMove={handleLongPressEnd}
                                                onMouseDown={(e) => handleLongPressStart(file, e)}
                                                onMouseUp={handleLongPressEnd}
                                                onMouseLeave={handleLongPressEnd}
                                                className={`
                                 group relative border rounded-lg p-3 sm:p-4 flex flex-col items-center text-center transition-all cursor-pointer aspect-[1/1.1]
                                 ${isSelected ? 'bg-blue-500/10 border-blue-500/50 shadow-md' : 'bg-card border-border hover:border-foreground/50 hover:shadow-lg'}
                             `}
                                            >
                                                {selectionMode && (
                                                    <div className={`absolute top-2 left-2 w-4 h-4 rounded border flex items-center justify-center transition-colors z-10 ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-muted-foreground/30 bg-background'}`}>
                                                        {isSelected && <Check size={10} className="text-white" />}
                                                    </div>
                                                )}

                                                <div className="flex-1 flex items-center justify-center w-full overflow-hidden">
                                                    {getIcon(file, 48, "w-12 h-12")}
                                                </div>
                                                <p className={`w-full mt-3 text-sm font-medium truncate px-1 ${isSelected ? 'text-blue-500 dark:text-blue-400' : 'text-foreground'}`}>{file.name}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            {/* Floating Action Bar for Selection */}
            {/* Floating Action Bar for Selection - Dynamic positioning */}
            {selectedKeys.size > 0 && (
                <div className="fixed left-1/2 -translate-x-1/2 bg-foreground text-background px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl flex items-center gap-3 sm:gap-6 animate-in slide-in-from-bottom-4 z-50" style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}>
                    <span className="font-bold text-xs sm:text-sm">{selectedKeys.size} selected</span>
                    <div className="h-4 w-px bg-background/20"></div>
                    <div className="flex items-center gap-1 sm:gap-2">
                        <button onClick={handleBulkDownload} className="p-1.5 sm:p-2 hover:bg-background/20 rounded-full transition-colors" title="Download Selected"><Download size={18} className="sm:w-5 sm:h-5" /></button>
                        {!readOnly && <button onClick={openMoveModal} className="p-1.5 sm:p-2 hover:bg-background/20 rounded-full transition-colors hidden sm:inline-flex" title="Move Selected"><Move size={18} className="sm:w-5 sm:h-5" /></button>}
                        {!readOnly && <button onClick={() => setDeleteConfirmation({ show: true, isBulk: true })} className="p-1.5 sm:p-2 hover:bg-red-500/20 hover:text-red-300 rounded-full transition-colors" title="Delete Selected"><Trash2 size={18} className="sm:w-5 sm:h-5" /></button>}
                        <button onClick={() => setSelectedKeys(new Set())} className="p-1.5 sm:p-2 hover:bg-background/20 rounded-full transition-colors ml-1 sm:ml-2"><X size={18} className="sm:w-5 sm:h-5" /></button>
                    </div>
                </div>
            )}

            {/* Long-press Context Menu */}
            {contextMenu.show && contextMenu.file && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-50" onClick={() => setContextMenu({ show: false, file: null, x: 0, y: 0 })} />

                    {/* Context Menu */}
                    <div
                        className="fixed bg-card border border-border rounded-lg shadow-2xl py-2 z-50 min-w-[200px] animate-in fade-in zoom-in-95 duration-200"
                        style={{
                            left: `${Math.min(contextMenu.x, window.innerWidth - 220)}px`,
                            top: `${Math.min(contextMenu.y, window.innerHeight - 300)}px`
                        }}
                    >
                        <div className="px-3 py-2 border-b border-border">
                            <div className="flex items-center gap-2">
                                {getIcon(contextMenu.file, 16)}
                                <span className="text-sm font-medium truncate max-w-[150px]">{contextMenu.file.name}</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                if (contextMenu.file!.isFolder) {
                                    handleNavigate(contextMenu.file!.key);
                                } else {
                                    handlePreview(contextMenu.file!);
                                }
                                setContextMenu({ show: false, file: null, x: 0, y: 0 });
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 transition-colors"
                        >
                            <Eye size={16} />
                            {contextMenu.file.isFolder ? 'Open' : 'Preview'}
                        </button>

                        <button
                            onClick={() => {
                                handleDownload(contextMenu.file!);
                                setContextMenu({ show: false, file: null, x: 0, y: 0 });
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 transition-colors"
                        >
                            <Download size={16} />
                            Download
                        </button>

                        <button
                            onClick={() => {
                                openShareModal(contextMenu.file!);
                                setContextMenu({ show: false, file: null, x: 0, y: 0 });
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 transition-colors"
                        >
                            <Share2 size={16} />
                            Share
                        </button>

                        <button
                            onClick={() => {
                                handleCopyS3Path(contextMenu.file!);
                                setContextMenu({ show: false, file: null, x: 0, y: 0 });
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 transition-colors"
                        >
                            <Link size={16} />
                            Copy S3 URI
                        </button>

                        {!readOnly && (
                            <>
                                <div className="h-px bg-border my-1" />
                                <button
                                    onClick={() => {
                                        const newSelected = new Set(selectedKeys);
                                        newSelected.add(contextMenu.file!.key);
                                        setSelectedKeys(newSelected);
                                        setSelectionMode(true);
                                        setContextMenu({ show: false, file: null, x: 0, y: 0 });
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary flex items-center gap-2 transition-colors"
                                >
                                    <CheckSquare size={16} />
                                    Select
                                </button>
                            </>
                        )}
                    </div>
                </>
            )}



        </div>
    );
};

export default Explorer;
