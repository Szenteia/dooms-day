const WINDOW = 2.5;
const MAX_COUNT = 5;

export function createSmashChain() {
  let count = 0, remaining = 0;
  function clear() {
    count = remaining = 0;
  }
  return {
    clear,
    smash() {
      count = Math.min(MAX_COUNT, count + 1);
      remaining = WINDOW;
      return count - 1;
    },
    update(dt) {
      remaining = Math.max(0, remaining - dt);
      if (remaining === 0) clear();
    },
    get count() { return count; },
    get bonus() { return Math.max(0, count - 1); },
    get progress() { return remaining / WINDOW; },
  };
}
