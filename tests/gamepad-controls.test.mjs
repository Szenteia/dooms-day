import test from 'node:test';
import assert from 'node:assert/strict';
import {createGamepadControls} from '../dist/gamepad-controls.js';

function setup() {
  const calls=[];
  const pad={index:0,id:'Test pad',connected:true,mapping:'standard',axes:[0],buttons:Array.from({length:16},()=>({pressed:false}))};
  let pads=[null,pad], denied=false;
  const poll=createGamepadControls({move:d=>calls.push(d),jump:()=>calls.push('jump'),hit:()=>calls.push('hit'),pause:()=>calls.push('start')},()=>{if(denied)throw Error('denied');return pads;});
  const press=(...indices)=>{pad.buttons.forEach((b,i)=>b.pressed=indices.includes(i));poll();};
  return {calls,pad,poll,press,setPads:p=>pads=p,deny:v=>denied=v};
}

test('standard actions fire once per press and Start consumes simultaneous actions',()=>{
  const {calls,poll,press}=setup();poll();
  press(0,2);poll();poll();assert.deepEqual(calls,['jump','hit']);
  press();press(9,0,2,15);poll();press(0,2,15);
  assert.deepEqual(calls,['jump','hit','start']);
  press();press(15);press();press(14);
  assert.deepEqual(calls,['jump','hit','start',1,-1]);
});

test('stick hysteresis prevents repeated lanes from held or noisy tilts',()=>{
  const {calls,poll,pad,press}=setup();poll();
  for(const axis of [.6,.49,.3,.54,.8]){pad.axes[0]=axis;poll();}
  assert.deepEqual(calls,[1]);
  pad.axes[0]=.2;poll();pad.axes[0]=.6;poll();pad.axes[0]=-.6;poll();
  assert.deepEqual(calls,[1,1,-1]);
  // Both opposing directions cancel; an aligned D-pad/stick edge is one action.
  pad.axes[0]=0;press();press(14,15);press();pad.axes[0]=.7;press(15);
  assert.deepEqual(calls,[1,1,-1,1]);
});

test('connection, controller replacement, disabled polling and reconnect consume held inputs',()=>{
  const {calls,poll,pad,press,setPads}=setup();
  pad.axes[0]=1;press(0,9);poll();assert.deepEqual(calls,[]);
  setPads([]);assert.equal(poll(),false);setPads([pad]);poll();poll();assert.deepEqual(calls,[]);
  poll(false);poll();assert.deepEqual(calls,[]);
  pad.id='Replacement';poll();assert.deepEqual(calls,[]);
  press();pad.axes[0]=0;poll();press(0);assert.deepEqual(calls,['jump']);
});

test('unsupported, disconnected, missing and denied controllers fall back safely',()=>{
  const s=setup();s.pad.mapping='';assert.equal(s.poll(),false);
  s.pad.mapping='standard';s.pad.connected=false;assert.equal(s.poll(),false);
  s.pad.connected=true;assert.equal(s.poll(),true);
  s.deny(true);assert.equal(s.poll(),false);s.deny(false);s.press(0);assert.deepEqual(s.calls,[]);
  s.setPads([null]);assert.equal(s.poll(),false);
  assert.equal(createGamepadControls({})(),false);
});
