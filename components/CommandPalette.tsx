
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, Database, Sun, Grid, LogOut, ArrowRight, UploadCloud, FilePlus, UserCircle2 } from 'lucide-react';
import { BucketObject, S3Config } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  buckets: BucketObject[];
  profiles: S3Config[];
  onSelectBucket: (name: string) => void;
  onSwitchProfile: (profile: S3Config) => void;
  onToggleTheme: () => void;
  onDisconnect: () => void;
}

type CommandItem = {
  id: string;
  icon: React.ReactNode;
  label: string;
  subLabel?: string;
  action: () => void;
  category: 'Navigation' | 'Actions' | 'Buckets' | 'Profiles';
};

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  buckets,
  profiles,
  onSelectBucket, 
  onSwitchProfile,
  onToggleTheme,
  onDisconnect
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    // Detect if user is on Mac
    setIsMac(/Mac|iPhone|iPad|iPod/.test(navigator.platform));
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure render before focus
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [
      {
        id: 'upload',
        icon: <UploadCloud size={18} />,
        label: 'Upload Files',
        subLabel: 'Trigger file upload dialog',
        category: 'Actions',
        action: () => window.dispatchEvent(new CustomEvent('s4:trigger-upload'))
      },
      {
        id: 'create-file',
        icon: <FilePlus size={18} />,
        label: 'Create New File',
        category: 'Actions',
        action: () => window.dispatchEvent(new CustomEvent('s4:create-file'))
      },
      {
        id: 'toggle-view',
        icon: <Grid size={18} />,
        label: 'Toggle View Mode',
        subLabel: 'Switch between List and Grid view',
        category: 'Actions',
        action: () => window.dispatchEvent(new CustomEvent('s4:toggle-view'))
      },
      {
        id: 'toggle-theme',
        icon: <Sun size={18} />,
        label: 'Toggle Theme',
        category: 'Actions',
        action: onToggleTheme
      },
      {
        id: 'disconnect',
        icon: <LogOut size={18} className="text-red-500" />,
        label: 'Disconnect',
        category: 'Actions',
        action: onDisconnect
      }
    ];

    // Add Profiles
    profiles.forEach(p => {
        items.push({
            id: `profile-${p.id}`,
            icon: <UserCircle2 size={18} className="text-purple-500" />,
            label: `Switch to ${p.label || 'Profile'}`,
            subLabel: p.endpoint || 'Default Endpoint',
            category: 'Profiles',
            action: () => onSwitchProfile(p)
        });
    });

    // Add buckets to commands
    buckets.forEach(b => {
      items.push({
        id: `bucket-${b.name}`,
        icon: <Database size={18} className="text-blue-500" />,
        label: b.name,
        subLabel: 'Switch bucket',
        category: 'Buckets',
        action: () => onSelectBucket(b.name)
      });
    });

    return items;
  }, [buckets, profiles, onSelectBucket, onSwitchProfile, onToggleTheme, onDisconnect]);

  const filteredCommands = useMemo(() => {
    if (!query) return commands;
    const lowerQuery = query.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(lowerQuery) || 
      (cmd.subLabel && cmd.subLabel.toLowerCase().includes(lowerQuery))
    );
  }, [query, commands]);

  // Reset selection when filtering changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[20vh] px-4" onMouseDown={onClose}>
       {/* Backdrop */}
       <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" />
       
       {/* Modal */}
       <div 
         className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden relative flex flex-col animate-in zoom-in-95 duration-200"
         onMouseDown={e => e.stopPropagation()}
       >
          <div className="flex items-center px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground" />
            <input
              ref={inputRef}
              className="w-full bg-transparent border-none px-4 py-4 text-base focus:outline-none placeholder:text-muted-foreground text-foreground"
              placeholder="Type a command or search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            <div className="hidden sm:flex gap-1 items-center">
                <kbd className="px-2 py-1 bg-secondary rounded text-[10px] text-muted-foreground font-mono">↑↓</kbd>
                <kbd className="px-2 py-1 bg-secondary rounded text-[10px] text-muted-foreground font-mono">↵</kbd>
                <span className="text-[10px] text-muted-foreground ml-1">|</span>
                <kbd className="px-2 py-1 bg-secondary rounded text-[10px] text-muted-foreground font-mono">{isMac ? '⌘' : 'Ctrl'}</kbd>
                <kbd className="px-2 py-1 bg-secondary rounded text-[10px] text-muted-foreground font-mono">K</kbd>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
             {filteredCommands.length === 0 ? (
               <div className="py-12 text-center text-muted-foreground">
                 <p>No results found.</p>
               </div>
             ) : (
               <div className="space-y-1">
                 {filteredCommands.map((cmd, index) => (
                   <div
                     key={cmd.id}
                     ref={index === selectedIndex ? selectedItemRef : null}
                     onClick={() => { cmd.action(); onClose(); }}
                     onMouseEnter={() => setSelectedIndex(index)}
                     className={`
                        flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors
                        ${index === selectedIndex ? 'bg-blue-500 text-white' : 'text-foreground hover:bg-secondary'}
                     `}
                   >
                     <div className={`p-2 rounded-md ${index === selectedIndex ? 'bg-white/20' : 'bg-secondary text-foreground'}`}>
                        {React.cloneElement(cmd.icon as React.ReactElement, { 
                            className: index === selectedIndex ? 'text-white' : 'text-muted-foreground' 
                        })}
                     </div>
                     <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{cmd.label}</div>
                        {cmd.subLabel && (
                            <div className={`text-xs ${index === selectedIndex ? 'text-blue-100' : 'text-muted-foreground'}`}>
                                {cmd.subLabel}
                            </div>
                        )}
                     </div>
                     {index === selectedIndex && <ArrowRight size={16} className="animate-in slide-in-from-left-2 fade-in" />}
                   </div>
                 ))}
               </div>
             )}
          </div>
          
          <div className="px-4 py-2 bg-secondary/50 border-t border-border text-[10px] text-muted-foreground flex justify-between items-center">
              <span><span className="font-medium">ProTip:</span> Use <kbd className="bg-background border border-border px-1 rounded">{isMac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="bg-background border border-border px-1 rounded">K</kbd> to open this menu anywhere.</span>
              <span>{filteredCommands.length} results</span>
          </div>
       </div>
    </div>
  );
};

export default CommandPalette;
