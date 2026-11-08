import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { createRunnerCamera } from '../dist/runner-camera.js';

const frame = { x: 0, z: -60, jumpHeight: 0, speed: 12, dt: 1/60 };

test('portrait camera keeps both edge lanes inside the frame after resize', () => {
  const camera = new T.PerspectiveCamera(52, 16/9, .1, 500);
  const follow = createRunnerCamera(camera);
  follow(frame);
  camera.aspect = 9/20;
  camera.updateProjectionMatrix();
  for (const x of [-6, 6]) {
    for (let i = 0; i < 90; i++) follow({ ...frame, x });
    camera.updateMatrixWorld();
    for (const edge of [-6, 6]) {
      const projected = new T.Vector3(edge, 0, frame.z).project(camera);
      assert.ok(Math.abs(projected.x) < .98);
      assert.ok(Math.abs(projected.y) < .98);
    }
  }
});

test('smoothing follows elapsed time instead of frame count', () => {
  function sample(fps) {
    const camera = new T.PerspectiveCamera(52, 16/9, .1, 500);
    const follow = createRunnerCamera(camera);
    follow(frame);
    for (let i = 0; i < fps/2; i++) follow({ ...frame, x: 6, speed: 24, dt: 1/fps });
    return camera;
  }
  const slow = sample(30), fast = sample(120);
  assert.ok(Math.abs(slow.position.x - fast.position.x) < 1e-9);
  assert.ok(Math.abs(slow.fov - fast.fov) < 1e-9);
});

test('restart snaps to the new run and reduced motion holds framing steady during a jump', () => {
  const camera = new T.PerspectiveCamera(52, 16/9, .1, 500);
  const follow = createRunnerCamera(camera);
  follow({ ...frame, x: 6, z: -500, speed: 24, jumpHeight: 2.25 });
  assert.equal(camera.fov, 58);
  follow({ ...frame, z: 0, speed: 24, jumpHeight: 2.25, reducedMotion: true });
  assert.deepEqual(camera.position.toArray(), [0, 6.8, 12]);
  assert.equal(camera.fov, 52);
});
