export function createResumeCountdown(element) {
  let remaining = 0;
  function clear() {
    remaining = 0;
    element.hidden = true;
    element.textContent = '';
  }
  function start() {
    remaining = 3;
    element.textContent = 'Folytatás · 3';
    element.hidden = false;
  }
  function update(dt) {
    if (remaining <= 0) return false;
    remaining = Math.max(0, remaining - dt);
    if (remaining === 0) {
      clear();
      return true;
    }
    const label = 'Folytatás · ' + Math.ceil(remaining);
    if (element.textContent !== label) element.textContent = label;
    return false;
  }
  return { start, update, clear };
}
