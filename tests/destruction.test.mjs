import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { createDestruction } from '../dist/destruction.js';
function fixture(count=1, options={}) {
  const scene=new T.Scene(), group=new T.Group();
  group.position.set(3,0,-24);
  const geometry=new T.BoxGeometry(), material=new T.MeshBasicMaterial({color:0x55aa33});
  for(let i=0;i<count;i++) { const m=new T.Mesh(geometry,material);m.position.y=i+1;group.add(m); }
  scene.add(group);
  return {scene,group,geometry,material,system:createDestruction(scene,{random:()=>.5,...options})};
}
test('multipart models retain original geometry, material and world placement',()=>{
  const {scene,group,system,geometry,material}=fixture(4);
  group.rotation.y=.6;group.scale.setScalar(2);group.updateWorldMatrix(true,true);
  const expected=group.children.map(m=>m.matrixWorld.clone());
  system.shatter(group,'tree');
  assert.equal(system.count,4);assert.equal(group.visible,false);
  scene.children.filter(m=>m.isMesh).forEach((m,i)=>{
    assert.equal(m.geometry,geometry);assert.equal(m.material,material);
    m.updateMatrixWorld();assert.ok(m.matrixWorld.elements.every((v,j)=>Math.abs(v-expected[i].elements[j])<1e-9));
  });
});
test('solid rocks split, fall, rotate and expire without disposing source assets',()=>{
  const {scene,group,system,geometry,material}=fixture();let disposed=0;
  geometry.addEventListener('dispose',()=>disposed++);material.addEventListener('dispose',()=>disposed++);
  system.shatter(group,'rock');assert.equal(system.count,8);
  const piece=scene.children.find(m=>m.isMesh),before=piece.position.clone();
  system.update(.1);assert.notEqual(piece.position.y,before.y);
  for(let i=0;i<150;i++)system.update(.02);
  assert.equal(system.count,0);assert.equal(scene.children.length,1);assert.equal(disposed,0);
});
test('rapid destruction is bounded and restart cleanup removes all fragments',()=>{
  const {scene,group,system}=fixture(4,{maxFragments:12});
  for(let i=0;i<100;i++)system.shatter(group,'cave');
  assert.equal(system.count,12);assert.equal(scene.children.filter(m=>m.isMesh).length,12);
  system.clear();assert.equal(system.count,0);assert.equal(scene.children.length,1);
});
test('zero time leaves debris frozen and floor bounce stays above ground',()=>{
  const {scene,group,system}=fixture();system.shatter(group,'rock');
  const m=scene.children.find(m=>m.isMesh),p=m.position.clone();system.update(0);assert.deepEqual(m.position,p);
  for(let i=0;i<60;i++){system.update(.02);assert.ok(m.position.y>=.18);}
});
