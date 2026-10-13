// EasyInput 研读工作台可用动作注册表
export const EASYINPUT_ACTIONS = {
  voiceInput: { name: '语音输入', icon: 'mic' },
  deleteDoc: { name: '删除当前文档', icon: 'trash-2' },
  enterReading: { name: '进入阅读模式', icon: 'book-open' },
  nextPage: { name: '翻到下一页', icon: 'chevron-down' },
  prevPage: { name: '翻到上一页', icon: 'chevron-up' },
  zoomIn: { name: '放大文档视图', icon: 'zoom-in' },
  zoomOut: { name: '缩小文档视图', icon: 'zoom-out' },
  resetZoom: { name: '自适应宽度 / 重置', icon: 'maximize-2' },
  aiSummary: { name: 'AI 核心提炼', icon: 'sparkles' },
  aiChat: { name: 'AI 研读问答', icon: 'message-square' },
  toggleDeepMode: { name: '深度精读开关', icon: 'brain' },
  returnHome: { name: '返回星轨主页', icon: 'orbit' },
  toggleView: { name: '阅读 / 主页切换', icon: 'orbit' },
  importPdf: { name: '上传 PDF 文档', icon: 'plus' },
  highlightTool: { name: '划线批注工具', icon: 'highlighter' }
};

// 硬件键帽高密度简短标签 (2-4 字，确保键帽永不溢出)
export const ACTION_SHORT_LABELS = {
  voiceInput: '语音输入',
  deleteDoc: '删除文档',
  enterReading: '进入阅读',
  nextPage: '下一页',
  prevPage: '上一页',
  zoomIn: '放大视图',
  zoomOut: '缩小视图',
  resetZoom: '自适应',
  aiSummary: '核心提炼',
  aiChat: 'AI问答',
  toggleDeepMode: '深度精读',
  returnHome: '星轨主页',
  toggleView: '主页/阅读',
  importPdf: '上传文档',
  highlightTool: '划线批注'
};

// EasyInput 默认硬件引脚与动作映射 (8 按键 + 1 编码器 3 种状态)
export const DEFAULT_HARDWARE_MAP = {
  // 旋转编码器 (A/B: GPIO 17/16, 按压: GPIO 18)
  ENC_RIGHT: { label: '旋钮顺时针 (CW)', action: 'nextPage', pin: 'GPIO16/17', type: 'encoder', fallbackKey: 'ArrowRight', hidName: 'ArrowRight' },
  ENC_LEFT: { label: '旋钮逆时针 (CCW)', action: 'prevPage', pin: 'GPIO16/17', type: 'encoder', fallbackKey: 'ArrowLeft', hidName: 'ArrowLeft' },
  ENC_PRESS: { label: '旋钮下按 (Click)', action: 'enterReading', pin: 'GPIO18', type: 'encoder', fallbackKey: 'Escape', hidName: 'Escape' },

  // 8 个独立机械物理按键 S1 ~ S8 (按原厂 EasyInput V2 丝印与硬件 GPIO 严谨对应)
  KEY1: { label: 'S1 按键 (Key 1)', action: 'importPdf', pin: 'GPIO2', type: 'key', fallbackKey: 'u', hidName: 'Ctrl+Shift+Space' },
  KEY2: { label: 'S2 按键 (Key 2)', action: 'voiceInput', actionVersion: 3, pin: 'GPIO47', type: 'key', fallbackKey: 'MetaLeft', hidName: 'MetaLeft / Enter' },
  KEY3: { label: 'S3 按键 (Key 3)', action: 'zoomIn', pin: 'GPIO38', type: 'key', fallbackKey: '=', hidName: 'Ctrl+Shift+E' },
  KEY4: { label: 'S4 按键 (Key 4)', action: 'zoomOut', pin: 'GPIO41', type: 'key', fallbackKey: '-', hidName: 'Backspace' },
  KEY5: { label: 'S5 按键 (Key 5)', action: 'returnHome', pin: 'GPIO1', type: 'key', fallbackKey: 'Space', hidName: 'Ctrl+A' },
  KEY6: { label: 'S6 按键 (Key 6)', action: 'toggleDeepMode', pin: 'GPIO6', type: 'key', fallbackKey: 'd', hidName: 'Ctrl+C' },
  KEY7: { label: 'S7 按键 (Key 7)', action: 'prevPage', pin: 'GPIO7', type: 'key', fallbackKey: 'PageUp', hidName: 'Ctrl+V' },
  KEY8: { label: 'S8 按键 (Key 8)', action: 'resetZoom', pin: 'GPIO48', type: 'key', fallbackKey: '0', hidName: 'Ctrl+Z/Ctrl+Tab' }
};

export const STORAGE_KEY_MAP = 'orbit_easyinput_hardware_map';

export function loadStoredHardwareMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MAP);
    if (raw) {
      const parsed = JSON.parse(raw);
      const merged = { ...DEFAULT_HARDWARE_MAP };

      Object.keys(DEFAULT_HARDWARE_MAP).forEach(token => {
        if (parsed[token]) {
          const item = { ...DEFAULT_HARDWARE_MAP[token], ...parsed[token] };
          // Apply the requested S2 voice preset once, retaining recorded signals.
          if (token === 'KEY2' && parsed[token].actionVersion !== 3) {
            item.action = 'voiceInput';
            if (item.fallbackKey === 'Enter' || !item.fallbackKey) {
              item.fallbackKey = 'MetaLeft';
            }
            item.actionVersion = 3;
          }
          // 清理可能误录入的纯修饰键
          if (['Control', 'Shift', 'Alt', 'Meta', 'undefined', 'null'].includes(item.fallbackKey)) {
            item.fallbackKey = DEFAULT_HARDWARE_MAP[token].fallbackKey;
          }
          // 确保动作合法
          if (!item.action || !EASYINPUT_ACTIONS[item.action]) {
            item.action = DEFAULT_HARDWARE_MAP[token].action;
          }
          merged[token] = item;
        }
      });
      return merged;
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_HARDWARE_MAP));
}

export function saveStoredHardwareMap(map) {
  try {
    localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(map));
  } catch (e) {}
}

export function normalizeToken(token) {
  if (!token) return null;
  const str = String(token).toUpperCase().replace(/[\s_-]+/g, '');
  if (str === 'ENCLEFT' || str === 'ENCODERLEFT' || str === 'ENCCCW') return 'ENC_LEFT';
  if (str === 'ENCRIGHT' || str === 'ENCODER_RIGHT' || str === 'ENCCW') return 'ENC_RIGHT';
  if (str === 'ENCPRESS' || str === 'ENCODERPRESS' || str === 'ENCCLICK') return 'ENC_PRESS';
  if (str === 'METALEFT' || str === 'METARIGHT' || str === 'WIN' || str === 'META') return 'KEY2';
  const m = str.match(/^(KEY|S|K)?([1-8])$/);
  if (m) return 'KEY' + m[2];
  return str;
}

export function resolveHardwareToken(rawToken, map) {
  const normalized = normalizeToken(rawToken);
  // A recorded device signal takes priority, including UUIDs and named keys.
  const binding = Object.entries(map).find(([, item]) =>
    item.fallbackKey && normalizeToken(item.fallbackKey) === normalized
  );
  return binding?.[0] || normalized;
}
