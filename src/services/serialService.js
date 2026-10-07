// Web Serial (COM3) Driver & Token Decoder

import { normalizeToken } from './hardwareConfig.js';

let serialPort = null;
let serialReader = null;
let serialConnected = false;
let serialReadAbort = false;

// EasyInput V2.0 / ESP32-S3 原厂硬件 GPIO 直连映射表 (严格遵循 EasyInput V2 硬件规格)
const GPIO_PIN_MAP = {
  // S1 (上传 PDF): 原厂丝印 S1 ➔ 硬件 GPIO2 (V1 兼容 GPIO39)
  '2': 'KEY1',
  '39': 'KEY1',

  // S2 (下一页): 原厂丝印 S2 ➔ 硬件 GPIO47 (V1 兼容 GPIO40)
  '47': 'KEY2',
  '40': 'KEY2',

  // S3 (放大): 原厂丝印 S3 ➔ 硬件 GPIO38
  '38': 'KEY3',

  // S4 (缩小): 原厂丝印 S4 ➔ 硬件 GPIO41 (V1 兼容 GPIO42)
  '41': 'KEY4',
  '42': 'KEY4',

  // S5 (返回主页 / 全屏): 原厂丝印 S5 ➔ 硬件 GPIO1
  '1': 'KEY5',

  // S6 (深度精读): 原厂丝印 S6 ➔ 硬件 GPIO6 (V1 兼容 GPIO37)
  '6': 'KEY6',
  '37': 'KEY6',

  // S7 (上一页): 原厂丝印 S7 ➔ 硬件 GPIO7 (V1 兼容 GPIO36)
  '7': 'KEY7',
  '36': 'KEY7',

  // S8 (自适应重置): 原厂丝印 S8 ➔ 硬件 GPIO48 (V1 兼容 GPIO35)
  '48': 'KEY8',
  '35': 'KEY8',

  // 旋转编码器下按 (S9)
  '18': 'ENC_PRESS',
  '11': 'ENC_PRESS'
};

// 严格报文解析器：精准匹配 COM3 串口上报的按键、引脚与旋钮事件
export function parseSerialLineToToken(raw) {
  if (!raw) return null;
  const line = raw.trim();

  // 0. 过滤芯片型号特征（如 ESP32-S3、ESP32-S2 等避免被当作 S3/S2 误触）及系统引导日志
  if (/ESP(?:32)?[-_]?S[1-8]/i.test(line)) return null;
  if (/\b(?:boot|rst|flash|clock|baud|heap|wifi|ble|bt|cpu)\b/i.test(line)) return null;

  // 过滤包含多个按键代号的批量转储/状态行 (如 "S1=0 S2=0 S3=0" 或 "KEY1, KEY2")，防止串键
  const keyMatches = line.match(/\b(?:KEY|S|BTN)[_\s]?[1-8]\b/gi);
  if (keyMatches && keyMatches.length > 1) return null;

  // 1. JSON 报文 (状态诊断与实时输入)
  if (line.startsWith('{') && line.endsWith('}')) {
    try {
      const obj = JSON.parse(line);
      if (obj.state && /(release|up|0)/i.test(String(obj.state))) return null;
      if (obj.diag) {
        if (obj.diag.last_age_ms !== undefined && obj.diag.last_age_ms > 350) {
          return null;
        }
        if (obj.diag.last) {
          const t = parseSerialLineToToken(obj.diag.last);
          if (t) return t;
        }
      }
      if (obj.last) {
        const t = parseSerialLineToToken(obj.last);
        if (t) return t;
      }
      if (obj.input) return normalizeToken(obj.input);
      if (obj.key !== undefined) return normalizeToken('KEY' + obj.key);
      if (obj.id !== undefined) return normalizeToken('KEY' + obj.id);
      if (obj.s !== undefined) return normalizeToken('KEY' + obj.s);
      if (obj.k !== undefined) return normalizeToken('KEY' + obj.k);
      if (obj.btn !== undefined) return normalizeToken('KEY' + obj.btn);
      if (obj.button !== undefined) return normalizeToken('KEY' + obj.button);
      if (obj.pin !== undefined && GPIO_PIN_MAP[String(obj.pin)]) return GPIO_PIN_MAP[String(obj.pin)];
    } catch (e) {}
  }

  // 2. 严格过滤明确的松开/抬起/空闲
  if (/\b(released|release|up|inactive|idle|disconnect)\b/i.test(line) && !/\b(pressed|down)\b/i.test(line)) {
    return null;
  }

  // 3. 过滤状态倾倒中的 0 状态行 (例如 "S1:0", "KEY2=0")
  if (/(?:KEY|S|K|BTN)[_\s]?[1-8]\s*[:=]\s*0\b/i.test(line) && !/(?:KEY|S|K|BTN)[_\s]?[1-8]\s*[:=]\s*1\b/i.test(line)) {
    return null;
  }

  // 4. 旋转编码器
  if (/\b(ENC_LEFT|ENCODER_LEFT|ENC_CCW|ROTARY_CCW|CCW)\b/i.test(line) || /step\s*=\s*-\d+/i.test(line)) return 'ENC_LEFT';
  if (/\b(ENC_RIGHT|ENCODER_RIGHT|ENC_CW|ROTARY_CW|CW)\b/i.test(line) || /step\s*=\s*\+?[1-9]\d*/i.test(line)) return 'ENC_RIGHT';
  if (/\b(ENC_PRESS|ENCODER_PRESS|ROTARY_PRESS|ENC_CLICK|CLICK)\b/i.test(line)) return 'ENC_PRESS';

  // 5. 纯数字整行上报 (如某些固件发送 "1" ~ "8")
  if (/^[1-8]$/.test(line)) {
    return 'KEY' + line;
  }

  // 6. 板级 GPIO / 引脚显式匹配 (如 "KEY1:pressed:gpio=2", "gpio=47", "pin 2")
  const gpioMatch = line.match(/\b(?:gpio|pin)[=:\s]*(\d+)\b/i);
  if (gpioMatch && !/\b(released|up|0)\b/i.test(line)) {
    const pin = gpioMatch[1];
    if (GPIO_PIN_MAP[pin]) {
      return GPIO_PIN_MAP[pin];
    }
  }

  // 7. 显式按下匹配 (例如 "KEY1: 1", "KEY1 pressed", "KEY1:pressed", "S2: down", "btn1:1")
  const pressExplicit = line.match(/(?:KEY|S|K|BTN|BUTTON|SW)[_\s]?([1-8])(?:\s*[:=]\s*1\b|[:\s]+(?:pressed|down)\b)/i);
  if (pressExplicit) {
    return 'KEY' + pressExplicit[1];
  }

  // 8. 纯按键代号整行匹配 (例如 "KEY1", "S1", "K1", "BTN1", "SW1")
  const exactToken = line.match(/^(?:KEY|S|K|BTN|BUTTON|SW)[_\s]?([1-8])$/i);
  if (exactToken) {
    return 'KEY' + exactToken[1];
  }

  // 9. 中文按键匹配 (例如 "按键1", "键1按下")
  const cnMatch = line.match(/(?:按键|键|按钮)[_\s]?([1-8])/);
  if (cnMatch && !/\b(释放|抬起|0)\b/.test(line)) {
    return 'KEY' + cnMatch[1];
  }

  // 10. 标准 ESP-IDF 日志 (例如 "easy_input: KEY1 pressed")
  const idfLogMatch = line.match(/\b(?:easy_input|gpio_keys|key|btn):\s*(?:KEY|S|K|BTN)?([1-8])\b/i);
  if (idfLogMatch && !/\b(released|up|0)\b/i.test(line)) {
    return 'KEY' + idfLogMatch[1];
  }

  // 11. 单词边界匹配，排除日志参数干扰
  const wordMatch = line.match(/\b(KEY[_\s]?([1-8])|S([1-8])|BTN[_\s]?([1-8]))\b/i);
  if (wordMatch) {
    const idx = wordMatch.index;
    const prefix = line.substring(Math.max(0, idx - 6), idx);
    if (!/(?:status|step|size|vin|chrg|core|task|chip)/i.test(prefix)) {
      const num = wordMatch[2] || wordMatch[3] || wordMatch[4];
      return 'KEY' + num;
    }
  }

  return null;
}

export async function openSerialConnection(onTokenReceived, onLogReceived, onStatusChanged, forcePrompt = false) {
  if (!('serial' in navigator)) {
    throw new Error('当前浏览器暂不支持 Web Serial API。请使用 Google Chrome 或 Microsoft Edge 浏览器访问以直连 COM3！');
  }

  // 先确保清理旧端口状态
  if (serialPort) {
    await closeSerialConnection();
  }

  let port = null;

  // 1. 如果没有要求强制弹窗，尝试复用已授权的历史端口
  if (!forcePrompt) {
    try {
      const existingPorts = await navigator.serial.getPorts();
      if (existingPorts && existingPorts.length > 0) {
        const matched = existingPorts.find(p => {
          const info = p.getInfo ? p.getInfo() : {};
          return info.usbVendorId === 0x303a;
        }) || existingPorts[0];

        try {
          if (!matched.readable) {
            await matched.open({ baudRate: 115200 });
          }
          serialPort = matched;
          serialConnected = true;
          serialReadAbort = false;
          if (onStatusChanged) onStatusChanged(true);
          startSerialLoop(onTokenReceived, onLogReceived, onStatusChanged);
          return true;
        } catch (openErr) {
          console.warn('复用已授权串口失败，将自动调起选择弹窗:', openErr);
        }
      }
    } catch (e) {
      console.warn('读取历史串口列表异常:', e);
    }
  }

  // 2. 调起系统选择框：让用户从弹窗中明确选择连接设备
  try {
    try {
      // 优先锁定 ESP32-S3 (VID: 0x303A)
      port = await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x303a }]
      });
    } catch (filterErr) {
      // 若过滤条件未列出设备或驱动未上报 VID，放宽过滤器弹出所有可用串口
      if (filterErr.name !== 'NotFoundError') {
        port = await navigator.serial.requestPort();
      } else {
        // 用户主动取消了带过滤器的窗口，尝试无条件弹窗
        port = await navigator.serial.requestPort();
      }
    }
  } catch (userCancelErr) {
    if (userCancelErr.name === 'NotFoundError') {
      return false; // 用户在系统弹窗中点击了“取消”
    }
    throw userCancelErr;
  }

  if (!port) return false;

  // 3. 打开端口通信
  if (!port.readable) {
    await port.open({ baudRate: 115200 });
  }

  serialPort = port;
  serialConnected = true;
  serialReadAbort = false;
  if (onStatusChanged) onStatusChanged(true);

  startSerialLoop(onTokenReceived, onLogReceived, onStatusChanged);
  return true;
}

// 尝试静默自动重连历史已授权的 COM3 端口
export async function tryAutoConnectSerial(onTokenReceived, onLogReceived, onStatusChanged) {
  if (!('serial' in navigator)) return false;
  try {
    const ports = await navigator.serial.getPorts();
    if (ports && ports.length > 0) {
      const matched = ports.find(p => {
        const info = p.getInfo ? p.getInfo() : {};
        return info.usbVendorId === 0x303a;
      }) || ports[0];

      if (!matched.readable) {
        await matched.open({ baudRate: 115200 });
      }
      serialPort = matched;
      serialConnected = true;
      serialReadAbort = false;
      if (onStatusChanged) onStatusChanged(true);
      startSerialLoop(onTokenReceived, onLogReceived, onStatusChanged);
      return true;
    }
  } catch (e) {
    console.debug('Auto-connect serial silent check:', e);
  }
  return false;
}

export async function closeSerialConnection(onStatusChanged) {
  serialConnected = false;
  serialReadAbort = true;
  if (serialReader) {
    try {
      await serialReader.cancel();
    } catch (e) {}
    try {
      serialReader.releaseLock();
    } catch (e) {}
    serialReader = null;
  }
  if (serialPort) {
    try {
      await serialPort.close();
    } catch (e) {}
    serialPort = null;
  }
  if (onStatusChanged) onStatusChanged(false);
}

async function startSerialLoop(onTokenReceived, onLogReceived, onStatusChanged) {
  let reader = null;
  const decoder = new TextDecoder();
  let lineBuffer = '';
  let flushTimer = null;

  const processChunk = (rawLine) => {
    const line = rawLine.trim();
    if (!line) return;
    if (onLogReceived) onLogReceived(line);
    const token = parseSerialLineToToken(line);
    if (token && onTokenReceived) {
      onTokenReceived(token, 'COM3 串口');
    }
  };

  try {
    reader = serialPort.readable.getReader();
    serialReader = reader;

    while (serialConnected && !serialReadAbort) {
      const { value, done } = await reader.read();
      if (done) break;
      if (value) {
        clearTimeout(flushTimer);
        const text = decoder.decode(value, { stream: true });
        lineBuffer += text;

        if (lineBuffer.includes('\n') || lineBuffer.includes('\r')) {
          const lines = lineBuffer.split(/\r?\n|\r/);
          lineBuffer = lines.pop() || '';
          for (const rawLine of lines) {
            processChunk(rawLine);
          }
        }

        // 如果缓冲区有字符，但硬件未发送换行符，40ms 后自动触发解析
        if (lineBuffer.trim().length > 0) {
          flushTimer = setTimeout(() => {
            if (lineBuffer.trim().length > 0) {
              const pending = lineBuffer;
              lineBuffer = '';
              processChunk(pending);
            }
          }, 40);
        }
      }
    }
  } catch (err) {
    console.warn('Serial read loop interrupted:', err);
  } finally {
    clearTimeout(flushTimer);
    if (reader) {
      try {
        reader.releaseLock();
      } catch (e) {}
    }
    serialReader = null;
    serialConnected = false;
    if (onStatusChanged) onStatusChanged(false);
  }
}

export function isSerialConnected() {
  return serialConnected;
}

