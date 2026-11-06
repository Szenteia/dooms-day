import { LOW_OBSTACLE_HEIGHT } from './movement.js';

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
