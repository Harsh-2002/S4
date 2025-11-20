
import React from 'react';
import {
    ArrowRight, Globe, Zap, Github, UploadCloud, Eye,
    Database, CloudLightning, Search,
    Folder, Image as ImageIcon, FileCode, MoreHorizontal, ShieldCheck,
    Sparkles, LayoutGrid, ChevronRight, Command, User, Bell, Settings,
    Star, Clock, HardDrive, MoreVertical, List, Filter, Code2,
    Smartphone, WifiOff, Download, Heart
} from 'lucide-react';

interface LandingProps {
    onGetStarted: () => void;
}

const Landing: React.FC<LandingProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen w-full bg-background text-foreground font-sans flex flex-col relative overflow-y-auto overflow-x-hidden scroll-smooth selection:bg-blue-500/30 transition-colors duration-300">
            {/* Animation Styles */}
            <style>{`
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 4rem 4rem; }
        }
        .animate-grid {
          animation: grid-move 60s linear infinite;
        }
        .perspective-container {
          perspective: 2000px;
        }
      `}</style>

            {/* Top Blur Gradient (Mobile Only) */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-background via-background to-transparent z-0"></div>

            {/* Decorative Grids with Animation - Adaptive */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)] md:[mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_60%,transparent_100%)] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_20%,#000_60%,transparent_100%)] pointer-events-none animate-grid z-0"></div>

            {/* Top Ambient Light */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none z-0 mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-100"></div>

            <main className="flex-1 flex flex-col items-center justify-start text-center z-10 pt-20 pb-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header Section */}
                <div className="flex flex-col items-center gap-8 mb-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">

                    {/* Open Source Badge */}
                    <a
                        href="https://github.com/Harsh-2002/S4"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border bg-background/50 hover:bg-secondary backdrop-blur-md text-[10px] uppercase tracking-widest font-semibold text-muted-foreground hover:text-foreground transition-all cursor-pointer group shadow-sm"
                    >
                        <Github size={12} className="group-hover:text-foreground transition-colors" />
                        Open Source
                    </a>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tighter text-foreground leading-[1.1] drop-shadow-sm dark:drop-shadow-2xl">
                        The modern interface for <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-b from-foreground via-foreground to-foreground/40">your cloud storage.</span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
                        A blazing fast, client-side S3 explorer. <br className="hidden sm:block" />
                        Supports AWS S3, Cloudflare R2, MinIO, and more. <br className="hidden sm:block" />
                        No servers, no tracking, just your data.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 mt-2 w-full sm:w-auto">
                        <button
                            onClick={onGetStarted}
                            className="h-12 px-8 rounded-full bg-foreground text-background font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95 shadow-lg"
                        >
                            Launch App <ArrowRight size={18} />
                        </button>
                        <a
                            href="https://github.com/Harsh-2002/S4"
                            target="_blank"
                            rel="noreferrer"
                            className="h-12 px-8 rounded-full border border-border bg-background/50 text-foreground font-medium hover:bg-secondary/50 transition-all flex items-center justify-center gap-2 backdrop-blur-sm"
                        >
                            <Github size={18} /> Star on GitHub
                        </a>
                    </div>
                </div>

                {/* UI Illustration / Mockup */}
                <div className="w-full max-w-6xl mt-4 mb-8 md:mb-32 perspective-container group relative px-2 md:px-0 overflow-hidden">

                    {/* Dynamic Interactive Glow Background */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 rounded-[1.5rem] blur-2xl opacity-50 group-hover:opacity-75 transition-all duration-700 will-change-transform"></div>

                    {/* Main Window Container */}
                    {/* Desktop: Interactive HTML Mockup */}
                    <div className="hidden md:block relative rounded-xl bg-background dark:bg-[#0F1115] border border-border shadow-2xl overflow-hidden transition-all duration-500 ease-out group-hover:shadow-blue-500/20 ring-1 ring-border group-hover:ring-blue-500/30">

                        {/* Mockup Header */}
                        <div className="h-12 bg-secondary/30 dark:bg-[#16181D] border-b border-border flex items-center px-4 justify-between shrink-0 select-none">
                            {/* Window Controls */}
                            <div className="flex items-center gap-2 w-20 opacity-60 group-hover:opacity-100 transition-opacity">
                                <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E] hover:bg-[#FF5F57]/80 shadow-inner"></div>
                                <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24] hover:bg-[#FEBC2E]/80 shadow-inner"></div>
                                <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29] hover:bg-[#28C840]/80 shadow-inner"></div>
                            </div>

                            {/* Search Bar */}
                            <div className="flex-1 max-w-xl mx-4">
                                <div className="w-full bg-background dark:bg-[#0A0B0E] border border-border dark:border-white/5 rounded-md h-8 flex items-center px-3 gap-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all cursor-text group/search shadow-inner">
                                    <Search size={12} className="text-muted-foreground/70 group-hover/search:text-muted-foreground transition-colors" />
                                    <span className="flex-1">Search files...</span>
                                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono text-muted-foreground">
                                        <Command size={10} />K
                                    </div>
                                </div>
                            </div>

                            {/* Right Actions */}
                            <div className="flex items-center gap-3 w-20 justify-end">
                                <div className="p-1.5 hover:bg-secondary rounded-md text-muted-foreground hover:text-foreground transition-colors cursor-pointer relative">
                                    <Bell size={14} />
                                    <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-background"></span>
                                </div>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 ring-2 ring-background cursor-pointer hover:ring-border transition-all shadow-sm"></div>
                            </div>
                        </div>

                        {/* Mockup Body */}
                        <div className="flex h-[350px] sm:h-[450px] md:h-[600px] bg-background dark:bg-[#0F1115] relative text-left">

                            {/* Sidebar (Hidden on Mobile) */}
                            <div className="w-60 border-r border-border bg-secondary/10 dark:bg-[#121418] flex flex-col shrink-0">
                                <div className="p-4 space-y-6">
                                    {/* Favorites */}
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Favorites</div>
                                        <div className="space-y-0.5">
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer">
                                                <Clock size={14} className="group-hover/nav:text-blue-500 transition-colors" /> Recent
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer">
                                                <Star size={14} className="group-hover/nav:text-yellow-500 transition-colors" /> Starred
                                            </div>
                                        </div>
                                    </div>

                                    {/* Buckets */}
                                    <div>
                                        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex justify-between items-center">
                                            <span>Buckets</span>
                                            <span className="hover:bg-secondary p-0.5 rounded cursor-pointer"><CloudLightning size={10} /></span>
                                        </div>
                                        <div className="space-y-0.5">
                                            <div className="h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-100 border border-blue-500/20 flex items-center justify-between px-2 text-xs font-medium cursor-pointer shadow-[0_0_15px_rgba(59,130,246,0.1)]">
                                                <div className="flex items-center gap-2.5">
                                                    <Database size={14} className="text-blue-500" />
                                                    prod-assets
                                                </div>
                                                <span className="w-1.5 h-1.5 bg-green-500 rounded-full shadow-[0_0_5px_#22c55e]"></span>
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-border">
                                                <Database size={14} className="text-muted-foreground group-hover/nav:text-foreground" />
                                                backup-archive
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-border">
                                                <Database size={14} className="text-muted-foreground group-hover/nav:text-foreground" />
                                                staging-media
                                            </div>
                                            <div className="group/nav h-8 rounded-md hover:bg-secondary flex items-center gap-2.5 px-2 text-muted-foreground hover:text-foreground text-xs font-medium transition-all cursor-pointer border border-transparent hover:border-border">
                                                <Globe size={14} className="text-muted-foreground group-hover/nav:text-foreground" />
                                                public-cdn
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto p-4 border-t border-border">
                                    <div className="bg-card dark:bg-[#0A0B0E] rounded-lg p-3 border border-border shadow-inner group/storage hover:border-foreground/20 transition-colors">
                                        <div className="flex justify-between text-[10px] text-muted-foreground mb-2">
                                            <span>Storage Used</span>
                                            <span className="text-foreground">420 GB</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full w-[65%] bg-gradient-to-r from-blue-600 to-blue-400 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.4)] group-hover/storage:w-[67%] transition-all duration-500"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="flex-1 flex flex-col min-w-0 bg-background dark:bg-[#0F1115]">

                                {/* Toolbar */}
                                <div className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 bg-background/50 dark:bg-[#0F1115]/50 backdrop-blur-sm z-10">
                                    <div className="flex items-center gap-2 text-sm">
                                        <button className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                                            <ArrowRight size={16} className="rotate-180" />
                                        </button>
                                        <div className="h-4 w-px bg-border mx-1"></div>
                                        <div className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer group/bread">
                                            <Database size={14} className="group-hover/bread:text-blue-500 transition-colors" />
                                            <span>prod-assets</span>
                                        </div>
                                        <ChevronRight size={14} className="text-muted-foreground" />
                                        <span className="font-semibold text-foreground cursor-pointer hover:underline transition-colors">images</span>
                                        <ChevronRight size={14} className="text-muted-foreground" />
                                        <span className="text-muted-foreground cursor-pointer hover:text-foreground transition-colors">marketing</span>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="hidden lg:flex items-center gap-2 text-xs text-muted-foreground bg-card dark:bg-[#0A0B0E] border border-border px-2 py-1 rounded">
                                            <Filter size={12} />
                                            <span>Filter...</span>
                                        </div>
                                        <div className="h-4 w-px bg-border mx-1 hidden sm:block"></div>
                                        <div className="flex bg-card dark:bg-[#0A0B0E] p-0.5 rounded-lg border border-border">
                                            <div className="p-1.5 rounded-md bg-secondary text-foreground shadow-sm cursor-pointer"><LayoutGrid size={14} /></div>
                                            <div className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer transition-colors"><List size={14} /></div>
                                        </div>
                                        <button className="bg-foreground text-background px-3 py-1.5 rounded-md text-xs font-bold hover:opacity-90 transition-colors flex items-center gap-2 shadow-sm">
                                            <UploadCloud size={12} /> <span className="hidden sm:inline">Upload</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Grid */}
                                <div className="p-4 md:p-6 overflow-hidden relative">
                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                                        {/* Interactive Folder */}
                                        <div className="aspect-[4/3.2] bg-card dark:bg-[#16181D] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-[0_4px_20px_-12px_rgba(59,130,246,0.5)] transition-all group/item cursor-pointer relative">
                                            <Folder size={48} className="text-blue-500 fill-blue-500/10 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-foreground dark:text-zinc-300 font-medium block mb-0.5 truncate px-2">2024_campaign</span>
                                                <span className="text-[10px] text-muted-foreground">12 items</span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-secondary rounded text-muted-foreground">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Interactive Image (Selected) */}
                                        <div className="aspect-[4/3.2] bg-blue-500/10 border border-blue-500/50 rounded-xl p-3 flex flex-col items-center justify-center gap-3 shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] transition-all group/item cursor-pointer relative ring-1 ring-blue-400/30">
                                            <ImageIcon size={48} className="text-purple-400 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-blue-600 dark:text-blue-200 font-medium block mb-0.5 truncate px-2">hero_banner_v2.jpg</span>
                                                <span className="text-[10px] text-blue-500/70 dark:text-blue-300/70">2.4 MB</span>
                                            </div>
                                            <div className="absolute top-2 right-2 p-1 hover:bg-blue-500/20 rounded text-blue-500 dark:text-blue-300">
                                                <MoreHorizontal size={14} />
                                            </div>
                                            <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-blue-400 rounded-full shadow-[0_0_8px_rgba(96,165,250,1)] ring-2 ring-blue-900"></div>
                                        </div>

                                        {/* Interactive Code File */}
                                        <div className="aspect-[4/3.2] bg-card dark:bg-[#16181D] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-3 hover:border-yellow-500/40 hover:bg-yellow-500/5 hover:shadow-[0_4px_20px_-12px_rgba(234,179,8,0.5)] transition-all group/item cursor-pointer relative">
                                            <FileCode size={48} className="text-yellow-500 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-foreground dark:text-zinc-300 font-medium block mb-0.5 truncate px-2">analytics_config.json</span>
                                                <span className="text-[10px] text-muted-foreground">1 KB</span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-secondary rounded text-muted-foreground">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Interactive Folder 2 */}
                                        <div className="aspect-[4/3.2] bg-card dark:bg-[#16181D] border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-3 hover:border-blue-500/40 hover:bg-blue-500/5 hover:shadow-[0_4px_20px_-12px_rgba(59,130,246,0.5)] transition-all group/item cursor-pointer relative">
                                            <Folder size={48} className="text-blue-500 fill-blue-500/10 drop-shadow-lg transition-transform group-hover/item:scale-110 duration-300" />
                                            <div className="text-center w-full">
                                                <span className="text-xs text-foreground dark:text-zinc-300 font-medium block mb-0.5 truncate px-2">raw_assets</span>
                                                <span className="text-[10px] text-muted-foreground">48 items</span>
                                            </div>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover/item:opacity-100 transition-opacity p-1 hover:bg-secondary rounded text-muted-foreground">
                                                <MoreHorizontal size={14} />
                                            </div>
                                        </div>

                                        {/* Placeholders */}
                                        <div className="aspect-[4/3.2] bg-secondary/20 dark:bg-[#16181D]/40 border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-all cursor-pointer hover:bg-secondary/40 sm:hidden">
                                            <div className="w-12 h-12 rounded-lg bg-muted/50 skeleton-shimmer"></div>
                                            <div className="w-16 h-2 rounded bg-muted/50 mt-2"></div>
                                            <div className="w-8 h-1.5 rounded bg-muted/50"></div>
                                        </div>
                                        {[1, 2].map((i) => (
                                            <div key={i} className="aspect-[4/3.2] bg-secondary/20 dark:bg-[#16181D]/40 border border-border dark:border-white/5 rounded-xl p-3 flex-col items-center justify-center gap-2 opacity-40 hover:opacity-60 transition-all cursor-pointer hover:bg-secondary/40 hidden sm:flex">
                                                <div className="w-12 h-12 rounded-lg bg-muted/50 skeleton-shimmer"></div>
                                                <div className="w-16 h-2 rounded bg-muted/50 mt-2"></div>
                                                <div className="w-8 h-1.5 rounded bg-muted/50"></div>
                                            </div>
                                        ))}
                                        <div className="aspect-[4/3.2] bg-secondary/20 dark:bg-[#16181D]/40 border border-border dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center gap-2 opacity-40 hidden lg:flex hover:opacity-60 transition-all cursor-pointer hover:bg-secondary/40">
                                            <div className="w-12 h-12 rounded-lg bg-muted/50 skeleton-shimmer"></div>
                                            <div className="w-16 h-2 rounded bg-muted/50 mt-2"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Screen Glare/Reflection */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none mix-blend-overlay opacity-50"></div>
                    </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full mb-20 text-left max-w-6xl mx-auto">
                    <FeatureCard
                        icon={<ShieldCheck className="text-green-500" />}
                        title="End-to-End Encrypted"
                        description="Your credentials are encrypted with AES-GCM and stored locally on your device. Nothing is ever sent to a backend server."
                        color="bg-green-500/10"
                    />
                    <FeatureCard
                        icon={<Code2 className="text-yellow-500" />}
                        title="Open Source"
                        description="Transparent, inspectable code. Fork it, contribute to it, or self-host it on your own infrastructure."
                        color="bg-yellow-500/10"
                    />
                    <FeatureCard
                        icon={<Globe className="text-blue-500" />}
                        title="Multi-Cloud Support"
                        description="One tool for all. Seamlessly switch between AWS S3, Cloudflare R2, MinIO, and any S3-compatible provider."
                        color="bg-blue-500/10"
                    />
                    <FeatureCard
                        icon={<UploadCloud className="text-purple-500" />}
                        title="Drag & Drop Uploads"
                        description="Upload huge files and folders effortlessly. Just drag them into the browser window and watch them fly."
                        color="bg-purple-500/10"
                    />
                    <FeatureCard
                        icon={<Eye className="text-pink-500" />}
                        title="Instant Previews"
                        description="Preview images, videos, PDFs, and markdown files with syntax highlighting instantly without downloading them."
                        color="bg-pink-500/10"
                    />
                    <FeatureCard
                        icon={<Command className="text-cyan-500" />}
                        title="Keyboard Shortcuts"
                        description="Navigate at the speed of thought with powerful keyboard shortcuts. Press Cmd+K to access the command palette for instant actions."
                        color="bg-cyan-500/10"
                    />
                </div>

                {/* How It Works Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
                    <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">Get started in three simple steps</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
                                <Database size={32} className="text-blue-500" />
                            </div>
                            <div className="text-2xl font-bold text-blue-500 mb-2">1. Connect</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Enter your S3 credentials (endpoint, access key, secret key). Your credentials are encrypted and stored locally in your browser.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                                <Folder size={32} className="text-purple-500" />
                            </div>
                            <div className="text-2xl font-bold text-purple-500 mb-2">2. Browse</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Navigate through your buckets and folders just like a file manager. Preview files, search, and organize your cloud storage.
                            </p>
                        </div>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
                                <UploadCloud size={32} className="text-green-500" />
                            </div>
                            <div className="text-2xl font-bold text-green-500 mb-2">3. Manage</div>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Upload, download, delete, and move files. Create folders, generate share links, and manage your storage with ease.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Security & Privacy Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Security & Privacy</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Your data security is our top priority</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/20 relative z-10">
                                <Database size={24} className="text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">100% Client-Side</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                S4 runs entirely in your browser. No backend servers, no databases, no data collection. Your files and credentials never touch our servers because we don't have any.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 relative z-10">
                                <ShieldCheck size={24} className="text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">Local Encryption</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                Connection profiles are encrypted using AES-GCM 256-bit encryption via the Web Crypto API and stored in your browser's local storage.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20 relative z-10">
                                <Zap size={24} className="text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">Direct Connection</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                All S3 operations connect directly from your browser to your storage provider. Your access keys are never transmitted to any third party.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-yellow-500/20 relative z-10">
                                <Code2 size={24} className="text-yellow-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">Open Source</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                The entire codebase is open source and available on GitHub for inspection, auditing, or self-hosting on your own infrastructure.
                            </p>
                        </div>
                    </div>
                </div>

                {/* PWA / Native Experience Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Native Experience</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Install S4 on your device for the best experience</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-blue-500/20 relative z-10">
                                <Smartphone size={24} className="text-blue-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">Installable PWA</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                Add S4 to your home screen on iOS, Android, or Desktop. It runs in its own window, free from browser distractions.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-purple-500/20 relative z-10">
                                <WifiOff size={24} className="text-purple-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">Offline Ready</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                S4 loads instantly, even without an internet connection. The app shell is cached locally for lightning-fast performance.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-green-500/20 relative z-10">
                                <Zap size={24} className="text-green-500" />
                            </div>
                            <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">Native Performance</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">
                                Experience smooth animations, touch gestures, and a responsive interface that feels just like a native application.
                            </p>
                        </div>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="w-full max-w-6xl mx-auto mb-20">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
                        <p className="text-muted-foreground max-w-2xl mx-auto">Everything you need to know about S4</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <ShieldCheck size={20} className="text-green-500 shrink-0 mt-0.5" />
                                Is my data secure?
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                Yes. S4 is entirely client-side. Your credentials are encrypted locally using AES-GCM and never leave your device. No backend server collects or stores your data.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Globe size={20} className="text-blue-500 shrink-0 mt-0.5" />
                                What providers are supported?
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                AWS S3, Cloudflare R2, MinIO, and any S3-compatible storage provider. If it supports the S3 API, you can use S4 to manage it.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <UploadCloud size={20} className="text-purple-500 shrink-0 mt-0.5" />
                                Can I self-host S4?
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                Absolutely. Run <code className="px-1.5 py-0.5 rounded bg-secondary text-xs font-mono">npm run build</code> and deploy the dist folder to any static hosting service or web server.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Settings size={20} className="text-yellow-500 shrink-0 mt-0.5" />
                                What permissions do I need?
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10">
                                For full functionality: ListBucket, GetObject, PutObject, DeleteObject. For read-only mode, just ListBucket and GetObject are sufficient.
                            </p>
                        </div>

                        <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm cursor-default relative overflow-hidden shadow-sm md:col-span-2">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700"></div>
                            <h3 className="text-lg font-bold mb-3 text-foreground relative z-10 flex items-start gap-2">
                                <Globe size={20} className="text-orange-500 shrink-0 mt-0.5" />
                                Do I need to configure CORS?
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed relative z-10 mb-3">
                                Yes, because S4 runs in your browser, you need to configure CORS on your S3 bucket. Add this policy to allow browser access:
                            </p>
                            <pre className="text-xs font-mono bg-secondary p-3 rounded overflow-x-auto relative z-10">{`[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]`}</pre>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-muted-foreground pb-8 border-t border-border pt-8 w-full max-w-4xl flex flex-col sm:flex-row justify-center items-center gap-4">
                    <p className="flex items-center gap-1">
                        Built with <Heart size={12} className="text-red-500 fill-red-500" /> by <a href="https://firstfinger.io/author/anurag-vishwakarma/" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors font-medium">Anurag Vishwakarma</a>
                    </p>
                </div>

            </main>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
    <div className="group p-6 rounded-2xl bg-card/50 border border-border hover:border-foreground/20 hover:bg-card transition-all duration-300 backdrop-blur-sm hover:-translate-y-1 cursor-default relative overflow-hidden shadow-sm">
        <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-foreground/5 to-transparent rounded-bl-3xl -mr-4 -mt-4 transition-transform group-hover:scale-150 duration-700`}></div>
        <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-border relative z-10`}>
            {React.cloneElement(icon as React.ReactElement, { size: 24 })}
        </div>
        <h3 className="text-lg font-bold mb-2 text-foreground group-hover:text-primary transition-colors relative z-10">{title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed group-hover:text-foreground/80 transition-colors relative z-10">{description}</p>
    </div>
);

export default Landing;
