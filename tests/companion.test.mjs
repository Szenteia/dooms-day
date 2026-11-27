import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import {createCompanion,resolveCompanion} from '../dist/companion.js';

function setup(){
  const scene=new T.Scene(),cache=new Map();
  const geometries={box:new T.BoxGeometry(1,1,1),ball:new T.IcosahedronGeometry(1,1),cone:new T.ConeGeometry(1,1,7),cyl:new T.CylinderGeometry(1,1,1,8)};
  let meshCalls=0;
  const mesh=(shape,color,x,y,z,sx,sy,sz,parent)=>{
    meshCalls++;
    if(!cache.has(color))cache.set(color,new T.MeshStandardMaterial({color}));
    const node=new T.Mesh(geometries[shape],cache.get(color));
    node.position.set(x,y,z);node.scale.set(sx,sy,sz);node.castShadow=node.receiveShadow=true;parent.add(node);return node;
  };
  const companion=createCompanion(scene,mesh);
  return {scene,companion,anchor:scene.getObjectByName('spirit-companion'),cache,geometries,count:()=>meshCalls};
}
const meshes=root=>{const out=[];root.traverse(n=>{if(n.isMesh)out.push(n);});return out;};
const transforms=root=>{const out=[];root.traverse(n=>out.push([...n.position,...n.quaternion,...n.scale]));return out;};

test('only previously discovered creatures can be selected, with explicit opt-out and legacy fallback',()=>{
  assert.equal(resolveCompanion(undefined,[]),null);
  assert.equal(resolveCompanion(undefined,[2,0]),2);
  assert.equal(resolveCompanion(0,[2,0]),0);
  assert.equal(resolveCompanion(4,[2,0]),2);
  assert.equal(resolveCompanion(null,[2,0]),null);
  for(const preference of [undefined,-1,5,'0',false,{},NaN])assert.equal(resolveCompanion(preference,['0',-1,5,1,1]),1);
  assert.equal(resolveCompanion(0,null),null);
  const known=[];const current=resolveCompanion(undefined,known);known.push(0);
  assert.equal(current,null);assert.equal(resolveCompanion(undefined,known),0);
});

test('all five companions use cached geometry and private spirit materials without changing originals',()=>{
  const {companion,anchor,cache,geometries}=setup();
  assert.equal(anchor.visible,false);
  for(let type=0;type<5;type++){
    companion.begin(type);companion.update(0,-100,1,.04);
    assert.equal(companion.type,type);assert.equal(anchor.children.length,1);
    assert.equal(anchor.visible,true);assert(meshes(anchor).length>0&&meshes(anchor).length<40);
    for(const node of meshes(anchor)){
      assert(Object.values(geometries).includes(node.geometry));
      assert(![...cache.values()].includes(node.material));
      assert.equal(node.material.opacity,.58);assert.equal(node.material.transparent,true);assert.equal(node.material.depthWrite,false);
      assert.equal(node.castShadow,false);assert.equal(node.receiveShadow,false);
    }
    for(const material of cache.values()){assert.equal(material.opacity,1);assert.equal(material.transparent,false);assert.equal(material.emissive.getHex(),0);}
  }
});

test('same-species restarts reuse model; changed species and opt-out dispose only private materials',()=>{
  const {companion,anchor,cache,geometries,count}=setup();
  let sharedDisposals=0,privateDisposals=0;
  for(const geometry of Object.values(geometries))geometry.addEventListener('dispose',()=>sharedDisposals++);
  companion.begin(0);const model=anchor.children[0],buildCalls=count();
  for(const material of cache.values())material.addEventListener('dispose',()=>sharedDisposals++);
  const privateMaterials=new Set(meshes(anchor).map(n=>n.material));
  for(const material of privateMaterials)material.addEventListener('dispose',()=>privateDisposals++);
  for(let i=0;i<20;i++){companion.begin(0);companion.update(0,-i,1,.04);}
  assert.equal(count(),buildCalls);assert.equal(anchor.children[0],model);assert.equal(privateDisposals,0);
  companion.begin(1);assert.equal(privateDisposals,privateMaterials.size);assert.equal(model.parent,null);
  const next=new Set(meshes(anchor).map(n=>n.material));let nextDisposals=0;
  for(const material of next)material.addEventListener('dispose',()=>nextDisposals++);
  companion.begin(null);assert.equal(nextDisposals,next.size);assert.equal(anchor.children.length,0);assert.equal(anchor.visible,false);assert.equal(sharedDisposals,0);
});

test('following stays grounded behind the hero, animates without allocating and resets deterministically',()=>{
  const {companion,anchor,count}=setup();
  for(let type=0;type<5;type++){
    companion.begin(type);companion.update(0,-20,0,.04);
    assert.deepEqual(anchor.position.toArray(),[2.1,.15,-17.2]);
    const initial=transforms(anchor),built=count();
    companion.update(6,-21,1,.04);
    assert(anchor.position.x>2.1&&anchor.position.x<8.1);assert.equal(anchor.position.z,-18.2);
    assert.notDeepEqual(transforms(anchor),initial);
    for(let i=0;i<500;i++)companion.update(Math.sin(i)*6,-i*2,i/10,.04);
    assert.equal(count(),built);
    assert(transforms(anchor).flat().every(Number.isFinite));
    companion.begin(type);companion.update(0,-20,0,.04);assert.deepEqual(transforms(anchor),initial);
    companion.hide();assert.equal(anchor.visible,false);
  }
  companion.begin(8);companion.update(0,0,0,.04);assert.equal(anchor.visible,false);assert.equal(anchor.children.length,0);
});

test('entrypoint discovers a creature, saves next-run selection, freezes on pause and restores after reload',async()=>{
  const {readFile}=await import('node:fs/promises');
  const nodes=new Map(),keys={};let tick,persisted;
  const element=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,value:'',style:{},classList:{toggle(){}},click(){return this.onclick?.();}});return nodes.get(id);};
  const originals=new Map();
  const globals={document:{hidden:false,querySelector:element,querySelectorAll:()=>[],addEventListener(){}},localStorage:{getItem(){return persisted;},setItem(key,value){assert.equal(key,'dooms-day-v1');persisted=value;}},requestAnimationFrame:fn=>tick=fn,addEventListener:(name,fn)=>keys[name]=fn,innerWidth:1200,innerHeight:800,devicePixelRatio:1};
  for(const [key,value]of Object.entries(globals)){
    originals.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,configurable:true,writable:true});
  }
  const moduleURL=new URL('../dist/game.js',import.meta.url),vendorURL=new URL('../dist/vendor/three.module.js',import.meta.url).href;
  const dataURL=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
  const renderer=`export * from '${vendorURL}';export class WebGLRenderer {shadowMap={};setPixelRatio(){}setSize(){}render(){}}export class Clock {getDelta(){return .04;}}`;
  const source=(await readFile(moduleURL,'utf8')).replace(/from '(\.\/[^']+)'/g,(_,path)=>`from '${path==='./vendor/three.module.js'?dataURL(renderer):new URL(path,moduleURL).href}'`);
  const probe=`\nexport const snapshot=()=>({type:runCompanionId,save:JSON.parse(JSON.stringify(save)),state});export const anchor=scene.getObjectByName('spirit-companion');export const approachFox=()=>{distance=68;lane=-2;x=-5;};export const cleanup=()=>clearTimeout(toast.timer);\n//# sourceURL=companion-integration.js`;
  let game,reloaded;
  try{
    game=await import(dataURL(source+probe));element('#start').click();tick();
    assert.equal(game.snapshot().type,null);assert.equal(game.anchor.children.length,0);
    game.approachFox();tick();assert.deepEqual(game.snapshot().save.creatures,[0]);
    assert.equal(game.snapshot().type,null);assert.equal(game.anchor.visible,false);
    element('#book').click();const select=element('#companion-select');
    assert(element('#modal').innerHTML.includes('Homokróka'));
    select.value='0';select.onchange();assert.equal(JSON.parse(persisted).companion,0);
    assert.equal(game.snapshot().type,null);element('#close').click();
    element('#start').click();tick();assert.equal(game.snapshot().type,0);assert.equal(game.anchor.visible,true);
    const frozen=transforms(game.anchor);element('#pause').click();for(let i=0;i<5;i++)tick();assert.deepEqual(transforms(game.anchor),frozen);
    element('#pause').click();tick();assert.notDeepEqual(transforms(game.anchor),frozen);
    element('#book').click();select.value='none';select.onchange();assert.equal(game.snapshot().type,0);
    assert.equal(JSON.parse(persisted).companion,null);
    select.value='4';select.onchange();assert.equal(JSON.parse(persisted).companion,null); // Undiscovered choice ignored.
    element('#close').click();element('#start').click();tick();assert.equal(game.snapshot().type,null);assert.equal(game.anchor.children.length,0);
    element('#book').click();select.value='0';select.onchange();element('#close').click();game.cleanup();
    reloaded=await import(dataURL(source+probe+'\n// simulate fresh page'));
    element('#start').click();tick();assert.equal(reloaded.snapshot().type,0);assert.deepEqual(reloaded.snapshot().save.creatures,[0]);
    const bookPose=transforms(reloaded.anchor);element('#book').click();tick();assert.deepEqual(transforms(reloaded.anchor),bookPose);
  }finally{
    game?.cleanup();reloaded?.cleanup();
    for(const [key,descriptor]of originals){if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];}
  }
});
