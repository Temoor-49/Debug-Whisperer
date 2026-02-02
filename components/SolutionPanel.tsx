
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { DebugResponse, Difficulty, AppTheme, ChatMessage, UserProfile } from '../types';
import { formatCodeSnippet, createSolutionChat, sendMessageToChat, elaborateCodeExplanation } from '../services/geminiService';

interface SolutionPanelProps {
  initialSolution: DebugResponse;
  difficulty: Difficulty;
  onConfirm: () => void;
  onReset: () => void;
  theme: AppTheme;
  profile?: UserProfile;
}

const MarkdownText: React.FC<{ text: string; theme: AppTheme }> = ({ text, theme }) => {
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;
  const isMono = theme === AppTheme.MONO;
  
  const lines = text.split('\n');
  
  return (
    <div className="space-y-1">
      {lines.map((line, lineIdx) => {
        const parts = line.split(/(\*\*.*?\*\*|`.*?`)/g);
        const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ');
        
        return (
          <p key={lineIdx} className={`whitespace-pre-wrap ${isBullet ? 'pl-4 relative' : ''}`}>
            {isBullet && <span className="absolute left-0 top-0 opacity-50">•</span>}
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
                    className={`px-1.5 py-0.5 rounded text-[11px] mono-font font-bold border ${
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
          </p>
        );
      })}
    </div>
  );
};

const SolutionPanel: React.FC<SolutionPanelProps> = ({ initialSolution, difficulty, onConfirm, onReset, theme, profile }) => {
  const [copied, setCopied] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [previewTab, setPreviewTab] = useState<'code' | 'render'>('code');
  const [lastSync, setLastSync] = useState<number>(Date.now());
  
  // Elaborate Explanation state
  const [elaboratedExplanation, setElaboratedExplanation] = useState<string | null>(null);
  const [isElaborating, setIsElaborating] = useState(false);
  
  // Chat state
  const [solution, setSolution] = useState<DebugResponse>(initialSolution);
  const [editedCode, setEditedCode] = useState(initialSolution.codeSnippet || '');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: initialSolution.chatResponse || "I've analyzed the issue. Here is my suggested fix.", response: initialSolution, timestamp: Date.now() }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const chatInstance = useRef<any>(null);
  const scrollAnchor = useRef<HTMLDivElement>(null);

  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;
  const isMono = theme === AppTheme.MONO;

  const languagePatterns: Record<string, RegExp> = {
    python: /def\s+\w+\(|import\s+(os|sys|pandas|numpy|math|json)|print\(|#\s+|if\s+__name__\s*==|elif\s+|lambda\s+\w+:|@[\w\.]+/,
    typescript: /interface\s+\w+|type\s+\w+\s*=|:\s*(string|number|boolean|any|void|Array|Promise|React\.)|readonly\s+|private\s+/,
    javascript: /const\s+\w+\s*=|let\s+\w+\s*=|var\s+|function\s+|=>|console\.log|export\s+(default|const)|import\s+.*from/,
    rust: /fn\s+\w+\s*\(|pub\s+(struct|enum|fn|use)|let\s+mut|match\s+|impl\s+|#!\[|println!/,
    go: /func\s+\w+\(|package\s+\w+|import\s+\(|chan\s+|go\s+func|select\s+\{/,
    java: /public\s+static\s+void\s+main|System\.out\.println|private\s+final\s+|@Override|implements\s+\w+/,
    csharp: /using\s+System(\.|\s*;)|namespace\s+\w+|public\s+class\s+\w+|\[[\w]+Attribute\]/,
    bash: /npm\s+|yarn\s+|pip\s+|sudo\s+|apt-get\s+|git\s+|cd\s+|ls\s+|mkdir\s+|#!/,
    json: /^[\s\n]*[{\[]/,
    html: /<\/?[a-z][\s\S]*>/i,
    css: /[a-z-]+\s*:\s*[^;]+;/i,
    cpp: /#include\s+<[\w\.]+>|std::\w+|using\s+namespace\s+std;|int\s+main\(\)/
  };

  const detectedLanguage = useMemo(() => {
    const textToScan = editedCode || solution.codeSnippet || '';
    if (!textToScan) return solution.language || 'javascript';
    
    for (const [lang, regex] of Object.entries(languagePatterns)) {
      if (regex.test(textToScan)) return lang;
    }
    return solution.language || 'javascript';
  }, [editedCode, solution.codeSnippet, solution.language]);

  const canRender = detectedLanguage === 'html';

  // Inject common styling for HTML preview to ensure a "World Class" look
  const htmlPreviewContent = useMemo(() => {
    if (!canRender) return '';
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <script src="https://cdn.tailwindcss.com"></script>
          <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
          <style>
            body { font-family: sans-serif; padding: 20px; transition: all 0.3s ease; }
          </style>
        </head>
        <body>
          ${editedCode}
        </body>
      </html>
    `;
  }, [editedCode, canRender]);

  useEffect(() => {
    if (!chatInstance.current) {
      chatInstance.current = createSolutionChat(difficulty, profile);
    }
  }, [difficulty, profile]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Prism) {
      const timer = setTimeout(() => {
        (window as any).Prism.highlightAll();
        setLastSync(Date.now());
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [solution, showExplanation, theme, isEditing, editedCode, detectedLanguage, isFormatting, messages, elaboratedExplanation, previewTab]);

  useEffect(() => {
    if (scrollAnchor.current) {
      scrollAnchor.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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

  const handleElaborate = async () => {
    if (isElaborating || elaboratedExplanation) return;
    setIsElaborating(true);
    try {
      const result = await elaborateCodeExplanation(editedCode, detectedLanguage, difficulty);
      setElaboratedExplanation(result);
    } catch (err) {
      console.error("Elaboration failed:", err);
    } finally {
      setIsElaborating(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isSending) return;
    
    const userMsg: ChatMessage = { role: 'user', text: chatInput, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsSending(true);

    try {
      const result = await sendMessageToChat(chatInstance.current, userMsg.text);
      const modelMsg: ChatMessage = { 
        role: 'model', 
        text: result.chatResponse || "I've updated the fix based on your feedback.", 
        response: result, 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, modelMsg]);
      setSolution(result);
      setElaboratedExplanation(null);
      if (result.codeSnippet) {
        setEditedCode(result.codeSnippet);
      }
    } catch (err) {
      console.error("Chat failed:", err);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble processing that follow-up. Could you rephrase?", timestamp: Date.now() }]);
    } finally {
      setIsSending(false);
    }
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
            <div className="flex flex-col gap-1">
              <h3 className={`text-2xl font-black tracking-tight leading-none mb-1 ${isCyber ? 'text-green-400' : isMono ? 'text-black uppercase' : ''}`}>Resolution Plan</h3>
              <div className="flex items-center gap-2">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${isCyber ? 'text-green-600' : isMono ? 'text-black' : 'opacity-50'}`}>
                  {difficulty} Difficulty
                </p>
                <div className={`w-1 h-1 rounded-full ${isCyber ? 'bg-green-800' : 'bg-slate-300'}`}></div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isCyber ? 'text-green-500' : 'text-indigo-500'}`}>
                  Detected: {detectedLanguage}
                </p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
              isCyber ? 'bg-green-900/20 border-green-500 text-green-400 shadow-[0_0_10px_rgba(0,255,65,0.2)]' :
              isMono ? 'bg-white border-black text-black border-2' :
              isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}>
              Stateful Debug Session
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className={`font-black text-[9px] uppercase tracking-widest ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'opacity-50'}`}>Current Diagnosis</h4>
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
              <div className="flex items-center justify-between">
                <h4 className={`font-black text-[9px] uppercase tracking-widest ${isCyber ? 'text-green-500' : isMono ? 'text-black' : 'opacity-50'}`}>How to Fix It</h4>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${
                  isCyber ? 'border-green-800 text-green-700' : 'border-indigo-100 text-indigo-400'
                }`}>
                  {detectedLanguage} Optimized
                </span>
              </div>
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
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setShowExplanation(!showExplanation)}
                        className={`text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${
                          showExplanation 
                            ? (isCyber ? 'text-green-400' : isMono ? 'text-black underline' : 'text-indigo-500') 
                            : (isCyber ? 'text-green-800 hover:text-green-500' : isMono ? 'text-black opacity-30 hover:opacity-100' : 'text-slate-400 hover:text-slate-600')
                        }`}
                      >
                        <i className={`fas ${showExplanation ? 'fa-eye-slash' : 'fa-lightbulb'}`}></i>
                        {showExplanation ? 'Hide Logic' : 'Explain Logic'}
                      </button>

                      {showExplanation && (
                        <button 
                          onClick={handleElaborate}
                          disabled={isElaborating}
                          className={`text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 px-3 py-1 rounded-full border ${
                            elaboratedExplanation 
                              ? (isCyber ? 'bg-green-500 text-black border-green-500' : 'bg-indigo-500 text-white border-indigo-500') 
                              : (isCyber ? 'text-green-500 border-green-500/30 hover:bg-green-500/10' : 'text-indigo-500 border-indigo-500/30 hover:bg-indigo-500/10')
                          } ${isElaborating ? 'animate-pulse opacity-50' : ''}`}
                        >
                          <i className={`fas ${isElaborating ? 'fa-spinner fa-spin' : 'fa-search-plus'}`}></i>
                          {isElaborating ? 'Analyzing...' : elaboratedExplanation ? 'Detailed Breakdown Active' : 'Elaborate Explanation'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleFormat} disabled={isFormatting} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isFormatting ? 'opacity-50' : (isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600')}`}>
                    <i className={`fas ${isFormatting ? 'fa-spinner fa-spin' : 'fa-magic'} mr-2`}></i>
                    Format
                  </button>
                  <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isEditing ? (isCyber ? 'bg-green-500 text-black' : 'bg-slate-900 text-white') : (isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600')}`}>
                    <i className={`fas ${isEditing ? 'fa-check' : 'fa-edit'} mr-2`}></i>
                    {isEditing ? 'Done' : 'Edit'}
                  </button>
                  <button onClick={handleCopyCode} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${copied ? 'text-emerald-500' : (isDark ? 'bg-slate-700 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-600')}`}>
                    <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
                    Copy
                  </button>
                </div>
              </div>

              {showExplanation && (
                <div className="space-y-4 animate-reveal">
                  {solution.codeExplanation && (
                    <div className={`p-5 rounded-2xl border ${isCyber ? 'bg-green-900/10 border-green-500/30' : isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-indigo-50/30 border-indigo-100'}`}>
                      <h5 className={`text-[8px] font-black uppercase tracking-widest mb-2 ${isCyber ? 'text-green-500' : 'text-indigo-500'}`}>Summary Breakdown</h5>
                      <p className="text-xs leading-relaxed opacity-70">{solution.codeExplanation}</p>
                    </div>
                  )}

                  {elaboratedExplanation && (
                    <div className={`p-6 rounded-2xl border-2 animate-reveal ${isCyber ? 'bg-black border-green-500 shadow-[0_0_20px_rgba(0,255,65,0.05)]' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200 shadow-lg'}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCyber ? 'bg-green-500 text-black' : 'bg-indigo-500 text-white'}`}>
                          <i className="fas fa-graduation-cap text-xs"></i>
                        </div>
                        <h5 className={`text-[10px] font-black uppercase tracking-widest ${isCyber ? 'text-green-400' : 'text-indigo-600'}`}>Step-by-Step Lesson</h5>
                      </div>
                      <div className={`text-xs leading-relaxed ${isCyber ? 'text-green-300' : 'text-slate-600'}`}>
                        <MarkdownText text={elaboratedExplanation} theme={theme} />
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <div className={`rounded-2xl overflow-hidden border transition-all duration-300 ${isCyber ? 'bg-black border-green-500' : isDark ? 'bg-black border-slate-700' : 'bg-[#1e1e1e] border-slate-200'}`}>
                <div className={`px-5 py-3 flex justify-between items-center ${isCyber ? 'bg-green-900/20' : isDark ? 'bg-slate-800' : 'bg-[#252525]'}`}>
                   <div className="flex items-center gap-4">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                       {detectedLanguage} fix {isEditing && '(Editing Mode)'}
                     </span>
                     {isEditing && (
                       <div className="flex items-center gap-1">
                         <button 
                           onClick={() => setPreviewTab('code')}
                           className={`text-[8px] font-black uppercase tracking-widest transition-all px-2.5 py-1 rounded-md ${previewTab === 'code' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/50'}`}
                         >
                           <i className="fas fa-code mr-1.5"></i> Code
                         </button>
                         {canRender && (
                           <button 
                             onClick={() => setPreviewTab('render')}
                             className={`text-[8px] font-black uppercase tracking-widest transition-all px-2.5 py-1 rounded-md ${previewTab === 'render' ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30 hover:text-white/50'}`}
                           >
                             <i className="fas fa-play mr-1.5"></i> Render
                           </button>
                         )}
                       </div>
                     )}
                   </div>
                   <div className="flex items-center gap-2">
                     {isEditing && (
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/5 shadow-inner">
                           <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                           <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500/80">Live Sync Active</span>
                        </div>
                     )}
                     <div className="flex items-center gap-1.5 opacity-20 ml-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                       <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                     </div>
                   </div>
                </div>
                <div className={`max-h-[500px] overflow-auto ${isEditing && previewTab === 'code' ? 'grid md:grid-cols-2 divide-x divide-white/10' : ''}`}>
                  {isEditing ? (
                    <>
                      {previewTab === 'code' ? (
                        <>
                          <div className="flex flex-col h-full min-h-[400px]">
                            <div className="bg-white/[0.02] px-4 py-2 text-[8px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 flex items-center justify-between">
                              <span>Source Editor</span>
                              <i className="fas fa-pencil text-[7px]"></i>
                            </div>
                            <textarea 
                              value={editedCode} 
                              onChange={(e) => setEditedCode(e.target.value)} 
                              spellCheck={false} 
                              className={`w-full h-full p-6 bg-transparent outline-none resize-none mono-font text-[13px] leading-relaxed text-slate-300 flex-1 custom-scrollbar`} 
                            />
                          </div>
                          <div className="flex flex-col h-full bg-[#161616]">
                            <div className="bg-white/[0.02] px-4 py-2 text-[8px] font-black uppercase tracking-widest text-white/30 border-b border-white/5 flex items-center justify-between">
                              <span>Live Formatted Preview</span>
                              <span className="text-[7px] opacity-40">Synced: {new Date(lastSync).toLocaleTimeString()}</span>
                            </div>
                            <pre className="p-6 m-0 !bg-transparent !text-[13px] leading-relaxed mono-font flex-1 overflow-auto custom-scrollbar">
                              <code className={`language-${detectedLanguage}`}>{editedCode}</code>
                            </pre>
                          </div>
                        </>
                      ) : (
                        <div className="w-full min-h-[400px] bg-white flex flex-col">
                           <div className="bg-slate-100 px-4 py-2.5 flex items-center gap-4 border-b border-slate-200">
                              <div className="flex gap-1.5 shrink-0">
                                 <div className="w-2.5 h-2.5 rounded-full bg-rose-400"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div>
                                 <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
                              </div>
                              <div className="bg-white border border-slate-200 rounded-md px-3 py-1 text-[9px] text-slate-400 flex-1 truncate font-medium shadow-sm">
                                 https://whisperer-sandbox.local/preview.html
                              </div>
                              <div className="flex items-center gap-2 opacity-30">
                                <i className="fas fa-rotate-right text-[10px]"></i>
                                <i className="fas fa-ellipsis-vertical text-[10px]"></i>
                              </div>
                           </div>
                           <iframe 
                             title="Web Render Preview" 
                             srcDoc={htmlPreviewContent} 
                             className="w-full flex-1 border-none bg-white"
                           />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-col h-full bg-[#1a1a1a]">
                       <div className="bg-white/[0.02] px-5 py-2 text-[8px] font-black uppercase tracking-widest text-white/20 border-b border-white/5">ReadOnly Manifest</div>
                       <pre className="p-8 m-0 !bg-transparent !text-[13px] leading-relaxed mono-font overflow-auto custom-scrollbar">
                         <code className={`language-${detectedLanguage}`}>{editedCode}</code>
                       </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Discussion / Chat Section */}
          <div className="space-y-6 pt-4 border-t border-slate-500/10">
            <h4 className={`font-black text-[9px] uppercase tracking-widest ${isCyber ? 'text-green-500' : 'opacity-40'}`}>Discussion & Follow-ups</h4>
            <div className="space-y-4 max-h-80 overflow-y-auto pr-2 no-scrollbar">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-reveal`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed border ${
                    msg.role === 'user'
                      ? (isCyber ? 'bg-green-500 text-black border-green-500' : isDark ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-900 text-white border-slate-900')
                      : (isCyber ? 'bg-black border-green-900 text-green-400' : isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700')
                  }`}>
                    <MarkdownText text={msg.text} theme={theme} />
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start animate-pulse">
                  <div className={`p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest ${isCyber ? 'text-green-500' : 'text-slate-400'}`}>
                    Thinking...
                  </div>
                </div>
              )}
              <div ref={scrollAnchor} />
            </div>

            <div className={`relative rounded-2xl border overflow-hidden transition-all ${isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendChat(); } }}
                placeholder="Ask follow-up questions or request changes..."
                className="w-full h-24 p-5 bg-transparent outline-none resize-none text-xs leading-relaxed"
                disabled={isSending}
              />
              <div className={`px-4 py-2 border-t flex justify-end ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                <button 
                  onClick={handleSendChat}
                  disabled={!chatInput.trim() || isSending}
                  className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                    !chatInput.trim() || isSending ? 'opacity-20 cursor-not-allowed' : (isCyber ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'bg-indigo-600 text-white')
                  }`}
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Send Message
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={onConfirm}
              className={`flex-1 font-black py-4 px-8 rounded-xl transition-all text-[10px] uppercase tracking-[0.2em] shadow-lg transform hover:-translate-y-1 active:translate-y-0 ${
                isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-indigo-500 text-white shadow-indigo-500/20' : 'bg-slate-900 text-white'
              }`}
            >
              Resolve & Archive
            </button>
            <button
               onClick={onReset}
               className={`px-8 py-4 font-black rounded-xl border-2 transition-all text-[10px] uppercase tracking-[0.2em] transform hover:-translate-y-1 active:scale-95 ${
                 isCyber ? 'border-green-500 text-green-400 hover:bg-green-900/20' :
                 isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-100 text-slate-400 hover:text-slate-900'
               }`}
            >
              Discard Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SolutionPanel;
