// Web Speech API 语音识别服务
let recognition = null;
let isListening = false;
let callbacks = {
  onResult: null,
  onStatusChange: null,
  onError: null
};

// 检查浏览器是否支持语音识别
export function isSpeechSupported() {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

export function isCurrentlyListening() {
  return isListening;
}

function notifyState(state, text = '') {
  window.dispatchEvent(new CustomEvent('orbit-speech-state', {
    detail: { isListening: state, text }
  }));
}

export function startSpeechRecognition({ onResult, onStatusChange, onError } = {}) {
  if (!isSpeechSupported()) {
    onError && onError('当前浏览器不支持 Web Speech API，建议使用 Chrome 或 Edge 浏览器');
    return false;
  }

  if (isListening) {
    return true;
  }

  callbacks = { onResult, onStatusChange, onError };

  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'zh-CN'; // 默认中文识别，可兼容普通话与中英夹杂

    let finalTranscript = '';

    recognition.onstart = () => {
      isListening = true;
      notifyState(true, '');
      callbacks.onStatusChange && callbacks.onStatusChange(true);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript + interimTranscript;
      notifyState(true, currentText);
      if (callbacks.onResult) {
        callbacks.onResult(currentText);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        callbacks.onError && callbacks.onError('请允许浏览器使用麦克风权限');
      } else if (event.error !== 'no-speech') {
        callbacks.onError && callbacks.onError(`语音识别异常: ${event.error}`);
      }
      stopSpeechRecognition();
    };

    recognition.onend = () => {
      isListening = false;
      notifyState(false);
      callbacks.onStatusChange && callbacks.onStatusChange(false);
    };

    recognition.start();
    return true;
  } catch (err) {
    console.error('Failed to start speech recognition:', err);
    isListening = false;
    notifyState(false);
    callbacks.onError && callbacks.onError(err.message || '启动麦克风失败');
    return false;
  }
}

export function stopSpeechRecognition() {
  if (recognition) {
    try {
      recognition.stop();
    } catch (e) {
      // ignore
    }
    recognition = null;
  }
  isListening = false;
  notifyState(false);
  callbacks.onStatusChange && callbacks.onStatusChange(false);
}

export function toggleSpeechRecognition(opts = {}) {
  if (isListening) {
    stopSpeechRecognition();
    return false;
  } else {
    return startSpeechRecognition(opts);
  }
}
