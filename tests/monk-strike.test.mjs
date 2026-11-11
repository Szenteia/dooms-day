import test from 'node:test';
import assert from 'node:assert/strict';
import { BoxGeometry, Mesh, MeshBasicMaterial, Scene } from '../dist/vendor/three.module.js';
import { createMonk } from '../dist/monk.js';

function monk() {
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial();
  return createMonk(new Scene(), (_shape, _color, x, y, z, sx, sy, sz, parent) => {
    const part = new Mesh(geometry, material);
    part.position.set(x, y, z);
    part.scale.set(sx, sy, sz);
    parent.add(part);
    return part;
  });
}

function poseSnapshot(root) {
  const snapshot = [];
  root.traverse(node => {
    if (node.name !== 'Staff swing arc') snapshot.push(...node.rotation.toArray().slice(0, 3));
  });
  return snapshot;
}

test('a strike twists the body and staff, then blends back into running without a snap', () => {
  const { root, pose } = monk();
  const staff = root.getObjectByName('Monk staff');
  const torso = root.children[0];
  const run = {phase: 1.2, speed: 18, steering: .4};
  pose(run);
  const baseline = poseSnapshot(root);
  pose({...run, attack: .5});
  assert.ok(torso.rotation.y < -.4);
  assert.ok(staff.rotation.x < -.6);
  assert.ok(Math.abs(torso.rotation.z + .08) < 1e-10);
  pose({...run, attack: .001});
  const ending = poseSnapshot(root);
  assert.ok(ending.every((angle, i) => Math.abs(angle - baseline[i]) < .0001));
  pose(run);
  assert.deepEqual(poseSnapshot(root), baseline);
  assert.equal(root.getObjectByName('Staff swing arc').visible, false);
});

test('the swing reuses one arc and pose sampling is stable during jumps and pause', () => {
  const { root, pose } = monk();
  const arc = root.getObjectByName('Staff swing arc');
  const geometry = arc.geometry;
  const material = arc.material;
  const jump = {phase: 2, speed: 12, airborne: true, attack: .5};
  pose(jump);
  const snapshot = poseSnapshot(root);
  root.updateMatrixWorld(true);
  const boundsBefore = arc.matrixWorld.toArray();
  pose(jump);
  assert.deepEqual(poseSnapshot(root), snapshot);
  root.updateMatrixWorld(true);
  assert.deepEqual(arc.matrixWorld.toArray(), boundsBefore);
  assert.equal(arc.material.opacity, .5);
  for (let i = 0; i < 1000; i++) pose({...jump, attack: (i % 100) / 100});
  assert.equal(arc.geometry, geometry);
  assert.equal(arc.material, material);
  assert.equal(root.children.filter(node => node.name === 'Staff swing arc').length, 1);
  pose({ ...jump, attack: 0 });
  const airborne = poseSnapshot(root);
  pose({ ...jump, attack: 1 });
  assert.ok(poseSnapshot(root).every((angle, i) => Math.abs(angle - airborne[i]) < 1e-10));
});
