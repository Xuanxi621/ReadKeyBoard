import React, { useState, useEffect } from 'react';
import { stopSpeechRecognition } from '../services/speechService.js';

export default function VoiceTranscriptionOverlay() {
  const [isListening, setIsListening] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleSpeechState = (e) => {
      const { isListening: listening, text } = e.detail || {};
      if (listening) {
        setIsListening(true);
        setVisible(true);
        if (text !== undefined) {
          setTranscribedText(text);
        }
      } else {
        setIsListening(false);
        // 如果录音停止且没有文本，3秒后自动隐藏
        if (!text && !transcribedText) {
          const timer = setTimeout(() => setVisible(false), 2000);
          return () => clearTimeout(timer);
        }
      }
    };

    window.addEventListener('orbit-speech-state', handleSpeechState);
    return () => window.removeEventListener('orbit-speech-state', handleSpeechState);
  }, [transcribedText]);

  if (!visible) return null;

  const handleCopy = () => {
    if (transcribedText) {
      navigator.clipboard?.writeText(transcribedText);
    }
  };

  const handleClose = () => {
    stopSpeechRecognition();
    setVisible(false);
  };

  return (
    <div className="fixed bottom-24 right-8 z-50 max-w-md w-full bg-slate-900/90 backdrop-blur-md border border-cyan-500/30 rounded-2xl shadow-2xl p-4 text-slate-100 transition-all animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-2">
          {isListening ? (
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          ) : (
            <span className="h-3 w-3 rounded-full bg-slate-500"></span>
          )}
          <span className="text-xs font-semibold tracking-wider uppercase text-cyan-400">
            {isListening ? 'S2 物理键 · 正在倾听...' : '语音录入完成'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {transcribedText && (
            <button
              onClick={handleCopy}
              className="px-2 py-1 text-xs rounded hover:bg-slate-800 text-slate-300 hover:text-white transition"
              title="复制文本"
            >
              复制
            </button>
          )}
          <button
            onClick={handleClose}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-3 min-h-[50px] max-h-48 overflow-y-auto text-sm leading-relaxed text-slate-200 break-words">
        {transcribedText ? (
          transcribedText
        ) : (
          <span className="text-slate-400 italic">
            {isListening ? '请对准麦克风说话，内容将自动输入并填充至 AI 提问框...' : '未识别到语音'}
          </span>
        )}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>提示: 再次按下 EasyInput 的 <strong className="text-cyan-300">S2</strong> 即可停止录入</span>
        {isListening && (
          <button
            onClick={() => stopSpeechRecognition()}
            className="text-rose-400 hover:text-rose-300 font-medium"
          >
            停止
          </button>
        )}
      </div>
    </div>
  );
}
