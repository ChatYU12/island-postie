/* Progress lives in localStorage under one key. Everything is plain JSON so a
 * save survives code changes; unknown fields are ignored and missing ones get
 * defaults. If storage is unavailable (private mode, blocked), the game still
 * runs and simply forgets on reload. */

const KEY = 'island-postie.save.v1';

export function defaultSave() {
  return {
    version: 1,
    unlocks: [],          // ids from UNLOCKS
    completed: [],        // errand ids
    active: null,         // { id, step, targets: { [stepIndex]: target } }
    foundStamps: [],      // hidden stamp ids
    errandStamps: 0,
    postcards: [],
    position: null        // { x, z }
  };
}

export function loadSave() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultSave();
    return { ...defaultSave(), ...JSON.parse(raw) };
  } catch {
    return defaultSave();
  }
}

export function writeSave(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); return true; } catch { return false; }
}

export function clearSave() {
  try { localStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}

export const totalStamps = (save) => save.errandStamps + save.foundStamps.length;
