import { useEffect, useRef, useState } from 'react';
import { createVoiceInput, VOICE_INPUT_EVENT } from '../services/voiceInput.js';

export function useVoiceInput(setText, showToast, onActivate) {
  const [state, setState] = useState('idle');
  const callbacks = useRef({ setText, showToast, onActivate });
  callbacks.current = { setText, showToast, onActivate };
  const controller = useRef(null);
  useEffect(() => {
    const voice = createVoiceInput({
      Recognition: window.SpeechRecognition || window.webkitSpeechRecognition,
      onText: text => callbacks.current.setText(previous => previous ? `${previous} ${text}` : text),
      onState: setState,
      onMessage: message => callbacks.current.showToast(message)
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
