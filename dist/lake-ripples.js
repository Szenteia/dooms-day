import * as T from './vendor/three.module.js';
import { CHUNK_LENGTH, biomeAt } from './biome-scenery.js';

export const WATER_LEVEL = .035;
const CAPACITY = 24;

// Terrain/water chunks choose their biome from the chunk's starting distance.
const hasWater = distance => biomeAt(Math.floor(distance / CHUNK_LENGTH) * CHUNK_LENGTH) === 3;

export function createLakeRipples(scene) {
  const material = new T.MeshBasicMaterial({
    color: '#ffffff', transparent: true, opacity: .28,
    blending: T.AdditiveBlending, depthWrite: false, toneMapped: false,
  });
  const mesh = new T.InstancedMesh(new T.RingGeometry(.96, 1, 32), material, CAPACITY);
  mesh.name = 'Lake ripples';
  mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);
  mesh.frustumCulled = false;
  mesh.count = 0;
  scene.add(mesh);
  const transform = new T.Object3D();
  transform.rotation.x = -Math.PI / 2;
  const tint = new T.Color();
  let time = 0;

  function update(dt, distance) {
    time += dt;
    mesh.count = 0;
    const firstCell = Math.floor(distance / 24) - 2;
    for (let i = 0; i < CAPACITY; i++) {
      const cell = firstCell + Math.floor(i / 2);
      const center = cell * 24 + 12;
      // Keep complete rings inside the existing water strips at biome borders.
      if (!hasWater(center - 3) || !hasWater(center + 3)) continue;
      const phase = (time * .3 + cell * .173) % 1;
      const radius = 1 + Math.sin(phase * Math.PI) * 1.8;
      const side = i % 2 ? 1 : -1;
      transform.position.set(side * (20 + Math.sin(cell * 12.9) * 6), WATER_LEVEL + .005, -center);
      transform.scale.set(radius, radius * .45, 1);
      transform.updateMatrix();
      mesh.setMatrixAt(mesh.count, transform.matrix);
      tint.set('#a4ded4').multiplyScalar(Math.sin(phase * Math.PI) ** 2);
      mesh.setColorAt(mesh.count, tint);
      mesh.count++;
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }
  function clear() {
    time = 0;
    mesh.count = 0;
  }
  return { update, clear };
}
