const MODIFIERS = new Set(['Control', 'Shift', 'Alt', 'Meta']);

export function isModifierKey(event) {
  return MODIFIERS.has(event.key);
}

// Wait for release so a standalone modifier never fires as part of a shortcut.
export function createModifierTapTracker() {
  const held = new Set();
  let candidate = null;
  return {
    keydown(event) {
      if (!isModifierKey(event)) {
        candidate = null;
        return;
      }
      const code = event.code || event.key;
      if (event.repeat || held.has(code)) return;
      const modifierCount = [event.ctrlKey, event.altKey, event.shiftKey, event.metaKey].filter(Boolean).length;
      candidate = held.size === 0 && modifierCount <= 1 ? code : null;
      held.add(code);
    },
    keyup(event) {
      const code = event.code || event.key;
      const tap = held.has(code) && candidate === code ? code : null;
      held.delete(code);
      if (candidate === code) candidate = null;
      return tap;
    },
    reset() {
      held.clear();
      candidate = null;
    }
  };
}
