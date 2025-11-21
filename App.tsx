
import React, { useState, useRef, useEffect } from 'react';
import Login from './components/Login';
import Explorer from './components/Explorer';
import Landing from './components/Landing';
import BucketList from './components/BucketList';
import CommandPalette from './components/CommandPalette';
import { S3Config, UploadTask, BucketObject } from './types';
import { LogOut, Loader2, CheckCircle, XCircle, ChevronDown, Database, Sun, Moon, Folder, UploadCloud } from 'lucide-react';
import { S3Service, formatBytes } from './services/s3Service';
import { cryptoService } from './services/cryptoService';

// App states
type AppState = 'landing' | 'login' | 'app';
const PROFILES_KEY = 's4_profiles_v1';

const App = () => {
    const [view, setView] = useState<AppState>('landing');
    const [config, setConfig] = useState<S3Config | null>(null);
    const [uploads, setUploads] = useState<Record<string, UploadTask>>({});
    const [showUploads, setShowUploads] = useState(false);
    const [currentBucket, setCurrentBucket] = useState<string | null>(null);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    // Profile Management
    const [profiles, setProfiles] = useState<S3Config[]>([]);
    const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);

    // We need a list of buckets for the command palette.
    const [availableBuckets, setAvailableBuckets] = useState<BucketObject[]>([]);

    const s3Ref = useRef<S3Service | null>(null);

    // Check if user has visited before to skip landing
    useEffect(() => {
        const visited = localStorage.getItem('s4_has_visited');
        if (visited) {
            setView('login');
        }
        // Initialize theme state based on DOM
        setIsDarkMode(document.documentElement.classList.contains('dark'));
        loadProfiles();
    }, []);

    // Update theme-color meta tag based on view and dark mode
    useEffect(() => {
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) return;

        let color = '#16181D'; // Dark mode default
        
        if (view === 'landing') {
            color = isDarkMode ? '#0f1318' : '#e8f0ff';
        } else {
            color = isDarkMode ? '#16181D' : '#ffffff';
        }
        
        metaThemeColor.setAttribute('content', color);
    }, [view, isDarkMode]);

    // Load Profiles from Local Storage
    const loadProfiles = async () => {
        const saved = localStorage.getItem(PROFILES_KEY);
        if (saved) {
            try {
                const decrypted = await cryptoService.decrypt(saved);
                if (Array.isArray(decrypted)) {
                    setProfiles(decrypted);
                }
            } catch (e) {
                console.error("Failed to load profiles", e);
            }
        }
        setIsLoadingProfiles(false);
    };

    // Save Profile
    const handleSaveProfile = async (newProfile: S3Config) => {
        const updatedProfiles = [...profiles.filter(p => p.id !== newProfile.id), newProfile];
        setProfiles(updatedProfiles);
        try {
            const encrypted = await cryptoService.encrypt(updatedProfiles);
            localStorage.setItem(PROFILES_KEY, encrypted);
        } catch (e) {
            console.error("Failed to save profile", e);
        }
        return updatedProfiles;
    };

    // Delete Profile
    const handleDeleteProfile = async (id: string) => {
        const updatedProfiles = profiles.filter(p => p.id !== id);
        setProfiles(updatedProfiles);
        try {
            const encrypted = await cryptoService.encrypt(updatedProfiles);
            localStorage.setItem(PROFILES_KEY, encrypted);
        } catch (e) {
            console.error("Failed to delete profile", e);
        }
    };

    // Global Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                if (view === 'app') {
                    setIsCommandPaletteOpen(prev => !prev);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [view]);

    // Fetch buckets for palette when it opens
    useEffect(() => {
        if (isCommandPaletteOpen && s3Ref.current) {
            s3Ref.current.listBuckets().then(setAvailableBuckets).catch(console.error);
        }
    }, [isCommandPaletteOpen]);

    const handleGetStarted = () => {
        localStorage.setItem('s4_has_visited', 'true');
        setView('login');
    };

    const handleConnect = (cfg: S3Config) => {
        setConfig(cfg);
        if (cfg.bucketName) {
            setCurrentBucket(cfg.bucketName);
        }
        s3Ref.current = new S3Service(cfg);
        setView('app');
    };

    const handleDisconnect = () => {
        setConfig(null);
        s3Ref.current = null;
        setUploads({});
        setCurrentBucket(null);
        setView('login');
    };

    const handleSelectBucket = (name: string) => {
        setCurrentBucket(name);
        if (s3Ref.current && config) {
            const newConfig = { ...config, bucketName: name };
            setConfig(newConfig);
            s3Ref.current.updateConfig(newConfig);
        }
    };

    const handleToggleTheme = () => {
        document.documentElement.classList.toggle('dark');
        const newDarkMode = !document.documentElement.classList.contains('dark');
        setIsDarkMode(newDarkMode);
        
        // Update theme-color immediately for Safari
        const metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (metaThemeColor) {
            const color = newDarkMode ? '#16181D' : '#ffffff';
            metaThemeColor.setAttribute('content', color);
        }
    };

    const handleUpload = async (file: File, prefix: string, onComplete: () => void) => {
        if (!s3Ref.current || !currentBucket) return;

        const taskId = Math.random().toString(36).substring(7);
        const startTime = Date.now();

        setUploads(prev => ({
            ...prev,
            [taskId]: {
                id: taskId,
                fileName: file.name,
                progress: 0,
                status: 'uploading',
                loaded: 0,
                total: file.size
            }
        }));

        setShowUploads(true);

        try {
            await s3Ref.current.uploadFile(file, prefix, (progress, loaded, total) => {
                const now = Date.now();
                const duration = (now - startTime) / 1000; // seconds
                const speedBytesPerSec = duration > 0 ? loaded / duration : 0;

                setUploads(prev => ({
                    ...prev,
                    [taskId]: {
                        ...prev[taskId],
                        progress,
                        loaded,
                        total,
                        speed: `${formatBytes(speedBytesPerSec)}/s`
                    }
                }));
            });

            setUploads(prev => ({
                ...prev,
                [taskId]: { ...prev[taskId], status: 'completed', progress: 100 }
            }));

            onComplete();

            setTimeout(() => {
                setUploads(current => {
                    const allDone = (Object.values(current) as UploadTask[]).every(t => t.status !== 'uploading');
                    if (allDone) setShowUploads(false);
                    return current;
                });
            }, 3000);

        } catch (error: any) {
            setUploads(prev => ({
                ...prev,
                [taskId]: { ...prev[taskId], status: 'error', error: error.message }
            }));
        }
    };

    if (view === 'landing') {
        return <Landing onGetStarted={handleGetStarted} />;
    }

    if (view === 'login') {
        return (
            <Login
                onConnect={handleConnect}
                profiles={profiles}
                onSaveProfile={handleSaveProfile}
                onDeleteProfile={handleDeleteProfile}
                loadingProfiles={isLoadingProfiles}
            />
        );
    }

    if (!config || !s3Ref.current) {
        // Fallback if state is inconsistent
        return (
            <Login
                onConnect={handleConnect}
                profiles={profiles}
                onSaveProfile={handleSaveProfile}
                onDeleteProfile={handleDeleteProfile}
                loadingProfiles={isLoadingProfiles}
            />
        );
    }

    const activeUploads = (Object.values(uploads) as UploadTask[]).filter(u => u.status === 'uploading');
    const activeCount = activeUploads.length;
    const totalUploads = Object.values(uploads) as UploadTask[];

    return (
        <div className="h-screen w-full bg-background text-foreground flex flex-col overflow-hidden font-sans selection:bg-blue-500/30">
            <CommandPalette
                isOpen={isCommandPaletteOpen}
                onClose={() => setIsCommandPaletteOpen(false)}
                buckets={availableBuckets}
                profiles={profiles}
                onSelectBucket={handleSelectBucket}
                onSwitchProfile={handleConnect}
                onToggleTheme={handleToggleTheme}
                onDisconnect={handleDisconnect}
            />

            {/* Global Header */}
            <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4 shrink-0 z-20 relative safe-area-inset-top transition-colors duration-300">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-foreground rounded-lg flex items-center justify-center shadow-sm cursor-pointer hover:opacity-90 transition-opacity" onClick={() => setCurrentBucket(null)}>
                        <span className="font-bold text-background text-xs tracking-tighter">S4</span>
                    </div>

                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground hidden sm:inline-block leading-none">{config.label || 'Storage Explorer'}</span>
                        <span className="text-[10px] text-muted-foreground hidden sm:inline-block leading-none mt-0.5">{config.endpoint}</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {totalUploads.length > 0 && (
                        <div className="relative">
                            <button
                                onClick={() => setShowUploads(!showUploads)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border transition-all ${activeCount > 0
                                    ? 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                    : 'bg-secondary border-border text-muted-foreground'
                                    }`}
                            >
                                {activeCount > 0 ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                                <span className="text-xs font-medium hidden sm:inline">
                                    {activeCount > 0 ? `${activeCount} Uploading` : 'Uploads Done'}
                                </span>
                                <ChevronDown size={12} />
                            </button>

                            {showUploads && (
                                <div className="absolute top-full right-0 mt-2 w-72 md:w-80 bg-card border border-border rounded-lg shadow-2xl overflow-hidden z-50 animate-in slide-in-from-top-2">
                                    <div className="bg-secondary/50 px-3 py-2 border-b border-border flex justify-between items-center">
                                        <span className="text-xs font-semibold">Upload Queue</span>
                                        <button onClick={() => setUploads({})} className="text-[10px] text-muted-foreground hover:text-foreground">Clear All</button>
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1">
                                        {totalUploads.slice().reverse().map(task => (
                                            <div key={task.id} className="p-2 border-b border-border/50 last:border-0 text-sm">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="truncate font-medium max-w-[70%]">{task.fileName}</span>
                                                    {task.status === 'uploading' && <span className="text-[10px] font-mono text-blue-400">{task.progress}%</span>}
                                                </div>
                                                {task.status === 'uploading' ? (
                                                    <div className="space-y-1">
                                                        <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                                                            <div className="h-full bg-blue-500 transition-all duration-300" style={{ width: `${task.progress}%` }}></div>
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-muted-foreground">
                                                            <span>{formatBytes(task.loaded || 0)} / {formatBytes(task.total || 0)}</span>
                                                            <span>{task.speed}</span>
                                                        </div>
                                                    </div>
                                                ) : task.status === 'completed' ? (
                                                    <div className="flex items-center gap-1 text-green-500 text-xs">
                                                        <CheckCircle size={12} />
                                                        <span>Completed</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-destructive text-xs">
                                                        <XCircle size={12} />
                                                        <span>Error</span>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>

                    <button
                        onClick={handleToggleTheme}
                        className="p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                        title="Toggle Theme"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>

                    <button
                        onClick={handleDisconnect}
                        className="group flex items-center gap-2 px-2 py-1.5 sm:px-3 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                        title="Disconnect"
                    >
                        <LogOut size={16} />
                        <span className="text-xs font-medium hidden sm:inline">Disconnect</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                <div className={`flex-col bg-background border-r border-border shrink-0 transition-all duration-300 ${currentBucket ? 'hidden md:flex md:w-64' : 'flex w-full md:w-64'}`}>
                    <BucketList
                        s3={s3Ref.current}
                        selectedBucket={currentBucket}
                        onSelectBucket={handleSelectBucket}
                        provider={config.provider}
                    />
                </div>

                <main className={`flex-1 flex-col min-w-0 bg-background transition-all ${!currentBucket ? 'hidden md:flex' : 'flex'}`}>
                    {currentBucket ? (
                        <Explorer
                            s3={s3Ref.current}
                            bucketName={currentBucket}
                            onUpload={handleUpload}
                            readOnly={config.readOnly}
                            onBackToBuckets={() => setCurrentBucket(null)}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center animate-in fade-in duration-500">
                            <div className="w-16 h-16 bg-secondary/50 rounded-2xl flex items-center justify-center mb-4 border border-border">
                                <Database size={32} className="opacity-50" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground mb-2">No Bucket Selected</h2>
                            <p className="text-sm max-w-md">Select a bucket from the sidebar to view its contents.</p>
                            <p className="text-xs text-muted-foreground mt-8"><kbd className="border border-border px-1 rounded">Cmd+K</kbd> for commands</p>
                        </div>
                    )}
                </main>
            </div>

        </div>
    );
};

export default App;
