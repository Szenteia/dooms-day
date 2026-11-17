import test from 'node:test';
import assert from 'node:assert/strict';
import { bindSwipeControls } from '../dist/swipe-controls.js';

function controls() {
  const handlers = new Map(), calls = [], captures = [];
  let running = true;
  const cancel = bindSwipeControls({
    addEventListener(name, handler) { handlers.set(name, handler); },
    setPointerCapture(id) { captures.push(id); },
  }, {
    move: value => calls.push(value), jump: () => calls.push('jump'),
    hit: () => calls.push('hit'), isRunning: () => running,
  });
  const event = (name, x=0, y=0, overrides={}) => handlers.get(name)({
    pointerType:'touch', pointerId:1, clientX:x, clientY:y,
    timeStamp:name==='pointerdown'?0:100, preventDefault() {}, ...overrides,
  });
  return {event, calls, captures, cancel, pause: () => {running=false;}};
}

test('four swipe directions fire once even if the finger keeps moving', () => {
  for (const [x,y,expected] of [[-40,0,-1],[40,0,1],[0,-40,'jump'],[0,40,'hit']]) {
    const {event,calls}=controls();
    event('pointerdown');
    event('pointermove',x,y);
    event('pointermove',x*2,y*2);
    event('pointerup',x*2,y*2);
    assert.deepEqual(calls,[expected]);
  }
});

test('short, ambiguous, slow and mouse gestures do not trigger actions', () => {
  for (const [x,y,overrides] of [[15,0,{}],[40,40,{}],[40,0,{timeStamp:700}]]) {
    const {event,calls}=controls();
    event('pointerdown');
    event('pointerup',x,y,overrides);
    assert.deepEqual(calls,[]);
  }
  const {event,calls}=controls();
  event('pointerdown',0,0,{pointerType:'mouse'});
  event('pointerup',40,0,{pointerType:'mouse'});
  assert.deepEqual(calls,[]);
});

test('multiple fingers cancel the whole gesture until all fingers are lifted', () => {
  const {event,calls,captures}=controls();
  event('pointerdown');
  event('pointerdown',0,0,{pointerId:2});
  assert.deepEqual(captures,[1,2]);
  event('pointerup',0,-50);
  event('pointerup',0,-50,{pointerId:2});
  assert.deepEqual(calls,[]);
  event('pointerdown');
  event('pointerup',0,-50);
  assert.deepEqual(calls,['jump']);
});

test('pointer cancellation, lost capture, pause and menu reset discard pending gestures', () => {
  for (const interruption of ['pointercancel','lostpointercapture','pause','reset']) {
    const {event,calls,cancel,pause}=controls();
    event('pointerdown');
    if(interruption==='pause')pause();
    else if(interruption==='reset')cancel();
    else event(interruption);
    event('pointerup',0,-50);
    assert.deepEqual(calls,[]);
  }
});
