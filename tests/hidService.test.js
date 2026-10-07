import { test } from 'node:test';
import assert from 'node:assert/strict';
import { openHidConnection, tryAutoConnectHid, closeHidConnection } from '../src/services/hidService.js';

test('S2 and S5 reports survive automatic and manual reconnection without duplicate listeners', async () => {
  const listeners = new Set();
  const device = {
    vendorId: 0x303a, productId: 0x1006, opened: false,
    async open() { this.opened = true; },
    async close() { this.opened = false; },
    addEventListener(type, handler) { listeners.add(handler); },
    removeEventListener(type, handler) { listeners.delete(handler); }
  };
  const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
  Object.defineProperty(globalThis, 'navigator', {
    configurable: true, value: { hid: { getDevices: async () => [device] } }
  });
  const received = [];
  const receive = token => received.push(token);
  const press = (hotkey, state = 1) => {
    const bytes = new Uint8Array(63);
    bytes.set([2, 0, 1, hotkey.length + 1, state]);
    bytes.set(new TextEncoder().encode(hotkey), 5);
    for (const handler of listeners) handler({ reportId: 0x11, data: new DataView(bytes.buffer) });
  };
  try {
    assert.equal(await tryAutoConnectHid(receive), true);
    press('Return');
    press('Ctrl+A');
    press('Ctrl+A', 2);
    assert.deepEqual(received, ['KEY2', 'KEY5']);
    await tryAutoConnectHid(receive);
    assert.equal(listeners.size, 1);
    press('Enter');
    press('Meta+A');
    assert.deepEqual(received, ['KEY2', 'KEY5', 'KEY2', 'KEY5']);
    await openHidConnection(receive);
    assert.equal(listeners.size, 1);
    press('SelectAll');
    assert.equal(received.at(-1), 'KEY5');
    press('Fn');
    assert.equal(received.at(-1), 'Fn');
    await closeHidConnection();
    assert.equal(listeners.size, 0);
  } finally {
    await closeHidConnection();
    if (original) Object.defineProperty(globalThis, 'navigator', original);
    else delete globalThis.navigator;
  }
});
