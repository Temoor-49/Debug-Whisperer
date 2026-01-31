
import React, { useState, useEffect } from 'react';
import { Difficulty, DebugResponse, MemoryEntry, AppTheme, UserProfile, PreventionResponse, DetectiveResponse } from './types';
import { analyzeErrorInitial, generateSolution, analyzePrevention, analyzeDetective } from './services/geminiService';
import Header from './components/Header';
import ErrorInput from './components/ErrorInput';
import SolutionPanel from './components/SolutionPanel';
import MemoryPanel from './components/MemoryPanel';
import ProfileSettings from './components/ProfileSettings';
import PreventionPanel from './components/PreventionPanel';
import DetectivePanel from './components/DetectivePanel';

const WhisperingSteps: React.FC<{ theme: AppTheme; mode: 'error' | 'prevention' | 'detective' }> = ({ theme, mode }) => {
  const steps = {
    error: ["Analyzing patterns", "Identifying root cause", "Synthesizing fix"],
    prevention: ["Scanning logic paths", "Simulating edge cases", "Drafting auto-patch"],
    detective: ["Tracing propagation", "Backtracking files", "Mapping dependencies", "Building chain"]
  }[mode];
    
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % steps.length);
    }, 1200);
    return () => clearInterval(interval);
  }, [steps]);

  const isCyber = theme === AppTheme.CYBER;
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-reveal">
      <div className="relative">
        <div className={`w-12 h-12 border-2 rounded-full animate-spin ${
          isCyber ? 'border-green-500 border-t-transparent shadow-[0_0_15px_rgba(0,255,65,0.4)]' : 
          theme === AppTheme.MONO ? 'border-slate-200 border-t-black' : 
          'border-indigo-100 border-t-indigo-600'
        }`}></div>
      </div>
      <div className="text-center">
        <p className={`font-black uppercase tracking-[0.2em] text-[10px] ${
          isCyber ? 'text-green-400' : isDark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          Step {currentStep + 1}: {steps[currentStep]}...
        </p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [errorInput, setErrorInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string } | null>(null);
  const [initialExplanation, setInitialExplanation] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [solution, setSolution] = useState<DebugResponse | null>(null);
  const [preventionData, setPreventionData] = useState<PreventionResponse | null>(null);
  const [detectiveData, setDetectiveData] = useState<DetectiveResponse | null>(null);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [theme, setTheme] = useState<AppTheme>(AppTheme.PRO);
  const [showProfile, setShowProfile] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    preferredLanguage: '',
    experienceLevel: Difficulty.BEGINNER,
    frameworks: ''
  });

  useEffect(() => {
    const savedMemories = localStorage.getItem('dw_memories');
    if (savedMemories) setMemories(JSON.parse(savedMemories));
    const savedTheme = localStorage.getItem('dw_theme') as AppTheme;
    if (Object.values(AppTheme).includes(savedTheme)) setTheme(savedTheme);
    const savedProfile = localStorage.getItem('dw_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
    else setShowProfile(true);
  }, []);

  const changeTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    localStorage.setItem('dw_theme', newTheme);
  };

  const handleSaveProfile = (newProfile: UserProfile) => {
    setProfile(newProfile);
    localStorage.setItem('dw_profile', JSON.stringify(newProfile));
  };

  const saveMemory = (entry: MemoryEntry) => {
    const newMemories = [entry, ...memories].slice(0, 50);
    setMemories(newMemories);
    localStorage.setItem('dw_memories', JSON.stringify(newMemories));
  };

  const handleDeleteMemory = (id: string) => {
    const newMemories = memories.filter(m => m.id !== id);
    setMemories(newMemories);
    localStorage.setItem('dw_memories', JSON.stringify(newMemories));
  };

  const getActiveMode = (text: string): 'error' | 'prevention' | 'detective' => {
    if (text.toLowerCase().includes('entire project') || text.toLowerCase().includes('multiple files')) return 'detective';
    const errorIndicators = ['error:', 'exception', 'at ', 'line ', 'stack trace', 'uncaught'];
    const codeIndicators = ['function', 'class', 'def ', 'import ', 'export ', '=>', '{', 'let ', 'const '];
    const hasError = errorIndicators.some(ind => text.toLowerCase().includes(ind));
    const hasCode = codeIndicators.some(ind => text.toLowerCase().includes(ind));
    return (hasCode && !hasError) ? 'prevention' : 'error';
  };

  const handleAnalyze = async (text: string, image?: { base64: string; mimeType: string }) => {
    if (!text.trim() && !image) return;
    setLoading(true);
    setInitialExplanation(null);
    setSolution(null);
    setDifficulty(null);
    setPreventionData(null);
    setDetectiveData(null);
    
    try {
      const mode = image ? 'error' : getActiveMode(text);
      if (mode === 'detective') {
        const result = await analyzeDetective(text, profile);
        setDetectiveData(result);
      } else if (mode === 'prevention') {
        const result = await analyzePrevention(text, profile);
        setPreventionData(result);
      } else {
        const explanation = await analyzeErrorInitial({
          text: text || undefined,
          imageBase64: image?.base64,
          mimeType: image?.mimeType
        }, profile);
        setInitialExplanation(explanation);
      }
    } catch (err) {
      setInitialExplanation("Issue processing input. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDifficulty = async (level: Difficulty) => {
    const context = selectedImage ? "Capture analysis" : errorInput;
    setDifficulty(level);
    setLoading(true);
    try {
      const result = await generateSolution(context, initialExplanation!, level, profile);
      setSolution(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFixConfirmed = () => {
    saveMemory({
      id: Date.now().toString(),
      errorSnippet: detectiveData ? "Project Analysis" : selectedImage ? "Captured Error" : errorInput.slice(0, 80),
      explanation: detectiveData ? "Multi-file fix applied" : preventionData ? "Prevention patch applied" : initialExplanation || "Fix applied",
      timestamp: Date.now(),
      tags: detectiveData ? ['Detective', 'Multi-file'] : preventionData ? ['Prevention'] : solution?.tags || []
    });
    setErrorInput('');
    setSelectedImage(null);
    setInitialExplanation(null);
    setSolution(null);
    setDifficulty(null);
    setPreventionData(null);
    setDetectiveData(null);
  };

  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 theme-${theme} ${isDark ? 'bg-[#0f172a] text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Header 
        theme={theme} 
        onThemeChange={changeTheme} 
        onOpenProfile={() => setShowProfile(true)}
        hasProfile={!!(profile.preferredLanguage || profile.frameworks)}
      />
      {showProfile && <ProfileSettings theme={theme} profile={profile} onSave={handleSaveProfile} onClose={() => setShowProfile(false)} />}
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 space-y-8">
        {!initialExplanation && !preventionData && !detectiveData ? (
          <div className="space-y-6">
            <div className="text-center max-w-lg mx-auto mb-10">
              <h2 className={`text-3xl font-black tracking-tight mb-2 ${isCyber ? 'text-green-400' : ''}`}>Proactive Debugging.</h2>
              <p className={`text-sm font-medium italic ${isCyber ? 'text-green-500' : 'opacity-60'}`}>Paste code to scan, logs to fix, or mention "entire project" for Detective Mode.</p>
            </div>
            <ErrorInput 
              value={errorInput} 
              onChange={setErrorInput} 
              onImageSelect={setSelectedImage}
              selectedImage={selectedImage}
              onAnalyze={(val) => handleAnalyze(val, selectedImage || undefined)} 
              loading={loading}
              theme={theme}
            />
          </div>
        ) : loading ? (
           <WhisperingSteps theme={theme} mode={detectiveData ? 'detective' : preventionData ? 'prevention' : 'error'} />
        ) : detectiveData ? (
          <DetectivePanel data={detectiveData} theme={theme} onConfirm={handleFixConfirmed} onReset={() => setDetectiveData(null)} />
        ) : preventionData ? (
          <PreventionPanel data={preventionData} theme={theme} onConfirm={handleFixConfirmed} onReset={() => setPreventionData(null)} />
        ) : (
          <div className="space-y-8 animate-reveal">
            <div className={`rounded-3xl p-8 border shadow-lg ${isCyber ? 'bg-black border-green-500 shadow-[0_0_20px_rgba(0,255,65,0.1)]' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white'}`}>
                  <i className="fas fa-magic text-xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-3 ${isCyber ? 'text-green-500' : 'opacity-50'}`}>Expert Diagnosis</h3>
                  <p className={`text-xl font-bold leading-tight mb-8 ${isCyber ? 'text-green-400' : ''}`}>{initialExplanation}</p>
                  {!difficulty && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[Difficulty.BEGINNER, Difficulty.INTERMEDIATE, Difficulty.EXPERT].map((level) => (
                        <button key={level} onClick={() => handleSelectDifficulty(level)} className={`p-4 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${isCyber ? 'bg-black border-green-900 text-green-500 hover:border-green-400' : isDark ? 'bg-slate-900 border-slate-700 hover:border-indigo-500' : 'bg-slate-50 border-slate-100 hover:border-indigo-600'}`}>
                          {level}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            {solution && <SolutionPanel solution={solution} difficulty={difficulty!} onConfirm={handleFixConfirmed} theme={theme} onReset={() => { setInitialExplanation(null); setSolution(null); }} />}
          </div>
        )}
        <MemoryPanel memories={memories} theme={theme} onDeleteMemory={handleDeleteMemory} />
      </main>
    </div>
  );
};

export default App;
