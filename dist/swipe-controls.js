export function bindSwipeControls(canvas, { move, jump, hit, isRunning }) {
  const pointers = new Set();
  let origin = null;
  const cancel = () => { origin = null; };

  canvas.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'touch') return;
    pointers.add(event.pointerId);
    canvas.setPointerCapture(event.pointerId);
    if (pointers.size !== 1 || !isRunning()) {
      cancel();
      return;
    }
    origin = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
  });

  function recognize(event) {
    if (!origin || origin.id !== event.pointerId) return;
    if (!isRunning() || event.timeStamp - origin.time > 600) {
      cancel();
      return;
    }
    const dx = event.clientX - origin.x, dy = event.clientY - origin.y;
    const horizontal = Math.abs(dx), vertical = Math.abs(dy);
    if (Math.max(horizontal, vertical) < 32) return;
    if (horizontal < vertical * 1.3 && vertical < horizontal * 1.3) return;
    cancel();
    event.preventDefault();
    if (horizontal > vertical) move(Math.sign(dx));
    else if (dy < 0) jump();
    else hit();
  }

  function finish(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    cancel();
  }
  canvas.addEventListener('pointermove', recognize, { passive: false });
  canvas.addEventListener('pointerup', event => {
    recognize(event);
    finish(event);
  });
  canvas.addEventListener('pointercancel', finish);
  canvas.addEventListener('lostpointercapture', finish);
  return cancel;
}
