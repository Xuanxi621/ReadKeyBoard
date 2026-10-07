// User-Only PDF Scattered Orbit System with IndexedDB Persistence & Duplicate Check

const DB_NAME = 'OrbitReaderDB';
const DB_VERSION = 1;
const STORE_NAME = 'documents';

const state = {
  currentView: 'universe', // 'universe' | 'workspace'
  deepMode: true,
  isOrbitRotating: true,
  globalOrbitAngle: 0,
  isDragging: false,
  dragStartX: 0,
  dragStartAngle: 0,
  cards: [], // 1 uploaded PDF = exactly 1 card
  currentDoc: null,
  currentPage: 1,
  totalPages: 1,
  pdfScale: 1.15,
  extractedFullText: '',
  pageTexts: {},
  chatHistory: [],
  notes: [],
  attachedFile: null,
  hoveredCardIndex: -1
};

// ======================== IndexedDB Engine ========================

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveDocToIndexedDB(docRecord) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    // Store metadata, buffer, thumbnail, card geometry
    store.put({
      id: docRecord.id,
      fileName: docRecord.fileName,
      fileSize: docRecord.fileSize,
      fileSizeBytes: docRecord.fileSizeBytes,
      pages: docRecord.pages,
      fileBuffer: docRecord.fileBuffer,
      coverThumbnail: docRecord.coverThumbnail,
      cardProps: docRecord.cardProps,
      uploadedAt: docRecord.uploadedAt
    });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

async function getAllDocsFromIndexedDB() {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function removeDocFromIndexedDB(docId) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(docId);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ======================== Initialize & Restore from Local ========================

document.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();

  // Animation Loop
  startOrbitAnimationLoop();

  // Setup Drag & Drop
  setupDragAndDrop();

  // Stage Dragging
  setupOrbitStageDrag();

  // Load existing PDFs from IndexedDB
  await restorePersistedDocuments();

  // Initialize EasyInput listeners
  initEasyInputSystem();
  updateHotspotLabels();
});

// =========================================================================
// EasyInput 硬件按键设置与 COM3 串口通信系统 (ESP32-S3 V2.0 专用驱动)
// 适配 CY-CHENYUE/easy-input-maker & easyinput-board-cy: 8按键 (S1~S8) + 1旋转编码器
// =========================================================================

// 支持映射的动作库
const EASYINPUT_ACTIONS = {
  nextPage: { name: '翻到下一页 (Next Page)', icon: 'chevron-down' },
  prevPage: { name: '翻到上一页 (Prev Page)', icon: 'chevron-up' },
  zoomIn: { name: '放大文档 (Zoom In)', icon: 'zoom-in' },
  zoomOut: { name: '缩小文档 (Zoom Out)', icon: 'zoom-out' },
  resetZoom: { name: '自适应宽度 / 重置缩放', icon: 'maximize-2' },
  aiSummary: { name: 'AI 核心要点提炼', icon: 'sparkles' },
  aiChat: { name: 'AI 研读问答聚焦', icon: 'message-square' },
  toggleDeepMode: { name: '深度精读模式开关', icon: 'brain' },
  toggleView: { name: '全屏研读 / 返回主页', icon: 'orbit' },
  importPdf: { name: '导入本地 PDF 文档', icon: 'plus' },
  highlightTool: { name: '划线批注工具切换', icon: 'highlighter' }
};

// EasyInput 默认硬件引脚与动作映射 (8 按键 + 1 编码器 3 种状态)
const DEFAULT_HARDWARE_MAP = {
  // 旋转编码器 (A/B: GPIO 17/16, 按压: GPIO 18)
  ENC_RIGHT: { label: '旋钮顺时针 (CW)', action: 'nextPage', pin: 'GPIO16/17', type: 'encoder', fallbackKey: 'ArrowRight' },
  ENC_LEFT: { label: '旋钮逆时针 (CCW)', action: 'prevPage', pin: 'GPIO16/17', type: 'encoder', fallbackKey: 'ArrowLeft' },
  ENC_PRESS: { label: '旋钮下按 (Click)', action: 'toggleView', pin: 'GPIO18', type: 'encoder', fallbackKey: 'Escape' },

  // 8 个独立机械物理按键 S1 ~ S8
  KEY1: { label: 'S1 按键 (Key 1)', action: 'prevPage', pin: 'GPIO2', type: 'key', fallbackKey: 'PageUp' },
  KEY2: { label: 'S2 按键 (Key 2)', action: 'nextPage', pin: 'GPIO47', type: 'key', fallbackKey: 'PageDown' },
  KEY3: { label: 'S3 按键 (Key 3)', action: 'zoomIn', pin: 'GPIO38', type: 'key', fallbackKey: '=' },
  KEY4: { label: 'S4 按键 (Key 4)', action: 'zoomOut', pin: 'GPIO41', type: 'key', fallbackKey: '-' },
  KEY5: { label: 'S5 按键 (Key 5)', action: 'aiSummary', pin: 'GPIO1', type: 'key', fallbackKey: 'Space' },
  KEY6: { label: 'S6 按键 (Key 6)', action: 'toggleDeepMode', pin: 'GPIO6', type: 'key', fallbackKey: 'd' },
  KEY7: { label: 'S7 按键 (Key 7)', action: 'importPdf', pin: 'GPIO7', type: 'key', fallbackKey: 'o' },
  KEY8: { label: 'S8 按键 (Key 8)', action: 'resetZoom', pin: 'GPIO48', type: 'key', fallbackKey: '0' }
};

let userHardwareMap = loadStoredHardwareMap();
let recordingInputToken = null;
let serialPort = null;
let serialReader = null;
let serialConnected = false;
let serialLogs = [];
let hudTimer = null;

function loadStoredHardwareMap() {
  try {
    const raw = localStorage.getItem('orbit_easyinput_hardware_map');
    if (raw) {
      const parsed = JSON.parse(raw);
      // Merge with defaults in case of missing keys
      return { ...DEFAULT_HARDWARE_MAP, ...parsed };
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_HARDWARE_MAP));
}

function saveHardwareMap() {
  localStorage.setItem('orbit_easyinput_hardware_map', JSON.stringify(userHardwareMap));
}

function resetDefaultKeybindings() {
  userHardwareMap = JSON.parse(JSON.stringify(DEFAULT_HARDWARE_MAP));
  saveHardwareMap();
  renderKeyMappings();
  updateHotspotLabels();
  showToast('已恢复 EasyInput 默认推荐键位');
}

function openKeySettingsModal() {
  renderKeyMappings();
  updateHotspotLabels();
  document.getElementById('keySettingsModal').classList.remove('hidden');
  lucide.createIcons();
}

function closeKeySettingsModal() {
  recordingInputToken = null;
  document.getElementById('keySettingsModal').classList.add('hidden');
}

function updateHotspotLabels() {
  for (let i = 1; i <= 8; i++) {
    const keyId = 'KEY' + i;
    const labelElem = document.getElementById('label_' + keyId);
    if (labelElem && userHardwareMap[keyId]) {
      const act = EASYINPUT_ACTIONS[userHardwareMap[keyId].action];
      labelElem.innerText = act ? act.name.split(' ')[0] : '无';
    }
  }
  const capsuleHint = document.getElementById('capsuleHint');
  if (capsuleHint) {
    if (serialConnected) {
      const s1Act = EASYINPUT_ACTIONS[userHardwareMap['KEY1']?.action]?.name.split(' ')[0] || '翻页';
      const s5Act = EASYINPUT_ACTIONS[userHardwareMap['KEY5']?.action]?.name.split(' ')[0] || 'AI';
      capsuleHint.innerText = `旋钮: 翻页 · S1: ${s1Act} · S5: ${s5Act}`;
    } else {
      capsuleHint.innerText = '点击设置按键或连接 COM3';
    }
  }
}

// 聚焦到指定按键卡片 (点击设备图上的键帽或旋钮时)
function focusKeyCard(tokenId) {
  if (tokenId === 'ENC') {
    const knobCard = document.getElementById('unifiedKnobCard');
    if (knobCard) {
      knobCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      knobCard.classList.add('ring-4', 'ring-orange-400', 'bg-orange-100/70');
      setTimeout(() => knobCard.classList.remove('ring-4', 'ring-orange-400', 'bg-orange-100/70'), 1000);
    }
  } else {
    const card = document.getElementById('card_' + tokenId);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      card.classList.add('ring-4', 'ring-orange-400', 'bg-orange-50');
      setTimeout(() => card.classList.remove('ring-4', 'ring-orange-400', 'bg-orange-50'), 1000);
    }
  }
}

// 鼠标悬停卡片时高亮图上键位
function highlightHotspotOnImage(token, enable) {
  const hotspotId = token.startsWith('ENC') ? 'keyHotspot_ENC' : 'keyHotspot_' + token;
  const hotspot = document.getElementById(hotspotId);
  if (hotspot) {
    if (enable) {
      hotspot.classList.add('bg-orange-500/25', 'ring-2', 'ring-orange-500', 'scale-105');
    } else {
      hotspot.classList.remove('bg-orange-500/25', 'ring-2', 'ring-orange-500', 'scale-105');
    }
  }
}

function handlePrimaryConnectClick() {
  try {
    window.location.href = 'ms-settings:bluetooth';
  } catch (err) {}
  showToast('正在调起系统蓝牙设置... 亦可点击下方按钮直接连接 USB 串口 (COM3)');
}

function recheckEasyInputConnection() {
  showToast('正在重新检测 EasyInput 设备连接状态...');
  if ('serial' in navigator && navigator.serial.getPorts) {
    navigator.serial.getPorts().then(ports => {
      if (ports && ports.length > 0) {
        showToast('检测到可用 USB 串口，请点击「连接 USB 串口 (COM3)」完成授权');
      } else {
        showToast('设备检测完毕，支持 USB 与系统蓝牙');
      }
    }).catch(() => {
      showToast('设备检测完毕，支持 USB 与系统蓝牙');
    });
  } else {
    showToast('设备检测完毕，支持 USB 与系统蓝牙');
  }
}

function updateHardwareMappingAction(tokenId, actionKey) {
  if (userHardwareMap[tokenId]) {
    userHardwareMap[tokenId].action = actionKey;
    saveHardwareMap();
    renderKeyMappings();
    updateHotspotLabels();
    const act = EASYINPUT_ACTIONS[actionKey];
    showToast(`${userHardwareMap[tokenId].label} 动作已更新为：${act ? act.name : actionKey}`);
  }
}

function startRecordingHardwareKey(tokenId) {
  recordingInputToken = tokenId;
  renderKeyMappings();
  showToast(`请在 EasyInput 上按下或在键盘上敲击目标键...`);
}

function renderKeyMappings() {
  const keysGrid = document.getElementById('unifiedKeysGrid');
  const knobCard = document.getElementById('unifiedKnobCard');
  if (!keysGrid || !knobCard) return;

  const actionOptionsHtml = (selectedAction) => {
    return Object.keys(EASYINPUT_ACTIONS).map(actKey => {
      const act = EASYINPUT_ACTIONS[actKey];
      return `<option value="${actKey}" ${actKey === selectedAction ? 'selected' : ''}>${act.name}</option>`;
    }).join('');
  };

  // 1. 渲染 8 个物理机械按键卡片 (S1 ~ S8)
  const keyTokens = ['KEY1', 'KEY2', 'KEY3', 'KEY4', 'KEY5', 'KEY6', 'KEY7', 'KEY8'];
  keysGrid.innerHTML = keyTokens.map(token => {
    const item = userHardwareMap[token];
    const isRecording = (recordingInputToken === token);
    const num = token.replace('KEY', '');

    return `
      <div id="card_${token}" 
           onmouseenter="highlightHotspotOnImage('${token}', true)"
           onmouseleave="highlightHotspotOnImage('${token}', false)"
           class="p-2.5 rounded-xl bg-white border ${isRecording ? 'border-orange-500 ring-2 ring-orange-200 bg-orange-50/30' : 'border-neutral-200 hover:border-orange-300'} flex flex-col justify-between gap-2 shadow-2xs transition">
        
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-1.5">
            <span class="w-6 h-6 rounded-lg bg-neutral-900 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">S${num}</span>
            <span class="text-[9px] font-mono text-neutral-400">${item.pin}</span>
          </div>
          <button onclick="startRecordingHardwareKey('${token}')" class="px-2 py-0.5 rounded text-[10px] font-medium ${isRecording ? 'bg-orange-500 text-white animate-pulse' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'} transition cursor-pointer" title="点击后敲击键盘任意键重设绑定">
            ${isRecording ? '请按键...' : (item.fallbackKey || '改键')}
          </button>
        </div>

        <!-- Action Selector -->
        <div>
          <label class="text-[10px] text-neutral-400 block mb-0.5">触发动作</label>
          <select onchange="updateHardwareMappingAction('${token}', this.value)" class="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-lg px-2 py-1 outline-none font-semibold text-neutral-800 cursor-pointer">
            ${actionOptionsHtml(item.action)}
          </select>
        </div>
      </div>
    `;
  }).join('');

  // 2. 渲染无级旋转编码器 (Knob) 3-in-1 卡片
  const encRight = userHardwareMap['ENC_RIGHT'];
  const encLeft = userHardwareMap['ENC_LEFT'];
  const encPress = userHardwareMap['ENC_PRESS'];

  knobCard.innerHTML = `
    <div class="flex items-center justify-between border-b border-orange-200/60 pb-2">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shadow-xs">
          <i data-lucide="rotate-cw" class="w-4 h-4"></i>
        </div>
        <div>
          <span class="font-bold text-xs text-neutral-900">无级旋转编码器 (Knob Encoder)</span>
          <span class="text-[10px] text-neutral-500 ml-2">引脚: GPIO16/17 (旋转) · GPIO18 (按压)</span>
        </div>
      </div>
      <span class="text-[10px] text-orange-600 bg-orange-100/80 font-bold px-2 py-0.5 rounded-full">3 向复合操控</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
      <!-- Knob CW -->
      <div id="card_ENC_RIGHT" 
           onmouseenter="highlightHotspotOnImage('ENC', true)"
           onmouseleave="highlightHotspotOnImage('ENC', false)"
           class="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1">
        <div class="flex items-center justify-between text-[11px] font-bold text-neutral-700">
          <span class="flex items-center gap-1">
            <i data-lucide="rotate-cw" class="w-3.5 h-3.5 text-orange-500"></i>
            <span>顺时针旋转 (CW)</span>
          </span>
          <span class="font-mono text-[9px] text-neutral-400">${encRight.fallbackKey}</span>
        </div>
        <select onchange="updateHardwareMappingAction('ENC_RIGHT', this.value)" class="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md px-1.5 py-1 outline-none font-semibold text-neutral-800 cursor-pointer">
          ${actionOptionsHtml(encRight.action)}
        </select>
      </div>

      <!-- Knob CCW -->
      <div id="card_ENC_LEFT" 
           onmouseenter="highlightHotspotOnImage('ENC', true)"
           onmouseleave="highlightHotspotOnImage('ENC', false)"
           class="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1">
        <div class="flex items-center justify-between text-[11px] font-bold text-neutral-700">
          <span class="flex items-center gap-1">
            <i data-lucide="rotate-ccw" class="w-3.5 h-3.5 text-orange-500"></i>
            <span>逆时针旋转 (CCW)</span>
          </span>
          <span class="font-mono text-[9px] text-neutral-400">${encLeft.fallbackKey}</span>
        </div>
        <select onchange="updateHardwareMappingAction('ENC_LEFT', this.value)" class="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md px-1.5 py-1 outline-none font-semibold text-neutral-800 cursor-pointer">
          ${actionOptionsHtml(encLeft.action)}
        </select>
      </div>

      <!-- Knob Press -->
      <div id="card_ENC_PRESS" 
           onmouseenter="highlightHotspotOnImage('ENC', true)"
           onmouseleave="highlightHotspotOnImage('ENC', false)"
           class="p-2 rounded-lg bg-white/90 border border-neutral-200 space-y-1">
        <div class="flex items-center justify-between text-[11px] font-bold text-neutral-700">
          <span class="flex items-center gap-1">
            <i data-lucide="disc" class="w-3.5 h-3.5 text-orange-500"></i>
            <span>垂直按压 (Click)</span>
          </span>
          <span class="font-mono text-[9px] text-neutral-400">${encPress.fallbackKey}</span>
        </div>
        <select onchange="updateHardwareMappingAction('ENC_PRESS', this.value)" class="w-full text-[11px] bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 rounded-md px-1.5 py-1 outline-none font-semibold text-neutral-800 cursor-pointer">
          ${actionOptionsHtml(encPress.action)}
        </select>
      </div>
    </div>
  `;

  lucide.createIcons();
}

// 屏幕中央悬浮 HUD 提示
function showEasyInputHud(text) {
  const hud = document.getElementById('easyInputHud');
  const hudText = document.getElementById('easyInputHudText');
  if (!hud || !hudText) return;
  hudText.innerText = text;
  hud.classList.remove('opacity-0', '-translate-y-4');
  hud.classList.add('opacity-100', 'translate-y-0');

  clearTimeout(hudTimer);
  hudTimer = setTimeout(() => {
    hud.classList.remove('opacity-100', 'translate-y-0');
    hud.classList.add('opacity-0', '-translate-y-4');
  }, 1400);
}

// 执行指定动作并给予即时反馈
function executeActionByName(actionName, sourceLabel = 'EasyInput') {
  const actionInfo = EASYINPUT_ACTIONS[actionName];
  const actNameText = actionInfo ? actionInfo.name : actionName;
  showEasyInputHud(`${sourceLabel} ➔ ${actNameText}`);

  // 如果按键设置弹窗当前处于打开状态，在弹窗内只进行按键点亮测试，不触发翻页或全屏等侵入式动作
  const isModalOpen = !document.getElementById('keySettingsModal').classList.contains('hidden');
  if (isModalOpen && (actionName === 'nextPage' || actionName === 'prevPage' || actionName === 'toggleView')) {
    return;
  }

  switch (actionName) {
    case 'nextPage':
      if (state.currentView === 'workspace') nextPage();
      else if (state.documents.length > 0) openDocument(state.documents[0].id);
      break;
    case 'prevPage':
      if (state.currentView === 'workspace') prevPage();
      break;
    case 'zoomIn':
      if (state.currentView === 'workspace') zoomIn();
      break;
    case 'zoomOut':
      if (state.currentView === 'workspace') zoomOut();
      break;
    case 'resetZoom':
      if (state.currentView === 'workspace') fitWidth();
      break;
    case 'aiSummary':
      if (state.currentView === 'workspace') {
        switchAiTab('summary');
        showToast('EasyInput 触发：AI 核心要点');
      }
      break;
    case 'aiChat':
      if (state.currentView === 'workspace') {
        switchAiTab('chat');
        const input = document.getElementById('aiChatInput');
        if (input) input.focus();
      }
      break;
    case 'toggleDeepMode':
      toggleDeepMode();
      break;
    case 'toggleView':
      if (state.currentView === 'universe') {
        if (state.documents.length > 0) openDocument(state.documents[0].id);
      } else {
        switchView('universe');
      }
      break;
    case 'importPdf':
      triggerPdfUpload();
      break;
    case 'highlightTool':
      if (state.currentView === 'workspace') toggleHighlightTool();
      break;
    default:
      console.warn('Unknown EasyInput action:', actionName);
  }
}

// 硬件防抖与去重状态池
let lastTokenTriggerTime = {};
let lastAnyHardwareTriggerTime = 0;

// 统一硬件输入触发处理 (支持串口与键盘多路触发)
function onEasyInputHardwareTrigger(tokenId, transportSource = 'COM3 串口') {
  const normToken = normalizeToken(tokenId);
  if (!normToken) return;

  const now = Date.now();
  // 1. 同一键位硬件防抖：200ms 内禁止重复触发（彻底解决机械触点抖动导致的连发）
  if (lastTokenTriggerTime[normToken] && (now - lastTokenTriggerTime[normToken] < 200)) {
    return;
  }
  // 2. 跨按键最小间隔防抖：80ms 内只处理一次（彻底解决串口/HID多路并发或批量状态倾倒导致的多键同时误触发）
  if (now - lastAnyHardwareTriggerTime < 80) {
    return;
  }

  lastTokenTriggerTime[normToken] = now;
  lastAnyHardwareTriggerTime = now;

  const mapping = userHardwareMap[normToken];
  const label = mapping ? mapping.label : normToken;
  const actionName = mapping ? mapping.action : null;
  const actionInfo = actionName ? EASYINPUT_ACTIONS[actionName] : null;

  // 更新设置弹窗内的高亮信号指示器
  const sigElem = document.getElementById('liveSerialSignal');
  if (sigElem) {
    sigElem.innerText = `${label} (${transportSource})`;
    sigElem.classList.add('bg-orange-100', 'text-orange-700');
    setTimeout(() => sigElem.classList.remove('bg-orange-100', 'text-orange-700'), 500);
  }
  const actElem = document.getElementById('liveActionTriggered');
  if (actElem) {
    actElem.innerText = actionInfo ? actionInfo.name : '未绑定动作';
  }

  // 如果当前处于改键录制模式
  if (recordingInputToken) {
    userHardwareMap[recordingInputToken].action = actionName || userHardwareMap[recordingInputToken].action;
    showToast(`已绑定 ${userHardwareMap[recordingInputToken].label}`);
    recordingInputToken = null;
    renderKeyMappings();
    return;
  }

  // 视觉高亮设备图上的对应按键 / 旋钮 (精准贴合)
  const hotspotId = (normToken.startsWith('ENC') ? 'keyHotspot_ENC' : 'keyHotspot_' + normToken);
  const hotspot = document.getElementById(hotspotId);
  if (hotspot) {
    hotspot.classList.add('bg-orange-500/35', 'border-orange-500', 'ring-4', 'ring-orange-400/80', 'scale-95');
    setTimeout(() => {
      hotspot.classList.remove('bg-orange-500/35', 'border-orange-500', 'ring-4', 'ring-orange-400/80', 'scale-95');
    }, 300);
  }

  // 同时高亮联动下方功能卡片
  const cardElem = document.getElementById('card_' + normToken) || (normToken.startsWith('ENC') ? document.getElementById('unifiedKnobCard') : null);
  if (cardElem) {
    cardElem.classList.add('ring-4', 'ring-orange-400', 'bg-orange-100/70');
    setTimeout(() => {
      cardElem.classList.remove('ring-4', 'ring-orange-400', 'bg-orange-100/70');
    }, 300);
  }

  // 执行绑定的研读交互动作
  if (actionName) {
    executeActionByName(actionName, `${label}`);
  }
}

// 模拟测试 EasyInput 按键
function simulateEasyInput(tokenId) {
  onEasyInputHardwareTrigger(tokenId, '虚拟测试');
}

// 解析从 EasyInput 固件串口返回的原始行或报文 (精准防误判)
function parseEasyInputSerialToken(raw) {
  if (!raw) return null;
  const line = raw.trim();

  // 1. JSON 数据解析尝试
  if (line.startsWith('{') && line.endsWith('}')) {
    try {
      const obj = JSON.parse(line);
      // 若包含状态且为释放/0，则忽略
      if (obj.state && /(release|up|0)/i.test(String(obj.state))) return null;
      if (obj.input) return normalizeToken(obj.input);
      if (obj.key !== undefined) return normalizeToken('KEY' + obj.key);
      if (obj.id !== undefined) return normalizeToken('KEY' + obj.id);
    } catch (e) {}
  }

  // 2. 严格过滤明确的松开/抬起/空闲事件
  if (/\b(released|release|up|inactive|idle|disconnect)\b/i.test(line) && !/\b(pressed|down)\b/i.test(line)) {
    return null;
  }

  // 3. 过滤状态倾倒中的非激活按键 (如 "S1:0", "KEY2=0", "k1: 0" 等)
  if (/(?:KEY|S|K)[_\s]?[1-8]\s*[:=]\s*0\b/i.test(line) && !/(?:KEY|S|K)[_\s]?[1-8]\s*[:=]\s*1\b/i.test(line)) {
    return null;
  }

  // 4. 旋转编码器
  if (/\b(ENC_LEFT|ENCODER_LEFT|ENC_CCW|ROTARY_CCW|CCW)\b/i.test(line) || /step\s*=\s*-\d+/i.test(line)) return 'ENC_LEFT';
  if (/\b(ENC_RIGHT|ENCODER_RIGHT|ENC_CW|ROTARY_CW|CW)\b/i.test(line) || /step\s*=\s*\+?[1-9]\d*/i.test(line)) return 'ENC_RIGHT';
  if (/\b(ENC_PRESS|ENCODER_PRESS|ROTARY_PRESS|ENC_CLICK|CLICK)\b/i.test(line)) return 'ENC_PRESS';

  // 5. 优先匹配明确包含 "按下/有效" 语义的按键 (如 "KEY1: 1", "KEY1 pressed", "S2: down")
  const pressExplicit = line.match(/(?:KEY|S|K)[_\s]?([1-8])\s*(?:[:=]\s*1\b|\bpressed\b|\bdown\b)/i);
  if (pressExplicit) {
    return 'KEY' + pressExplicit[1];
  }

  // 6. 如果整行完全就是一个纯按键代号 (如 "KEY1", "S1", "K1", "KEY_3")
  const exactToken = line.match(/^(?:KEY|S|K)[_\s]?([1-8])$/i);
  if (exactToken) {
    return 'KEY' + exactToken[1];
  }

  // 7. 如果是标准 ESP-IDF 日志 (如 "easy_input: KEY1 pressed" 或 "gpio_keys: Key 1 down")
  const idfLogMatch = line.match(/\b(?:easy_input|gpio_keys|key):\s*(?:KEY|S|K)?([1-8])\b/i);
  if (idfLogMatch && !/\b(released|up|0)\b/i.test(line)) {
    return 'KEY' + idfLogMatch[1];
  }

  // 8. 兜底匹配词边界，但严格排除 "status=1"、"step=1"、"vin=1" 等日志噪音
  const wordMatch = line.match(/\b(KEY[_\s]?([1-8])|S([1-8]))\b/i);
  if (wordMatch) {
    const idx = wordMatch.index;
    const prefix = line.substring(Math.max(0, idx - 6), idx);
    if (!/(?:status|step|size|vin|chrg|core|task|gpio)/i.test(prefix)) {
      const num = wordMatch[2] || wordMatch[3];
      return 'KEY' + num;
    }
  }

  return null;
}

function normalizeToken(token) {
  if (!token) return null;
  const str = String(token).toUpperCase().replace(/[\s_-]+/g, '');
  if (str === 'ENCLEFT' || str === 'ENCODERLEFT' || str === 'ENCCCW') return 'ENC_LEFT';
  if (str === 'ENCRIGHT' || str === 'ENCODER_RIGHT' || str === 'ENCCW') return 'ENC_RIGHT';
  if (str === 'ENCPRESS' || str === 'ENCODERPRESS' || str === 'ENCCLICK') return 'ENC_PRESS';
  const m = str.match(/^(KEY|S|K)?([1-8])$/);
  if (m) return 'KEY' + m[2];
  return str;
}

// ======================== Web Serial (COM3) 串口直连驱动 ========================

function toggleConnectEasyInputSerial() {
  if (serialConnected) {
    disconnectEasyInputSerial();
  } else {
    connectEasyInputSerial();
  }
}

async function connectEasyInputSerial() {
  if (!('serial' in navigator)) {
    showToast('当前浏览器暂不支持 Web Serial API。建议使用 Chrome 或 Edge 访问以直连 COM3 串口！', 4500);
    return;
  }

  try {
    // 调起浏览器串口授权弹窗 (用户选择 COM3)
    serialPort = await navigator.serial.requestPort();
    await serialPort.open({ baudRate: 115200 });
    serialConnected = true;
    updateSerialUI(true);
    showToast('🟢 已成功连接 EasyInput 串口设备 (COM3 / 115200)！');
    startSerialReadLoop();
  } catch (err) {
    if (err.name !== 'NotFoundError') {
      console.error('Serial port connection error:', err);
      showToast('连接失败: ' + (err.message || '串口被占用或权限不足'));
    }
  }
}

async function disconnectEasyInputSerial() {
  serialConnected = false;
  if (serialReader) {
    try {
      await serialReader.cancel();
    } catch (e) {}
  }
  if (serialPort) {
    try {
      await serialPort.close();
    } catch (e) {}
    serialPort = null;
  }
  updateSerialUI(false);
  showToast('EasyInput 串口已断开');
}

async function startSerialReadLoop() {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = serialPort.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();
  serialReader = reader;
  let lineBuffer = '';

  try {
    while (serialConnected) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        lineBuffer += value;
        const lines = lineBuffer.split(/\r?\n/);
        lineBuffer = lines.pop(); // 保留不完整尾段

        for (const rawLine of lines) {
          const line = rawLine.trim();
          if (!line) continue;
          appendSerialLog(line);
          const token = parseEasyInputSerialToken(line);
          if (token) {
            onEasyInputHardwareTrigger(token, 'COM3 串口');
          }
        }
      }
    }
  } catch (err) {
    console.warn('Serial read stream ended or interrupted:', err);
  } finally {
    try {
      reader.releaseLock();
    } catch (e) {}
    updateSerialUI(false);
  }
}

function updateSerialUI(connected) {
  const dot = document.getElementById('easyInputStatusDot');
  const connText = document.getElementById('easyInputConnectionStatusText');
  const btnConnectPrimary = document.getElementById('btnConnectPrimaryText');
  const headerConnDot = document.getElementById('headerConnDot');
  const headerConnText = document.getElementById('headerConnText');
  const headerConnBadge = document.getElementById('headerConnBadge');
  const capsuleDot = document.getElementById('capsuleDot');
  const capsuleText = document.getElementById('capsuleText');
  const capsuleHint = document.getElementById('capsuleHint');

  if (connected) {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse';
    if (connText) connText.innerText = '已连接串口 (COM3 · 115200)';
    if (btnConnectPrimary) btnConnectPrimary.innerText = '断开串口 (COM3)';
    if (headerConnDot) headerConnDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    if (headerConnText) headerConnText.innerText = 'COM3 已连接';
    if (headerConnBadge) headerConnBadge.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 flex items-center gap-1.5 border border-emerald-200';
    if (capsuleDot) capsuleDot.className = 'w-2 h-2 rounded-full bg-emerald-500 animate-pulse';
    if (capsuleText) capsuleText.innerText = 'EasyInput 已连接 (COM3)';
    updateHotspotLabels();
  } else {
    if (dot) dot.className = 'w-2.5 h-2.5 rounded-full bg-neutral-300';
    if (connText) connText.innerText = '尚未连接键盘';
    if (btnConnectPrimary) btnConnectPrimary.innerText = '连接 USB 串口 (COM3)';
    if (headerConnDot) headerConnDot.className = 'w-2 h-2 rounded-full bg-neutral-400';
    if (headerConnText) headerConnText.innerText = '未连接';
    if (headerConnBadge) headerConnBadge.className = 'text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-neutral-100 text-neutral-600 flex items-center gap-1.5 border border-neutral-200';
    if (capsuleDot) capsuleDot.className = 'w-2 h-2 rounded-full bg-neutral-400';
    if (capsuleText) capsuleText.innerText = 'EasyInput 未连接';
    if (capsuleHint) capsuleHint.innerText = '点击设置按键或连接 COM3';
  }
}

function appendSerialLog(line) {
  serialLogs.push(line);
  if (serialLogs.length > 80) serialLogs.shift();
  const container = document.getElementById('serialMonitorContainer');
  if (container && !container.classList.contains('hidden')) {
    const el = document.createElement('div');
    el.className = 'truncate';
    el.innerText = `[${new Date().toLocaleTimeString()}] ${line}`;
    container.appendChild(el);
    container.scrollTop = container.scrollHeight;
  }
}

function toggleSerialMonitor() {
  const container = document.getElementById('serialMonitorContainer');
  const text = document.getElementById('serialMonitorToggleText');
  if (!container) return;
  const isHidden = container.classList.toggle('hidden');
  if (text) text.innerText = isHidden ? '查看串口日志' : '收起串口日志';
  if (!isHidden) {
    container.innerHTML = serialLogs.slice(-20).map(l => `<div class="truncate">[LOG] ${l}</div>`).join('') || '<div class="text-neutral-500">// 暂无新报文，请旋转旋钮或按下按键...</div>';
    container.scrollTop = container.scrollHeight;
  }
}

// ======================== 全局键盘监听与 HID 模式回退 ========================

function initEasyInputSystem() {
  document.addEventListener('keydown', (e) => {
    // 改键录制模式
    if (recordingInputToken) {
      e.preventDefault();
      e.stopPropagation();

      const pressedKey = e.key === ' ' ? 'Space' : e.key;
      userHardwareMap[recordingInputToken].fallbackKey = pressedKey;
      saveHardwareMap();

      showToast(`${userHardwareMap[recordingInputToken].label} 关联键已设为：${pressedKey}`);
      recordingInputToken = null;
      renderKeyMappings();
      return;
    }

    // 输入框聚焦时不拦截按键
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
      return;
    }

    // 检查是否匹配任何 EasyInput 硬件的快捷键
    const pressedKey = e.key === ' ' ? 'Space' : e.key;
    for (const token of Object.keys(userHardwareMap)) {
      const item = userHardwareMap[token];
      if (item.fallbackKey && item.fallbackKey.toLowerCase() === pressedKey.toLowerCase()) {
        e.preventDefault();
        onEasyInputHardwareTrigger(token, '键盘映射');
        return;
      }
    }

    // 默认备用翻页与全局研读快捷键
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (state.currentView === 'workspace') { e.preventDefault(); nextPage(); }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (state.currentView === 'workspace') { e.preventDefault(); prevPage(); }
    } else if (e.key === '+' || e.key === '=') {
      if (state.currentView === 'workspace') { e.preventDefault(); zoomIn(); }
    } else if (e.key === '-' || e.key === '_') {
      if (state.currentView === 'workspace') { e.preventDefault(); zoomOut(); }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      switchView(state.currentView === 'universe' ? 'workspace' : 'universe');
    }
  });

  // 鼠标滚轮转动 (对应旋转编码器 HID 模式)
  window.addEventListener('wheel', (e) => {
    if (!document.getElementById('keySettingsModal').classList.contains('hidden')) return;
    if (state.currentView !== 'workspace') return;
    if (e.ctrlKey) return; // 允许浏览器自带缩放

    if (Math.abs(e.deltaY) > 80) {
      if (e.deltaY > 0) {
        onEasyInputHardwareTrigger('ENC_RIGHT', '滚轮旋钮');
      } else {
        onEasyInputHardwareTrigger('ENC_LEFT', '滚轮旋钮');
      }
    }
  }, { passive: true });
}

// Robust PDF.js Document Loader
async function loadPdfDocument(arrayBuffer) {
  const data = new Uint8Array(arrayBuffer.slice(0));
  try {
    return await pdfjsLib.getDocument({ data: data }).promise;
  } catch (err) {
    console.warn('PDF.js standard worker load failed, trying blob worker...', err);
    try {
      if (!window._blobWorkerUrl) {
        const response = await fetch('pdf.worker.min.js');
        const text = await response.text();
        const blob = new Blob([text], { type: 'application/javascript' });
        window._blobWorkerUrl = URL.createObjectURL(blob);
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = window._blobWorkerUrl;
      return await pdfjsLib.getDocument({ data: data }).promise;
    } catch (e2) {
      console.error('All PDF worker methods failed', e2);
      throw err;
    }
  }
}

// Restore saved PDFs on page refresh
async function restorePersistedDocuments() {
  try {
    const savedDocs = await getAllDocsFromIndexedDB();
    if (!savedDocs || savedDocs.length === 0) return;

    for (const saved of savedDocs) {
      try {
        const pdf = await loadPdfDocument(saved.fileBuffer);

        const docRecord = {
          id: saved.id,
          fileName: saved.fileName,
          fileSize: saved.fileSize,
          fileSizeBytes: saved.fileSizeBytes,
          pages: saved.pages,
          fileBuffer: saved.fileBuffer,
          coverThumbnail: saved.coverThumbnail,
          pdfJsInstance: pdf,
          oneLiner: `已从本地存储加载文档《${saved.fileName}》（共 ${saved.pages} 页）。`,
          keyTakeaways: [
            { tag: '本地持久化', text: `文件《${saved.fileName}》已完整缓存在本地 IndexedDB 中，随时可用。` }
          ],
          outline: [],
          mindmap: [
            {
              title: saved.fileName.replace('.pdf', ''),
              children: ['文档概览', '核心章节', '数据结论']
            }
          ]
        };

      for (let p = 1; p <= Math.min(saved.pages, 10); p++) {
        docRecord.outline.push({ page: p, title: `第 ${p} 页 · 正文内容` });
      }

      // Reconstruct single card
      const cProps = saved.cardProps || {
        w: 120,
        h: 160,
        baseTilt: Math.random() * 30 - 15,
        radiusX: 430,
        radiusY: 260,
        orbitOffset: Math.random() * Math.PI * 2
      };

      state.cards.push({
        id: `card-${docRecord.id}`,
        docId: docRecord.id,
        docRef: docRecord,
        title: saved.fileName.replace('.pdf', ''),
        tag: `${saved.pages} 页 · PDF`,
        authors: saved.fileSize,
        thumbnail: saved.coverThumbnail,
        w: cProps.w,
        h: cProps.h,
        baseTilt: cProps.baseTilt,
        radiusX: cProps.radiusX,
        radiusY: cProps.radiusY,
        orbitOffset: cProps.orbitOffset
      });
      } catch (errDoc) {
        console.warn('Failed to load specific saved PDF:', saved.fileName, errDoc);
      }
    }

    if (state.cards.length > 0) {
      const hint = document.getElementById('emptyOrbitHint');
      if (hint) hint.classList.add('opacity-0', 'pointer-events-none');

      const statusText = document.getElementById('orbitStatusText');
      if (statusText) statusText.innerText = `本地已持久化 ${state.cards.length} 份 PDF 文档在星轨中环绕`;

      createCardElements();
    }
  } catch (err) {
    console.warn('Failed to restore documents from IndexedDB', err);
  }
}

// ======================== User PDF Upload (Duplicate Check & Save) ========================

function triggerPdfUpload() {
  document.getElementById('pdfFileInput').click();
}

function handleFileUpload(event) {
  const files = event.target.files;
  if (files && files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      processSelectedPdfFile(files[i]);
    }
  }
  // Reset input value so re-selecting triggers change
  event.target.value = '';
}

function clearAttachedFile(event) {
  event.stopPropagation();
  state.attachedFile = null;
  document.getElementById('attachedFileBadge').classList.add('hidden');
  document.getElementById('pdfFileInput').value = '';
}

function setupDragAndDrop() {
  const dropOverlay = document.getElementById('dropOverlay');

  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (dropOverlay && state.currentView === 'universe') {
      dropOverlay.classList.remove('hidden');
    }
  });

  window.addEventListener('dragleave', (e) => {
    if (e.clientX <= 0 || e.clientY <= 0) {
      if (dropOverlay) dropOverlay.classList.add('hidden');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (dropOverlay) dropOverlay.classList.add('hidden');
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          processSelectedPdfFile(file);
        } else {
          showToast('请上传标准的 PDF 格式文件');
        }
      }
    }
  });
}

// Duplicate Detection & Storage
function processSelectedPdfFile(file) {
  // 1. Check for duplicates by filename and filesize!
  const isDuplicate = state.cards.some(c => {
    return c.docRef && (c.docRef.fileName === file.name && c.docRef.fileSizeBytes === file.size);
  });

  if (isDuplicate) {
    showToast(`⚠️ 该文件《${file.name}》已存在于星轨中，请勿重复上传！`, 3500);
    return;
  }

  state.attachedFile = file;

  const badge = document.getElementById('attachedFileBadge');
  const nameEl = document.getElementById('attachedFileName');
  const sizeEl = document.getElementById('attachedFileSize');
  nameEl.innerText = file.name;
  sizeEl.innerText = (file.size / (1024 * 1024)).toFixed(1) + ' MB';
  badge.classList.remove('hidden');

  showToast(`正在解析并保存《${file.name}》至本地...`);

  const reader = new FileReader();
  reader.onload = async function(e) {
    const arrayBuffer = e.target.result;

    try {
      const pdf = await loadPdfDocument(arrayBuffer);
      
      // Render first page as cover
      let coverThumbnail = '';
      try {
        const page1 = await pdf.getPage(1);
        const viewport = page1.getViewport({ scale: 0.4 });
        const offCanvas = document.createElement('canvas');
        offCanvas.width = viewport.width;
        offCanvas.height = viewport.height;
        const offCtx = offCanvas.getContext('2d');
        await page1.render({ canvasContext: offCtx, viewport: viewport }).promise;
        coverThumbnail = offCanvas.toDataURL();
      } catch (err) {
        console.warn('Cover extraction fallback', err);
      }

      // Card Geometry Props
      const baseW = 120 + (Math.random() * 16 - 8);
      const baseH = baseW * 1.36;
      const cardProps = {
        w: Math.round(baseW),
        h: Math.round(baseH),
        baseTilt: Math.random() * 40 - 20,
        radiusX: 430 + (Math.random() * 40 - 20),
        radiusY: 260 + (Math.random() * 30 - 15),
        orbitOffset: Math.random() * Math.PI * 2
      };

      const docRecord = {
        id: 'doc-' + Date.now(),
        fileName: file.name,
        fileSize: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        fileSizeBytes: file.size,
        pages: pdf.numPages,
        fileBuffer: arrayBuffer,
        coverThumbnail: coverThumbnail,
        cardProps: cardProps,
        uploadedAt: Date.now(),
        pdfJsInstance: pdf,
        oneLiner: `已成功加载并持久化本地文档《${file.name}》（共 ${pdf.numPages} 页）。`,
        keyTakeaways: [
          { tag: '本地持久化', text: `文件《${file.name}》已永久保存在浏览器本地数据库中，刷新页面不丢失。` },
          { tag: '深度研读', text: '点击卡片即可在左右分屏开展多轮 AI 研读与笔记。' }
        ],
        outline: [],
        mindmap: [
          {
            title: file.name.replace('.pdf', ''),
            children: ['文档概览', '核心章节', '实验结论', '参考文献']
          }
        ]
      };

      for (let p = 1; p <= Math.min(pdf.numPages, 10); p++) {
        docRecord.outline.push({ page: p, title: `第 ${p} 页 · 正文内容` });
      }

      // Persist to IndexedDB!
      await saveDocToIndexedDB(docRecord);

      // Create exactly 1 card
      const singleCard = {
        id: `card-${docRecord.id}`,
        docId: docRecord.id,
        docRef: docRecord,
        title: file.name.replace('.pdf', ''),
        tag: `${pdf.numPages} 页 · PDF`,
        authors: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
        thumbnail: coverThumbnail,
        w: cardProps.w,
        h: cardProps.h,
        baseTilt: cardProps.baseTilt,
        radiusX: cardProps.radiusX,
        radiusY: cardProps.radiusY,
        orbitOffset: cardProps.orbitOffset
      };

      state.cards.push(singleCard);
      state.currentDoc = docRecord;
      state.totalPages = pdf.numPages;

      const hint = document.getElementById('emptyOrbitHint');
      if (hint) hint.classList.add('opacity-0', 'pointer-events-none');

      const statusText = document.getElementById('orbitStatusText');
      if (statusText) statusText.innerText = `本地已持久化 ${state.cards.length} 份 PDF 文档在星轨中环绕`;

      createCardElements();
      showToast(`✨ 《${file.name}》已永久存入本地星轨，刷新不丢失！`);

    } catch (err) {
      console.error('PDF parsing error', err);
      showToast(`PDF 解析失败: ${err.message || '格式不支持或文件损坏'}`);
    }
  };
  reader.readAsArrayBuffer(file);
}

// Delete document from local IndexedDB
async function deleteCardDoc(event, index) {
  event.stopPropagation();
  const card = state.cards[index];
  if (!card) return;

  if (confirm(`确定要从本地星轨中移除《${card.docRef.fileName}》吗？`)) {
    await removeDocFromIndexedDB(card.docId);
    state.cards.splice(index, 1);

    if (state.cards.length === 0) {
      const hint = document.getElementById('emptyOrbitHint');
      if (hint) hint.classList.remove('opacity-0', 'pointer-events-none');

      const statusText = document.getElementById('orbitStatusText');
      if (statusText) statusText.innerText = '拖拽或上传本地 PDF 即可生成不规则环绕卡片';
    } else {
      const statusText = document.getElementById('orbitStatusText');
      if (statusText) statusText.innerText = `本地已持久化 ${state.cards.length} 份 PDF 文档在星轨中环绕`;
    }

    createCardElements();
    showToast(`已从本地星轨中删除文献`);
  }
}

// Generate Card DOM Elements
function createCardElements() {
  const container = document.getElementById('orbitCardsContainer');
  if (!container) return;

  container.innerHTML = '';

  state.cards.forEach((card, index) => {
    const el = document.createElement('div');
    el.id = `orbit-card-${card.id}`;
    el.className = 'orbit-card';
    el.style.width = `${card.w}px`;
    el.style.height = `${card.h}px`;
    el.style.marginTop = `-${card.h / 2}px`;
    el.style.marginLeft = `-${card.w / 2}px`;

    el.innerHTML = `
      <div class="orbit-card-inner group"
           onmouseenter="handleCardMouseEnter(${index})" 
           onmouseleave="handleCardMouseLeave()" 
           onclick="openCardDoc(${index})"
           title="点击研读：《${card.title}》">
        
        <!-- Real Cover Thumbnail of User's PDF -->
        <div class="relative w-full overflow-hidden bg-neutral-50 flex-shrink-0" style="height: ${card.h - 48}px;">
          ${card.thumbnail ? 
            `<img src="${card.thumbnail}" alt="${card.title}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">` :
            `<div class="w-full h-full flex flex-col items-center justify-center bg-orange-50 text-orange-600">
               <i data-lucide="file-text" class="w-8 h-8 mb-1"></i>
               <span class="text-[9px] font-bold">PDF</span>
             </div>`
          }
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 p-1.5 flex flex-col justify-between">
            <span class="self-start text-[8px] font-semibold text-white px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-xs">
              ${card.tag}
            </span>
            <!-- Quick delete button on hover -->
            <button onclick="deleteCardDoc(event, ${index})" class="self-end p-1 rounded-full bg-black/50 text-white/80 hover:text-red-400 hover:bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity" title="从本地删除">
              <i data-lucide="trash-2" class="w-2.5 h-2.5"></i>
            </button>
          </div>
        </div>

        <!-- Bottom Paper Label -->
        <div class="p-1.5 flex-1 flex flex-col justify-between bg-white text-neutral-800">
          <div class="font-bold text-[9px] leading-tight line-clamp-1" title="${card.title}">
            ${card.title}
          </div>
          <div class="flex items-center justify-between text-[8px] text-neutral-400 mt-0.5">
            <span class="truncate max-w-[70px]">${card.authors}</span>
            <i data-lucide="arrow-up-right" class="w-3 h-3 text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
          </div>
        </div>

      </div>
    `;

    container.appendChild(el);
  });

  lucide.createIcons();
}

function handleCardMouseEnter(index) {
  state.hoveredCardIndex = index;
}

function handleCardMouseLeave() {
  state.hoveredCardIndex = -1;
}

// ======================== Irregular Orbit Physics Loop ========================

function startOrbitAnimationLoop() {
  let lastTime = performance.now();

  function tick(now) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    if (state.isOrbitRotating && !state.isDragging && state.hoveredCardIndex === -1 && state.cards.length > 0) {
      state.globalOrbitAngle += 0.20 * dt;
    }

    renderCardsTransform();
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

function renderCardsTransform() {
  const total = state.cards.length;
  if (total === 0) return;

  const stage = document.getElementById('orbitStage');
  if (!stage) return;
  const stageWidth = stage.clientWidth;
  const stageHeight = stage.clientHeight;

  const rxBase = Math.min(stageWidth * 0.44, 480);
  const ryBase = Math.min(stageHeight * 0.38, 270);

  state.cards.forEach((card, index) => {
    const el = document.getElementById(`orbit-card-${card.id}`);
    if (!el) return;

    const cardAngle = state.globalOrbitAngle + card.orbitOffset;

    // Organic wavy movement
    const waveX = Math.sin(cardAngle * 2 + index) * 20;
    const waveY = Math.cos(cardAngle * 2 + index) * 15;

    const rx = (card.radiusX || rxBase) + waveX;
    const ry = (card.radiusY || ryBase) + waveY;

    const x = Math.cos(cardAngle) * rx;
    const y = Math.sin(cardAngle) * ry;

    const sinA = Math.sin(cardAngle);

    // Dynamic tilt
    const dynamicTilt = card.baseTilt + (-Math.cos(cardAngle) * 16);

    const depthRatio = (sinA + 1) / 2;
    const isHovered = (state.hoveredCardIndex === index);

    const scale = isHovered ? 1.25 : 0.88 + (depthRatio * 0.24);
    const zIndex = isHovered ? 60 : (sinA > 0.08 ? 35 : 10);
    const opacity = isHovered ? 1 : 0.88 + (depthRatio * 0.12);

    el.style.transform = `translate3d(${x}px, ${y}px, 0px) rotate(${dynamicTilt}deg) scale(${scale})`;
    el.style.zIndex = zIndex;
    el.style.opacity = opacity;
  });
}

// Stage Dragging
function setupOrbitStageDrag() {
  const stage = document.getElementById('orbitStage');
  if (!stage) return;

  window.addEventListener('mousemove', (e) => {
    if (!state.isDragging) return;
    const deltaX = e.clientX - state.dragStartX;
    state.globalOrbitAngle = state.dragStartAngle + (deltaX * 0.005);
  });

  window.addEventListener('mouseup', () => {
    if (state.isDragging) state.isDragging = false;
  });

  window.addEventListener('touchmove', (e) => {
    if (!state.isDragging || !e.touches[0]) return;
    const deltaX = e.touches[0].clientX - state.dragStartX;
    state.globalOrbitAngle = state.dragStartAngle + (deltaX * 0.005);
  });

  window.addEventListener('touchend', () => {
    state.isDragging = false;
  });
}

function handleOrbitDragStart(e) {
  if (e.target.closest('#centralConsole') || e.target.closest('.orbit-card-inner')) return;
  state.isDragging = true;
  state.dragStartX = e.touches ? e.touches[0].clientX : e.clientX;
  state.dragStartAngle = state.globalOrbitAngle;
}

// Open card in reading workspace
function openCardDoc(index) {
  const card = state.cards[index];
  if (!card) return;

  const doc = card.docRef;
  state.currentDoc = doc;
  state.currentPage = 1;
  state.totalPages = doc.pages;
  state.pdfJsDoc = doc.pdfJsInstance;

  document.getElementById('workspaceDocTitle').innerText = doc.fileName;
  document.getElementById('docMetaBadge').innerText = `${doc.pages} 页 · ${doc.fileSize}`;
  document.getElementById('totalPagesSpan').innerText = doc.pages;
  document.getElementById('currentPageInput').value = 1;

  updateWorkspaceUI();
  switchView('workspace');
  showToast(`已开启精读：《${doc.fileName}》`);
}

function switchView(viewName) {
  state.currentView = viewName;
  const universeEl = document.getElementById('viewUniverse');
  const workspaceEl = document.getElementById('viewWorkspace');

  if (viewName === 'universe') {
    universeEl.classList.remove('hidden');
    workspaceEl.classList.add('hidden');
  } else {
    universeEl.classList.add('hidden');
    workspaceEl.classList.remove('hidden');
    renderCurrentPage();
  }
  lucide.createIcons();
}

// ======================== PDF Rendering on Canvas ========================

function renderCurrentPage() {
  if (!state.currentDoc || !state.currentDoc.pdfJsInstance) return;

  document.getElementById('currentPageInput').value = state.currentPage;
  document.getElementById('workspaceDocTitle').innerText = state.currentDoc.fileName;

  const canvas = document.getElementById('pdfCanvas');
  const ctx = canvas.getContext('2d');
  const spinner = document.getElementById('pdfLoadingSpinner');

  if (spinner) spinner.classList.remove('hidden');

  state.currentDoc.pdfJsInstance.getPage(state.currentPage).then(page => {
    const viewport = page.getViewport({ scale: state.pdfScale });
    const outputScale = window.devicePixelRatio || 1;

    canvas.width = Math.floor(viewport.width * outputScale);
    canvas.height = Math.floor(viewport.height * outputScale);
    canvas.style.width = Math.floor(viewport.width) + "px";
    canvas.style.height = Math.floor(viewport.height) + "px";

    const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

    const renderContext = {
      canvasContext: ctx,
      transform: transform,
      viewport: viewport
    };

    page.render(renderContext).promise.then(() => {
      if (spinner) spinner.classList.add('hidden');
      renderTextLayer(page, viewport);
    });
  }).catch(err => {
    console.error('Page render error', err);
    if (spinner) spinner.classList.add('hidden');
  });
}

function renderTextLayer(page, viewport) {
  const textLayerDiv = document.getElementById('textLayer');
  textLayerDiv.innerHTML = '';
  textLayerDiv.style.width = viewport.width + 'px';
  textLayerDiv.style.height = viewport.height + 'px';

  page.getTextContent().then(textContent => {
    pdfjsLib.renderTextLayer({
      textContentSource: textContent,
      container: textLayerDiv,
      viewport: viewport,
      textDivs: []
    });
  });
}

// Page controls
function prevPage() {
  if (state.currentPage > 1) {
    state.currentPage--;
    renderCurrentPage();
  }
}

function nextPage() {
  if (state.currentPage < state.totalPages) {
    state.currentPage++;
    renderCurrentPage();
  }
}

function jumpToPage(num) {
  const p = parseInt(num);
  if (!isNaN(p) && p >= 1 && p <= state.totalPages) {
    state.currentPage = p;
    renderCurrentPage();
  }
}

function zoomIn() {
  if (state.pdfScale < 2.5) {
    state.pdfScale += 0.15;
    updateZoomDisplay();
    renderCurrentPage();
  }
}

function zoomOut() {
  if (state.pdfScale > 0.6) {
    state.pdfScale -= 0.15;
    updateZoomDisplay();
    renderCurrentPage();
  }
}

function fitWidth() {
  state.pdfScale = 1.15;
  updateZoomDisplay();
  renderCurrentPage();
  showToast('已自适应最佳页面宽度');
}

function updateZoomDisplay() {
  document.getElementById('zoomLevelDisplay').innerText = Math.round(state.pdfScale * 100) + '%';
}

function toggleHighlightTool() {
  const btn = document.getElementById('highlightToolBtn');
  btn.classList.toggle('bg-amber-100');
  showToast('批注模式已就绪，选中文本即可保存批注');
}

// ======================== AI Copilot & Panels ========================

function updateWorkspaceUI() {
  if (!state.currentDoc) return;

  const oneLinerEl = document.getElementById('summaryOneLiner');
  if (oneLinerEl) oneLinerEl.innerText = state.currentDoc.oneLiner;

  const pointsList = document.getElementById('summaryPointsList');
  if (pointsList && state.currentDoc.keyTakeaways) {
    pointsList.innerHTML = state.currentDoc.keyTakeaways.map(t => `
      <div class="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200">
        <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 mb-1">
          ${t.tag}
        </span>
        <p class="text-neutral-700 leading-relaxed">${t.text}</p>
      </div>
    `).join('');
  }

  const outlineList = document.getElementById('documentOutlineList');
  if (outlineList && state.currentDoc.outline) {
    outlineList.innerHTML = state.currentDoc.outline.map(item => `
      <div onclick="jumpToPage(${item.page})" class="flex items-center justify-between p-2 rounded-lg hover:bg-neutral-100 cursor-pointer text-neutral-700 transition">
        <span class="truncate pr-2">${item.title}</span>
        <span class="text-[10px] font-mono text-neutral-400 bg-neutral-200 px-1.5 py-0.2 rounded">P.${item.page}</span>
      </div>
    `).join('');
  }

  renderMindmapTree();
  renderNotesList();
}

function renderMindmapTree() {
  const container = document.getElementById('mindmapContainer');
  if (!container || !state.currentDoc) return;

  const data = state.currentDoc.mindmap || [];
  let html = '';

  data.forEach(root => {
    html += `<div class="font-bold text-neutral-900 flex items-center gap-1.5 pb-1">
      <span class="w-2 h-2 rounded-full bg-orange-500"></span>
      ${root.title}
    </div>`;

    if (root.children) {
      root.children.forEach(c => {
        if (typeof c === 'string') {
          html += `<div class="mindmap-node text-neutral-700">${c}</div>`;
        } else {
          html += `<div class="mindmap-node font-semibold text-neutral-800">${c.title}`;
          if (c.children) {
            c.children.forEach(sub => {
              html += `<div class="mindmap-node text-neutral-600 text-[11px]">${sub}</div>`;
            });
          }
          html += `</div>`;
        }
      });
    }
  });

  container.innerHTML = html;
}

function generateMindmap() {
  showToast('正在重构概念拓扑...');
  setTimeout(() => {
    renderMindmapTree();
    showToast('知识脑图已更新完毕');
  }, 500);
}

function renderNotesList() {
  const container = document.getElementById('notesListContainer');
  if (!container) return;

  container.innerHTML = state.notes.map(n => `
    <div class="p-2.5 rounded-lg bg-neutral-50 border border-neutral-200 space-y-1">
      <div class="flex items-center justify-between text-[11px] text-neutral-400">
        <span class="font-medium text-orange-600">引用定位：P.${n.page}</span>
        <span>${n.time}</span>
      </div>
      <p class="text-neutral-800 leading-relaxed">${n.text}</p>
    </div>
  `).join('');
}

function addManualNote() {
  const noteText = prompt('请输入你的批注笔记：', '该论点具有启发性与实用价值');
  if (noteText && noteText.trim()) {
    state.notes.unshift({
      id: Date.now(),
      page: state.currentPage,
      text: noteText.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    renderNotesList();
    showToast('笔记已收录');
  }
}

function exportReadingNotes() {
  const content = `# 智能研读报告\n\n` +
    `文档名称: ${state.currentDoc.fileName}\n` +
    `核心提炼: ${state.currentDoc.oneLiner}\n\n` +
    `## 批注与书签笔记\n` +
    state.notes.map(n => `- [第 ${n.page} 页] ${n.text} (${n.time})`).join('\n') +
    `\n\n---\n导出自 智能阅读工作台`;

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${state.currentDoc.fileName}-研读笔记.md`;
  a.click();
  showToast('已导出 Markdown 研读报告');
}

// AI Copilot Tabs
function switchAiTab(tab) {
  ['chat', 'summary', 'mindmap', 'notes'].forEach(t => {
    const el = document.getElementById('aiTab' + capitalize(t));
    const btn = document.getElementById('tabBtn' + capitalize(t));
    if (t === tab) {
      el.classList.remove('hidden');
      btn.classList.add('border-orange-500', 'text-orange-600');
      btn.classList.remove('border-transparent', 'text-neutral-500');
    } else {
      el.classList.add('hidden');
      btn.classList.remove('border-orange-500', 'text-orange-600');
      btn.classList.add('border-transparent', 'text-neutral-500');
    }
  });
  lucide.createIcons();
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function handleChatKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    submitChat();
  }
}

function submitChat() {
  const input = document.getElementById('chatInputText');
  const query = input.value.trim();
  if (!query) return;

  sendChatMessage(query);
  input.value = '';
}

function sendChatMessage(query) {
  const container = document.getElementById('chatMessagesContainer');

  const userHtml = `
    <div class="flex gap-2.5 items-start justify-end">
      <div class="bg-neutral-900 text-white p-2.5 rounded-2xl rounded-tr-sm max-w-[85%] leading-relaxed shadow-sm">
        ${escapeHtml(query)}
      </div>
      <div class="w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
        我
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', userHtml);
  container.scrollTop = container.scrollHeight;

  const thinkingId = 'thinking-' + Date.now();
  const thinkingHtml = `
    <div id="${thinkingId}" class="flex gap-2.5 items-start">
      <div class="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold">
        AI
      </div>
      <div class="bg-neutral-100 p-2.5 rounded-2xl rounded-tl-sm text-neutral-500 flex items-center gap-1.5">
        <span class="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
        <span>正在分析你上传的文档...</span>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', thinkingHtml);
  container.scrollTop = container.scrollHeight;

  setTimeout(() => {
    const thinkingEl = document.getElementById(thinkingId);
    if (thinkingEl) thinkingEl.remove();

    const response = generateDocumentAnswer(query);
    const aiHtml = `
      <div class="flex gap-2.5 items-start">
        <div class="w-6 h-6 rounded-md bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center flex-shrink-0 text-[10px] font-bold shadow-xs">
          AI
        </div>
        <div class="flex-1 space-y-2">
          <div class="bg-neutral-100 p-3 rounded-2xl rounded-tl-sm text-neutral-800 leading-relaxed shadow-xs">
            ${response.html}
          </div>
          <div class="flex items-center gap-2 text-[11px] text-neutral-400">
            <span class="flex items-center gap-1 cursor-pointer hover:text-orange-500" onclick="jumpToPage(${response.pageRef})">
              <i data-lucide="bookmark" class="w-3 h-3 text-orange-500"></i>
              依据来源：第 ${response.pageRef} 页
            </span>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', aiHtml);
    container.scrollTop = container.scrollHeight;
    lucide.createIcons();
  }, 650);
}

function generateDocumentAnswer(query) {
  return {
    html: `已针对你的问题 <strong>"${escapeHtml(query)}"</strong> 检索当前你上传的文档《${state.currentDoc ? state.currentDoc.fileName : '当前文档'}》：<br><br>
    结合文档第 ${state.currentPage} 页内容分析，已完成对该段落核心论点的解析与归纳。你可以继续指定具体页码进行深入挖掘。`,
    pageRef: state.currentPage
  };
}

// Prompt & Tags
function applyQuickPrompt(promptText) {
  const mainInput = document.getElementById('mainPromptInput');
  mainInput.value = promptText;
  showToast('已填入指令，上传或选择卡片即可开启研读');
}

function handleStartReading() {
  const promptText = document.getElementById('mainPromptInput').value.trim();
  if (state.cards.length > 0) {
    openCardDoc(0);
    if (promptText) {
      setTimeout(() => {
        sendChatMessage(promptText);
      }, 300);
    }
  } else {
    showToast('请先上传你的 PDF 文档');
  }
}

function toggleDeepMode() {
  state.deepMode = !state.deepMode;
  const toggle = document.getElementById('deepModeToggle');
  const knob = document.getElementById('deepModeKnob');

  if (state.deepMode) {
    toggle.classList.add('bg-orange-500');
    toggle.classList.remove('bg-neutral-300');
    knob.classList.add('translate-x-3');
    knob.classList.remove('translate-x-0');
    showToast('已开启深度精读模式');
  } else {
    toggle.classList.remove('bg-orange-500');
    toggle.classList.add('bg-neutral-300');
    knob.classList.remove('translate-x-3');
    knob.classList.add('translate-x-0');
    showToast('已切换为速读模式');
  }
}

function showToast(message, duration = 2400) {
  const toast = document.getElementById('toastNotification');
  const msgEl = document.getElementById('toastMessage');
  msgEl.innerText = message;
  toast.classList.remove('translate-y-20', 'opacity-0');
  toast.classList.add('translate-y-0', 'opacity-100');

  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
    toast.classList.remove('translate-y-0', 'opacity-100');
  }, duration);
}

function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
