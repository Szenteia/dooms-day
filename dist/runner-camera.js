const BASE_FOV = 52;
const BASE_DISTANCE = 12;
const TRACK_HALF_FRAME = 9.2;
const DAMPING = 8;

export function createRunnerCamera(camera) {
  let previousZ = Infinity;
  let previousAspect = 0;
  let trackedX = 0;
  let lift = 0;

  return function follow({ x, z, jumpHeight, speed, dt, reducedMotion = false }) {
    const aspect = camera.aspect;
    const snap = !Number.isFinite(previousZ) || z > previousZ || aspect !== previousAspect;
    const blend = snap ? 1 : 1 - Math.exp(-DAMPING * dt);
    previousZ = z;
    previousAspect = aspect;

    const portraitDistance = TRACK_HALF_FRAME / (aspect * Math.tan(BASE_FOV * Math.PI / 360));
    const distance = Math.max(BASE_DISTANCE, portraitDistance);
    trackedX += (x * .45 - trackedX) * blend;
    lift = reducedMotion ? 0 : lift + (jumpHeight * .25 - lift) * blend;
    const pace = Math.min(1, Math.max(0, (speed - 12) / 12));
    const targetFov = BASE_FOV + pace * 6;
    const nextFov = reducedMotion ? BASE_FOV : camera.fov + (targetFov - camera.fov) * blend;
    if (Math.abs(nextFov - camera.fov) > .001) {
      camera.fov = nextFov;
      camera.updateProjectionMatrix();
    }
    camera.position.set(trackedX, 6.8 + (distance - BASE_DISTANCE) * .18 + lift, z + distance);
    camera.lookAt(trackedX, 1.7 + lift * .35, z - 14);
  };
}
