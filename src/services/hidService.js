// WebHID Driver for EasyInput AI (VID: 0x303A, PID: 0x1006)

let hidDevice = null;
let hidConnected = false;
let openDevices = [];
const boundListeners = new Map();

function removeAllInputListeners() {
  for (const [dev, handler] of boundListeners.entries()) {
    try {
      dev.removeEventListener('inputreport', handler);
    } catch (e) {}
  }
  boundListeners.clear();
}

function removeInputListener(device) {
  if (device && boundListeners.has(device)) {
    try {
      device.removeEventListener('inputreport', boundListeners.get(device));
    } catch (e) {}
    boundListeners.delete(device);
  }
}

export async function openHidConnection(onTokenReceived, onLogReceived, onStatusChanged) {
  if (!('hid' in navigator)) {
    throw new Error('当前浏览器不支持 WebHID API，请使用 Chrome 或 Edge 浏览器！');
  }

  // 关闭旧连接
  await closeHidConnection();

  // 1. 获取已授权设备
  const existingDevices = await navigator.hid.getDevices();
  let matchedList = existingDevices.filter(d => d.vendorId === 0x303a);

  // 2. 若无历史设备，弹窗供用户选择
  if (matchedList.length === 0) {
    const selected = await navigator.hid.requestDevice({
      filters: [{ vendorId: 0x303a }]
    });
    if (!selected || selected.length === 0) return false;
    matchedList = selected;
  }

  if (matchedList.length === 0) return false;

  // 寻找拥有 Feature Report 0x10 或 vendor usage page 0xFF00 的集合设备
  let targetDevice = matchedList.find(d => 
    d.collections?.some(c => 
      c.usagePage === 0xFF00 || 
      c.featureReports?.some(r => r.reportId === 0x10)
    )
  ) || matchedList[0];

  // 打开匹配到的所有 EasyInput 集合节点，确保按键上报和配网配置双通
  openDevices = [];
  for (const dev of matchedList) {
    if (!dev.opened) {
      try {
        await dev.open();
      } catch (e) {
        console.warn('HID 打开失败:', dev, e);
      }
    }
    if (dev.opened || dev.opened === undefined) {
      openDevices.push(dev);
    }
  }

  hidDevice = targetDevice;
  hidConnected = true;
  if (onStatusChanged) onStatusChanged(true);

  if (onLogReceived) {
    onLogReceived(`[WebHID] 已连接 EasyInput: ${targetDevice.productName || 'ESP32-S3'} (VID: 0x${targetDevice.vendorId.toString(16)}, PID: 0x${targetDevice.productId.toString(16)}, 集合数: ${matchedList.length})`);
  }

  // 为所有打开的设备挂载输入监听，彼此独立保留，不互相冲掉
  for (const dev of openDevices) {
    attachInputListener(dev, onTokenReceived, onLogReceived);
  }

  return true;
}

function attachInputListener(device, onTokenReceived, onLogReceived) {
  removeInputListener(device);
  const inputReportHandler = (event) => {
    const { data, reportId } = event;
    if (onLogReceived) {
      onLogReceived(`[WebHID Report 0x${reportId.toString(16)}] 字节数: ${data.byteLength}`);
    }

    // Report ID 0x11 (17): App Command / Vendor HID
    if (reportId === 0x11 && data.byteLength > 0) {
      const cmdKind = data.getUint8(0);

      // 1. Hotkey 事件 (Return=S2, SelectAll=S5, Backspace=S4, Copy=S6, Paste=S7, Undo=S8)
      if (cmdKind === 0x02 && data.byteLength >= 5) {
        const state = data.getUint8(4); // 1: Pressed, 2: Released
        if (state === 1) { // 仅响应按下瞬间
          let hotkey = '';
          for (let i = 5; i < data.byteLength; i++) {
            const code = data.getUint8(i);
            if (code === 0) break;
            hotkey += String.fromCharCode(code);
          }
          const lower = hotkey.toLowerCase().replace(/\s/g, '');
          onLogReceived?.(`[WebHID 按下] ${hotkey || '(空快捷键)'}`);
          let token = null;
          if (lower.includes('return') || lower.includes('enter') || lower === 's2' || lower === 'key2') token = 'KEY2';
          else if (lower.includes('selectall') || lower.includes('select_all') || /^(ctrl|control|meta|cmd|command)\+a$/.test(lower)) token = 'KEY5';
          else if (lower.includes('backspace')) token = 'KEY4';
          else if (lower.includes('copy')) token = 'KEY6';
          else if (lower.includes('paste')) token = 'KEY7';
          else if (lower.includes('undo')) token = 'KEY8';
          else if (lower.includes('voice') || lower.includes('ptt')) token = 'KEY2';
          else if (lower.includes('edit')) token = 'KEY3';
          else if (lower.includes('scroll') || lower.includes('toggle')) token = 'ENC_PRESS';

          if (token && onTokenReceived) {
            onTokenReceived(token, `WebHID (${hotkey})`);
            return;
          }
          // Unknown configured hotkeys must remain available for recording.
          if (hotkey && onTokenReceived) onTokenReceived(hotkey, 'WebHID 自定义快捷键');
        }
      }

      // 2. Host Action UUID
      if (cmdKind === 0x05) {
        const bytes = [];
        for (let i = 4; i < Math.min(data.byteLength, 40); i++) {
          const b = data.getUint8(i);
          if (b !== 0) bytes.push(String.fromCharCode(b));
        }
        const actionStr = bytes.join('').trim();
        if (actionStr && onTokenReceived) {
          onTokenReceived(actionStr, 'WebHID 指令');
        }
      }

      // 3. Config ACK (cmdKind 0x01)
      if (cmdKind === 0x01 && data.byteLength >= 8) {
        const ok = data.getUint8(2) === 1;
        const saved = data.getUint8(7) === 1;
        onLogReceived?.(`[WebHID 配置回执] 固件写入: ${ok ? '成功' : '失败'}, 已持久化: ${saved ? '是' : '否'}`);
      }

      // 4. Status Response JSON (cmdKind 0x04)
      if (cmdKind === 0x04 && data.byteLength >= 13) {
        const chunkIndex = data.getUint8(10);
        const totalChunks = data.getUint8(11);
        onLogReceived?.(`[WebHID 状态响应] 分片 ${chunkIndex + 1}/${totalChunks}`);
      }
    }
  };
  boundListeners.set(device, inputReportHandler);
  device.addEventListener('inputreport', inputReportHandler);
}

export async function tryAutoConnectHid(onTokenReceived, onLogReceived, onStatusChanged) {
  if (!('hid' in navigator)) return false;
  try {
    const devices = await navigator.hid.getDevices();
    const matchedList = devices.filter(d => d.vendorId === 0x303a);
    if (matchedList.length > 0) {
      removeAllInputListeners();
      openDevices = [];
      for (const dev of matchedList) {
        if (!dev.opened) {
          try {
            await dev.open();
          } catch (e) {
            console.warn('Auto-connect HID open failed:', dev, e);
          }
        }
        if (dev.opened || dev.opened === undefined) {
          openDevices.push(dev);
        }
      }
      for (const dev of openDevices) {
        attachInputListener(dev, onTokenReceived, onLogReceived);
      }
      hidDevice = matchedList.find(d => 
        d.collections?.some(c => 
          c.usagePage === 0xFF00 || 
          c.featureReports?.some(r => r.reportId === 0x10)
        )
      ) || matchedList[0];
      hidConnected = true;
      if (onStatusChanged) onStatusChanged(true);
      if (onLogReceived) {
        onLogReceived(`[WebHID 自动重连] ${hidDevice.productName || 'EasyInput AI'}`);
      }
      return true;
    }
  } catch (e) {
    console.debug('Auto-connect HID silent check:', e);
  }
  return false;
}

export async function closeHidConnection(onStatusChanged) {
  hidConnected = false;
  removeAllInputListeners();
  for (const dev of openDevices) {
    try {
      await dev.close();
    } catch (e) {}
  }
  openDevices = [];
  hidDevice = null;
  if (onStatusChanged) onStatusChanged(false);
}

export function isHidConnected() {
  return hidConnected;
}

export function getHidDevice() {
  return hidDevice;
}
