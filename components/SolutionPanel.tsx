
import React, { useEffect, useState, useMemo } from 'react';
import { DebugResponse, Difficulty, AppTheme } from '../types';
import { formatCodeSnippet } from '../services/geminiService';

interface SolutionPanelProps {
  solution: DebugResponse;
  difficulty: Difficulty;
  onConfirm: () => void;
  onReset: () => void;
  theme: AppTheme;
}

const MarkdownText: React.FC<{ text: string; theme: AppTheme }> = ({ text, theme }) => {
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;
  const isMono = theme === AppTheme.MONO;
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className={`font-black transition-colors ${
              isCyber ? 'text-green-400' : isMono ? 'text-black underline' : isDark ? 'text-white' : 'text-slate-900'
            }`}>
              {part.slice(2, -2)}
            </strong>
          );
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code 
              key={i} 
              className={`px-1.5 py-0.5 rounded text-[12px] mono-font font-bold border ${
                isCyber ? 'bg-green-900/40 text-green-300 border-green-500' :
                isMono ? 'bg-white text-black border-black' :
                isDark ? 'bg-slate-700 text-indigo-300 border-slate-600' :
                'bg-slate-100 text-indigo-700 border-slate-200'
              }`}
            >
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      })}
    </span>
  );
};

const SolutionPanel: React.FC<SolutionPanelProps> = ({ solution, difficulty, onConfirm, onReset, theme }) => {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [editedCode, setEditedCode] = useState(solution.codeSnippet || '');
  
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;
  const isMono = theme === AppTheme.MONO;

  const isModified = editedCode !== solution.codeSnippet;

  // Language Detection Heuristics
  const languagePatterns: Record<string, RegExp> = {
    python: /def\s+\w+\(|import\s+\w+|print\(|#\s+|if\s+__name__\s*==/,
    typescript: /interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|any|void|Array|Promise)/,
    javascript: /const\s+|let\s+|var\s+|function\s+|=>|console\.log|export\s+default/,
    bash: /npm\s+|yarn\s+|pip\s+|sudo\s+|apt-get\s+|git\s+|cd\s+|ls\s+|mkdir\s+/,
    json: /^[\s\n]*[{\[]/,
    html: /<\/?[a-z][\s\S]*>/i,
    css: /[a-z-]+\s*:\s*[^;]+;/i,
    rust: /fn\s+main|pub\s+use|let\s+mut|match\s+/,
    go: /func\s+\w+\(|package\s+main|import\s+\(/,
    java: /public\s+class\s+\w+|System\.out\.println/,
    csharp: /namespace\s+\w+|using\s+System;/
  };

  const detectedLanguage = useMemo(() => {
    if (!editedCode) return solution.language || 'javascript';
    
    // Check for strong matches first
    for (const [lang, regex] of Object.entries(languagePatterns)) {
      if (regex.test(editedCode)) return lang;
    }
    
    return solution.language || 'javascript';
  }, [editedCode, solution.language]);

  useEffect(() => {
    setEditedCode(solution.codeSnippet || '');
  }, [solution]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Prism) {
      const timer = setTimeout(() => {
        (window as any).Prism.highlightAll();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [solution, showExplanation, theme, isEditing, editedCode, detectedLanguage, isFormatting]);

  const handleCopyCode = () => {
    if (editedCode) {
      navigator.clipboard.writeText(editedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleFormat = async () => {
    if (isFormatting || !editedCode) return;
    setIsFormatting(true);
    try {
      const formatted = await formatCodeSnippet(editedCode, detectedLanguage);
      setEditedCode(formatted);
    } catch (err) {
      console.error("Formatting failed:", err);
    } finally {
      setIsFormatting(false);
    }
  };

  const resetToOriginal = () => {
    setEditedCode(solution.codeSnippet || '');
    setIsEditing(false);
  };

  return (
    <div className="space-y-6 animate-reveal">
      <div className={`rounded-3xl border transition-all duration-500 overflow-hidden ${
        isCyber ? 'bg-black border-green-500 shadow-[0_0_30px_rgba(0,255,65,0.05)]' : 
        isMono ? 'bg-white border-black shadow-none border-2' :
        isDark ? 'bg-slate-800/80 border-slate-700 shadow-2xl' : 'bg-white border-slate-100 shadow-2xl'
      }`}>
        <div className="p-8 md:p-10 space-y-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className={`text-2xl font-black tracking-tight leading-none mb-2 ${isCyber ? 'text-green-400' : isMono ? 'text-black uppercase' : ''}`}>Resolution Plan</h3>
              <p className={`text-xs font-bold uppercase tracking-widest ${isCyber ? 'text-green-600' : isMono ? 'text-black' : 'opacity-50'}`}>
                {difficulty} Difficulty level
              </p>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${
              isCyber ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(0,255,65,0.2)]' :
              isMono ? 'bg-white border-black text-black border-2' :
              isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              Verified logic
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className={`font-black text-[9px] uppercase tracking-widest ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'opacity-50'}`}>Root Cause</h4>
              <div className={`rounded-2xl p-6 border h-full flex flex-col justify-center ${
                isCyber ? 'bg-green-900/10 border-green-900' :
                isMono ? 'bg-white border-black border-2' :
                isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-100'
              }`}>
                <p className={`font-bold italic text-lg leading-tight mb-4 ${isCyber ? 'text-green-400' : isMono ? 'text-black' : ''}`}>"{solution.whatWentWrong}"</p>
                <p className={`text-sm leading-relaxed ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'opacity-60'}`}>{solution.whyItHappened}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className={`font-black text-[9px] uppercase tracking-widest ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'opacity-50'}`}>Instructions</h4>
              <div className={`rounded-2xl p-6 border h-full ${
                isCyber ? 'bg-green-900/20 border-green-500 shadow-[0_0_15px_rgba(0,255,65,0.05)]' :
                isMono ? 'bg-white border-black border-2' :
                isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-emerald-50/20 border-emerald-100'
              }`}>
                <div className={`text-sm leading-relaxed font-bold ${isCyber ? 'text-green-400' : isMono ? 'text-black' : ''}`}>
                  <MarkdownText text={solution.howToFixIt} theme={theme} />
                </div>
              </div>
            </div>
          </div>
          
          {solution.codeSnippet && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h4 className={`font-black text-[9px] uppercase tracking-widest ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'opacity-50'}`}>Code Fix</h4>
                  {solution.codeExplanation && (
                    <div className="group relative">
                      <button 
                        onClick={() => setShowExplanation(!showExplanation)}
                        className={`text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                          showExplanation 
                            ? (isCyber ? 'text-green-400' : isMono ? 'text-black underline' : 'text-indigo-500') 
                            : (isCyber ? 'text-green-800 hover:text-green-500' : isMono ? 'text-black opacity-30 hover:opacity-100' : 'text-slate-400 hover:text-slate-600')
                        }`}
                      >
                        <i className={`fas ${showExplanation ? 'fa-eye-slash' : 'fa-lightbulb'}`}></i>
                        {showExplanation ? 'Hide Breakdown' : 'Explain Logic'}
                      </button>
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                        {showExplanation ? 'Hide detailed logic breakdown' : 'See line-by-line explanation'}
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {isModified && (
                    <div className="group relative">
                      <button 
                        onClick={resetToOriginal}
                        className={`p-2 rounded-lg text-[10px] transition-all ${
                          isCyber ? 'text-green-500 hover:bg-green-500/10' : 'text-rose-500 hover:bg-rose-500/10'
                        }`}
                      >
                        <i className="fas fa-undo"></i>
                      </button>
                      <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 bg-rose-600 text-white`}>
                        Reset to AI suggestion
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-rose-600"></div>
                      </div>
                    </div>
                  )}

                  <div className="relative group">
                    <button 
                      onClick={handleFormat}
                      disabled={isFormatting}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border transform active:scale-95 flex items-center gap-2 ${
                        isFormatting
                          ? 'opacity-50 cursor-not-allowed'
                          : (isCyber ? 'bg-black border-green-500 text-green-400 hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]' : isMono ? 'bg-white border-black text-black border-2 hover:bg-black hover:text-white' : isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600')
                      }`}
                    >
                      <i className={`fas ${isFormatting ? 'fa-spinner fa-spin' : 'fa-magic'}`}></i>
                      {isFormatting ? 'Formatting...' : 'Format Code'}
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                      Auto-format using standard conventions
                      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                    </div>
                  </div>
                  
                  <div className="relative group">
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border transform active:scale-95 flex items-center gap-2 ${
                        isEditing 
                          ? (isCyber ? 'bg-green-500 text-black border-green-500 shadow-[0_0_10px_rgba(0,255,65,0.4)]' : isDark ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-900 text-white border-slate-900')
                          : (isCyber ? 'bg-black border-green-500 text-green-400 hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]' : isMono ? 'bg-white border-black text-black border-2 hover:bg-black hover:text-white' : isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600')
                      }`}
                    >
                      <i className={`fas ${isEditing ? 'fa-check' : 'fa-edit'}`}></i>
                      {isEditing ? 'Done Editing' : 'Edit Code'}
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                      {isEditing ? 'Save edits and return to preview' : 'Make minor edits to the snippet'}
                      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                    </div>
                  </div>

                  <div className="relative group">
                    {copied && (
                      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest animate-reveal shadow-lg z-10 whitespace-nowrap ${
                        isCyber ? 'bg-green-500 text-black shadow-[0_0_10px_rgba(0,255,65,0.6)]' : 
                        isMono ? 'bg-black text-white' : 
                        isDark ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-white'
                      }`}>
                        Copied!
                        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${
                          isCyber ? 'bg-green-500' : isMono ? 'bg-black' : isDark ? 'bg-indigo-500' : 'bg-slate-900'
                        }`}></div>
                      </div>
                    )}
                    <button 
                      onClick={handleCopyCode}
                      className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border transform active:scale-95 flex items-center gap-2 ${
                        copied 
                          ? (isCyber ? 'bg-green-500/10 text-green-400 border-green-500' : isMono ? 'bg-black text-white border-black' : isDark ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500' : 'bg-slate-100 text-slate-900 border-slate-400') 
                          : (isCyber ? 'bg-black border-green-500 text-green-400 hover:shadow-[0_0_10px_rgba(0,255,65,0.2)]' : isMono ? 'bg-white border-black text-black border-2 hover:bg-black hover:text-white' : isDark ? 'bg-slate-700 border-slate-600 hover:border-slate-400 text-slate-300' : 'bg-white border-slate-200 hover:border-slate-400 text-slate-600')
                      }`}
                    >
                      <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                      {copied ? 'Success' : 'Copy Code'}
                    </button>
                    <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                      Copy current code to clipboard
                      <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                    </div>
                  </div>
                </div>
              </div>

              {showExplanation && solution.codeExplanation && (
                <div className={`p-5 rounded-2xl border mb-2 animate-reveal ${
                  isCyber ? 'bg-green-900/10 border-green-500/30' : 
                  isMono ? 'bg-white border-black border-2' :
                  isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-indigo-50/30 border-indigo-100'
                }`}>
                  <h5 className={`text-[8px] font-black uppercase tracking-widest mb-2 ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'text-indigo-500'}`}>
                    Logical Breakdown
                  </h5>
                  <p className={`text-xs leading-relaxed ${isCyber ? 'text-green-400' : isMono ? 'text-black' : 'opacity-70'}`}>
                    {solution.codeExplanation}
                  </p>
                </div>
              )}
              
              <div className={`rounded-2xl overflow-hidden border transition-all ${
                isCyber ? 'bg-black border-green-500 shadow-[inset_0_0_20px_rgba(0,255,65,0.05)]' : 
                isMono ? 'bg-white border-black border-2' :
                isDark ? 'bg-black border-slate-700 shadow-inner' : 'bg-[#1e1e1e] border-slate-200 shadow-xl'
              }`}>
                <div className={`px-5 py-3 flex justify-between items-center ${
                  isCyber ? 'bg-green-900/20' : isMono ? 'bg-black text-white' : isDark ? 'bg-slate-800' : 'bg-[#252525]'
                }`}>
                   <span className={`text-[9px] font-black uppercase tracking-[0.2em] flex items-center gap-2 ${
                     isCyber ? 'text-green-500' : isMono ? 'text-white' : 'opacity-40'
                   }`}>
                     <i className="fas fa-microchip text-[7px] opacity-40"></i>
                     {detectedLanguage.charAt(0).toUpperCase() + detectedLanguage.slice(1)}
                     {isEditing && <span className="ml-2 lowercase opacity-50 italic">(editing mode)</span>}
                   </span>
                   <div className={`flex gap-1.5 ${isCyber ? 'text-green-500 shadow-[0_0_5px_rgba(0,255,65,0.5)]' : isMono ? 'text-white' : 'opacity-20'}`}>
                     <div className="w-2 h-2 rounded-full bg-current"></div>
                     <div className="w-2 h-2 rounded-full bg-current"></div>
                   </div>
                </div>

                <div className={`max-h-96 overflow-auto scroll-smooth no-scrollbar ${isEditing ? 'grid md:grid-cols-2 divide-x divide-white/10' : ''}`}>
                  {isEditing ? (
                    <>
                      <div className="relative group/edit">
                        <div className="absolute top-2 right-4 text-[7px] font-black uppercase tracking-widest opacity-30 select-none">Input Buffer</div>
                        <textarea
                          value={editedCode}
                          onChange={(e) => setEditedCode(e.target.value)}
                          spellCheck={false}
                          autoFocus
                          className={`w-full min-h-[300px] h-full p-6 bg-transparent outline-none resize-none mono-font text-[13px] leading-relaxed block ${
                            isCyber ? 'text-green-400 caret-green-500' : isMono ? 'text-black' : 'text-slate-300'
                          }`}
                        />
                      </div>
                      <div className="relative group/preview overflow-auto">
                        <div className="absolute top-2 right-4 text-[7px] font-black uppercase tracking-widest text-indigo-500 animate-pulse select-none">Live Highlight Preview</div>
                        <pre className="p-6 m-0 !bg-transparent !text-[13px] leading-relaxed mono-font">
                          <code className={`language-${detectedLanguage} ${isCyber ? 'text-green-400' : isMono ? 'text-black' : ''}`}>
                            {editedCode}
                          </code>
                        </pre>
                      </div>
                    </>
                  ) : (
                    <pre className="p-6 m-0 !bg-transparent !text-[13px] leading-relaxed mono-font">
                      <code className={`language-${detectedLanguage} ${isCyber ? 'text-green-400' : isMono ? 'text-black' : ''}`}>
                        {editedCode}
                      </code>
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 group relative">
              <button
                onClick={onConfirm}
                className={`w-full font-black py-4 px-8 rounded-xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg transform hover:-translate-y-1 active:translate-y-0 ${
                  isCyber ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(0,255,65,0.4)] hover:shadow-[0_0_30px_rgba(0,255,65,0.6)]' : 
                  isMono ? 'bg-black text-white hover:bg-white hover:text-black border-2 border-black' :
                  isDark ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-900 text-white'
                }`}
              >
                Resolve & Archive
              </button>
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                Save current code to history and clear
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
              </div>
            </div>
            <div className="group relative">
              <button
                 onClick={onReset}
                 className={`px-8 py-4 font-black rounded-xl border-2 transition-all text-[10px] uppercase tracking-[0.2em] transform hover:-translate-y-1 active:scale-95 ${
                   isCyber ? 'border-green-500 text-green-400 hover:bg-green-900/20' :
                   isMono ? 'border-black text-black hover:bg-black hover:text-white' :
                   isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-100 text-slate-400 hover:text-slate-900'
                 }`}
              >
                Discard
              </button>
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                Discard and start a new analysis
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionPanel;
