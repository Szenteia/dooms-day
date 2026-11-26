import test from 'node:test';
import assert from 'node:assert/strict';
import {createGameAudio} from '../dist/game-audio.js';

export class FakeContext {
  static instances=[];
  constructor(){this.state='suspended';this.currentTime=10;this.destination={};this.nodes=[];FakeContext.instances.push(this);}
  resume(){this.state='running';return Promise.resolve();}
  param(){return {value:0,events:[],setValueAtTime(value,time){this.events.push({value,time});},exponentialRampToValueAtTime(value,time){this.events.push({value,time});}};}
  node(kind){const node={kind,connections:[],disconnects:0,connect(to){this.connections.push(to);},disconnect(){this.disconnects++;}};this.nodes.push(node);return node;}
  createGain(){return Object.assign(this.node('gain'),{gain:this.param()});}
  createOscillator(){return Object.assign(this.node('osc'),{frequency:this.param(),stops:[],start(time){this.started=time;},stop(time){this.stops.push(time);}});}
  get oscillators(){return this.nodes.filter(n=>n.kind==='osc');}
  finish(){for(const osc of this.oscillators)osc.onended?.();}
}
const setup=()=>{FakeContext.instances=[];return createGameAudio({AudioContext:FakeContext});};

test('audio starts muted and lazy, enabling reuses one context without replaying past events',async()=>{
  const audio=setup();assert.equal(audio.enabled,false);
  assert.equal(audio.play('jump'),false);assert.equal(FakeContext.instances.length,0);
  assert.equal(await audio.enable(),true);const ctx=FakeContext.instances[0];
  assert.equal(ctx.oscillators.length,0);
  assert.equal(audio.play('jump'),true);ctx.finish();audio.mute();
  assert.equal(await audio.enable(),true);assert.equal(FakeContext.instances.length,1);
  assert.equal(ctx.nodes.filter(n=>n.connections.includes(ctx.destination)).length,1);
});

test('cues have distinct bounded schedules with positive frequency and quiet envelopes',async()=>{
  const audio=setup();await audio.enable();const ctx=FakeContext.instances[0];
  const signatures=[];
  for(const cue of ['start','jump','hit','smash','damage','shield','fossil','discovery','blessing','over']){
    const before=ctx.oscillators.length;
    assert.equal(audio.play(cue),true,cue);
    const voices=ctx.oscillators.slice(before);
    signatures.push(JSON.stringify(voices.map(v=>v.frequency.events)));
    for(const voice of voices){
      assert(voice.started>=ctx.currentTime);
      assert(voice.stops[0]<=ctx.currentTime+1.2);
      assert(voice.frequency.events.every(e=>e.value>0&&Number.isFinite(e.time)));
      const envelope=voice.connections[0].gain.events;
      assert(envelope.every(e=>e.value>0&&e.value<=.07));
      assert.equal(envelope.at(-1).value,.0001);
    }
    ctx.finish();
  }
  assert.equal(new Set(signatures).size,10);
  assert.equal(audio.play('unknown'),false);
});

test('voice cap bounds simultaneous cues and ended nodes release capacity',async()=>{
  const audio=setup();await audio.enable();const ctx=FakeContext.instances[0];
  for(let i=0;i<16;i++)assert.equal(audio.play('jump'),true);
  assert.equal(audio.play('jump'),false);assert.equal(audio.play('fossil'),false);
  assert.equal(ctx.oscillators.length,16);
  ctx.finish();assert(ctx.oscillators.every(v=>v.disconnects>0&&v.connections[0].disconnects>0));
  assert.equal(audio.play('fossil'),true);
});

test('mass destruction has one crack per swing and stopping clears scheduled sounds',async()=>{
  const audio=setup();await audio.enable();const ctx=FakeContext.instances[0];
  assert.equal(audio.play('smash'),true);
  for(let i=0;i<100;i++)assert.equal(audio.play('smash'),false);
  ctx.currentTime+=.07;assert.equal(audio.play('smash'),true);
  audio.play('fossil');const pending=[...ctx.oscillators];
  audio.stop();assert.equal(audio.enabled,true);
  assert(pending.every(v=>v.stops.length===2&&v.stops[1]===undefined&&v.disconnects>0));
  assert.equal(audio.play('smash'),true);
  audio.mute();assert.equal(audio.enabled,false);assert.equal(audio.play('discovery'),false);
  ctx.finish();assert.equal(await audio.enable(),true);assert.equal(audio.play('start'),true);
});

test('unsupported or denied audio and scheduling failure cannot break gameplay',async()=>{
  assert.equal(await createGameAudio({AudioContext:null}).enable(),false);
  const denied=createGameAudio({AudioContext:class extends FakeContext{resume(){return Promise.reject(Error('denied'));}}});
  assert.equal(await denied.enable(),false);assert.equal(denied.play('jump'),false);
  const unavailable=createGameAudio({AudioContext:class{constructor(){throw Error('unavailable');}}});
  assert.equal(await unavailable.enable(),false);
  const audio=setup();await audio.enable();const ctx=FakeContext.instances[0];
  audio.play('fossil');ctx.createOscillator=()=>{throw Error('device gone');};
  assert.equal(audio.play('jump'),false);assert.equal(audio.enabled,false);
  assert(ctx.oscillators.every(v=>v.disconnects>0));
});

test('muting during an asynchronous permission/resume attempt cannot re-enable audio',async()=>{
  let resume;
  const audio=createGameAudio({AudioContext:class extends FakeContext{resume(){this.state='running';return new Promise(resolve=>resume=resolve);}}});
  const pending=audio.enable();audio.mute();resume();
  assert.equal(await pending,false);assert.equal(audio.enabled,false);
  assert.equal(audio.play('jump'),false);
});

test('real game events honor mute, pause, book, hidden tab and fossil discovery',async()=>{
  const {readFile}=await import('node:fs/promises');
  const nodes=new Map();
  const element=id=>{
    if(!nodes.has(id))nodes.set(id,{hidden:true,disabled:false,style:{},attributes:{},classList:{toggle(){}},click(){return this.onclick?.();},setAttribute(name,value){this.attributes[name]=value;}});
    return nodes.get(id);
  };
  let tick;const keys={},events={};
  FakeContext.instances=[];
  const originals=new Map();
  const globals={AudioContext:FakeContext,document:{hidden:false,querySelector:element,querySelectorAll:()=>[],addEventListener:(name,fn)=>events[name]=fn},localStorage:{getItem(){},setItem(){}},requestAnimationFrame:fn=>tick=fn,addEventListener:(name,fn)=>keys[name]=fn,innerWidth:1200,innerHeight:800,devicePixelRatio:1};
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
  try{
    game=await import(dataURL(source+`\nexport {burst,end};export const fossil=()=>objects.find(o=>o.kind==='fossil');export const snapshot=()=>({state,distance});export const cleanup=()=>{audio.mute();clearTimeout(toast.timer);};\n//# sourceURL=game-audio-integration.js`));
    element('#start').click();assert.equal(FakeContext.instances.length,0);
    await element('#sound').click();const ctx=FakeContext.instances[0];
    assert.equal(element('#sound').textContent,'Hang: be');assert.equal(element('#sound').attributes['aria-pressed'],'true');
    assert.equal(ctx.oscillators.length,0); // No replay of muted start.
    element('#start').click();tick();assert.equal(ctx.oscillators.length,2);
    const key=code=>keys.keydown({code,preventDefault(){}});
    key('Space');assert.equal(ctx.oscillators.length,3);key('Space');assert.equal(ctx.oscillators.length,3);
    key('KeyJ');assert.equal(ctx.oscillators.length,4);key('KeyJ');assert.equal(ctx.oscillators.length,4);
    const fossil=game.fossil();game.burst(fossil);assert.equal(ctx.oscillators.length,8); // Crack + discovery chord.
    const active=()=>ctx.oscillators.filter(v=>v.disconnects===0);
    element('#book').click();assert.equal(active().length,0);
    const before=ctx.oscillators.length;key('Space');key('KeyJ');tick();assert.equal(ctx.oscillators.length,before);
    element('#close').click();element('#start').click();assert.equal(active().length,2);
    element('#pause').click();assert.equal(active().length,0);
    const frozen=game.snapshot().distance;tick();assert.equal(game.snapshot().distance,frozen);
    element('#pause').click();element('#start').click();assert.equal(active().length,2);
    document.hidden=true;events.visibilitychange();assert.equal(active().length,0);assert.equal(game.snapshot().state,'pause');
    document.hidden=false;events.visibilitychange();element('#pause').click();
    game.end();assert.equal(active().length,3);
    await element('#sound').click();assert.equal(active().length,0);assert.equal(element('#sound').attributes['aria-pressed'],'false');
    const count=ctx.oscillators.length;element('#start').click();assert.equal(ctx.oscillators.length,count);
  }finally{
    game?.cleanup();
    for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
