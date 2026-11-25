import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Exercise the real entrypoint and callbacks; replace only GPU rendering and DOM.
test('Start preserves the book opened from menu, run, pause and game over',async()=>{
  const nodes=new Map();
  const element=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:true,style:{},classList:{toggle(){}},click(){this.onclick?.();}});
    return nodes.get(id);
  };
  let tick;
  const pad={index:0,id:'Test',connected:true,mapping:'standard',axes:[0],buttons:Array.from({length:16},()=>({pressed:false}))};
  const originals=new Map();
  const globals={document:{hidden:false,querySelector:element,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem(){},setItem(){}},navigator:{getGamepads:()=>[pad]},requestAnimationFrame:fn=>tick=fn,addEventListener(){},innerWidth:1200,innerHeight:800,devicePixelRatio:1};
  for(const [key,value]of Object.entries(globals)){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));
    Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  }
  const moduleURL=new URL('../dist/game.js',import.meta.url);
  const vendorURL=new URL('../dist/vendor/three.module.js',import.meta.url).href;
  const renderer=`export * from '${vendorURL}';export class WebGLRenderer {shadowMap={};setPixelRatio(){}setSize(){}render(){}}export class Clock {getDelta(){return .04;}}`;
  const dataURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
  const source=(await readFile(moduleURL,'utf8')).replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${path==='./vendor/three.module.js'?dataURL(renderer):new URL(path,moduleURL).href}'`);
  let game;
  try {
    game=await import(dataURL(source+'\nexport {end};export const snapshot=()=>({state,runs:save.runs});export const cleanup=()=>clearTimeout(toast.timer);'));
    const startPress=()=>{pad.buttons[9].pressed=false;tick();pad.buttons[9].pressed=true;tick();};
    for(const origin of ['menu','run','pause','over']){
      if(origin==='run')element('#start').click();
      if(origin==='pause')element('#pause').click();
      if(origin==='over')game.end();
      element('#book').click();
      const before=game.snapshot();
      const contents=element('#modal').innerHTML;
      startPress();
      assert.deepEqual(game.snapshot(),before,origin);
      assert.equal(element('#modal').hidden,false,origin);
      assert.equal(element('#modal').innerHTML,contents,origin);
      element('#close').click();
    }
    // Closing the book after game over allows a deliberate new run again.
    const runs=game.snapshot().runs;startPress();
    assert.equal(game.snapshot().state,'run');assert.equal(game.snapshot().runs,runs+1);
    game.end();startPress();assert.equal(game.snapshot().runs,runs+2);
  } finally {
    game?.cleanup();
    for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
