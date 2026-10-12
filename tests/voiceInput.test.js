import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createVoiceInput } from '../src/services/voiceInput.js';
import { loadStoredHardwareMap, DEFAULT_HARDWARE_MAP } from '../src/services/hardwareConfig.js';

function setup() {
  const sessions = [], texts = [], states = [], messages = [];
  class Recognition {
    constructor() { sessions.push(this); }
    start() { this.onstart(); }
    stop() { this.stops = (this.stops || 0) + 1; }
    abort() { this.aborted = true; }
  }
  const voice = createVoiceInput({ Recognition, onText: text => texts.push(text), onState: state => states.push(state), onMessage: message => messages.push(message) });
  return { voice, sessions, texts, states, messages };
}

test('S2 voice toggle appends each final result once, stops once, and restarts', () => {
  const { voice, sessions, texts, states } = setup();
  voice.toggle();
  const session = sessions[0];
  assert.equal(session.lang, 'zh-CN');
  const result = Object.assign([{ transcript: '测试语音' }], { isFinal: true });
  session.onresult({ results: [result] });
  session.onresult({ results: [result] });
  assert.deepEqual(texts, ['测试语音']);
  voice.toggle();
  voice.toggle();
  assert.equal(session.stops, 1);
  session.onend();
  assert.equal(states.at(-1), 'idle');
  voice.toggle();
  assert.equal(sessions.length, 2);
  voice.dispose();
  assert.equal(sessions[1].aborted, true);
  assert.equal(sessions[1].onresult, null);
});

test('permission failure clears recording and gives a useful error', () => {
  const { voice, sessions, states, messages } = setup();
  voice.toggle();
  sessions[0].onerror({ error: 'not-allowed' });
  assert.match(messages[0], /麦克风权限/);
  assert.equal(states.at(-1), 'idle');
  assert.equal(sessions[0].aborted, true);
});

test('unsupported speech recognition offers system dictation', () => {
  const messages = [];
  createVoiceInput({ onMessage: message => messages.push(message) }).toggle();
  assert.match(messages[0], /Win\+H/);
});

test('S2 preset migration preserves recorded hardware signal and later custom actions', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  let stored = { KEY2: { action: 'deleteDoc', actionVersion: 1, fallbackKey: 'MetaLeft' } };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => JSON.stringify(stored) } });
  try {
    assert.equal(DEFAULT_HARDWARE_MAP.KEY2.action, 'voiceInput');
    const migrated = loadStoredHardwareMap();
    assert.equal(migrated.KEY2.action, 'voiceInput');
    assert.equal(migrated.KEY2.fallbackKey, 'MetaLeft');
    stored = { KEY2: { ...migrated.KEY2, action: 'nextPage' } };
    assert.equal(loadStoredHardwareMap().KEY2.action, 'nextPage');
  } finally {
    if (original) Object.defineProperty(globalThis, 'localStorage', original);
    else delete globalThis.localStorage;
  }
});
