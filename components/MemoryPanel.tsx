
import React, { useState, useMemo } from 'react';
import { MemoryEntry, AppTheme } from '../types';

interface MemoryPanelProps {
  memories: MemoryEntry[];
  theme: AppTheme;
  onDeleteMemory: (id: string) => void;
}

const MemoryPanel: React.FC<MemoryPanelProps> = ({ memories, theme, onDeleteMemory }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;

  const { allTags, tagCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    const tags = new Set<string>();
    memories.forEach(m => {
      m.tags?.forEach(t => {
        tags.add(t);
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return {
      allTags: Array.from(tags).sort(),
      tagCounts: counts
    };
  }, [memories]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSearchQuery('');
  };

  const handleCopyExplanation = (memory: MemoryEntry) => {
    navigator.clipboard.writeText(memory.explanation);
    setCopiedId(memory.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredMemories = useMemo(() => {
    let result = memories.filter(memory => {
      const matchesSearch = 
        memory.explanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        memory.errorSnippet.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || 
        selectedTags.every(tag => memory.tags?.includes(tag));
      
      return matchesSearch && matchesTags;
    });

    result.sort((a, b) => {
      return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return result;
  }, [memories, searchQuery, selectedTags, sortOrder]);

  if (memories.length === 0) return null;

  return (
    <section className="mt-16 space-y-6">
      <div className={`flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div>
          <h3 className="text-xl font-black uppercase tracking-tighter">Memory Bank</h3>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isCyber ? 'text-green-600' : 'opacity-40'}`}>Knowledge retention engine</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search bar */}
          <div className="group relative flex-1 sm:w-64">
            <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[10px] ${isCyber ? 'text-green-500' : 'opacity-30'}`}></i>
            <input 
              type="text" 
              placeholder="Query past resolutions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 bg-transparent border text-xs font-bold outline-none transition-all ${
                isCyber ? 'border-green-500 focus:shadow-[0_0_10px_rgba(0,255,65,0.2)] text-green-400 placeholder:text-green-900' : 
                isDark ? 'border-slate-700 focus:border-indigo-500 text-white' : 'border-slate-200 focus:border-indigo-600 text-slate-900'
              }`}
            />
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              Filter by keywords
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>

          {/* Sort toggle */}
          <div className="group relative">
            <button 
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className={`h-full px-4 py-2 border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all w-full sm:w-auto ${
                isCyber ? 'border-green-500 text-green-400 bg-green-500/5 hover:bg-green-500/10' :
                isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <i className={`fas ${sortOrder === 'newest' ? 'fa-sort-amount-down' : 'fa-sort-amount-up'}`}></i>
              {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
            </button>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              Change display order
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className={`text-[9px] font-black uppercase tracking-widest ${isCyber ? 'text-green-700' : 'opacity-30'}`}>Filter by category</span>
            {(selectedTags.length > 0 || searchQuery) && (
              <button 
                onClick={clearFilters}
                className={`text-[9px] font-black uppercase tracking-widest transition-colors ${isCyber ? 'text-green-400 hover:text-green-300' : 'text-rose-500 hover:text-rose-600'}`}
              >
                Clear All Parameters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {allTags.map(tag => {
              const isActive = selectedTags.includes(tag);
              const count = tagCounts[tag] || 0;
              return (
                <div key={tag} className="group relative">
                  <button
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                      isActive 
                        ? (isCyber ? 'bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(0,255,65,0.4)]' : isDark ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-900 text-white border-slate-900') 
                        : (isCyber ? 'bg-black text-green-500 border-green-900 hover:border-green-500' : isDark ? 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400')
                    }`}
                  >
                    #{tag} ({count})
                  </button>
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                    Toggle category filter
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMemories.map((memory) => (
          <div 
            key={memory.id} 
            className={`p-6 rounded-2xl border transition-all flex flex-col group relative ${
              isCyber ? 'bg-black border-green-900/40 hover:border-green-500 hover:shadow-[0_0_15px_rgba(0,255,65,0.05)]' : 
              isDark ? 'bg-slate-800/30 border-slate-800 hover:border-slate-600' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'
            }`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[9px] font-black uppercase tracking-widest ${isCyber ? 'text-green-900' : 'opacity-30'}`}>
                {new Date(memory.timestamp).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="group/btn relative">
                  <button 
                    onClick={() => handleCopyExplanation(memory)}
                    className={`p-2 rounded-lg text-[10px] transition-all ${
                      isCyber ? 'hover:bg-green-500/20 text-green-500' : 'hover:bg-slate-500/10 text-slate-400 hover:text-indigo-500'
                    }`}
                  >
                    <i className={`fas ${copiedId === memory.id ? 'fa-check' : 'fa-copy'}`}></i>
                  </button>
                  <div className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover/btn:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                    Copy explanation
                    <div className={`absolute -bottom-1 right-2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                  </div>
                </div>
                <div className="group/btn relative">
                  <button 
                    onClick={() => onDeleteMemory(memory.id)}
                    className="p-2 rounded-lg text-[10px] text-rose-500 hover:bg-rose-500/10 transition-all"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                  <div className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover/btn:block tooltip-visible shadow-xl z-50 bg-rose-600 text-white`}>
                    Delete from history
                    <div className="absolute -bottom-1 right-2 w-2 h-2 rotate-45 bg-rose-600"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <p className={`text-[10px] mono-font truncate mb-3 ${isCyber ? 'text-green-900' : 'opacity-30'}`}>{memory.errorSnippet}</p>
            <p className={`font-bold leading-tight mb-4 text-sm line-clamp-2 ${isCyber ? 'text-green-400' : ''}`}>"{memory.explanation}"</p>

            <div className="mt-auto pt-4 flex flex-wrap gap-1.5 border-t border-transparent group-hover:border-white/5 transition-all">
              {memory.tags?.map(tag => (
                <span key={tag} className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                  isCyber ? 'bg-green-500/5 text-green-500 border border-green-500/20' : 
                  isDark ? 'bg-slate-900 text-indigo-400' : 'bg-slate-50 text-indigo-600'
                }`}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredMemories.length === 0 && memories.length > 0 && (
        <div className="py-20 text-center border-2 border-dashed border-slate-500/10 rounded-3xl">
          <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${isCyber ? 'bg-green-500/10 text-green-500' : 'bg-slate-100 text-slate-400'}`}>
            <i className="fas fa-ghost"></i>
          </div>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-4 ${isCyber ? 'text-green-700' : 'opacity-30'}`}>No traces found matching your criteria</p>
          <div className="group relative w-fit mx-auto">
            <button 
              onClick={clearFilters}
              className={`text-[10px] font-black uppercase tracking-widest underline ${isCyber ? 'text-green-400' : 'text-indigo-600'}`}
            >
              Reset filter stack
            </button>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              Show all history
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default MemoryPanel;
