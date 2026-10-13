import { useEffect, useRef, useState } from 'react';
import { createVoiceInput, VOICE_INPUT_EVENT } from '../services/voiceInput.js';

export function useVoiceInput(setText, showToast, onActivate) {
  const [state, setState] = useState('idle');
  const callbacks = useRef({ setText, showToast, onActivate });
  callbacks.current = { setText, showToast, onActivate };
  const controller = useRef(null);
  const hadErrorRef = useRef(false);

  useEffect(() => {
    const voice = createVoiceInput({
      Recognition: window.SpeechRecognition || window.webkitSpeechRecognition,
      onText: text => {
        callbacks.current.setText(previous => previous ? `${previous} ${text}` : text);
        callbacks.current.showToast?.(`🎤 已识别: "${text}"`);
      },
      onState: (nextState) => {
        setState(prev => {
          if (nextState === 'listening') {
            hadErrorRef.current = false;
            callbacks.current.showToast?.('🎤 EasyInput S2 ➔ 已开启语音输入，请说话...');
          } else if (nextState === 'idle' && prev === 'listening') {
            if (!hadErrorRef.current) {
              callbacks.current.showToast?.('🛑 语音输入已结束');
            }
          }
          return nextState;
        });
      },
      onMessage: message => {
        hadErrorRef.current = true;
        callbacks.current.showToast?.(message);
      }
    });
    controller.current = voice;
    const toggle = () => {
      callbacks.current.onActivate?.();
      voice.toggle();
    };
    const stopWhenHidden = () => {
      if (document.hidden) { voice.dispose(); setState('idle'); }
    };
    window.addEventListener(VOICE_INPUT_EVENT, toggle);
    document.addEventListener('visibilitychange', stopWhenHidden);
    return () => {
      window.removeEventListener(VOICE_INPUT_EVENT, toggle);
      document.removeEventListener('visibilitychange', stopWhenHidden);
      voice.dispose();
      controller.current = null;
    };
  }, []);
  return { state, toggle: () => controller.current?.toggle() };
}
