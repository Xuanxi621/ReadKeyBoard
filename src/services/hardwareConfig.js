// EasyInput 研读工作台可用动作注册表
export const EASYINPUT_ACTIONS = {
  nextPage: { name: '翻到下一页 (Next Page)', icon: 'chevron-down' },
  prevPage: { name: '翻到上一页 (Prev Page)', icon: 'chevron-up' },
  zoomIn: { name: '放大文档视图 (Zoom In)', icon: 'zoom-in' },
  zoomOut: { name: '缩小文档视图 (Zoom Out)', icon: 'zoom-out' },
  resetZoom: { name: '自适应宽度 / 重置缩放', icon: 'maximize-2' },
  aiSummary: { name: 'AI 核心要点提炼', icon: 'sparkles' },
  aiChat: { name: 'AI 研读问答聚焦', icon: 'message-square' },
  toggleDeepMode: { name: '深度精读模式开关', icon: 'brain' },
  toggleView: { name: '全屏研读 / 返回主页', icon: 'orbit' },
  importPdf: { name: '上传 PDF 文档 (Upload PDF)', icon: 'plus' },
  highlightTool: { name: '划线批注工具切换', icon: 'highlighter' }
};

// EasyInput 默认硬件引脚与动作映射 (8 按键 + 1 编码器 3 种状态)
export const DEFAULT_HARDWARE_MAP = {
  // 旋转编码器 (A/B: GPIO 17/16, 按压: GPIO 18)
  ENC_RIGHT: { label: '旋钮顺时针 (CW)', action: 'nextPage', pin: 'GPIO16/17', type: 'encoder', fallbackKey: 'ArrowRight', hidName: 'ArrowRight' },
  ENC_LEFT: { label: '旋钮逆时针 (CCW)', action: 'prevPage', pin: 'GPIO16/17', type: 'encoder', fallbackKey: 'ArrowLeft', hidName: 'ArrowLeft' },
  ENC_PRESS: { label: '旋钮下按 (Click)', action: 'toggleView', pin: 'GPIO18', type: 'encoder', fallbackKey: 'Escape', hidName: 'Escape' },

  // 8 个独立机械物理按键 S1 ~ S8 (按原厂 EasyInput V2 丝印与硬件 GPIO 严谨对应)
  KEY1: { label: 'S1 按键 (Key 1)', action: 'importPdf', pin: 'GPIO2', type: 'key', fallbackKey: 'u', hidName: 'Ctrl+Shift+Space' },
  KEY2: { label: 'S2 按键 (Key 2)', action: 'nextPage', pin: 'GPIO47', type: 'key', fallbackKey: 'Enter', hidName: 'Enter' },
  KEY3: { label: 'S3 按键 (Key 3)', action: 'zoomIn', pin: 'GPIO38', type: 'key', fallbackKey: '=', hidName: 'Ctrl+Shift+E' },
  KEY4: { label: 'S4 按键 (Key 4)', action: 'zoomOut', pin: 'GPIO41', type: 'key', fallbackKey: '-', hidName: 'Backspace' },
  KEY5: { label: 'S5 按键 (Key 5)', action: 'toggleView', pin: 'GPIO1', type: 'key', fallbackKey: 'Space', hidName: 'Ctrl+A' },
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
      // 保证 S1 默认始终为 importPdf (上传 PDF 文件)
      if (!parsed.KEY1 || parsed.KEY1.action !== 'importPdf') {
        parsed.KEY1 = { ...DEFAULT_HARDWARE_MAP.KEY1, action: 'importPdf' };
      }
      // 保证 S2 默认始终为 nextPage (翻到下一页)，严禁误置为 importPdf (上传 PDF)
      if (!parsed.KEY2 || parsed.KEY2.action !== 'nextPage') {
        parsed.KEY2 = { ...DEFAULT_HARDWARE_MAP.KEY2, action: 'nextPage' };
      }
      // 保证 S7 默认对应 prevPage (翻到上一页)
      if (!parsed.KEY7 || parsed.KEY7.action !== 'prevPage') {
        parsed.KEY7 = { ...DEFAULT_HARDWARE_MAP.KEY7, action: 'prevPage' };
      }
      // 保证 S5 默认对应 toggleView (全屏研读 / 返回主页)
      if (!parsed.KEY5 || parsed.KEY5.action !== 'toggleView') {
        parsed.KEY5 = { ...DEFAULT_HARDWARE_MAP.KEY5, action: 'toggleView' };
      }
      return { ...DEFAULT_HARDWARE_MAP, ...parsed };
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
  const m = str.match(/^(KEY|S|K)?([1-8])$/);
  if (m) return 'KEY' + m[2];
  return str;
}
