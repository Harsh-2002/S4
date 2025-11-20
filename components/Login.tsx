
import React, { useState, useEffect } from 'react';
import { S3Config } from '../types';
import { PROVIDERS, DEFAULT_S3_CONFIG } from '../constants';
import { ArrowRight, Plus, Trash2, ShieldCheck, Sun, Moon, LayoutGrid, ArrowLeft, Cloud, Server, Globe, CloudLightning, ChevronRight } from 'lucide-react';

interface LoginProps {
  onConnect: (config: S3Config) => void;
  profiles: S3Config[];
  onSaveProfile: (config: S3Config) => Promise<void>;
  onDeleteProfile: (id: string) => Promise<void>;
  loadingProfiles: boolean;
}

const Login: React.FC<LoginProps> = ({ onConnect, profiles, onSaveProfile, onDeleteProfile, loadingProfiles }) => {
  const [mode, setMode] = useState<'list' | 'form'>('list');
  const [formData, setFormData] = useState<Partial<S3Config>>({ ...DEFAULT_S3_CONFIG, readOnly: false });
  const [profileLabel, setProfileLabel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [endpointPlaceholder, setEndpointPlaceholder] = useState('Endpoint URL');
  const [regionPlaceholder, setRegionPlaceholder] = useState('us-east-1');
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    // Initialize theme state
    setIsDarkMode(document.documentElement.classList.contains('dark'));
  }, []);

  useEffect(() => {
    if (!loadingProfiles && profiles.length === 0) {
        setMode('form');
    }
  }, [loadingProfiles, profiles]);

  useEffect(() => {
    // Update defaults and placeholders based on provider selection
    switch (formData.provider) {
        case 'aws':
            setEndpointPlaceholder('Optional (Auto-resolved)');
            setRegionPlaceholder('us-east-1');
            if (!formData.region || formData.region === 'auto') setFormData(prev => ({ ...prev, region: 'us-east-1' }));
            break;
        case 'cloudflare':
            setEndpointPlaceholder('https://<account_id>.r2.cloudflarestorage.com');
            setRegionPlaceholder('auto');
            setFormData(prev => ({ ...prev, region: 'auto' }));
            break;
        case 'minio':
            setEndpointPlaceholder('http://localhost:9000');
            setRegionPlaceholder('Optional (Default: us-east-1)');
            if (formData.region === 'auto' || formData.region === 'us-east-1') {
                setFormData(prev => ({ ...prev, region: '' }));
            }
            break;
        case 'other':
            setEndpointPlaceholder('https://s3.example.com');
            setRegionPlaceholder('us-east-1');
            break;
    }
  }, [formData.provider]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (!formData.accessKeyId || !formData.secretAccessKey) {
        alert("Please fill in all required fields.");
        setIsLoading(false);
        return;
    }

    const newProfile: S3Config = {
        ...formData as S3Config,
        id: crypto.randomUUID(),
        label: profileLabel || `${formData.provider?.toUpperCase()} - ${formData.bucketName || 'No Bucket'}`,
    };

    await onSaveProfile(newProfile);
    
    setTimeout(() => {
        onConnect(newProfile);
        setIsLoading(false);
    }, 300);
  };

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark');
    setIsDarkMode(prev => !prev);
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
        case 'aws': return <Cloud size={20} className="text-[#FF9900]" />;
        case 'cloudflare': return <CloudLightning size={20} className="text-[#F38020]" />;
        case 'minio': return <Server size={20} className="text-[#C72E49]" />;
        default: return <Globe size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 relative overflow-hidden transition-colors duration-300">
      
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none"></div>

      <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={toggleTheme}
            className="p-2 rounded-full bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground transition-all backdrop-blur-sm border border-border shadow-sm"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
      </div>

      <div className="w-full max-w-[480px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="text-center space-y-2 mb-8">
            <div className="w-12 h-12 bg-foreground rounded-xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_-10px_rgba(0,0,0,0.2)] dark:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]">
                <span className="font-bold text-background text-xl tracking-tighter">S4</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {mode === 'list' ? 'Select Profile' : 'New Connection'}
            </h1>
            <p className="text-muted-foreground text-sm">
                {mode === 'list' ? 'Choose a stored profile or create a new one.' : 'Enter credentials to create a secure profile.'}
            </p>
        </div>

        {mode === 'list' ? (
            <div className="space-y-4">
                {loadingProfiles ? (
                    <div className="text-center text-muted-foreground text-sm py-8">Loading profiles...</div>
                ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {profiles.map(profile => (
                            <div 
                                key={profile.id}
                                onClick={() => onConnect(profile)}
                                className="group relative bg-card hover:bg-secondary/50 border border-border hover:border-foreground/30 rounded-xl p-4 cursor-pointer transition-all shadow-sm flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center border border-border shrink-0">
                                    {getProviderIcon(profile.provider)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-sm text-foreground truncate">{profile.label}</h3>
                                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                        {profile.provider.toUpperCase()} 
                                        <span className="w-1 h-1 rounded-full bg-muted-foreground/50"></span>
                                        {profile.bucketName || 'All Buckets'}
                                    </p>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteProfile(profile.id); }}
                                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        title="Delete Profile"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                    <div className="text-muted-foreground">
                                        <ChevronRight size={18} />
                                    </div>
                                </div>
                            </div>
                        ))}
                        
                        <button 
                            onClick={() => { setFormData(DEFAULT_S3_CONFIG); setProfileLabel(''); setMode('form'); }}
                            className="w-full py-4 rounded-xl border-2 border-dashed border-border hover:border-foreground/40 hover:bg-secondary/30 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center gap-2 text-sm font-medium group"
                        >
                            <div className="w-6 h-6 rounded-full bg-secondary group-hover:bg-foreground group-hover:text-background flex items-center justify-center transition-colors">
                                <Plus size={14} />
                            </div>
                            Add New Profile
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <form onSubmit={handleFormSubmit} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
                
                <div className="space-y-4 bg-card/50 p-5 rounded-xl border border-border/50 shadow-sm">
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Profile Name</label>
                        <input 
                            type="text" 
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:border-foreground focus:ring-0 outline-none transition-colors placeholder:text-muted-foreground/40 text-foreground"
                            placeholder="e.g., Production Assets"
                            value={profileLabel}
                            onChange={(e) => setProfileLabel(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="space-y-1 pt-2">
                         <label className="text-xs font-medium text-muted-foreground ml-1">Provider</label>
                         <div className="grid grid-cols-4 gap-2">
                            {PROVIDERS.map(p => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setFormData({...formData, provider: p.id as any})}
                                    className={`h-10 rounded-md text-xs font-medium transition-all border flex items-center justify-center gap-1 ${
                                        formData.provider === p.id 
                                        ? 'bg-foreground text-background border-foreground' 
                                        : 'bg-background text-muted-foreground border-input hover:text-foreground hover:border-foreground/30'
                                    }`}
                                >
                                    {p.name.split(' ')[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-1">
                         <label className="text-xs font-medium text-muted-foreground ml-1">Endpoint</label>
                         <input 
                            type="text" 
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:border-foreground focus:ring-0 outline-none transition-colors placeholder:text-muted-foreground/40 text-foreground"
                            placeholder={endpointPlaceholder}
                            value={formData.endpoint || ''}
                            onChange={(e) => setFormData({...formData, endpoint: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground ml-1">Region</label>
                            <input 
                                type="text" 
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:border-foreground focus:ring-0 outline-none transition-colors placeholder:text-muted-foreground/40 text-foreground"
                                placeholder={regionPlaceholder}
                                value={formData.region || ''}
                                onChange={(e) => setFormData({...formData, region: e.target.value})}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground ml-1">Bucket (Optional)</label>
                            <input 
                                type="text" 
                                className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:border-foreground focus:ring-0 outline-none transition-colors placeholder:text-muted-foreground/40 text-foreground"
                                placeholder="Default Bucket"
                                value={formData.bucketName || ''}
                                onChange={(e) => setFormData({...formData, bucketName: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Access Key ID</label>
                        <input 
                            type="text" 
                            required
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:border-foreground focus:ring-0 outline-none transition-colors placeholder:text-muted-foreground/40 text-foreground"
                            placeholder="Enter Access Key"
                            value={formData.accessKeyId || ''}
                            onChange={(e) => setFormData({...formData, accessKeyId: e.target.value})}
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground ml-1">Secret Access Key</label>
                        <input 
                            type="password" 
                            required
                            className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm focus:border-foreground focus:ring-0 outline-none transition-colors placeholder:text-muted-foreground/40 text-foreground"
                            placeholder="Enter Secret Key"
                            value={formData.secretAccessKey || ''}
                            onChange={(e) => setFormData({...formData, secretAccessKey: e.target.value})}
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    {profiles.length > 0 && (
                        <button 
                            type="button"
                            onClick={() => setMode('list')}
                            className="px-4 bg-secondary hover:bg-secondary/80 h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center text-foreground"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <button 
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-foreground text-background hover:opacity-90 h-11 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg"
                    >
                        {isLoading ? 'Connecting...' : 'Save & Connect'}
                        {!isLoading && <ArrowRight size={14} />}
                    </button>
                </div>
            </form>
        )}

        <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground pt-6 border-t border-border/50 mt-6">
            <ShieldCheck size={12} className="text-green-600 dark:text-green-400" />
            <p>Credentials are encrypted with AES-GCM locally.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
