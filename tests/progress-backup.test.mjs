import test from 'node:test';
import assert from 'node:assert/strict';
import {exportProgress,parseProgressBackup,mergeProgress,attachProgressBackup,MAX_BACKUP_SIZE,ProgressBackupError} from '../dist/progress-backup.js';
const progress=(changes={})=>({best:120,shards:20,runs:3,creatures:[0,2],fossils:[1],...changes});
const wrap=value=>JSON.stringify({game:'dooms-day',version:1,progress:value});

test('backup round trip keeps progression, deduplicates IDs and excludes unknown fields',()=>{
  const original=progress({creatures:[2,0,2],privateData:'not for export',companion:2});
  const text=exportProgress(original);assert(!text.includes('privateData'));assert(!text.includes('companion'));
  assert.deepEqual(parseProgressBackup(text),progress());
  assert.deepEqual(parseProgressBackup(wrap({...progress(),extra:'<script>',__proto__:null})),progress());
  assert.deepEqual(parseProgressBackup(exportProgress(null)),{best:0,shards:0,runs:0,creatures:[],fossils:[]});
});

test('wrong schema, malformed values, future versions and oversized files are rejected',()=>{
  for(const text of ['','not json','null','[]',JSON.stringify({game:'other',version:1,progress:progress()}),JSON.stringify({game:'dooms-day',version:2,progress:progress()}),wrap({}),wrap([])])assert.throws(()=>parseProgressBackup(text),ProgressBackupError);
  for(const field of ['best','shards','runs'])for(const value of [-1,1.5,'10',null,Number.MAX_SAFE_INTEGER+1])assert.throws(()=>parseProgressBackup(wrap(progress({[field]:value}))),ProgressBackupError);
  for(const field of ['creatures','fossils'])for(const value of [null,{},[5],[-1],['0'],[1.5],[[0]]])assert.throws(()=>parseProgressBackup(wrap(progress({[field]:value}))),ProgressBackupError);
  assert.throws(()=>parseProgressBackup(' '.repeat(MAX_BACKUP_SIZE+1)),ProgressBackupError);
  assert.throws(()=>parseProgressBackup(null),ProgressBackupError);
});

test('merge preserves better counters and all discoveries; repeated imports cannot multiply shards',()=>{
  const a=progress(),b=progress({best:80,shards:50,runs:1,creatures:[1],fossils:[0,4]});
  const merged=mergeProgress(a,b);
  assert.deepEqual(merged,{best:120,shards:50,runs:3,creatures:[0,1,2],fossils:[0,1,4]});
  assert.deepEqual(mergeProgress(merged,b),merged);
  assert.deepEqual(mergeProgress(b,a),merged);
  const c=progress({best:200,creatures:[4],fossils:[3]});
  assert.deepEqual(mergeProgress(mergeProgress(a,b),c),mergeProgress(a,mergeProgress(b,c)));
  assert.deepEqual(a,progress());assert.equal(b.shards,50); // No source mutation.
});

test('valid backup can recover malformed current fields without copying extra properties',()=>{
  assert.deepEqual(mergeProgress({best:'bad',runs:-2,shards:90,creatures:[0,9],fossils:null,extra:true},progress()),progress({shards:90}));
  const malicious=JSON.parse(wrap(progress()).replace('"progress":{','"progress":{"__proto__":{"polluted":true},'));
  assert.deepEqual(parseProgressBackup(JSON.stringify(malicious)),progress());assert.equal({}.polluted,undefined);
});

test('panel downloads JSON, releases its URL and validates before committing an import',async()=>{
  const globals=new Map();const set=(key,value)=>{globals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});};
  const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{disabled:false,value:'',textContent:'',files:[],click(){return this.onclick?.();}});return nodes.get(id);};
  let clicked,removed=false,blob,revoke,deferred,appended;
  const create=URL.createObjectURL,revokeURL=URL.revokeObjectURL;
  try{
    set('document',{querySelector:node,body:{append:a=>appended=a},createElement:()=>({click(){clicked={href:this.href,download:this.download};},remove(){removed=true;}})});
    set('setTimeout',fn=>{deferred=fn;});URL.createObjectURL=value=>{blob=value;return 'blob:test';};URL.revokeObjectURL=url=>revoke=url;
    let current=progress(),allowed=true,commits=0;
    const install=()=>attachProgressBackup({getProgress:()=>current,canRestore:()=>allowed,commit:value=>{current={...current,...value};commits++;},refresh:()=>install()});
    install();node('#backup-download').click();assert.equal(appended.download,'dooms-day-progress.json');assert.deepEqual(clicked,{href:'blob:test',download:'dooms-day-progress.json'});assert.equal(removed,true);
    assert.deepEqual(parseProgressBackup(await blob.text()),progress());deferred();assert.equal(revoke,'blob:test');
    const input=node('#backup-file');input.click=()=>{clicked='picker';};node('#backup-restore').click();assert.equal(clicked,'picker');
    input.files=[{size:100,text:async()=>wrap(progress({best:300,creatures:[4]}))}];await input.onchange();assert.equal(commits,1);assert.equal(current.best,300);assert.deepEqual(current.creatures,[0,2,4]);
    let reads=0;input.files=[{size:MAX_BACKUP_SIZE+1,text:async()=>{reads++;}}];await input.onchange();assert.equal(reads,0);assert.equal(commits,1);assert.match(node('#backup-status').textContent,/64 KiB/);
    input.files=[{size:4,text:async()=>'oops'}];await input.onchange();assert.equal(commits,1);
    let resolve;input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];const pending=input.onchange();allowed=false;current.runs++;resolve(wrap(progress()));await pending;
    assert.equal(commits,1);assert.match(node('#backup-status').textContent,/új futás/);assert.equal(input.disabled,false);assert.equal(node('#backup-restore').disabled,true);
  }finally{
    URL.createObjectURL=create;URL.revokeObjectURL=revokeURL;
    for(const [key,descriptor]of globals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});

test('entrypoint commits imports before applying next-run powers and rejects failed writes or a run started while reading',async()=>{
  const {readFile}=await import('node:fs/promises');
  const nodes=new Map();const element=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,disabled:false,files:[],value:'',textContent:'',style:{},classList:{toggle(){}},click(){return this.onclick?.();}});return nodes.get(id);};
  let tick,writeFails=false,persisted=JSON.stringify(progress({best:200,shards:40,runs:2,creatures:[0],fossils:[],localPreference:'keep'}));
  const originals=new Map();
  const globals={document:{hidden:false,querySelector:element,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem(){return persisted;},setItem(key,value){assert.equal(key,'dooms-day-v1');if(writeFails)throw Error('quota');persisted=value;}},requestAnimationFrame:fn=>tick=fn,addEventListener(){},innerWidth:1200,innerHeight:800,devicePixelRatio:1};
  for(const [key,value]of Object.entries(globals)){originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});}
  const moduleURL=new URL('../dist/game.js',import.meta.url),vendorURL=new URL('../dist/vendor/three.module.js',import.meta.url).href;
  const dataURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
  const renderer=`export * from '${vendorURL}';export class WebGLRenderer {shadowMap={};setPixelRatio(){}setSize(){}render(){}}export class Clock {getDelta(){return .04;}}`;
  const source=(await readFile(moduleURL,'utf8')).replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${path==='./vendor/three.module.js'?dataURL(renderer):new URL(path,moduleURL).href}'`);
  let game;
  try{
    game=await import(dataURL(source+`\nexport {end};export const snapshot=()=>({save:JSON.parse(JSON.stringify(save)),active:blessings.active,state});export const meetKnown=()=>creatureRun.meet(1);export const cleanup=()=>clearTimeout(toast.timer);\n//# sourceURL=backup-integration.js`));
    element('#collection').click();
    const input=element('#backup-file');
    input.files=[{size:100,text:async()=>wrap(progress({best:100,shards:60,runs:5,creatures:[1],fossils:[1]}))}];
    await input.onchange();
    const merged=game.snapshot().save;
    assert.equal(merged.best,200);assert.equal(merged.shards,60);assert.equal(merged.runs,5);assert.deepEqual(merged.creatures,[0,1]);assert.deepEqual(merged.fossils,[1]);assert.equal(merged.localPreference,'keep');
    assert.deepEqual(JSON.parse(persisted),merged);assert.deepEqual(game.snapshot().active,[]);
    assert.match(element('#backup-status').textContent,/egyesítettük/);
    element('#close').click();element('#start').click();tick();
    assert.deepEqual(game.snapshot().active,[1]);assert.equal(game.meetKnown(),'blessing');
    element('#book').click();assert.equal(element('#backup-restore').disabled,true);
    let reads=0;input.files=[{size:100,text:async()=>{reads++;return exportProgress(progress());}}];
    const beforeBlocked=game.snapshot().save;await input.onchange();assert.equal(reads,0);assert.deepEqual(game.snapshot().save,beforeBlocked);
    game.end();element('#book').click();
    const beforeFailure=game.snapshot().save,oldStored=persisted;writeFails=true;
    input.files=[{size:100,text:async()=>wrap(progress({best:999,creatures:[4]}))}];await input.onchange();
    assert.deepEqual(game.snapshot().save,beforeFailure);assert.equal(persisted,oldStored);assert.match(element('#backup-status').textContent,/nem tudta elmenteni/);
    writeFails=false;
    let resolve;input.files=[{size:100,text:()=>new Promise(r=>resolve=r)}];const pending=input.onchange();
    element('#close').click();element('#start').click();tick();game.end(); // Ends again before asynchronous file read completes.
    const afterRun=game.snapshot().save;resolve(wrap(progress({best:1000,runs:999,creatures:[4]})));await pending;
    assert.deepEqual(game.snapshot().save,afterRun);assert.match(element('#backup-status').textContent,/új futás/);
  }finally{
    game?.cleanup();
    for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
