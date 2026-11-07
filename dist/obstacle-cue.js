import { JUMP_DURATION, JUMP_PEAK, LOW_OBSTACLE_HEIGHT, RUNNER_HALF_DEPTH } from './movement.js';

export function findUpcomingObstacle(objects, laneX, playerZ, speed) {
  const lookAhead = Math.max(8, speed * 1.6);
  let nearest = null;
  let distance = lookAhead;
  for (const obstacle of objects) {
    if (obstacle.done || !obstacle.bounds) continue;
    const { min, max } = obstacle.bounds;
    if (laneX + .28 <= min.x || laneX - .28 >= max.x) continue;
    const gap = playerZ - max.z;
    if (gap < 0 || gap > lookAhead || (nearest && gap >= distance)) continue;
    nearest = obstacle;
    distance = gap;
  }
  if (!nearest) return null;
  return {
    bounds: nearest.bounds,
    distance,
    tall: nearest.bounds.max.y > LOW_OBSTACLE_HEIGHT + .01,
  };
}

// Estimate arrival at both faces using current speed. Reserve a little height and
// time for acceleration, input sampling, and the next simulation step.
export function isJumpWindowOpen(bounds, playerZ, speed) {
  const clearance = bounds.max.y + .08;
  if (speed <= 0 || clearance >= JUMP_PEAK) return false;

  const halfWindow = JUMP_DURATION * Math.sqrt(1 - clearance / JUMP_PEAK) / 2;
  const ascent = JUMP_DURATION / 2 - halfWindow;
  const descent = JUMP_DURATION / 2 + halfWindow;
  const enter = (playerZ - bounds.max.z - RUNNER_HALF_DEPTH) / speed;
  const exit = (playerZ - bounds.min.z + RUNNER_HALF_DEPTH) / speed;
  return enter >= ascent + .04 && exit <= descent - .04;
}
