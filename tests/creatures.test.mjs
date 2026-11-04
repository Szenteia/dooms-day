import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { SPECIES,buildCreature,animateCreature } from '../dist/creatures.js';
const geometry=new T.BoxGeometry(), material=new T.MeshBasicMaterial();
function mesh(shape,color,x,y,z,sx,sy,sz,parent) {
  const m=new T.Mesh(geometry,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;
}
function make(type) {const parent=new T.Group();parent.position.set(5,0,-72);return {parent,rig:buildCreature(type,parent,mesh)};}
test('all five creatures have distinct geometry layouts and bounded model complexity',()=>{
  const layouts=[];
  for(let type=0;type<SPECIES.length;type++) {
    const {parent,rig}=make(type);let count=0;const layout=[];
    parent.traverse(m=>{if(m.isMesh){count++;layout.push([...m.position.toArray(),...m.scale.toArray()]);assert.equal(m.geometry,geometry);assert.equal(m.material,material);}});
    assert.ok(count>=8&&count<=32);assert.equal(rig.type,type);layouts.push(JSON.stringify(layout));
  }
  assert.equal(new Set(layouts).size,5);
});
test('species have their defining animated anatomy',()=>{
  assert.ok(make(0).rig.joints.some(j=>j.g.name==='fox-tail'));
  assert.equal(make(1).rig.joints.filter(j=>j.g.name==='leg').length,4);
  assert.equal(make(2).rig.joints.filter(j=>j.g.name==='leg').length,4);
  assert.equal(make(3).rig.joints.filter(j=>j.g.name==='dragon-segment').length,5);
  assert.equal(make(3).rig.joints.filter(j=>j.g.name==='dragon-fin').length,2);
  assert.equal(make(4).rig.joints.filter(j=>j.g.name==='guardian-arm').length,2);
});
test('animation is deterministic, moves joints and preserves encounter placement',()=>{
  for(let type=0;type<5;type++) {
    const {parent,rig}=make(type);const placement=parent.position.clone();
    animateCreature(rig,0);const start=rig.joints.map(j=>j.g.rotation[j.axis]);
    animateCreature(rig,.8);const next=rig.joints.map(j=>j.g.rotation[j.axis]);
    assert.notDeepEqual(start,next);assert.deepEqual(parent.position,placement);
    animateCreature(rig,.8);assert.deepEqual(rig.joints.map(j=>j.g.rotation[j.axis]),next);
    for(let i=0;i<1000;i++)animateCreature(rig,i*.04,2);
    parent.traverse(m=>{assert.ok([...m.position.toArray(),...m.rotation.toArray().slice(0,3)].every(Number.isFinite));});
  }
});
