import test from 'node:test';
import assert from 'node:assert/strict';
import { findUpcomingObstacle, isJumpWindowOpen } from '../dist/obstacle-cue.js';

function obstacle(x, z, height) {
  return {
    bounds: { min: { x: x-.5 }, max: { x: x+.5, y: height, z } },
  };
}

test('the cue follows the selected lane and uses the nearest leading edge', () => {
  const high = obstacle(3, -15, 2.9);
  const low = obstacle(0, -8, 1.25);
  const far = obstacle(0, -16, 1.25);
  const objects = [high, far, low];
  assert.deepEqual(findUpcomingObstacle(objects, 0, 0, 12), {
    bounds: low.bounds, distance: 8, tall: false,
  });
  assert.deepEqual(findUpcomingObstacle(objects, 3, 0, 12), {
    bounds: high.bounds, distance: 15, tall: true,
  });
});

test('destroyed, passed, distant objects and creatures do not get a cue', () => {
  const objects = [
    {...obstacle(0, -3, 1.25), done: true},
    obstacle(0, 2, 2.9),
    obstacle(0, -30, 2.9),
    {kind: 'creature', bounds: null},
  ];
  assert.equal(findUpcomingObstacle(objects, 0, 0, 12), null);
  assert.equal(findUpcomingObstacle(objects, 0, 0, 24).distance, 30);
});

test('jump timing waits for the full obstacle to fit under the arc', () => {
  const bounds = { min: { z: -10 }, max: { y: 1.25, z: -8 } };
  assert.equal(isJumpWindowOpen(bounds, 3, 12), false);
  assert.equal(isJumpWindowOpen(bounds, -3, 12), true);
  assert.equal(isJumpWindowOpen(bounds, -7.5, 12), false);
  assert.equal(isJumpWindowOpen(bounds, -3, 5.4), false);
  assert.equal(isJumpWindowOpen(bounds, -6.1, 5.4), true);
});

test('a tall or too wide obstacle never gets a jump-now cue', () => {
  const tall = { min: { z: -10 }, max: { y: 2.9, z: -8 } };
  const wide = { min: { z: -18 }, max: { y: 1.25, z: -8 } };
  for (let z = 2; z >= -10; z -= .05) {
    assert.equal(isJumpWindowOpen(tall, z, 12), false);
    assert.equal(isJumpWindowOpen(wide, z, 12), false);
  }
});
