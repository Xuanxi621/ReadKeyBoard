import { useState, useEffect, useRef, useCallback } from 'react';
import { createModifierTapTracker, isModifierKey } from '../services/modifierTap.js';
import { VOICE_INPUT_EVENT } from '../services/voiceInput.js';
import {
  EASYINPUT_ACTIONS,
  DEFAULT_HARDWARE_MAP,
  loadStoredHardwareMap,
  saveStoredHardwareMap,
  normalizeToken,
  resolveHardwareToken
} from '../services/hardwareConfig.js';
import {
  openSerialConnection,
  closeSerialConnection,
  tryAutoConnectSerial
} from '../services/serialService.js';
import {
  openHidConnection,
  closeHidConnection,
  tryAutoConnectHid
} from '../services/hidService.js';

export function useHardwareController({
  handleDeleteDoc,
  viewRef,
  setView,
  documentsRef,
  selectedDocIndexRef,
  setSelectedDocIndex,
  currentDocRef,
  setCurrentDoc,
  setCurrentPage,
  setPdfScale,
  setDeepMode,
  setActiveAiTab,
  setHighlightActive,
  isUploadModalOpenRef,
  setIsUploadModalOpen,
  setUploadTriggerKey,
  isKeyModalOpenRef,
  setIsKeyModalOpen,
  showToast,
  showHud
}) {
  const [hardwareMap, setHardwareMap] = useState(() => loadStoredHardwareMap());
  const [recordingToken, setRecordingToken] = useState(null);
  const [serialConnected, setSerialConnected] = useState(false);
  const [isDeviceConnected, setIsDeviceConnected] = useState(false);
  const [serialLogs, setSerialLogs] = useState([]);
  const [activeHighlightToken, setActiveHighlightToken] = useState(null);
  const [liveSignal, setLiveSignal] = useState('无输入');

  const hardwareMapRef = useRef(hardwareMap);
  const lastTokenTriggerTimeRef = useRef({});
  const lastAnyTriggerTimeRef = useRef(0);

  useEffect(() => { hardwareMapRef.current = hardwareMap; }, [hardwareMap]);

  // Execute Action triggered by hardware
  const executeAction = useCallback((actionName, sourceLabel = 'EasyInput') => {
    const actionInfo = EASYINPUT_ACTIONS[actionName];
    const actNameText = actionInfo ? actionInfo.name : actionName;
    showHud(`${sourceLabel} ➔ ${actNameText}`);

    // Modal is open ➔ close it and return home or enter reading
    if (isKeyModalOpenRef.current) {
      if (actionName === 'toggleView' || actionName === 'returnHome') {
        setIsKeyModalOpen(false);
        isKeyModalOpenRef.current = false;
        setView('universe');
        showToast('EasyInput S5 ➔ 关闭设置并返回星轨主页');
        return;
      }
      if (actionName === 'enterReading') {
        setIsKeyModalOpen(false);
        isKeyModalOpenRef.current = false;
      } else if (actionName === 'importPdf') {
        setIsKeyModalOpen(false);
        isKeyModalOpenRef.current = false;
      } else if (actionName === 'nextPage' || actionName === 'prevPage') {
        return;
      }
    }

    switch (actionName) {
      case 'voiceInput':
        setIsKeyModalOpen(false);
        isKeyModalOpenRef.current = false;
        if (isUploadModalOpenRef.current) {
          showToast('请先完成或关闭文件上传，再使用语音输入');
          break;
        }
        window.dispatchEvent(new Event(VOICE_INPUT_EVENT));
        break;
      case 'deleteDoc': {
        const targetDoc = viewRef.current === 'workspace'
          ? currentDocRef.current
          : documentsRef.current[selectedDocIndexRef.current] || documentsRef.current[0];
        if (!targetDoc) {
          showToast('当前没有可删除的文档');
          break;
        }
        handleDeleteDoc(targetDoc.id, targetDoc.fileName).catch(() => {
          showToast('删除失败，请重试');
        });
        break;
      }
      case 'returnHome':
        if (isUploadModalOpenRef.current) {
          setIsUploadModalOpen(false);
          isUploadModalOpenRef.current = false;
          showToast('EasyInput S5 ➔ 已关闭上传弹窗并返回星轨主页');
          return;
        }
        if (isKeyModalOpenRef.current) {
          setIsKeyModalOpen(false);
          isKeyModalOpenRef.current = false;
          showToast('EasyInput S5 ➔ 已关闭按键设置并返回星轨主页');
          return;
        }
        if (viewRef.current === 'workspace') {
          setView('universe');
          showToast('EasyInput S5 ➔ 已返回星轨主页');
        } else {
          if (documentsRef.current.length > 0) {
            const targetDoc = documentsRef.current[selectedDocIndexRef.current] || documentsRef.current[0];
            setCurrentDoc(targetDoc);
            setCurrentPage(1);
            setView('workspace');
            showToast(`EasyInput S5 ➔ 已切换至文献阅读：《${targetDoc.fileName}》`);
          } else {
            showToast('EasyInput S5 ➔ 当前暂无文档，请先上传 PDF');
          }
        }
        break;

      case 'enterReading':
        if (isUploadModalOpenRef.current) {
          setIsUploadModalOpen(false);
          isUploadModalOpenRef.current = false;
        }
        if (isKeyModalOpenRef.current) {
          setIsKeyModalOpen(false);
          isKeyModalOpenRef.current = false;
        }
        if (viewRef.current === 'universe') {
          if (documentsRef.current.length > 0) {
            const targetDoc = documentsRef.current[selectedDocIndexRef.current] || documentsRef.current[0];
            setCurrentDoc(targetDoc);
            setCurrentPage(1);
            setView('workspace');
            showToast(`${sourceLabel} ➔ 已进入阅读模式：《${targetDoc.fileName}》`);
          } else {
            setIsUploadModalOpen(true);
            isUploadModalOpenRef.current = true;
            showToast('当前暂无文档，已为你打开上传窗口，请选择 PDF 文档！');
          }
        } else {
          if (sourceLabel?.includes('旋钮') || sourceLabel?.includes('ENC') || sourceLabel?.includes('Escape') || sourceLabel?.includes('下按')) {
            setView('universe');
            showToast('EasyInput 旋钮下按 ➔ 已返回星轨主页');
          } else {
            setCurrentPage(prev => {
              const maxP = currentDocRef.current ? currentDocRef.current.pages : 1;
              const next = prev < maxP ? prev + 1 : prev;
              showToast(`EasyInput S2 ➔ 下一页 (${next}/${maxP})`);
              return next;
            });
          }
        }
        break;

      case 'nextPage':
        if (viewRef.current === 'workspace') {
          setCurrentPage(prev => {
            const maxP = currentDocRef.current ? currentDocRef.current.pages : 1;
            const next = prev < maxP ? prev + 1 : prev;
            showToast(`EasyInput ➔ 下一页 (${next}/${maxP})`);
            return next;
          });
        } else {
          const isRotation = sourceLabel?.includes('旋转') || sourceLabel?.includes('顺时针') || sourceLabel?.includes('CW') || sourceLabel?.includes('右旋');
          if (!isRotation) {
            // S2 按键或回车触发 ➔ 直接进入阅读选中文档
            if (documentsRef.current.length > 0) {
              const targetDoc = documentsRef.current[selectedDocIndexRef.current] || documentsRef.current[0];
              setCurrentDoc(targetDoc);
              setCurrentPage(1);
              setView('workspace');
              showToast(`${sourceLabel} ➔ 已进入阅读模式：《${targetDoc.fileName}》`);
            } else {
              showToast('EasyInput ➔ 当前暂无文档，请按 S1 上传本地 PDF');
            }
          } else {
            // 旋钮物理右旋 ➔ 轮换选中下一个文档
            if (documentsRef.current.length > 0) {
              const total = documentsRef.current.length;
              const nextIdx = (selectedDocIndexRef.current + 1) % total;
              setSelectedDocIndex(nextIdx);
              const doc = documentsRef.current[nextIdx];
              showToast(`EasyInput 旋钮 ➔ 选中《${doc.fileName}》(${nextIdx + 1}/${total})`);
            } else {
              showToast('EasyInput ➔ 当前已在星轨主页，暂无可翻页文档');
            }
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
          if (documentsRef.current.length > 0) {
            const total = documentsRef.current.length;
            const prevIdx = (selectedDocIndexRef.current - 1 + total) % total;
            setSelectedDocIndex(prevIdx);
            const doc = documentsRef.current[prevIdx];
            showToast(`EasyInput 旋钮 ➔ 选中《${doc.fileName}》(${prevIdx + 1}/${total})`);
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
          showToast('EasyInput ➔ AI 核心要点提炼');
        } else {
          showToast('EasyInput ➔ AI 核心要点（进入文献精读后即可实时查看）');
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
        if (isKeyModalOpenRef.current) {
          setIsKeyModalOpen(false);
          isKeyModalOpenRef.current = false;
          showToast('EasyInput ➔ 关闭按键设置并返回星轨主页');
          return;
        }
        if (viewRef.current === 'universe') {
          if (documentsRef.current.length > 0) {
            const targetDoc = documentsRef.current[selectedDocIndexRef.current] || documentsRef.current[0];
            setCurrentDoc(targetDoc);
            setCurrentPage(1);
            setView('workspace');
            showToast(`EasyInput ➔ 已进入阅读模式：《${targetDoc.fileName}》`);
          } else {
            showToast('EasyInput ➔ 当前暂无文档，请按 S1 上传本地 PDF');
          }
        } else {
          setView('universe');
          showToast('EasyInput ➔ 已返回星轨主页');
        }
        break;

      case 'importPdf': {
        const keyLabel = sourceLabel ? sourceLabel.split(' ')[0] : 'S1';
        setUploadTriggerKey(keyLabel);
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
  }, [
    handleDeleteDoc,
    showHud,
    showToast,
    viewRef,
    setView,
    documentsRef,
    selectedDocIndexRef,
    setSelectedDocIndex,
    currentDocRef,
    setCurrentDoc,
    setCurrentPage,
    setPdfScale,
    setDeepMode,
    setActiveAiTab,
    setHighlightActive,
    isUploadModalOpenRef,
    setIsUploadModalOpen,
    setUploadTriggerKey,
    isKeyModalOpenRef,
    setIsKeyModalOpen
  ]);

  // Hardware Trigger Handler (Strict debounce & cross-channel protection)
  const onHardwareTrigger = useCallback((rawToken, transportSource = 'COM3 串口') => {
    const currentMap = hardwareMapRef.current;
    let token = resolveHardwareToken(rawToken, currentMap);
    if (!token) return;

    const now = Date.now();
    const isEncoder = token.startsWith('ENC');
    const perKeyDebounceMs = isEncoder ? 70 : 120;
    const crossKeyDebounceMs = isEncoder ? 30 : 40;

    if (lastTokenTriggerTimeRef.current[token] && now - lastTokenTriggerTimeRef.current[token] < perKeyDebounceMs) {
      return;
    }
    if (now - lastAnyTriggerTimeRef.current < crossKeyDebounceMs) {
      return;
    }

    lastTokenTriggerTimeRef.current[token] = now;
    lastAnyTriggerTimeRef.current = now;

    if (document.activeElement && document.activeElement.blur && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      document.activeElement.blur();
    }

    let mapping = currentMap[token];
    if (!mapping) {
      for (const [k, v] of Object.entries(currentMap)) {
        if (v.fallbackKey && (v.fallbackKey === rawToken || v.fallbackKey === token)) {
          mapping = v;
          token = k;
          break;
        }
      }
    }
    const label = mapping ? mapping.label : (token || rawToken);
    const actionName = mapping ? mapping.action : null;

    setLiveSignal(`${label} (${transportSource})`);
    setSerialLogs(prev => [`[动作] ${token} → ${actionName || '未配置动作'} (${transportSource})`, ...prev].slice(0, 50));
    if (token) {
      setActiveHighlightToken(token);
      setTimeout(() => setActiveHighlightToken(null), 300);
    }

    if (recordingToken) {
      // Preserve the actual wire signal, not the alias of its previous mapping.
      const standardKey = normalizeToken(rawToken);
      const updated = {
        ...currentMap,
        [recordingToken]: {
          ...currentMap[recordingToken],
          fallbackKey: standardKey
        }
      };
      hardwareMapRef.current = updated;
      setHardwareMap(updated);
      saveStoredHardwareMap(updated);
      showToast(`已将 ${currentMap[recordingToken].label} 绑定至硬件按键: ${label} (${standardKey})`);
      setRecordingToken(null);
      return;
    }

    if (actionName) {
      executeAction(actionName, label);
    }
  }, [recordingToken, executeAction, showToast]);

  const onHardwareTriggerRef = useRef(onHardwareTrigger);
  useEffect(() => { onHardwareTriggerRef.current = onHardwareTrigger; }, [onHardwareTrigger]);

  const showToastRef = useRef(showToast);
  useEffect(() => { showToastRef.current = showToast; }, [showToast]);

  // 自动检测并重连硬件 (优先 WebHID，兼容 Web Serial)
  useEffect(() => {
    tryAutoConnectHid(
      (token, source) => onHardwareTriggerRef.current?.(token, source),
      (logLine) => setSerialLogs(prev => [logLine, ...prev].slice(0, 50)),
      (status) => {
        setIsDeviceConnected(status);
        if (status) showToastRef.current?.('已自动连接 EasyInput AI (WebHID)！');
      }
    );
    tryAutoConnectSerial(
      (token, source) => onHardwareTriggerRef.current?.(token, source),
      (logLine) => setSerialLogs(prev => [logLine, ...prev].slice(0, 50)),
      (status) => {
        setSerialConnected(status);
        if (status) showToastRef.current?.('已自动连接 EasyInput 串口！');
      }
    );
  }, []);

  // Global Keyboard shortcuts & EasyInput HID decoding
  // Capture only in the settings panel, which has no text-entry fields.
  // This also records keys that never reach the shortcut handler.
  useEffect(() => {
    const inspectKey = (e) => {
      if (!isKeyModalOpenRef.current) return;
      const modifiers = [e.ctrlKey && 'Ctrl', e.altKey && 'Alt', e.shiftKey && 'Shift', e.metaKey && 'Meta'].filter(Boolean);
      const key = e.key === ' ' ? 'Space' : e.key;
      const signal = `${[...modifiers, key].join('+')} [${e.code || '无 code'}]`;
      const phase = e.type === 'keyup' ? '松开' : '按下';
      setLiveSignal(`键盘${phase}：${signal}`);
      setSerialLogs(prev => [`[键盘${phase}] ${signal} · 焦点=${e.target?.tagName || '未知'}`, ...prev].slice(0, 50));
    };
    window.addEventListener('keydown', inspectKey, true);
    window.addEventListener('keyup', inspectKey, true);
    return () => {
      window.removeEventListener('keydown', inspectKey, true);
      window.removeEventListener('keyup', inspectKey, true);
    };
  }, [isKeyModalOpenRef]);

  useEffect(() => {
    // 键位格式化工具函数
    const formatKeyString = (e) => {
      const parts = [];
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');
      if (e.metaKey) parts.push('Win');

      let keyName = e.key;
      if (keyName === ' ') keyName = 'Space';
      else if (keyName.length === 1) keyName = keyName.toUpperCase();

      if (!parts.includes(keyName)) {
        parts.push(keyName);
      }
      return parts.join('+');
    };

    const modifierTaps = createModifierTapTracker();
    const handleKeyUp = (e) => {
      const code = modifierTaps.keyup(e);
      if (!code) return;
      if (recordingToken) {
        e.preventDefault();
        const updated = {
          ...hardwareMap,
          [recordingToken]: { ...hardwareMap[recordingToken], fallbackKey: code }
        };
        hardwareMapRef.current = updated;
        setHardwareMap(updated);
        saveStoredHardwareMap(updated);
        setLiveSignal(`已录制 ${code}`);
        showToast(`已重设 ${hardwareMap[recordingToken].label} 快捷键为: ${code}（松开触发）`);
        setRecordingToken(null);
        return;
      }
      const activeEl = document.activeElement;
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeEl?.tagName) || activeEl?.isContentEditable) return;
      const binding = Object.entries(hardwareMap).find(([, mapping]) => mapping.fallbackKey === code);
      // Some device configurations send Left Win for S2 instead of Return.
      const token = binding?.[0] || (code === 'MetaLeft' ? 'KEY2' : null);
      if (token) {
        e.preventDefault();
        onHardwareTrigger(token, `独立修饰键 ${code}`);
      }
    };

    const handleKeyDown = (e) => {
      modifierTaps.keydown(e);
      const activeEl = document.activeElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(activeEl?.tagName);
      const isSelect = activeEl?.tagName === 'SELECT';

      // ─── 改键录制模式 ───
      if (recordingToken) {
        // Escape 取消改键（除非改的就是 ENC_PRESS）
        if (e.key === 'Escape' && !e.ctrlKey && !e.altKey && !e.shiftKey && recordingToken !== 'ENC_PRESS') {
          e.preventDefault();
          setRecordingToken(null);
          showToast('已取消改键');
          return;
        }

        // 如果按下的是 Windows 键 (MetaLeft / MetaRight)，在 Windows 下 keyup 常被系统拦截，在 keydown 立即完成录制
        if (e.key === 'Meta' || e.code === 'MetaLeft' || e.code === 'MetaRight') {
          e.preventDefault();
          e.stopPropagation();
          const targetCode = e.code || 'MetaLeft';
          const updated = {
            ...hardwareMap,
            [recordingToken]: {
              ...hardwareMap[recordingToken],
              fallbackKey: targetCode
            }
          };
          hardwareMapRef.current = updated;
          setHardwareMap(updated);
          saveStoredHardwareMap(updated);
          showToast(`已重设 ${hardwareMap[recordingToken].label} 快捷键为: ${targetCode}`);
          setRecordingToken(null);
          return;
        }

        // 纯修饰键按下 (Ctrl / Alt / Shift)，等待组合键完成
        if (isModifierKey(e)) {
          e.preventDefault();
          return;
        }
        e.preventDefault();
        e.stopPropagation();
        const formattedKey = formatKeyString(e);
        const updated = {
          ...hardwareMap,
          [recordingToken]: {
            ...hardwareMap[recordingToken],
            fallbackKey: formattedKey
          }
        };
        hardwareMapRef.current = updated;
        setHardwareMap(updated);
        saveStoredHardwareMap(updated);
        showToast(`已重设 ${hardwareMap[recordingToken].label} 快捷键为: ${formattedKey}`);
        setRecordingToken(null);
        return;
      }

      // 独立 Meta 键 (Win键 / S2) 响应：Windows 系统下 keyup 会被系统吞掉，在 keydown 立即响应并拦截系统菜单
      if (e.code === 'MetaLeft' || e.code === 'MetaRight' || (e.key === 'Meta' && !e.ctrlKey && !e.altKey && !e.shiftKey)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat) return;
        const binding = Object.entries(hardwareMap).find(([, mapping]) => mapping.fallbackKey === e.code);
        const token = binding?.[0] || 'KEY2';
        onHardwareTrigger(token, `按键 (${e.code || 'Meta'})`);
        return;
      }

      // Bound modifier keys (Ctrl/Shift/Alt) are dispatched only on a standalone release.
      if (isModifierKey(e) && Object.values(hardwareMap).some(mapping => mapping.fallbackKey === e.code)) {
        e.preventDefault();
        return;
      }

      // ─── 弹窗打开时的 Escape 快捷关闭 ───
      if (e.key === 'Escape' && (isKeyModalOpenRef.current || isUploadModalOpenRef.current)) {
        e.preventDefault();
        if (isUploadModalOpenRef.current) {
          setIsUploadModalOpen(false);
          isUploadModalOpenRef.current = false;
          showToast('已关闭上传弹窗');
        }
        if (isKeyModalOpenRef.current) {
          setIsKeyModalOpen(false);
          isKeyModalOpenRef.current = false;
          showToast('已关闭按键设置');
        }
        return;
      }

      // Keep text entry and component-owned Enter actions out of document deletion.
      if (e.defaultPrevented) return;
      if (isInput || isSelect || activeEl?.isContentEditable) {
        if (isKeyModalOpenRef.current) {
          setSerialLogs(prev => [`[未执行] 焦点在 ${activeEl.tagName}，保留控件原生操作；点击面板空白处后再按键`, ...prev].slice(0, 50));
        }
        return;
      }

      // ─── 物理硬件 EasyInput HID 信号与键盘快捷键精准匹配 ───
      // 用户录制的键位优先于内置别名；默认键位仍由下面的兼容逻辑处理。
      const formattedKey = formatKeyString(e).toUpperCase();
      const customBinding = Object.entries(hardwareMap).find(([token, mapping]) =>
        mapping.fallbackKey &&
        mapping.fallbackKey !== DEFAULT_HARDWARE_MAP[token]?.fallbackKey &&
        mapping.fallbackKey.toUpperCase() === formattedKey
      );
      if (customBinding) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat && ['deleteDoc', 'voiceInput'].includes(customBinding[1].action)) return;
        onHardwareTrigger(customBinding[0], '自定义快捷键');
        return;
      }
      let matchedToken = null;
      let matchedLabel = null;

      // 1. S2: 用户配置动作 (Enter / 2 / NumpadEnter)
      if (e.key === 'Enter' || e.code === 'Enter' || e.code === 'NumpadEnter' || (!e.ctrlKey && !e.metaKey && e.key === '2')) {
        matchedToken = 'KEY2';
        matchedLabel = 'S2';
      }
      // 2. S7: 上一页 (Ctrl+V / PageUp / 7)
      else if (((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) || e.key === 'PageUp' || (!e.ctrlKey && !e.metaKey && e.key === '7')) {
        matchedToken = 'KEY7';
        matchedLabel = 'S7 (上一页)';
      }
      // 3. S5: 返回主页 (Ctrl+A / Space / 5 / Home)
      else if (((e.ctrlKey || e.metaKey) && (e.key === 'a' || e.key === 'A')) || (!e.ctrlKey && !e.metaKey && (e.key === ' ' || e.code === 'Space' || e.key === '5' || e.key === 'Home'))) {
        matchedToken = 'KEY5';
        matchedLabel = 'S5 (返回主页)';
      }
      // 4. 旋钮下按 (ENC_PRESS): (Escape / MediaPlayPause / 9 / e)
      else if (e.key === 'Escape' || e.code === 'Escape' || e.key === 'MediaPlayPause' || (!e.ctrlKey && !e.metaKey && (e.key === '9' || e.key === 'e' || e.key === 'E'))) {
        matchedToken = 'ENC_PRESS';
        matchedLabel = '旋钮下按';
      }
      // 5. S1: 上传 PDF (MetaRight / Ctrl+Shift+Space / u / 1)
      else if (e.code === 'MetaRight' || (e.ctrlKey && e.shiftKey && (e.code === 'Space' || e.key === ' ')) || (!e.ctrlKey && !e.metaKey && (e.key === 'u' || e.key === 'U' || e.key === '1'))) {
        matchedToken = 'KEY1';
        matchedLabel = 'S1 (上传)';
      }
      // 6. S3: 放大 (AltRight / Ctrl+Shift+E / = / + / 3)
      else if (e.code === 'AltRight' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'e' || e.key === 'E')) || (!e.ctrlKey && !e.metaKey && (e.key === '=' || e.key === '+' || e.key === '3'))) {
        matchedToken = 'KEY3';
        matchedLabel = 'S3 (放大)';
      }
      // 7. S4: 缩小 (Backspace / - / _ / 4)
      else if (e.key === 'Backspace' || (!e.ctrlKey && !e.metaKey && (e.key === '-' || e.key === '_' || e.key === '4'))) {
        matchedToken = 'KEY4';
        matchedLabel = 'S4 (缩小)';
      }
      // 8. S6: 深度精读 (Ctrl+C / d / 6)
      else if (((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C')) || (!e.ctrlKey && !e.metaKey && (e.key === 'd' || e.key === 'D' || e.key === '6'))) {
        matchedToken = 'KEY6';
        matchedLabel = 'S6 (深度精读)';
      }
      // 9. S8: 重置缩放 (Ctrl+Z / Ctrl+Tab / 0 / 8)
      else if (((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) || (e.ctrlKey && e.key === 'Tab') || (!e.ctrlKey && !e.metaKey && (e.key === '0' || e.key === '8'))) {
        matchedToken = 'KEY8';
        matchedLabel = 'S8 (重置缩放)';
      }
      // 10. 方向键：翻页 (ArrowRight / ArrowLeft / PageDown)
      else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
        matchedToken = 'ENC_RIGHT';
        matchedLabel = '旋钮顺时针';
      }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        matchedToken = 'ENC_LEFT';
        matchedLabel = '旋钮逆时针';
      }
      // 11. Tab：切换选中文档
      else if (e.key === 'Tab' && viewRef.current === 'universe') {
        e.preventDefault();
        e.stopPropagation();
        if (e.shiftKey) {
          onHardwareTrigger('ENC_LEFT', 'Tab 逆时针');
        } else {
          onHardwareTrigger('ENC_RIGHT', 'Tab 顺时针');
        }
        return;
      }

      if (matchedToken) {
        e.preventDefault();
        e.stopPropagation();
        if (e.repeat && ['deleteDoc', 'voiceInput'].includes(hardwareMap[matchedToken]?.action)) return;
        if (activeEl && activeEl.blur) activeEl.blur();
        onHardwareTrigger(matchedToken, matchedLabel || hardwareMap[matchedToken]?.label);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', modifierTaps.reset);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', modifierTaps.reset);
    };
  }, [
    recordingToken,
    hardwareMap,
    onHardwareTrigger,
    showToast,
    viewRef,
    setView,
    documentsRef,
    selectedDocIndexRef,
    setCurrentDoc,
    setCurrentPage,
    isKeyModalOpenRef,
    setIsKeyModalOpen,
    isUploadModalOpenRef,
    setIsUploadModalOpen
  ]);

  // Wheel decoding
  useEffect(() => {
    let wheelAccumulator = 0;
    let lastWheelTime = 0;

    const handleWheel = (e) => {
      if (isKeyModalOpenRef.current || isUploadModalOpenRef.current) return;
      const activeEl = document.activeElement;
      if (['INPUT', 'TEXTAREA'].includes(activeEl?.tagName)) return;

      e.preventDefault();
      const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
      wheelAccumulator += delta;

      const now = Date.now();
      if (Math.abs(wheelAccumulator) >= 25 && (now - lastWheelTime > 80)) {
        if (wheelAccumulator > 0) {
          onHardwareTriggerRef.current?.('ENC_RIGHT', 'EasyInput 旋钮 (右旋)');
        } else {
          onHardwareTriggerRef.current?.('ENC_LEFT', 'EasyInput 旋钮 (左旋)');
        }
        wheelAccumulator = 0;
        lastWheelTime = now;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [isKeyModalOpenRef, isUploadModalOpenRef]);

  // One physical middle click produces pointerdown, mousedown and auxclick.
  // Dispatch only mousedown so release cannot immediately reverse the action.
  useEffect(() => {
    const handleMiddleClick = (e) => {
      if (e.button === 1) {
        e.preventDefault();
        e.stopPropagation();
        onHardwareTriggerRef.current?.('ENC_PRESS', 'EasyInput 旋钮下按 (HID 中键)');
      }
    };

    const preventMiddleDefault = e => {
      if (e.button === 1) e.preventDefault();
    };
    window.addEventListener('auxclick', preventMiddleDefault);
    window.addEventListener('mousedown', handleMiddleClick);
    return () => {
      window.removeEventListener('auxclick', preventMiddleDefault);
      window.removeEventListener('mousedown', handleMiddleClick);
    };
  }, [documentsRef, selectedDocIndexRef, setCurrentDoc, setCurrentPage, setView, showToast, viewRef]);

  // Hardware Connect Toggle (智能双模：优先 WebHID，兼容 Web Serial 串口)
  const toggleConnectSerial = useCallback(async (forcePrompt = false) => {
    const isConn = serialConnected || isDeviceConnected;
    if (isConn && !forcePrompt) {
      if (serialConnected) {
        await closeSerialConnection((status) => setSerialConnected(status));
      }
      if (isDeviceConnected) {
        await closeHidConnection((status) => setIsDeviceConnected(status));
      }
      showToast('已断开 EasyInput 设备');
      return;
    }

    // 1. 优先调起 WebHID 授权（匹配 EasyInput V2 原厂 USB 硬件）
    let hidSuccess = false;
    try {
      hidSuccess = await openHidConnection(
        (token, source) => onHardwareTriggerRef.current?.(token, source),
        (logLine) => {
          setSerialLogs(prev => [logLine, ...prev].slice(0, 50));
          setLiveSignal(logLine);
        },
        (status) => {
          setIsDeviceConnected(status);
          if (status) showToastRef.current?.('已成功连接 EasyInput AI (WebHID 原生通道)！');
        }
      );
    } catch (hidErr) {
      console.warn('WebHID 尝试未就绪:', hidErr);
    }

    if (hidSuccess) return;

    // 2. 备用尝试 Web Serial 串口
    try {
      await openSerialConnection(
        (token, source) => onHardwareTriggerRef.current?.(token, source),
        (logLine) => {
          setSerialLogs(prev => [logLine, ...prev].slice(0, 50));
          setLiveSignal(logLine);
        },
        (status) => {
          setSerialConnected(status);
          if (status) showToastRef.current?.('已成功连接 EasyInput 串口！');
        },
        forcePrompt
      );
    } catch (err) {
      const msg = String(err?.message || '');
      if (err.name === 'NotFoundError') {
        showToast('未选择设备');
      } else {
        showToast(`设备连接提示: ${msg || '连接未完成'}`, 5000);
      }
    }
  }, [serialConnected, isDeviceConnected, showToast]);

  const handleUpdateHardwareAction = useCallback((token, actionKey) => {
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
  }, [hardwareMap, showToast]);

  const handleResetDefaults = useCallback(() => {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_HARDWARE_MAP));
    setHardwareMap(defaults);
    saveStoredHardwareMap(defaults);
    showToast('已恢复为默认按键设置');
  }, [showToast]);

  const handleSaveAsDefault = useCallback(() => {
    saveStoredHardwareMap(hardwareMap);
    try {
      localStorage.setItem('orbit_easyinput_user_defaults', JSON.stringify(hardwareMap));
    } catch (e) {}
    showToast('已将当前配置设为默认设置');
  }, [hardwareMap, showToast]);

  const handleResetSingleKey = useCallback((token) => {
    if (!DEFAULT_HARDWARE_MAP[token]) return;
    const def = DEFAULT_HARDWARE_MAP[token];
    const updated = {
      ...hardwareMap,
      [token]: { ...def }
    };
    setHardwareMap(updated);
    saveStoredHardwareMap(updated);
    showToast(`已恢复 ${def.label} 为默认设置`);
  }, [hardwareMap, showToast]);

  return {
    hardwareMap,
    setHardwareMap,
    recordingToken,
    setRecordingToken,
    serialConnected,
    isDeviceConnected,
    serialLogs,
    activeHighlightToken,
    liveSignal,
    onHardwareTrigger,
    toggleConnectSerial,
    handleUpdateHardwareAction,
    handleResetDefaults,
    handleSaveAsDefault,
    handleResetSingleKey
  };
}
