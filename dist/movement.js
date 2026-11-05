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
    && z + 0.24 > bounds.min.z && z - 0.24 < bounds.max.z
    && feetY < bounds.max.y;
}

// A late airborne press may launch the next jump on landing, once only.
export function createJumpController() {
  const bufferDuration = 0.15;
  const landingDuration = 0.22;
  let elapsed = JUMP_DURATION;
  let bufferedFor = 0;
  let landingAge = landingDuration;

  return {
    request() {
      if (elapsed >= JUMP_DURATION) {
        elapsed = 0;
        landingAge = landingDuration;
      } else {
        bufferedFor = bufferDuration;
      }
    },
    update(dt) {
      if (!Number.isFinite(dt) || dt <= 0) return;
      const untilLanding = JUMP_DURATION - elapsed;
      landingAge = Math.min(landingDuration, landingAge + dt);
      if (elapsed < JUMP_DURATION && dt >= untilLanding) {
        const remaining = dt - untilLanding;
        if (bufferedFor > 0 && bufferedFor >= untilLanding) {
          elapsed = Math.min(JUMP_DURATION, remaining);
          landingAge = landingDuration;
        } else {
          elapsed = JUMP_DURATION;
          landingAge = Math.min(landingDuration, remaining);
        }
        bufferedFor = 0;
      } else {
        elapsed = Math.min(JUMP_DURATION, elapsed + dt);
        bufferedFor = Math.max(0, bufferedFor - dt);
      }
    },
    reset() {
      elapsed = JUMP_DURATION;
      bufferedFor = 0;
      landingAge = landingDuration;
    },
    get height() { return jumpHeight(elapsed); },
    get airborne() { return elapsed < JUMP_DURATION; },
    get landing() {
      const recovery = 1 - landingAge / landingDuration;
      return recovery * recovery;
    },
  };
}
