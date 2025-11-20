
import React, { useEffect, useState } from 'react';
import { S3Service, formatBytes } from '../services/s3Service';
import { BucketObject } from '../types';
import { Database, Loader2, Search, RefreshCw, Plus, Trash2, X, AlertTriangle, Cloud, CloudLightning, Server, Globe, AlertCircle, HardDrive } from 'lucide-react';

interface BucketListProps {
    s3: S3Service;
    selectedBucket: string | null;
    onSelectBucket: (name: string) => void;
    provider?: string;
}

const BucketList: React.FC<BucketListProps> = ({ s3, selectedBucket, onSelectBucket, provider }) => {
    const [buckets, setBuckets] = useState<BucketObject[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<{ message: string, detail?: string } | null>(null);
    const [search, setSearch] = useState('');

    // Create & Delete States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newBucketName, setNewBucketName] = useState('');
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean, name: string | null }>({ show: false, name: null });
    const [actionLoading, setActionLoading] = useState(false);

    // Storage tracking
    const [totalStorage, setTotalStorage] = useState<number | null>(null);
    const [storageLoading, setStorageLoading] = useState(false);

    // Pull-to-refresh state
    const [isPulling, setIsPulling] = useState(false);
    const [pullDistance, setPullDistance] = useState(0);
    const pullStartY = React.useRef(0);
    const listRef = React.useRef<HTMLDivElement>(null);

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
            await loadBuckets();
        }
        setIsPulling(false);
        setPullDistance(0);
        pullStartY.current = 0;
    };

    const loadBuckets = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await s3.listBuckets();
            setBuckets(data);
        } catch (err: any) {
            console.error("Bucket List Error:", err);

            if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
                setError({
                    message: "Connection Failed",
                    detail: "CORS or Network Error. Check browser console."
                });
            } else if (err.name === 'AccessDenied') {
                setError({
                    message: "Access Denied",
                    detail: "Missing s3:ListAllMyBuckets permission."
                });
            } else {
                setError({ message: "Failed to load buckets" });
            }
        } finally {
            setLoading(false);
        }
    };

    // Calculate total storage across all accessible buckets
    const calculateTotalStorage = async () => {
        setStorageLoading(true);
        try {
            let total = 0;
            // Try to calculate for each bucket, skip if permission denied
            for (const bucket of buckets) {
                try {
                    const size = await s3.getBucketSize(bucket.name);
                    total += size;
                } catch (err: any) {
                    // Skip buckets we don't have permission to access
                    console.warn(`Cannot calculate size for ${bucket.name}:`, err.message);
                }
            }
            setTotalStorage(total);
        } catch (err) {
            console.error('Error calculating storage:', err);
            setTotalStorage(null);
        } finally {
            setStorageLoading(false);
        }
    };

    useEffect(() => {
        loadBuckets();
    }, []);

    // Calculate storage when buckets change
    useEffect(() => {
        if (buckets.length > 0 && !error) {
            calculateTotalStorage();
        }
    }, [buckets]);

    const handleCreateBucket = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBucketName.trim()) return;
        setActionLoading(true);
        try {
            await s3.createBucket(newBucketName);
            setNewBucketName('');
            setIsCreateModalOpen(false);
            loadBuckets();
        } catch (err: any) {
            alert("Failed to create bucket: " + (err.message || "Unknown error"));
        } finally {
            setActionLoading(false);
        }
    };

    const handleDeleteRequest = (e: React.MouseEvent, name: string) => {
        e.stopPropagation();
        setDeleteConfirmation({ show: true, name });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation.name) return;
        setActionLoading(true);
        try {
            await s3.deleteBucket(deleteConfirmation.name);
            setDeleteConfirmation({ show: false, name: null });
            if (selectedBucket === deleteConfirmation.name) {
                onSelectBucket('');
            }
            loadBuckets();
        } catch (err: any) {
            if (err.name === 'BucketNotEmpty') {
                alert("Cannot delete bucket: The bucket is not empty.");
            } else if (err.name === 'AccessDenied') {
                alert("Access Denied: You do not have permission to delete this bucket.");
            } else {
                alert("Failed to delete bucket: " + (err.message || "Unknown error"));
            }
        } finally {
            setActionLoading(false);
        }
    };

    const getProviderIcon = () => {
        switch (provider) {
            case 'aws': return Cloud;
            case 'cloudflare': return CloudLightning;
            case 'minio': return Server;
            case 'other': return Globe;
            default: return Database;
        }
    };

    const ProviderIcon = getProviderIcon();
    const filteredBuckets = buckets.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="flex flex-col h-full w-full bg-background relative">

            {/* Create Bucket Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsCreateModalOpen(false)}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Create Bucket</h3>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleCreateBucket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">Bucket Name</label>
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="my-new-bucket"
                                    className="w-full bg-secondary border border-input rounded-md px-3 py-2 text-sm focus:border-foreground outline-none transition-colors"
                                    value={newBucketName}
                                    onChange={(e) => setNewBucketName(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground mt-1">Bucket names must be unique and lowercase.</p>
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !newBucketName}
                                    className="px-4 py-2 rounded-md text-sm font-medium bg-foreground text-background hover:bg-white/90 transition-colors disabled:opacity-70 flex items-center gap-2"
                                >
                                    {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                    Create
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation.show && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setDeleteConfirmation({ show: false, name: null })}>
                    <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                                <AlertTriangle className="text-destructive w-5 h-5" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Delete Bucket</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
                            Are you sure you want to delete <span className="font-medium text-foreground bg-secondary px-1.5 py-0.5 rounded text-xs">{deleteConfirmation.name}</span>? This action cannot be undone and the bucket must be empty.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteConfirmation({ show: false, name: null })}
                                className="px-4 py-2 rounded-md text-sm font-medium hover:bg-secondary transition-colors border border-transparent hover:border-border"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                disabled={actionLoading}
                                className="px-4 py-2 rounded-md text-sm font-medium bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity shadow-sm flex items-center gap-2"
                            >
                                {actionLoading && <Loader2 size={14} className="animate-spin" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Header */}
            <div className="p-4 border-b border-border bg-background/50 sticky top-0 z-10 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                        <ProviderIcon size={14} className="text-foreground/70" />
                        Buckets
                    </h2>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                            title="New Bucket"
                        >
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={loadBuckets}
                            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className="absolute left-2.5 top-2 text-muted-foreground w-3.5 h-3.5 group-focus-within:text-foreground transition-colors" />
                    <input
                        type="text"
                        placeholder="Filter buckets..."
                        className="w-full bg-secondary/50 border border-border/50 focus:border-border rounded-md pl-8 pr-3 py-1.5 text-xs outline-none transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Pull Refresh Spinner */}
            <div className="absolute top-28 left-0 right-0 flex justify-center z-0">
                <Loader2 className={`w-6 h-6 text-blue-500 transition-all duration-200 ${isPulling ? 'opacity-100' : 'opacity-0'} ${pullDistance > 50 ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullDistance * 3}deg)` }} />
            </div>

            {/* Bucket List */}
            <div
                ref={listRef}
                className="flex-1 overflow-y-auto p-2 custom-scrollbar relative z-10 bg-background transition-transform duration-200 ease-out"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ transform: isPulling ? `translateY(${pullDistance}px)` : 'none' }}
            >
                {loading && buckets.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="w-5 h-5 animate-spin mb-2 opacity-50" />
                        <span className="text-xs">Loading...</span>
                    </div>
                )}

                {error && (
                    <div className="p-3 bg-destructive/10 rounded-md border border-destructive/20 mx-2 mt-2">
                        <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-destructive" />
                            <span className="text-xs text-destructive font-bold">{error.message}</span>
                        </div>
                        {error.detail && <p className="text-[10px] text-destructive/80 pl-6 mb-2">{error.detail}</p>}
                        <button onClick={loadBuckets} className="w-full text-[10px] bg-background/50 hover:bg-background px-2 py-1.5 rounded text-destructive transition-colors border border-destructive/20">Retry Connection</button>
                    </div>
                )}

                {!loading && !error && (
                    <div className="space-y-0.5">
                        {filteredBuckets.map(bucket => (
                            <div
                                key={bucket.name}
                                onClick={() => onSelectBucket(bucket.name)}
                                className={`
                            group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all text-sm
                            ${selectedBucket === bucket.name
                                        ? 'bg-foreground text-background shadow-sm font-medium'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'}
                         `}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Database size={16} className={selectedBucket === bucket.name ? 'text-background' : 'text-muted-foreground group-hover:text-foreground'} />
                                    <span className="truncate">{bucket.name}</span>
                                </div>

                                <button
                                    onClick={(e) => handleDeleteRequest(e, bucket.name)}
                                    className={`
                                   p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all
                                   ${selectedBucket === bucket.name
                                            ? 'hover:bg-black/20 text-background'
                                            : 'hover:bg-destructive/10 hover:text-destructive text-muted-foreground'}
                               `}
                                    title="Delete Bucket"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && !error && filteredBuckets.length === 0 && (
                    <div className="text-center py-8 px-4">
                        <p className="text-xs text-muted-foreground mb-2">No buckets found</p>
                    </div>
                )}
            </div>

            {/* Storage Summary - Sticky on mobile */}
            {!error && buckets.length > 0 && (
                <div className="p-4 border-t border-border bg-background/95 backdrop-blur-sm md:bg-background/50 sticky bottom-0 md:relative">
                    <div className="bg-card dark:bg-[#16181D] rounded-lg p-3 border border-border shadow-inner group/storage hover:border-foreground/20 transition-colors">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-2">
                            <div className="flex items-center gap-1.5">
                                <HardDrive size={12} className="text-foreground/70" />
                                <span>Total Storage</span>
                            </div>
                            {storageLoading ? (
                                <Loader2 size={10} className="animate-spin text-muted-foreground" />
                            ) : totalStorage !== null ? (
                                <span className="text-foreground font-medium">{formatBytes(totalStorage)}</span>
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                        {totalStorage !== null && !storageLoading && (
                            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] transition-all duration-500"
                                    style={{ width: `${Math.min((totalStorage / (1024 * 1024 * 1024 * 100)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BucketList;
