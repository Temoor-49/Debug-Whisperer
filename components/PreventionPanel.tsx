
import React, { useState, useEffect } from 'react';
import { PreventionResponse, AppTheme } from '../types';

interface PreventionPanelProps {
  data: PreventionResponse;
  theme: AppTheme;
  onConfirm: () => void;
  onReset: () => void;
}

const PreventionPanel: React.FC<PreventionPanelProps> = ({ data, theme, onConfirm, onReset }) => {
  const [showReasoning, setShowReasoning] = useState(false);
  const [copied, setCopied] = useState(false);
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;
  const isMono = theme === AppTheme.MONO;

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Prism) {
      (window as any).Prism.highlightAll();
    }
  }, [data, theme]);

  const handleCopy = () => {
    navigator.clipboard.writeText(data.autoPatch);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSeverityIcon = (sev: string) => {
    switch (sev) {
      case 'High': return 'fa-fire-alt';
      case 'Medium': return 'fa-exclamation-circle';
      case 'Low': return 'fa-info-circle';
      default: return 'fa-question-circle';
    }
  };

  const getSeverityColor = (sev: string) => {
    if (isCyber) return 'text-green-400';
    switch (sev) {
      case 'High': return 'text-rose-500';
      case 'Medium': return 'text-amber-500';
      case 'Low': return 'text-sky-500';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="space-y-8 animate-reveal">
      {/* Header Info */}
      <div className={`rounded-3xl p-8 border shadow-xl ${
        isCyber ? 'bg-black border-green-500 shadow-[0_0_20px_rgba(0,255,65,0.1)]' :
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className={`text-2xl font-black tracking-tight ${isCyber ? 'text-green-400' : ''}`}>Prevention Mode Activated</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Proactive Logic Analysis</p>
          </div>
          <button 
            onClick={() => setShowReasoning(!showReasoning)}
            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${
              showReasoning 
              ? (isCyber ? 'bg-green-500 text-black border-green-500' : 'bg-slate-900 text-white')
              : (isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-200 text-slate-500')
            }`}
          >
            {showReasoning ? 'Hide Reasoning' : 'Trace Reasoning'}
          </button>
        </div>

        {showReasoning && (
          <div className={`mb-8 p-6 rounded-2xl border animate-reveal ${
            isCyber ? 'bg-green-900/10 border-green-900' :
            isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'
          }`}>
            <h4 className={`text-[8px] font-black uppercase tracking-widest mb-3 ${isCyber ? 'text-green-500' : 'opacity-40'}`}>Model Internal Logic</h4>
            <p className={`text-xs leading-relaxed italic ${isCyber ? 'text-green-400' : ''}`}>{data.reasoning}</p>
          </div>
        )}

        {/* Prediction Feed */}
        <div className="space-y-4">
          <h4 className={`text-[9px] font-black uppercase tracking-widest ${isCyber ? 'text-green-500' : 'opacity-40'}`}>Runtime Risk Assessment</h4>
          {data.predictions.map((p, i) => (
            <div key={i} className={`p-6 rounded-2xl border transition-all transform hover:scale-[1.01] ${
              isCyber ? 'bg-black border-green-900' :
              isDark ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50/50 border-slate-100'
            }`}>
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isCyber ? 'bg-green-500 text-black' : 
                  p.severity === 'High' ? 'bg-rose-500/10 text-rose-500' : 
                  p.severity === 'Medium' ? 'bg-amber-500/10 text-amber-500' : 'bg-sky-500/10 text-sky-500'
                }`}>
                  <i className={`fas ${getSeverityIcon(p.severity)}`}></i>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest ${getSeverityColor(p.severity)}`}>
                      ⚠️ {p.severity} Severity &bull; {p.errorType} ({p.probability}%)
                    </span>
                  </div>
                  <div className="space-y-2 mt-3">
                    <p className="text-xs">
                      <strong className={`uppercase tracking-tighter text-[9px] mr-2 ${isCyber ? 'text-green-600' : 'opacity-40'}`}>Trigger:</strong>
                      <span className="font-bold">{p.trigger}</span>
                    </p>
                    <p className="text-xs">
                      <strong className={`uppercase tracking-tighter text-[9px] mr-2 ${isCyber ? 'text-green-600' : 'opacity-40'}`}>Because:</strong>
                      <span className="opacity-70">{p.because}</span>
                    </p>
                    <p className="text-xs">
                      <strong className={`uppercase tracking-tighter text-[9px] mr-2 ${isCyber ? 'text-green-600' : 'opacity-40'}`}>Fix:</strong>
                      <span className={`font-black ${isCyber ? 'text-green-400' : 'text-emerald-600'}`}>{p.fix}</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auto-Patch Preview */}
      <div className={`rounded-3xl border overflow-hidden shadow-2xl ${
        isCyber ? 'bg-black border-green-500' :
        isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
      }`}>
        <div className={`px-6 py-4 flex justify-between items-center border-b ${
          isCyber ? 'bg-green-500/10 border-green-500/30' : 
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-100'
        }`}>
          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isCyber ? 'text-green-400' : ''}`}>Proactive Auto-Patch</span>
            <p className="text-[8px] font-bold uppercase opacity-30">Risk-free Implementation</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCopy}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                copied 
                ? (isCyber ? 'text-green-400' : 'text-emerald-500')
                : (isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-indigo-600')
              }`}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i>
              {copied ? 'Copied' : 'Copy Patch'}
            </button>
          </div>
        </div>
        <div className="max-h-[500px] overflow-auto no-scrollbar">
          <pre className="p-8 m-0 !bg-transparent !text-[13px] leading-relaxed mono-font">
            <code className={`language-${data.language}`}>
              {data.autoPatch}
            </code>
          </pre>
        </div>
        <div className={`p-6 border-t flex flex-col sm:flex-row gap-4 ${
          isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50/50 border-slate-100'
        }`}>
          <button
            onClick={onConfirm}
            className={`flex-1 py-4 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transform transition-all hover:-translate-y-1 active:scale-95 ${
              isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-white'
            }`}
          >
            Apply Prevention Patch
          </button>
          <button
             onClick={onReset}
             className={`px-8 py-4 font-black rounded-xl border-2 transition-all text-[10px] uppercase tracking-[0.2em] transform hover:-translate-y-1 active:scale-95 ${
               isCyber ? 'border-green-500 text-green-400 hover:bg-green-900/20' :
               isDark ? 'border-slate-700 text-slate-400 hover:text-white' : 'border-slate-100 text-slate-400 hover:text-slate-900'
             }`}
          >
            Discard Scan
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreventionPanel;
