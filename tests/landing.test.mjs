import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { createJumpController, JUMP_PEAK } from '../dist/movement.js';
import { createMonk } from '../dist/monk.js';

test('early presses expire, late presses trigger exactly one follow-up jump', () => {
  const jump = createJumpController();
  jump.request();
  jump.update(.3);
  jump.request();
  jump.update(.7);
  assert.equal(jump.airborne, false);
  jump.request();
  jump.update(.9);
  jump.request();
  jump.update(.12);
  assert.equal(jump.airborne, true);
  assert.ok(jump.height > 0);
  jump.update(.98);
  assert.equal(jump.airborne, false);
});

test('peak and duration are retained and landing recovery freezes without time', () => {
  const jump = createJumpController();
  jump.request();
  jump.update(.5);
  assert.equal(jump.height, JUMP_PEAK);
  jump.update(.5);
  assert.equal(jump.height, 0);
  assert.equal(jump.landing, 1);
  jump.update(0);
  assert.equal(jump.landing, 1);
  jump.update(.11);
  assert.ok(Math.abs(jump.landing - .25) < 1e-10);
  jump.update(.11);
  assert.equal(jump.landing, 0);
});

test('restart clears queued input and landing pose', () => {
  const jump = createJumpController();
  jump.request();
  jump.update(.9);
  jump.request();
  jump.reset();
  jump.update(.2);
  assert.equal(jump.airborne, false);
  assert.equal(jump.landing, 0);
});

test('landing bends the actual monk rig and recovers without changing the root', () => {
  const geometry = new T.BoxGeometry();
  const material = new T.MeshBasicMaterial();
  const monk = createMonk(new T.Scene(), (_, __, x,y,z,sx,sy,sz,parent) => {
    const mesh = new T.Mesh(geometry, material);
    mesh.position.set(x,y,z); mesh.scale.set(sx,sy,sz); parent.add(mesh); return mesh;
  });
  monk.root.position.set(3,0,-48);
  monk.pose({speed:12, phase:1, landing:0});
  const torso = monk.root.children[0];
  const normal = torso.position.y;
  monk.pose({speed:12, phase:1, landing:1});
  assert.ok(torso.position.y < normal - .1);
  assert.deepEqual(monk.root.position.toArray(), [3,0,-48]);
  monk.pose({speed:12, phase:1, landing:0});
  assert.equal(torso.position.y, normal);
});
