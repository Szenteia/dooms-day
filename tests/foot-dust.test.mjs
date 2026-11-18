import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { createFootDust } from '../dist/foot-dust.js';

function dust() {
  const scene = new T.Scene();
  const effect = createFootDust(scene, {random: () => .5});
  return {...effect, mesh: scene.children[0], scene};
}
const active = mesh => {
  const matrix = new T.Matrix4();
  let count = 0;
  for (let i=0;i<mesh.count;i++) {
    mesh.getMatrixAt(i,matrix);
    if(matrix.determinant()>0)count++;
  }
  return count;
};

test('travel emits dust, off-road steps emit more, and jumping lets it expire', () => {
  const road=dust(), verge=dust();
  road.update(.04,0,-3,true,false,'#d7b98b');
  verge.update(.04,6,-3,true,true,'#719477');
  assert.equal(active(road.mesh),1);
  assert.equal(active(verge.mesh),2);
  const tint = new T.Color();
  verge.mesh.getColorAt(0,tint);
  assert.equal(tint.getHexString(),'719477');
  for(let i=1;i<=20;i++)verge.update(.04,6,-3-i,false,true,'#719477');
  assert.equal(active(verge.mesh),0);
  assert.equal(verge.mesh.visible,false);
});

test('pause freezes transforms and a fresh run clears every active instance', () => {
  const effect=dust();
  effect.update(.04,0,-3,true,false,'#d7b98b');
  const before=effect.mesh.instanceMatrix.array.slice();
  effect.update(0,9,-20,true,true,'#719477');
  assert.deepEqual(effect.mesh.instanceMatrix.array,before);
  effect.clear();
  assert.equal(active(effect.mesh),0);
  assert.equal(effect.mesh.visible,false);
  effect.update(.04,0,-.5,true,false,'#d7b98b');
  assert.equal(active(effect.mesh),0);
});

test('a long run reuses a bounded instance pool with finite transforms', () => {
  const effect=dust();
  const geometry=effect.mesh.geometry, material=effect.mesh.material;
  for(let frame=1;frame<=5000;frame++)effect.update(.04,Math.sin(frame)*6,-frame*.8,true,true,'#ce995d');
  assert.equal(effect.scene.children.length,1);
  assert.equal(effect.mesh.count,24);
  assert.equal(effect.mesh.geometry,geometry);
  assert.equal(effect.mesh.material,material);
  assert.ok([...effect.mesh.instanceMatrix.array].every(Number.isFinite));
  assert.ok(active(effect.mesh)<=24);
});
