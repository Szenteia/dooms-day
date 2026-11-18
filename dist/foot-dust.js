import * as T from './vendor/three.module.js';

const CAPACITY = 24;
const LIFETIME = .65;
const STEP_LENGTH = Math.PI / 1.25;

export function createFootDust(scene, { random = Math.random } = {}) {
  const material = new T.MeshBasicMaterial({
    color: '#ffffff', transparent: true, opacity: .32, depthWrite: false,
  });
  const mesh = new T.InstancedMesh(new T.IcosahedronGeometry(1, 0), material, CAPACITY);
  mesh.name = 'Footstep dust';
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.frustumCulled = false;
  scene.add(mesh);
  const particles = Array.from({length: CAPACITY}, () => ({age: LIFETIME, x: 0, z: 0, drift: 0}));
  const transform = new T.Object3D();
  const color = new T.Color();
  let cursor = 0, previousZ = 0, travel = 0, foot = 1;
  mesh.setColorAt(0, color);

  function clear() {
    for (let i = 0; i < CAPACITY; i++) {
      particles[i].age = LIFETIME;
      transform.scale.setScalar(0);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = false;
    cursor = travel = previousZ = 0;
    foot = 1;
  }
  clear();

  function update(dt, x, z, grounded, offRoad, groundColor) {
    if (dt <= 0) return;
    for (const particle of particles) particle.age = Math.min(LIFETIME, particle.age + dt);
    travel = grounded ? travel + Math.abs(z - previousZ) : 0;
    previousZ = z;
    if (travel >= STEP_LENGTH) {
      travel %= STEP_LENGTH;
      foot *= -1;
      color.set(groundColor);
      for (let i = 0; i < (offRoad ? 2 : 1); i++) {
        const particle = particles[cursor];
        particle.age = 0;
        particle.x = x + foot * .22 + (random() - .5) * .12;
        particle.z = z + .15;
        particle.drift = (random() - .5) * .8;
        mesh.setColorAt(cursor, color);
        cursor = (cursor + 1) % CAPACITY;
      }
      mesh.instanceColor.needsUpdate = true;
    }
    mesh.visible = false;
    for (let i = 0; i < CAPACITY; i++) {
      const particle = particles[i];
      const progress = particle.age / LIFETIME;
      const size = (.08 + progress * .35) * (1 - T.MathUtils.smoothstep(progress, .5, 1));
      transform.position.set(particle.x + particle.drift * particle.age, .12 + particle.age * .45, particle.z + particle.age * .3);
      transform.scale.set(size, size * .65, size);
      transform.updateMatrix();
      mesh.setMatrixAt(i, transform.matrix);
      if (particle.age < LIFETIME) mesh.visible = true;
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { update, clear };
}
