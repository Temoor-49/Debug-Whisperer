
import React from 'react';
import { AppTheme } from '../types';

interface HeaderProps {
  theme: AppTheme;
  onThemeChange: (theme: AppTheme) => void;
  onOpenProfile: () => void;
  hasProfile: boolean;
}

const Header: React.FC<HeaderProps> = ({ theme, onThemeChange, onOpenProfile, hasProfile }) => {
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;

  const themes = [
    { id: AppTheme.PRO, icon: 'fa-briefcase', label: 'Pro' },
    { id: AppTheme.DARK, icon: 'fa-moon', label: 'Dark' },
    { id: AppTheme.MONO, icon: 'fa-print', label: 'Mono' },
    { id: AppTheme.CYBER, icon: 'fa-bolt', label: 'Cyber' },
  ];

  return (
    <header className={`sticky top-0 z-40 border-b transition-all duration-300 backdrop-blur-md ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="group relative flex items-center gap-3 cursor-default">
          <div className={`${isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-indigo-500 text-slate-900' : 'bg-indigo-600 text-white'} w-8 h-8 rounded-lg flex items-center justify-center shadow-lg transition-all`}>
            <i className="fas fa-terminal text-xs"></i>
          </div>
          <span className="font-black text-xs uppercase tracking-tighter">DebugWhisperer</span>
          <div className={`absolute top-full left-0 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
            Home / Expert Debugging
            <div className={`absolute -top-1 left-4 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="group relative">
            <button 
              onClick={onOpenProfile}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
              }`}
            >
              <i className={`fas fa-user-gear ${hasProfile ? 'text-indigo-500' : ''}`}></i>
              <span className="hidden sm:inline">Profile</span>
              {hasProfile && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 absolute top-1 right-1"></div>}
            </button>
            <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              Edit your developer profile
              <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>

          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-500/10">
            {themes.map((t) => (
              <div key={t.id} className="group relative">
                <button
                  onClick={() => onThemeChange(t.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    theme === t.id 
                      ? (isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-slate-700 text-white' : 'bg-white text-indigo-600 shadow-sm')
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title={t.label}
                >
                  <i className={`fas ${t.icon}`}></i>
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
                <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                  Switch to {t.label} mode
                  <div className={`absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
