// WebHID Driver for EasyInput AI (VID: 0x303A, PID: 0x1006)

let hidDevice = null;
let hidConnected = false;
let inputReportHandler = null;

function removeInputListener() {
  if (hidDevice && inputReportHandler) {
    hidDevice.removeEventListener('inputreport', inputReportHandler);
  }
  inputReportHandler = null;
}

export async function openHidConnection(onTokenReceived, onLogReceived, onStatusChanged) {
  if (!('hid' in navigator)) {
    throw new Error('当前浏览器不支持 WebHID API，请使用 Chrome 或 Edge 浏览器！');
  }

  // 关闭旧连接
  if (hidDevice) {
    removeInputListener();
    try {
      await hidDevice.close();
    } catch (e) {}
    hidDevice = null;
    hidConnected = false;
  }

  // 1. 尝试复用已授权设备
  const existingDevices = await navigator.hid.getDevices();
  let matched = existingDevices.find(d => d.vendorId === 0x303a);

  // 2. 若无历史设备，弹窗供用户选择
  if (!matched) {
    const selected = await navigator.hid.requestDevice({
      filters: [{ vendorId: 0x303a }]
    });
    if (!selected || selected.length === 0) return false;
    matched = selected[0];
  }

  if (!matched) return false;

  if (!matched.opened) {
    await matched.open();
  }

  hidDevice = matched;
  hidConnected = true;
  if (onStatusChanged) onStatusChanged(true);

  if (onLogReceived) {
    onLogReceived(`[WebHID] 已成功连接 EasyInput: ${matched.productName || 'ESP32-S3'} (VID: 0x${matched.vendorId.toString(16)}, PID: 0x${matched.productId.toString(16)})`);
  }

  attachInputListener(matched, onTokenReceived, onLogReceived);

  return true;
}

function attachInputListener(device, onTokenReceived, onLogReceived) {
  removeInputListener();
  hidDevice = device;
  inputReportHandler = (event) => {
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
          if (lower.includes('return') || lower.includes('enter')) token = 'KEY2';
          else if (lower.includes('selectall') || lower.includes('select_all') || /^(ctrl|control|meta|cmd|command)\+a$/.test(lower)) token = 'KEY5';
          else if (lower.includes('backspace')) token = 'KEY4';
          else if (lower.includes('copy')) token = 'KEY6';
          else if (lower.includes('paste')) token = 'KEY7';
          else if (lower.includes('undo')) token = 'KEY8';
          else if (lower.includes('voice') || lower.includes('ptt')) token = 'KEY1';
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
    }
  };
  device.addEventListener('inputreport', inputReportHandler);
}

export async function tryAutoConnectHid(onTokenReceived, onLogReceived, onStatusChanged) {
  if (!('hid' in navigator)) return false;
  try {
    const devices = await navigator.hid.getDevices();
    const matched = devices.find(d => d.vendorId === 0x303a);
    if (matched) {
      if (!matched.opened) {
        await matched.open();
      }
      attachInputListener(matched, onTokenReceived, onLogReceived);
      hidConnected = true;
      if (onStatusChanged) onStatusChanged(true);
      if (onLogReceived) {
        onLogReceived(`[WebHID 自动重连] ${matched.productName || 'EasyInput AI'}`);
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
  if (hidDevice) {
    removeInputListener();
    try {
      await hidDevice.close();
    } catch (e) {}
    hidDevice = null;
  }
  if (onStatusChanged) onStatusChanged(false);
}

export function isHidConnected() {
  return hidConnected;
}
