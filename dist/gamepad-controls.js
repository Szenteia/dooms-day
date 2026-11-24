// Standard-layout controllers only. Every action is edge-triggered, never held-repeat.
export function createGamepadControls(actions, readGamepads = () => globalThis.navigator?.getGamepads?.() ?? []) {
  let identity = null, previous = new Set(), stick = 0;
  return function poll(enabled = true) {
    let pad;
    try {
      pad = Array.from(readGamepads()).find(p => p?.connected && p.mapping === 'standard');
    } catch { /* Unsupported or denied API: keyboard/touch remain available. */ }
    if (!enabled || !pad) {
      identity = null;
      previous.clear();
      stick = 0;
      return false;
    }
    const pressed = new Set([0, 2, 9, 14, 15].filter(i => pad.buttons[i]?.pressed));
    const axis = Number.isFinite(pad.axes[0]) ? pad.axes[0] : 0;
    const nextStick = axis <= -.55 ? -1 : axis >= .55 ? 1 : Math.abs(axis) <= .25 ? 0 : stick;
    const key = `${pad.index}:${pad.id}`;
    const fresh = identity !== key;
    const edge = i => pressed.has(i) && !previous.has(i);
    // Consume inputs even when an action is ignored by the current game state.
    const start = edge(9), jump = edge(0), hit = edge(2);
    const left = edge(14) || (nextStick === -1 && stick !== -1);
    const right = edge(15) || (nextStick === 1 && stick !== 1);
    identity = key;
    previous = pressed;
    stick = nextStick;
    if (!fresh) {
      if (start) actions.pause();
      else {
        if (left !== right) actions.move(left ? -1 : 1);
        if (jump) actions.jump();
        if (hit) actions.hit();
      }
    }
    return true;
  };
}
