export const VOICE_INPUT_EVENT = 'easyinput:voice-input';

export function createVoiceInput({ Recognition, onText, onState, onMessage }) {
  let recognition = null;
  let stopping = false;
  return {
    toggle() {
      if (recognition) {
        if (!stopping) {
          stopping = true;
          recognition.stop();
        }
        return;
      }
      if (!Recognition) {
        onMessage('当前浏览器不支持语音识别。可点击输入框后使用 Windows Win+H 语音输入。');
        return;
      }
      const session = new Recognition();
      recognition = session;
      stopping = false;
      session.lang = 'zh-CN';
      session.continuous = true;
      session.interimResults = false;
      let nextResult = 0;
      session.onstart = () => { if (recognition === session) onState('listening'); };
      session.onresult = event => {
        if (recognition !== session) return;
        for (let i = nextResult; i < event.results.length; i++) {
          if (!event.results[i].isFinal) break;
          nextResult = i + 1;
          const text = event.results[i][0].transcript.trim();
          if (text) onText(text);
        }
      };
      session.onerror = event => {
        if (recognition !== session) return;
        const messages = {
          'not-allowed': '麦克风权限未获允许，请在浏览器站点设置中允许麦克风后重试。',
          'service-not-allowed': '浏览器语音服务不可用，可在输入框中使用 Win+H。',
          'audio-capture': '未找到可用麦克风，请检查电脑的声音输入设备。',
          network: '语音识别服务连接失败，请检查网络，或在输入框中使用 Win+H。',
          'no-speech': '没有检测到语音，请再按 S2 重试。'
        };
        if (event.error !== 'aborted') onMessage(messages[event.error] || '语音识别失败，请重试。');
        this.dispose();
        onState('idle');
      };
      session.onend = () => {
        if (recognition !== session) return;
        recognition = null;
        stopping = false;
        onState('idle');
      };
      onState('starting');
      try { session.start(); }
      catch {
        this.dispose();
        onState('idle');
        onMessage('无法启动语音输入，请点击页面上的麦克风按钮重试。');
      }
    },
    dispose() {
      const session = recognition;
      recognition = null;
      stopping = false;
      if (session) {
        session.onstart = session.onresult = session.onerror = session.onend = null;
        session.abort();
      }
    }
  };
}
