import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createModifierTapTracker } from '../src/services/modifierTap.js';

const meta = { key: 'Meta', code: 'MetaLeft', metaKey: true };
test('S2 standalone MetaLeft fires once on release, including held-key repeats', () => {
  const tracker = createModifierTapTracker();
  tracker.keydown(meta);
  tracker.keydown({ ...meta, repeat: true });
  assert.equal(tracker.keyup(meta), 'MetaLeft');
  assert.equal(tracker.keyup(meta), null);
});

test('Meta+A stays a combination and never also triggers S2', () => {
  const tracker = createModifierTapTracker();
  tracker.keydown(meta);
  tracker.keydown({ key: 'a', code: 'KeyA', metaKey: true });
  assert.equal(tracker.keyup({ key: 'a', code: 'KeyA' }), null);
  assert.equal(tracker.keyup(meta), null);
});

test('multiple modifiers and focus loss do not leave a pending S2 trigger', () => {
  const tracker = createModifierTapTracker();
  const shift = { key: 'Shift', code: 'ShiftLeft', metaKey: true, shiftKey: true };
  tracker.keydown(meta);
  tracker.keydown(shift);
  assert.equal(tracker.keyup(shift), null);
  assert.equal(tracker.keyup(meta), null);
  tracker.keydown(meta);
  tracker.reset();
  assert.equal(tracker.keyup(meta), null);
});

test('left and right modifier keys remain distinct for recording', () => {
  const tracker = createModifierTapTracker();
  tracker.keydown({ key: 'Meta', code: 'MetaRight', metaKey: true });
  assert.equal(tracker.keyup({ key: 'Meta', code: 'MetaRight' }), 'MetaRight');
});
