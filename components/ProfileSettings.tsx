
import React, { useState } from 'react';
import { Difficulty, UserProfile, AppTheme } from '../types';

interface ProfileSettingsProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
  theme: AppTheme;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ profile, onSave, onClose, theme }) => {
  const [localProfile, setLocalProfile] = useState<UserProfile>(profile);
  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;

  const handleSave = () => {
    onSave(localProfile);
    onClose();
  };

  const inputClasses = `w-full px-4 py-3 rounded-xl text-sm font-bold border outline-none transition-all ${
    isDark 
      ? 'bg-slate-800 border-slate-700 focus:border-indigo-500 text-white placeholder:text-slate-600' 
      : 'bg-slate-50 border-slate-200 focus:border-indigo-600 text-slate-900 placeholder:text-slate-400'
  }`;

  const labelClasses = "text-[10px] font-black uppercase tracking-widest opacity-40 flex items-center gap-2 mb-2";

  const getDifficultyInfo = (level: Difficulty) => {
    switch(level) {
      case Difficulty.BEGINNER: return "Simple step-by-step guidance";
      case Difficulty.INTERMEDIATE: return "Technical context + logic fix";
      case Difficulty.EXPERT: return "Deep architectural root causes";
      default: return "";
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-reveal">
      <div className={`w-full max-w-md rounded-3xl overflow-hidden border-2 shadow-2xl transition-all ${
        isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-100'
      }`}>
        <div className={`px-8 py-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
          <div>
            <h3 className={`text-sm font-black uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Developer Profile</h3>
            <p className="text-[10px] opacity-40 font-bold uppercase tracking-widest">Personalize your AI tutor</p>
          </div>
          <div className="group relative">
            <button 
              onClick={onClose} 
              className={`opacity-40 hover:opacity-100 transition-all p-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className={`absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              Discard changes
              <div className={`absolute -top-1 right-2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Programming Language Section */}
          <div className="space-y-1">
            <label className={labelClasses}>
              <i className="fas fa-code text-[8px]"></i>
              Preferred Programming Language
            </label>
            <div className="group relative">
              <input
                type="text"
                className={inputClasses}
                placeholder="e.g. TypeScript, Python, Rust..."
                value={localProfile.preferredLanguage}
                onChange={(e) => setLocalProfile({ ...localProfile, preferredLanguage: e.target.value })}
              />
              <div className={`absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                Customizes code syntax in fixes
                <div className={`absolute -bottom-1 left-4 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
              </div>
            </div>
            <p className="text-[9px] opacity-30 font-bold italic pl-1">AI will prioritize this syntax in solutions</p>
          </div>

          {/* Experience Level Section */}
          <div className="space-y-1">
            <label className={labelClasses}>
              <i className="fas fa-layer-group text-[8px]"></i>
              Experience Level
            </label>
            <div className="flex gap-2">
              {Object.values(Difficulty).map((level) => (
                <div key={level} className="flex-1 group relative">
                  <button
                    onClick={() => setLocalProfile({ ...localProfile, experienceLevel: level })}
                    className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all transform active:scale-95 ${
                      localProfile.experienceLevel === level
                        ? (isCyber ? 'bg-green-500 text-black border-green-500' : isDark ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-slate-900 text-white border-slate-900 shadow-lg')
                        : (isDark ? 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-600' : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300')
                    }`}
                  >
                    {level}
                  </button>
                  <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                    {getDifficultyInfo(level)}
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Frameworks Section */}
          <div className="space-y-1">
            <label className={labelClasses}>
              <i className="fas fa-cubes text-[8px]"></i>
              Frameworks I Use
            </label>
            <div className="group relative">
              <input
                type="text"
                className={inputClasses}
                placeholder="e.g. React, Node.js, FastAPI, Django..."
                value={localProfile.frameworks}
                onChange={(e) => setLocalProfile({ ...localProfile, frameworks: e.target.value })}
              />
              <div className={`absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                Enables context-aware fixes
                <div className={`absolute -bottom-1 left-4 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
              </div>
            </div>
            <p className="text-[9px] opacity-30 font-bold italic pl-1">Helps AI context-aware architectural fixes</p>
          </div>

          <div className="pt-4">
            <div className="group relative">
              <button
                onClick={handleSave}
                className={`w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg transform transition-all hover:-translate-y-1 active:scale-95 ${
                  isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-white'
                }`}
              >
                Update Technical Profile
              </button>
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                Apply changes to your profile
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
