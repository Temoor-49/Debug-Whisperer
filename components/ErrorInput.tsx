
import React, { useRef, useState, useEffect } from 'react';
import { AppTheme } from '../types';

interface ErrorInputProps {
  value: string;
  onChange: (val: string) => void;
  onImageSelect: (image: { base64: string; mimeType: string } | null) => void;
  selectedImage: { base64: string; mimeType: string } | null;
  onAnalyze: (val: string) => void;
  loading: boolean;
  theme: AppTheme;
}

type InputMethod = 'text' | 'upload' | 'camera';

const ErrorInput: React.FC<ErrorInputProps> = ({ value, onChange, onImageSelect, selectedImage, onAnalyze, loading, theme }) => {
  const [activeTab, setActiveTab] = useState<InputMethod>('text');
  const [touched, setTouched] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const isDark = theme === AppTheme.DARK || theme === AppTheme.CYBER;
  const isCyber = theme === AppTheme.CYBER;

  const isEmpty = !value.trim() && !selectedImage;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onImageSelect({ base64, mimeType: file.type });
        onChange('');
        setActiveTab('upload');
        setTouched(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setCameraStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
      setShowCamera(true);
    } catch (err) {
      alert("Camera access failed.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        const base64 = dataUrl.split(',')[1];
        onImageSelect({ base64, mimeType: 'image/jpeg' });
        onChange('');
        stopCamera();
        setActiveTab('upload');
        setTouched(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (!loading && !isEmpty) {
        e.preventDefault();
        onAnalyze(value);
      }
    }
  };

  const getTabTooltip = (tab: InputMethod) => {
    switch(tab) {
      case 'text': return "Paste raw logs or code errors";
      case 'upload': return "Analyze from a saved image";
      case 'camera': return "Scan error logs using your camera";
      default: return "";
    }
  };

  return (
    <div className="space-y-4 animate-reveal">
      <div className={`flex gap-1 p-1 rounded-xl w-fit mx-auto border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-slate-200/50 border-slate-200'}`}>
        {(['text', 'upload', 'camera'] as InputMethod[]).map((tab) => (
          <div key={tab} className="group relative">
            <button 
              onClick={() => {
                if (tab === 'camera') startCamera();
                else if (tab === 'upload' && !selectedImage) fileInputRef.current?.click();
                else setActiveTab(tab);
              }}
              className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? (isCyber ? 'bg-green-500 text-black' : isDark ? 'bg-slate-600 text-white' : 'bg-white text-indigo-600 shadow-sm') 
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <i className={`fas fa-${tab === 'text' ? 'keyboard' : tab === 'upload' ? 'image' : 'camera'} mr-2`}></i>
              {tab}
            </button>
            <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              {getTabTooltip(tab)}
              <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>
        ))}
      </div>

      <div className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
        isEmpty && touched 
          ? 'border-rose-500/50 ring-4 ring-rose-500/10' 
          : isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xl shadow-slate-200/50'
      }`}>
        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

        {selectedImage && activeTab === 'upload' ? (
          <div className="relative p-8 bg-slate-500/5 flex flex-col items-center gap-4">
            <img 
              src={`data:${selectedImage.mimeType};base64,${selectedImage.base64}`} 
              className="max-h-60 rounded-lg shadow-lg border-2 border-white/10"
              alt="Snapshot" 
            />
            <div className="group relative">
              <button onClick={() => { onImageSelect(null); setActiveTab('text'); }} className="text-[10px] font-bold text-rose-500 uppercase tracking-widest hover:underline">Remove snapshot</button>
              <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 bg-rose-600 text-white`}>
                Discard current image
                <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-rose-600`}></div>
              </div>
            </div>
          </div>
        ) : (
          <textarea
            className="w-full h-48 p-6 bg-transparent outline-none resize-none mono-font text-[13px] leading-relaxed placeholder:opacity-30"
            placeholder="Paste raw error output or logs here..."
            value={value}
            onBlur={() => setTouched(true)}
            onKeyDown={handleKeyDown}
            onChange={(e) => { onChange(e.target.value); if (e.target.value) { setActiveTab('text'); setTouched(true); } }}
          />
        )}

        {isEmpty && touched && (
          <div className="absolute top-6 right-6 animate-reveal">
            <span className="bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-lg">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              Input Required
            </span>
          </div>
        )}

        <div className={`px-6 py-4 flex items-center justify-between border-t ${isDark ? 'bg-slate-800/30 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex flex-col">
            <div className="group relative flex items-center gap-2 opacity-30">
              <i className="fas fa-lock text-[10px]"></i>
              <span className="text-[9px] font-black uppercase tracking-widest">Client-Side Only</span>
              <div className={`absolute bottom-full left-0 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
                Your logs are never stored or shared
                <div className={`absolute -bottom-1 left-4 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
              </div>
            </div>
            {!isEmpty && (
              <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 animate-reveal">
                <i className="fas fa-check-circle mr-1"></i> Ready for Analysis
              </span>
            )}
          </div>
          <div className="group relative">
            <button
              onClick={() => onAnalyze(value)}
              disabled={loading || isEmpty}
              className={`
                px-8 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all transform active:scale-95
                ${loading || isEmpty
                  ? 'opacity-20 cursor-not-allowed grayscale' 
                  : isCyber ? 'bg-green-500 text-black shadow-[0_0_15px_rgba(34,197,94,0.4)]' : isDark ? 'bg-indigo-500 text-white' : 'bg-slate-900 text-white hover:bg-black'}
              `}
            >
              {loading ? 'Processing...' : 'Run Analysis'}
            </button>
            <div className={`absolute bottom-full right-0 mb-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isDark ? 'bg-slate-700 text-white' : 'bg-slate-900 text-white'}`}>
              {isEmpty ? 'Please enter text or upload image first' : 'Submit for AI diagnosis (Ctrl+Enter)'}
              <div className={`absolute -bottom-1 right-8 w-2 h-2 rotate-45 ${isDark ? 'bg-slate-700' : 'bg-slate-900'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-reveal">
          <div className={`rounded-3xl overflow-hidden shadow-2xl max-w-lg w-full ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-white'}`}>
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="font-black text-sm uppercase tracking-widest">Scanner Mode</h3>
              <div className="group relative">
                <button onClick={stopCamera} className="text-slate-500 hover:text-white transition-all"><i className="fas fa-times"></i></button>
                <div className={`absolute top-full right-0 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 bg-slate-700 text-white`}>
                  Close scanner
                  <div className={`absolute -top-1 right-1 w-2 h-2 rotate-45 bg-slate-700`}></div>
                </div>
              </div>
            </div>
            <div className="relative bg-black aspect-video">
              <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover opacity-80" />
            </div>
            <div className="p-8 flex justify-center">
              <div className="group relative">
                <button onClick={capturePhoto} className={`w-16 h-16 rounded-full border-4 flex items-center justify-center transition-all transform hover:scale-105 active:scale-90 ${isCyber ? 'bg-green-500 border-green-900 text-black' : 'bg-white border-indigo-600 text-indigo-600'}`}>
                  <i className="fas fa-camera text-xl"></i>
                </button>
                <div className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-4 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap hidden group-hover:block tooltip-visible shadow-xl z-50 ${isCyber ? 'bg-green-500 text-black' : 'bg-white text-indigo-600 border border-indigo-100'}`}>
                  Capture Snapshot
                  <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 ${isCyber ? 'bg-green-500' : 'bg-white border-r border-b border-indigo-100'}`}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErrorInput;
