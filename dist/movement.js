export const RUNNER_HALF_DEPTH = .24;
export const ROAD_WIDTH = 9;
export const OFF_ROAD_FACTOR = 0.45;
export const JUMP_DURATION = 1;
export const JUMP_PEAK = 2.25;
export const LOW_OBSTACLE_HEIGHT = 1.25;
export const TALL_OBSTACLE_HEIGHT = 2.9;

export function isOffRoad(x) {
  return Math.abs(x) > ROAD_WIDTH / 2;
}

export function targetRunSpeed(distance, x) {
  const speed = Math.min(24, 12 + distance / 200);
  return isOffRoad(x) ? speed * OFF_ROAD_FACTOR : speed;
}

export function jumpHeight(elapsed) {
  const progress = elapsed / JUMP_DURATION;
  if (progress <= 0 || progress >= 1) return 0;
  return 4 * JUMP_PEAK * progress * (1 - progress);
}

export function touchesObstacle(bounds, x, z, feetY) {
  return x + 0.28 > bounds.min.x && x - 0.28 < bounds.max.x
    && z + RUNNER_HALF_DEPTH > bounds.min.z && z - RUNNER_HALF_DEPTH < bounds.max.z
    && feetY < bounds.max.y;
}
