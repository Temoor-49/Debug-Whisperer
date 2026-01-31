
import React from 'react';
import { DetectiveResponse, AppTheme } from '../types';

interface DetectivePanelProps {
  data: DetectiveResponse;
  theme: AppTheme;
  onConfirm: () => void;
  onReset: () => void;
}

const DetectivePanel: React.FC<DetectivePanelProps> = ({ data, theme, onConfirm, onReset }) => {
  const isCyber = theme === AppTheme.CYBER;
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;

  return (
    <div className="space-y-8 animate-reveal">
      <div className={`rounded-3xl p-8 border shadow-xl ${isCyber ? 'bg-black border-green-500 shadow-[0_0_20px_rgba(0,255,65,0.2)]' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className="mb-8">
          <h2 className={`text-2xl font-black tracking-tight ${isCyber ? 'text-green-400' : ''}`}>🕵️ Detective Mode: Project Trace</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">Cross-file dependency investigation</p>
        </div>

        {/* Error Chain Visualization */}
        <div className="space-y-6 relative mb-12">
          <h4 className={`text-[9px] font-black uppercase tracking-widest ${isCyber ? 'text-green-500' : 'opacity-40'}`}>🔍 Error Chain (traced through {data.chain.length} points)</h4>
          <div className="space-y-4">
            {data.chain.map((link, i) => (
              <div key={i} className="flex gap-4 group">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-all ${
                    link.type === 'origin' ? (isCyber ? 'border-green-500 text-green-500' : 'border-emerald-500 text-emerald-500') :
                    link.type === 'manifestation' ? (isCyber ? 'border-red-500 text-red-500' : 'border-rose-500 text-rose-500') :
                    (isCyber ? 'border-blue-500 text-blue-500' : 'border-sky-500 text-sky-500')
                  }`}>
                    {i + 1}
                  </div>
                  {i < data.chain.length - 1 && <div className={`w-0.5 h-full ${isCyber ? 'bg-green-900' : 'bg-slate-200'}`}></div>}
                </div>
                <div className={`flex-1 p-4 rounded-xl border transition-all ${isCyber ? 'bg-black border-green-900 group-hover:border-green-500' : 'bg-slate-50/50 border-slate-100 group-hover:border-slate-300'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-black mono-font ${isCyber ? 'text-green-400' : 'text-slate-500'}`}>{link.file}:{link.line}</span>
                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                      link.type === 'origin' ? 'bg-emerald-500/10 text-emerald-500' :
                      link.type === 'manifestation' ? 'bg-rose-500/10 text-rose-500' :
                      'bg-sky-500/10 text-sky-500'
                    }`}>{link.type}</span>
                  </div>
                  <p className="text-sm font-bold">{link.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Root Cause Card */}
        <div className={`p-6 rounded-2xl border-2 mb-8 ${isCyber ? 'bg-green-900/10 border-green-500' : 'bg-emerald-50 border-emerald-100'}`}>
          <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isCyber ? 'text-green-400' : 'text-emerald-700'}`}>🎯 Target: Root Cause</h4>
          <p className="font-black text-lg mb-2">{data.rootCause.file}:{data.rootCause.line}</p>
          <p className="text-sm opacity-70 italic">"{data.rootCause.explanation}"</p>
        </div>

        {/* Impact Analysis */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className={`text-[9px] font-black uppercase tracking-widest ${isCyber ? 'text-green-500' : 'opacity-40'}`}>Affected Files</h4>
            <div className="flex flex-wrap gap-2">
              {data.affectedFiles.map(f => (
                <span key={f} className={`px-2 py-1 rounded text-[10px] font-bold border ${isCyber ? 'border-green-900 text-green-500' : 'border-slate-200 text-slate-600'}`}>{f}</span>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <h4 className={`text-[9px] font-black uppercase tracking-widest ${isCyber ? 'text-green-500' : 'opacity-40'}`}>Ripple Effects</h4>
            <p className="text-xs leading-relaxed opacity-60">{data.rippleEffects}</p>
          </div>
        </div>
      </div>

      {/* Strategy & Fixes */}
      <div className={`rounded-3xl border overflow-hidden shadow-2xl ${isCyber ? 'bg-black border-green-500' : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
        <div className={`px-8 py-6 border-b ${isCyber ? 'bg-green-500/5' : 'bg-slate-50'}`}>
          <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 ${isCyber ? 'text-green-400' : ''}`}>📋 Multi-file Strategy</h4>
          <p className="text-sm font-bold">{data.strategy}</p>
        </div>
        <div className="divide-y divide-slate-100/10">
          {data.fileFixes.map((fix, i) => (
            <div key={i} className="p-8 space-y-4">
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-black mono-font ${isCyber ? 'text-green-400' : ''}`}>Fixing: {fix.file}</span>
              </div>
              <p className="text-xs opacity-60">{fix.description}</p>
              <div className={`rounded-xl overflow-hidden border ${isCyber ? 'border-green-900' : 'border-slate-100'}`}>
                <div className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest ${isCyber ? 'bg-green-900/20 text-green-500' : 'bg-slate-50 text-slate-400'}`}>Fixed Implementation</div>
                <pre className="p-4 m-0 !bg-transparent !text-[12px] mono-font">
                  <code className={isCyber ? 'text-green-400' : ''}>{fix.fixedSnippet}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
        <div className={`p-6 border-t flex gap-4 ${isDark ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
          <button onClick={onConfirm} className={`flex-1 py-4 px-8 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] transition-all transform active:scale-95 ${isCyber ? 'bg-green-500 text-black' : 'bg-slate-900 text-white'}`}>Deploy Comprehensive Fix</button>
          <button onClick={onReset} className={`px-8 py-4 font-black rounded-xl border-2 transition-all text-[10px] uppercase tracking-widest ${isCyber ? 'border-green-500 text-green-500 hover:bg-green-500/10' : 'border-slate-200 text-slate-400 hover:text-slate-900'}`}>Close Case</button>
        </div>
      </div>
    </div>
  );
};

export default DetectivePanel;
