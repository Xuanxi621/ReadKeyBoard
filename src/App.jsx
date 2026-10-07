import React, { useState, useEffect, useRef, useCallback } from 'react';
import UniverseView from './components/UniverseView.jsx';
import WorkspaceView from './components/WorkspaceView.jsx';
import KeySettingsModal from './components/KeySettingsModal.jsx';
import FloatingCapsule from './components/FloatingCapsule.jsx';
import HudNotification from './components/HudNotification.jsx';
import ToastNotification from './components/ToastNotification.jsx';
import UploadModal from './components/UploadModal.jsx';

import {
  EASYINPUT_ACTIONS,
  DEFAULT_HARDWARE_MAP,
  loadStoredHardwareMap,
  saveStoredHardwareMap,
  normalizeToken
} from './services/hardwareConfig.js';

import {
  saveDocToIndexedDB,
  getAllDocsFromIndexedDB,
  removeDocFromIndexedDB
} from './services/db.js';

import { loadPdfDocument, generateCoverThumbnail } from './services/pdfLoader.js';
import { openSerialConnection, closeSerialConnection, tryAutoConnectSerial } from './services/serialService.js';

export default function App() {
  // Navigation & View
  const [view, setView] = useState('universe'); // 'universe' | 'workspace'
  const [deepMode, setDeepMode] = useState(true);

  // Documents state
  const [documents, setDocuments] = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfScale, setPdfScale] = useState(1.15);
  const [highlightActive, setHighlightActive] = useState(false);
  const [activeAiTab, setActiveAiTab] = useState('chat');
  const [notes, setNotes] = useState([]);

  // Hardware and Serial states
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const selectedDocIndexRef = useRef(0);
  useEffect(() => {
    selectedDocIndexRef.current = selectedDocIndex;
  }, [selectedDocIndex]);

  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadTriggerKey, setUploadTriggerKey] = useState('S1');
  const [hardwareMap, setHardwareMap] = useState(() => loadStoredHardwareMap());
  const [recordingToken, setRecordingToken] = useState(null);
  const [serialConnected, setSerialConnected] = useState(false);
  const [serialLogs, setSerialLogs] = useState([]);
  const [activeHighlightToken, setActiveHighlightToken] = useState(null);
  const [liveSignal, setLiveSignal] = useState('无输入');

  // Feedback Notifications
  const [hudMessage, setHudMessage] = useState('');
  const [hudVisible, setHudVisible] = useState(false);
  const [toast, setToast] = useState({ message: '', id: 0 });

  // Refs for debouncing and event handlers
  const hudTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const lastTokenTriggerTimeRef = useRef({});
  const lastAnyTriggerTimeRef = useRef(0);
  const viewRef = useRef(view);
  const currentDocRef = useRef(currentDoc);
  const documentsRef = useRef(documents);
  const hardwareMapRef = useRef(hardwareMap);
  const isKeyModalOpenRef = useRef(isKeyModalOpen);
  const isUploadModalOpenRef = useRef(isUploadModalOpen);
  const serialConnectedRef = useRef(serialConnected);

  // Sync refs
  useEffect(() => {
    serialConnectedRef.current = serialConnected;
  }, [serialConnected]);
  useEffect(() => {
    isUploadModalOpenRef.current = isUploadModalOpen;
  }, [isUploadModalOpen]);
  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    currentDocRef.current = currentDoc;
  }, [currentDoc]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    hardwareMapRef.current = hardwareMap;
  }, [hardwareMap]);

  useEffect(() => {
    isKeyModalOpenRef.current = isKeyModalOpen;
  }, [isKeyModalOpen]);

  // Toast Helper
  const showToast = useCallback((message, duration = 2400) => {
    setToast({ message, id: Date.now() });
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToast({ message: '', id: 0 });
    }, duration);
  }, []);

  // HUD Helper
  const showHud = useCallback((text) => {
    setHudMessage(text);
    setHudVisible(true);
    clearTimeout(hudTimerRef.current);
    hudTimerRef.current = setTimeout(() => {
      setHudVisible(false);
    }, 1400);
  }, []);

  // Restore persisted documents from IndexedDB on startup
  useEffect(() => {
    async function restoreDocs() {
      try {
        const savedDocs = await getAllDocsFromIndexedDB();
        const loadedDocs = [];

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
              cardProps: saved.cardProps,
              uploadedAt: saved.uploadedAt,
              pdfJsInstance: pdf,
              oneLiner: `已成功加载并持久化本地文档《${saved.fileName}》（共 ${saved.pages} 页）。`,
              keyTakeaways: [
                { tag: '本地持久化', text: `文件《${saved.fileName}》已永久保存在浏览器本地数据库中，刷新页面不丢失。` },
                { tag: '深度研读', text: '点击卡片即可在左右分屏开展多轮 AI 研读与笔记。' }
              ],
              outline: [],
              mindmap: [
                {
                  title: saved.fileName.replace('.pdf', ''),
                  children: ['文档概览', '核心章节', '实验结论', '参考文献']
                }
              ]
            };

            for (let p = 1; p <= Math.min(saved.pages, 10); p++) {
              docRecord.outline.push({ page: p, title: `第 ${p} 页 · 正文内容` });
            }

            loadedDocs.push(docRecord);
          } catch (err) {
            console.warn('Failed to restore saved PDF:', saved.fileName, err);
          }
        }

        setDocuments(loadedDocs);
        if (loadedDocs.length > 0) {
          showToast(`已从本地数据库载入 ${loadedDocs.length} 份 PDF 文档`);
        }
      } catch (err) {
        console.warn('Failed to read IndexedDB', err);
      }
    }

    restoreDocs();
  }, [showToast]);

  // Execute Action triggered by hardware
  const executeAction = useCallback((actionName, sourceLabel = 'EasyInput') => {
    const actionInfo = EASYINPUT_ACTIONS[actionName];
    const actNameText = actionInfo ? actionInfo.name : actionName;
    showHud(`${sourceLabel} ➔ ${actNameText}`);

    // If modal is open, handle view toggle or upload
    if (isKeyModalOpenRef.current) {
      if (actionName === 'toggleView') {
        setIsKeyModalOpen(false);
        setView('universe');
        showToast('EasyInput S5 ➔ 关闭设置并返回星轨主页');
        return;
      }
      if (actionName === 'importPdf') {
        setIsKeyModalOpen(false);
      } else if (actionName === 'nextPage' || actionName === 'prevPage') {
        return;
      }
    }

    switch (actionName) {
      case 'nextPage':
        if (viewRef.current === 'workspace') {
          setCurrentPage(prev => {
            const maxP = currentDocRef.current ? currentDocRef.current.pages : 1;
            const next = prev < maxP ? prev + 1 : prev;
            showToast(`EasyInput ➔ 下一页 (${next}/${maxP})`);
            return next;
          });
        } else {
          // 星轨主页：旋钮顺时针 / S2 切换选择下一个文档（如 Tab 选择）
          if (documentsRef.current.length > 0) {
            const total = documentsRef.current.length;
            const nextIdx = (selectedDocIndexRef.current + 1) % total;
            setSelectedDocIndex(nextIdx);
            const doc = documentsRef.current[nextIdx];
            showToast(`EasyInput 旋钮 ➔ 选中《${doc.fileName}》(${nextIdx + 1}/${total}) · 按下旋钮即可打开`);
          } else {
            showToast('EasyInput ➔ 当前已在星轨主页，暂无可翻页文档');
          }
        }
        break;

      case 'prevPage':
        if (viewRef.current === 'workspace') {
          setCurrentPage(prev => {
            const p = prev > 1 ? prev - 1 : 1;
            const maxP = currentDocRef.current ? currentDocRef.current.pages : 1;
            showToast(`EasyInput ➔ 上一页 (${p}/${maxP})`);
            return p;
          });
        } else {
          // 星轨主页：旋钮逆时针 / S7 切换选择上一个文档（如 Shift+Tab 选择）
          if (documentsRef.current.length > 0) {
            const total = documentsRef.current.length;
            const prevIdx = (selectedDocIndexRef.current - 1 + total) % total;
            setSelectedDocIndex(prevIdx);
            const doc = documentsRef.current[prevIdx];
            showToast(`EasyInput 旋钮 ➔ 选中《${doc.fileName}》(${prevIdx + 1}/${total}) · 按下旋钮即可打开`);
          } else {
            showToast('EasyInput ➔ 当前已在星轨主页，暂无可翻页文档');
          }
        }
        break;

      case 'zoomIn':
        if (viewRef.current === 'workspace') {
          setPdfScale(prev => Math.min(2.5, +(prev + 0.15).toFixed(2)));
        }
        break;

      case 'zoomOut':
        if (viewRef.current === 'workspace') {
          setPdfScale(prev => Math.max(0.6, +(prev - 0.15).toFixed(2)));
        }
        break;

      case 'resetZoom':
        if (viewRef.current === 'workspace') {
          setPdfScale(1.15);
          showToast('已自适应最佳页面宽度');
        }
        break;

      case 'aiSummary':
        if (viewRef.current === 'workspace') {
          setActiveAiTab('summary');
          showToast('EasyInput S5 ➔ AI 核心要点提炼');
        } else {
          showToast('EasyInput S5 ➔ AI 核心要点（进入文献精读后即可实时查看）');
        }
        break;

      case 'aiChat':
        if (viewRef.current === 'workspace') {
          setActiveAiTab('chat');
        }
        break;

      case 'toggleDeepMode':
        setDeepMode(prev => {
          showToast(!prev ? '已开启深度精读模式' : '已切换为速读模式');
          return !prev;
        });
        break;

      case 'toggleView':
        if (isUploadModalOpenRef.current) {
          setIsUploadModalOpen(false);
          isUploadModalOpenRef.current = false;
          showToast('EasyInput ➔ 关闭上传弹窗并返回星轨主页');
          return;
        }
        if (viewRef.current === 'universe') {
          // 用户明确需求：在星轨主页按下旋钮则打开当前选中的文档！
          if (documentsRef.current.length > 0) {
            const targetDoc = documentsRef.current[selectedDocIndexRef.current] || documentsRef.current[0];
            setCurrentDoc(targetDoc);
            setCurrentPage(1);
            setView('workspace');
            showToast(`EasyInput 旋钮按下 ➔ 打开研读《${targetDoc.fileName}》`);
          } else {
            showToast('EasyInput ➔ 当前暂无文档，请按 S1 上传本地 PDF');
          }
        } else {
          setView('universe');
          showToast('EasyInput 旋钮按下 ➔ 已返回星轨主页');
        }
        break;

      case 'importPdf': {
        const keyLabel = sourceLabel ? sourceLabel.split(' ')[0] : 'S1';
        setUploadTriggerKey(keyLabel);
        // 按两下取消上传：若上传窗口已打开，再次触发即刻取消并关闭！
        if (isUploadModalOpenRef.current) {
          setIsUploadModalOpen(false);
          isUploadModalOpenRef.current = false;
          showToast(`EasyInput ${keyLabel} ➔ 已取消上传并关闭窗口`);
        } else {
          setIsUploadModalOpen(true);
          isUploadModalOpenRef.current = true;
          showToast(`EasyInput ${keyLabel} ➔ 打开上传窗口（连按两下可取消）`);
        }
        break;
      }

      case 'highlightTool':
        if (viewRef.current === 'workspace') {
          setHighlightActive(prev => {
            showToast(!prev ? '批注模式已开启' : '批注模式已关闭');
            return !prev;
          });
        }
        break;

      default:
        console.warn('Unknown action:', actionName);
    }
  }, [showHud, showToast]);

  // Hardware Trigger Handler (Strict debounce & cross-channel protection)
  const onHardwareTrigger = useCallback((rawToken, transportSource = 'COM3 串口') => {
    const token = normalizeToken(rawToken);
    if (!token) return;

    const now = Date.now();
    const isEncoder = token.startsWith('ENC');
    const perKeyDebounceMs = isEncoder ? 70 : 200;
    const crossKeyDebounceMs = isEncoder ? 40 : 160;

    // 1. Per-key debounce (旋钮响应极速，按键防抖严密)
    if (lastTokenTriggerTimeRef.current[token] && now - lastTokenTriggerTimeRef.current[token] < perKeyDebounceMs) {
      return;
    }
    // 2. Cross-key debounce
    if (now - lastAnyTriggerTimeRef.current < crossKeyDebounceMs) {
      return;
    }

    lastTokenTriggerTimeRef.current[token] = now;
    lastAnyTriggerTimeRef.current = now;

    // 主动失焦当前聚焦的非文本元素，防止后续 Enter/Space 误触 DOM 按钮
    if (document.activeElement && document.activeElement.blur && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      document.activeElement.blur();
    }

    const currentMap = hardwareMapRef.current;
    const mapping = currentMap[token];
    const label = mapping ? mapping.label : token;
    const actionName = mapping ? mapping.action : null;

    setLiveSignal(`${label} (${transportSource})`);
    setActiveHighlightToken(token);
    setTimeout(() => setActiveHighlightToken(null), 300);

    // If in recording mode
    if (recordingToken) {
      const updated = {
        ...currentMap,
        [recordingToken]: {
          ...currentMap[recordingToken],
          action: actionName || currentMap[recordingToken].action
        }
      };
      setHardwareMap(updated);
      saveStoredHardwareMap(updated);
      showToast(`已绑定 ${currentMap[recordingToken].label}`);
      setRecordingToken(null);
      return;
    }

    if (actionName) {
      executeAction(actionName, label);
    }
  }, [recordingToken, executeAction, showToast]);

  const onHardwareTriggerRef = useRef(onHardwareTrigger);
  useEffect(() => {
    onHardwareTriggerRef.current = onHardwareTrigger;
  }, [onHardwareTrigger]);

  const showToastRef = useRef(showToast);
  useEffect(() => {
    showToastRef.current = showToast;
  }, [showToast]);

  // 按键诊断模式：显示每一个接收到的 keydown 事件的真实键码
  const [keyCaptureDiag, setKeyCaptureDiag] = useState(false);
  const keyCaptureDiagRef = useRef(false);
  useEffect(() => { keyCaptureDiagRef.current = keyCaptureDiag; }, [keyCaptureDiag]);

  // 静默自动重连历史已授权的 COM3 端口 (仅在页面挂载时初始化一次)
  useEffect(() => {
    tryAutoConnectSerial(
      (token, source) => onHardwareTriggerRef.current?.(token, source),
      (logLine) => {
        setSerialLogs(prev => [logLine, ...prev].slice(0, 50));
      },
      (status) => {
        setSerialConnected(status);
        if (status) showToastRef.current?.('已自动连接 EasyInput COM3 串口！');
      }
    );
  }, []);

  // Handle global keyboard shortcuts & EasyInput HID decoding
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeEl = document.activeElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(activeEl?.tagName);

      // 按键诊断模式：无条件显示收到的键码，帮助确认 EasyInput 真实发送的 HID 键值
      if (keyCaptureDiagRef.current) {
        const mods = [e.ctrlKey && 'Ctrl', e.shiftKey && 'Shift', e.altKey && 'Alt', e.metaKey && 'Meta'].filter(Boolean).join('+');
        const desc = mods ? `${mods}+${e.key}` : e.key;
        showToast(`🔑 诊断：key="${e.key}" code="${e.code}" ${mods ? 'mods=' + mods : ''} ➜ ${desc}`, 3000);
        console.log('[KeyDiag]', { key: e.key, code: e.code, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey, altKey: e.altKey, metaKey: e.metaKey });
        // 诊断模式下不拦截，仅观察
        return;
      }

      // 关键防串键隔离：当 COM3 串口已成功连接时，按键由 Web Serial 独占权威处理！
      // 必须完全屏蔽 EasyInput 发送的 USB HID 键盘按键（Enter、Space、Ctrl+A、u 等），
      // 彻底消除硬件双通道（CDC 串口 + USB HID）并发导致的重复触发与串键问题！
      if (serialConnectedRef.current && !recordingToken) {
        if (['Enter', ' '].includes(e.key)) {
          e.preventDefault();
          e.stopPropagation();
          if (activeEl && activeEl.blur) activeEl.blur();
        }
        return;
      }

      if (recordingToken) {
        e.preventDefault();
        const updated = {
          ...hardwareMap,
          [recordingToken]: {
            ...hardwareMap[recordingToken],
            fallbackKey: e.key
          }
        };
        setHardwareMap(updated);
        saveStoredHardwareMap(updated);
        showToast(`已重设 ${hardwareMap[recordingToken].label} 快捷键为: ${e.key}`);
        setRecordingToken(null);
        return;
      }

      if (isInput) return;

      // Tab 键与 Shift+Tab 键支持：在星轨主页如同旋钮一样自由切换选择文档
      if (e.key === 'Tab' && viewRef.current === 'universe' && !isKeyModalOpenRef.current && !isUploadModalOpenRef.current) {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          onHardwareTrigger('ENC_LEFT', 'Tab 键');
        } else {
          onHardwareTrigger('ENC_RIGHT', 'Tab 键');
        }
        return;
      }

      // 1. 物理按键 S1 (Key 1): 上传 PDF (importPdf)
      // 完整适配 macOS 固件默认模式 (RightMeta / MetaRight / Meta) 与 Windows 固件模式 (Ctrl+Shift+Space) 及单键 'u' / '1'
      const isS1 = (
        e.code === 'MetaRight' ||
        (e.key === 'Meta' && e.location === 2) ||
        e.code === 'OSRight' ||
        (e.metaKey && e.code === 'MetaRight') ||
        (e.ctrlKey && e.shiftKey && (e.code === 'Space' || e.key === ' ')) ||
        (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === 'u' || e.key === 'U' || e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1'))
      );
      if (isS1) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY1', 'USB HID (S1)');
        return;
      }

      // 2. 物理按键 S2 (Key 2): 翻到下一页 (nextPage)
      // 出厂固件发送 Return / Enter。强力拦截非文本输入态下的 Enter 键，彻底阻断触发任何 DOM 按钮（绝不误触上传）
      const isS2 = (
        e.key === 'Enter' ||
        e.code === 'Enter' ||
        e.code === 'NumpadEnter' ||
        (!e.ctrlKey && !e.metaKey && !e.altKey && (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2'))
      );
      if (isS2) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY2', 'USB HID (S2/下一页)');
        return;
      }

      // 3. 物理按键 S3 (Key 3): 放大文档 (zoomIn)
      // 完整适配 macOS 固件 (RightOption / AltRight) 与 Windows 固件 (Ctrl+Shift+E) 及单键 '=', '+', '3'
      const isS3 = (
        e.code === 'AltRight' ||
        (e.key === 'Alt' && e.location === 2) ||
        e.code === 'OptionRight' ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) ||
        (!e.ctrlKey && !e.metaKey && (e.key === '=' || e.key === '+' || e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3'))
      );
      if (isS3) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY3', 'USB HID (S3)');
        return;
      }

      // 4. 物理按键 S4 (Key 4): 缩小文档 (zoomOut)
      // 出厂固件发送 Backspace，及单键 '-', '_', '4'
      const isS4 = (
        e.key === 'Backspace' ||
        e.code === 'Backspace' ||
        (!e.ctrlKey && !e.metaKey && (e.key === '-' || e.key === '_' || e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4'))
      );
      if (isS4) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY4', 'USB HID (S4)');
        return;
      }

      // 5. 物理按键 S5 (Key 5): 全屏研读 / 返回主页 / 取消弹窗 (toggleView)
      // 固件发送 Ctrl+A (Win) / Meta+A (Mac)，或空格键 (Space)，或 '5'
      const isS5 = (
        ((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) ||
        (e.code === 'Space' && !e.shiftKey && !e.ctrlKey && !e.metaKey) ||
        (!e.ctrlKey && !e.metaKey && (e.key === '5' || e.code === 'Digit5' || e.code === 'Numpad5'))
      );
      if (isS5) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY5', 'USB HID (S5)');
        return;
      }

      // 6. 物理按键 S6 (Key 6): 深度精读模式切换 (toggleDeepMode)
      // 固件发送 Ctrl+C (Win) / Meta+C (Mac)，或单键 'd', '6'
      const isS6 = (
        ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) ||
        (!e.ctrlKey && !e.metaKey && (e.key === 'd' || e.key === 'D' || e.key === '6' || e.code === 'Digit6' || e.code === 'Numpad6'))
      );
      if (isS6) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY6', 'USB HID (S6)');
        return;
      }

      // 7. 物理按键 S7 (Key 7): 翻到上一页 (prevPage)
      // 固件发送 Ctrl+V (Win) / Meta+V (Mac)，或 PageUp，或 '7'
      const isS7 = (
        ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) ||
        e.key === 'PageUp' ||
        e.code === 'PageUp' ||
        (!e.ctrlKey && !e.metaKey && (e.key === '7' || e.code === 'Digit7' || e.code === 'Numpad7'))
      );
      if (isS7) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY7', 'USB HID (S7/上一页)');
        return;
      }

      // 8. 物理按键 S8 (Key 8): 自适应宽度 / 重置缩放 (resetZoom)
      // 固件发送 Ctrl+Z (Win) / Meta+Z (Mac)，或 Ctrl+Tab / Tab，或 '0', '8'
      const isS8 = (
        ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) ||
        (e.ctrlKey && e.key === 'Tab') ||
        (!e.ctrlKey && !e.metaKey && (e.key === '0' || e.key === '8' || e.code === 'Digit8' || e.code === 'Numpad8'))
      );
      if (isS8) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('KEY8', 'USB HID (S8)');
        return;
      }

      // 9. 旋转编码器下按 (ENC_PRESS / S9): Escape / 返回主页 / 关闭弹窗 (toggleView)
      if (e.key === 'Escape' || e.code === 'Escape' || (!e.ctrlKey && !e.metaKey && (e.key === '9' || e.code === 'Digit9' || e.code === 'Numpad9'))) {
        e.preventDefault();
        e.stopPropagation();
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger('ENC_PRESS', 'USB HID (Escape/旋钮下按)');
        return;
      }

      // 10. 旋转编码器旋转: 右旋 (ArrowRight/ArrowDown/PageDown) / 左旋 (ArrowLeft/ArrowUp/PageUp)
      if (e.key === 'ArrowRight' || e.code === 'ArrowRight' || e.key === 'ArrowDown' || e.code === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        e.stopPropagation();
        onHardwareTrigger('ENC_RIGHT', 'EasyInput 旋钮 (右旋)');
        return;
      }
      if (e.key === 'ArrowLeft' || e.code === 'ArrowLeft' || e.key === 'ArrowUp' || e.code === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        e.stopPropagation();
        onHardwareTrigger('ENC_LEFT', 'EasyInput 旋钮 (左旋)');
        return;
      }

      // 11. 动态配置映射 fallbackKey 兜底
      for (const [token, item] of Object.entries(hardwareMap)) {
        if (item.fallbackKey && item.fallbackKey.toLowerCase() === e.key.toLowerCase()) {
          e.preventDefault();
          e.stopPropagation();
          onHardwareTrigger(token, '按键触发');
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordingToken, hardwareMap, onHardwareTrigger, showToast]);

  // 监听 EasyInput 原厂出厂默认 HID 滚轮 (Wheel) 协议
  useEffect(() => {
    let wheelAccumulator = 0;
    let lastWheelTime = 0;

    const handleWheel = (e) => {
      // 在文本编辑框或设置弹窗中保持常规滚动
      if (isKeyModalOpenRef.current || isUploadModalOpenRef.current) return;
      const activeEl = document.activeElement;
      if (['INPUT', 'TEXTAREA'].includes(activeEl?.tagName)) return;

      // 阻止整个视口滚动，将旋钮旋转定向派发至卡片选择与翻页
      e.preventDefault();

      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      wheelAccumulator += delta;

      const now = Date.now();
      // 阈值 25，防抖 80ms，完美匹配物理旋钮每一档刻度感
      if (Math.abs(wheelAccumulator) >= 25 && (now - lastWheelTime > 80)) {
        if (wheelAccumulator > 0) {
          // 右旋转 / 顺时针 ➔ 下一个
          onHardwareTriggerRef.current?.('ENC_RIGHT', 'EasyInput 旋钮 (右旋)');
        } else {
          // 左旋转 / 逆时针 ➔ 上一个
          onHardwareTriggerRef.current?.('ENC_LEFT', 'EasyInput 旋钮 (左旋)');
        }
        wheelAccumulator = 0;
        lastWheelTime = now;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, []);

  // 全局防止鼠标点击后按钮常驻焦点导致 Enter 误触
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const btn = e.target.closest('button');
      if (btn) {
        setTimeout(() => {
          if (document.activeElement?.tagName === 'BUTTON') {
            document.activeElement.blur();
          }
        }, 30);
      }
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  // Serial Port Connection Toggle
  const toggleConnectSerial = async (forcePrompt = false) => {
    if (serialConnected && !forcePrompt) {
      await closeSerialConnection((status) => {
        setSerialConnected(status);
        showToast('已断开 COM3 串口');
      });
    } else {
      try {
        await openSerialConnection(
          (token, source) => onHardwareTriggerRef.current?.(token, source),
          (logLine) => {
            setSerialLogs(prev => [logLine, ...prev].slice(0, 50));
            setLiveSignal(logLine);
          },
          (status) => {
            setSerialConnected(status);
            if (status) showToastRef.current?.('已成功连接 COM3 串口 (115200 波特率)！');
          },
          forcePrompt
        );
      } catch (err) {
        const msg = String(err?.message || '');
        if (/failed to open|access|denied|busy|in use|resource/i.test(msg)) {
          showToast('COM3 访问被拒绝：端口可能被占用或 Windows 驱动句柄未释放。请拔插一次 USB 数据线释放锁后重试！', 7000);
        } else if (err.name === 'NotFoundError') {
          showToast('未选择串口设备', 2500);
        } else {
          showToast(`串口连接提示: ${msg || '连接未完成'}`, 5000);
        }
      }
    }
  };

  // Upload and Parse PDF Files (Duplicate Check & Storage)
  const handleUploadFiles = async (files) => {
    for (const file of files) {
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        showToast('请上传标准的 PDF 格式文件');
        continue;
      }

      // Check duplicate
      const isDuplicate = documents.some(
        d => d.fileName === file.name && d.fileSizeBytes === file.size
      );

      if (isDuplicate) {
        showToast(`⚠️ 该文件《${file.name}》已存在于星轨中，请勿重复上传！`, 3500);
        continue;
      }

      showToast(`正在解析并保存《${file.name}》至本地...`);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target.result;
        try {
          const pdf = await loadPdfDocument(arrayBuffer);
          const coverThumbnail = await generateCoverThumbnail(pdf);

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

          // Save to IndexedDB
          await saveDocToIndexedDB(docRecord);

          setDocuments(prev => [...prev, docRecord]);
          if (viewRef.current === 'workspace') {
            setCurrentDoc(docRecord);
            setCurrentPage(1);
          }
          showToast(`✨ 《${file.name}》已永久存入本地星轨，刷新不丢失！`);
        } catch (err) {
          console.error('PDF parse failed', err);
          showToast(`PDF 解析失败: ${err.message || '格式不支持或文件损坏'}`);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  // Delete Document
  const handleDeleteDoc = async (docId, fileName) => {
    if (window.confirm(`确定要从本地星轨中移除《${fileName}》吗？`)) {
      await removeDocFromIndexedDB(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (currentDoc && currentDoc.id === docId) {
        setView('universe');
        setCurrentDoc(null);
      }
      showToast('已从本地星轨中删除文献');
    }
  };

  // Open Document in Workspace
  const handleOpenDoc = (doc) => {
    setCurrentDoc(doc);
    setCurrentPage(1);
    setView('workspace');
    showToast(`已开启精读：《${doc.fileName}》`);
  };

  // Start reading with prompt
  const handleStartReadingWithPrompt = (doc, prompt) => {
    handleOpenDoc(doc);
    if (prompt && prompt.trim()) {
      setActiveAiTab('chat');
    }
  };

  // Update hardware mapping action
  const handleUpdateHardwareAction = (token, actionKey) => {
    const updated = {
      ...hardwareMap,
      [token]: {
        ...hardwareMap[token],
        action: actionKey
      }
    };
    setHardwareMap(updated);
    saveStoredHardwareMap(updated);
    const act = EASYINPUT_ACTIONS[actionKey];
    showToast(`${hardwareMap[token].label} 动作已更新为：${act ? act.name : actionKey}`);
  };

  // Reset default keybindings
  const handleResetDefaults = () => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_HARDWARE_MAP));
    setHardwareMap(defaults);
    saveStoredHardwareMap(defaults);
    showToast('已恢复 EasyInput 默认推荐键位');
  };

  return (
    <div className="relative w-full h-full flex flex-col z-10 overflow-hidden font-sans select-none">
      {/* VIEW 1: Universe View */}
      {view === 'universe' && (
        <UniverseView
          documents={documents}
          selectedDocIndex={selectedDocIndex}
          onSelectDocIndex={setSelectedDocIndex}
          onOpenDoc={handleOpenDoc}
          onDeleteDoc={handleDeleteDoc}
          onUploadFiles={handleUploadFiles}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          deepMode={deepMode}
          onToggleDeepMode={() => {
            setDeepMode(prev => {
              showToast(!prev ? '已开启深度精读模式' : '已切换为速读模式');
              return !prev;
            });
          }}
          showToast={showToast}
          onStartReadingWithPrompt={handleStartReadingWithPrompt}
        />
      )}

      {/* VIEW 2: Workspace View */}
      {view === 'workspace' && currentDoc && (
        <WorkspaceView
          currentDoc={currentDoc}
          onBackToUniverse={() => setView('universe')}
          onOpenKeySettings={() => setIsKeyModalOpen(true)}
          onUploadOtherPdf={handleUploadFiles}
          showToast={showToast}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          pdfScale={pdfScale}
          setPdfScale={setPdfScale}
          highlightActive={highlightActive}
          setHighlightActive={setHighlightActive}
          activeAiTab={activeAiTab}
          setActiveAiTab={setActiveAiTab}
          notes={notes}
          setNotes={setNotes}
        />
      )}

      {/* Floating Status Capsule */}
      <FloatingCapsule
        serialConnected={serialConnected}
        hardwareMap={hardwareMap}
        onOpenModal={() => setIsKeyModalOpen(true)}
      />

      {/* EasyInput Hardware HUD */}
      <HudNotification message={hudMessage} visible={hudVisible} />

      {/* Toast Notification */}
      <ToastNotification toast={toast} />

      {/* EasyInput Modal */}
      <KeySettingsModal
        isOpen={isKeyModalOpen}
        onClose={() => {
          setRecordingToken(null);
          setIsKeyModalOpen(false);
        }}
        hardwareMap={hardwareMap}
        onUpdateHardwareAction={handleUpdateHardwareAction}
        onResetDefaults={handleResetDefaults}
        serialConnected={serialConnected}
        onToggleConnectSerial={() => toggleConnectSerial(false)}
        onForceSelectPort={() => toggleConnectSerial(true)}
        serialLogs={serialLogs}
        activeHighlightToken={activeHighlightToken}
        liveSignal={liveSignal}
        recordingToken={recordingToken}
        onStartRecording={(token) => {
          setRecordingToken(token);
          showToast('请在 EasyInput 上按下或在键盘上敲击目标键...');
        }}
        showToast={showToast}
      />

      {/* S1 Triggered PDF Upload Modal */}
      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFiles={handleUploadFiles}
        triggerKeyLabel={uploadTriggerKey}
      />
    </div>
  );
}
