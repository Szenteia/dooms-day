import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { CHUNK_LENGTH, biomeAt } from '../dist/biome-scenery.js';
import { WATER_LEVEL, createLakeRipples } from '../dist/lake-ripples.js';

function ripples() {
  const scene = new T.Scene();
  return {...createLakeRipples(scene), scene, mesh: scene.children[0]};
}

test('ripples stay inside lake strips and only above water', () => {
  const effect = ripples(), matrix = new T.Matrix4(), point = new T.Vector3();
  effect.update(.04,0);
  assert.equal(effect.mesh.count,0);
  effect.update(.04,1400);
  assert.ok(effect.mesh.count>0);
  for(let i=0;i<effect.mesh.count;i++) {
    effect.mesh.getMatrixAt(i,matrix);
    point.setFromMatrixPosition(matrix);
    assert.ok(Math.abs(point.y-WATER_LEVEL-.005)<1e-6);
    assert.ok(Math.abs(point.x)-3>8.5 && Math.abs(point.x)+3<35.5);
    for(const edge of [-3,3])assert.equal(biomeAt(Math.floor((-point.z+edge)/CHUNK_LENGTH)*CHUNK_LENGTH),3);
  }
});

test('zero time preserves wave poses and a fresh run clears the effect', () => {
  const effect=ripples();
  effect.update(.3,1400);
  const before=effect.mesh.instanceMatrix.array.slice();
  effect.update(0,1400);
  assert.deepEqual(effect.mesh.instanceMatrix.array,before);
  effect.clear();
  assert.equal(effect.mesh.count,0);
  effect.update(0,1400);
  const first=ripples();
  first.update(0,1400);
  assert.deepEqual(effect.mesh.instanceMatrix.array,first.mesh.instanceMatrix.array);
});

test('streaming through repeated worlds reuses bounded resources', () => {
  const effect=ripples();
  const geometry=effect.mesh.geometry, material=effect.mesh.material;
  for(let distance=0;distance<12000;distance+=7) {
    effect.update(.04,distance);
    assert.ok(effect.mesh.count<=24);
  }
  assert.equal(effect.scene.children.length,1);
  assert.equal(effect.mesh.geometry,geometry);
  assert.equal(effect.mesh.material,material);
  assert.ok([...effect.mesh.instanceMatrix.array].every(Number.isFinite));
});
