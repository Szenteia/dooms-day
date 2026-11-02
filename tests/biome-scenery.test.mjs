import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { biomeAt,planScenery,buildScenery } from '../dist/biome-scenery.js';
test('world order and boundary vegetation follow absolute distance',()=>{
  assert.deepEqual([0,420,840,1260,1680,2100].map(biomeAt),[0,1,2,3,4,0]);
  for(let n=0;n<1000;n++)for(const p of planScenery(n,99)) {
    assert.equal(p.biome,biomeAt(-p.z));assert.ok(-p.z>=n*32&&-p.z<(n+1)*32);
    assert.ok(p.x>=-19&&p.x<19);assert.ok(p.scale>=.8&&p.scale<1.2);
  }
});
test('layout repeats by seed and chunk, independent of loading order',()=>{
  const first=planScenery(12,1234);planScenery(44,1234);planScenery(1,1234);
  assert.deepEqual(planScenery(12,1234),first);
  assert.notDeepEqual(planScenery(12,5678),first);
  assert.notDeepEqual(planScenery(13,1234),first);
});
test('generation remains bounded and preserves the opening corridor',()=>{
  for(let seed=0;seed<500;seed++)for(let n=0;n<3;n++) {
    const result=planScenery(n,seed);assert.ok(result.length<=12);
    if(n<2)assert.ok(result.every(p=>Math.abs(p.x)>=5));
    else assert.equal(result.length,12);
  }
});
test('five tree silhouettes differ, stay parented and share renderer assets',()=>{
  const geo=new T.BoxGeometry(),mat=new T.MeshBasicMaterial(),layouts=[];
  const mesh=(shape,color,x,y,z,sx,sy,sz,parent)=>{
    const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.userData.shape=shape;parent.add(m);return m;
  };
  for(let biome=0;biome<5;biome++) {
    for(const kind of ['tree','bush','rock']) {
      const g=new T.Group(),radius=buildScenery(kind,biome,g,mesh,{tree:'#557755',rock:'#888888'});
      assert.ok(radius>0&&Number.isFinite(radius));assert.ok(g.children.length<=10);
      for(const m of g.children){assert.equal(m.parent,g);assert.equal(m.geometry,geo);assert.equal(m.material,mat);}
      if(kind==='tree')layouts.push(JSON.stringify(g.children.map(m=>[m.userData.shape,...m.position.toArray(),...m.scale.toArray()])));
    }
  }
  assert.equal(new Set(layouts).size,5);
});
