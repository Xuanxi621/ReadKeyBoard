import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveHardwareToken } from '../src/services/hardwareConfig.js';

test('recorded UUIDs resolve regardless of case and separators', () => {
  const uuid = '9615aa05-a4c6-4944-8123-123456789abc';
  assert.equal(resolveHardwareToken(uuid, {
    KEY2: { fallbackKey: uuid.replaceAll('-', '').toUpperCase() }
  }), 'KEY2');
});

test('recorded encoder and custom hotkey signals override old identities', () => {
  const map = { KEY2: { fallbackKey: 'ENC_PRESS' }, ENC_PRESS: { fallbackKey: 'Fn' } };
  assert.equal(resolveHardwareToken('ENC_PRESS', map), 'KEY2');
  assert.equal(resolveHardwareToken('Fn', map), 'ENC_PRESS');
  assert.equal(resolveHardwareToken('S5', map), 'KEY5');
});
