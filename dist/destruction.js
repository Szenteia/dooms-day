import * as T from './vendor/three.module.js';

// Fragments borrow source geometry/materials. Never dispose those shared assets here.
export function createDestruction(scene, { maxFragments = 120, random = Math.random } = {}) {
  const fragments = [];
  const range = (a, b) => a + random() * (b - a);
  const position = new T.Vector3();
  const rotation = new T.Quaternion();
  const scale = new T.Vector3();

  function removeFirst() {
    scene.remove(fragments.shift().mesh);
  }

  function shatter(group, kind) {
    group.updateWorldMatrix(true, true);
    const sources = [];
    group.traverse(node => { if (node.isMesh) sources.push(node); });
    // Multipart models keep their silhouette; solid rocks split into eight chips.
    const solid = sources.length === 1;
    const count = solid ? 8 : Math.min(sources.length, 18);
    for (let i = 0; i < count; i++) {
      const source = sources[solid ? 0 : i];
      source.matrixWorld.decompose(position, rotation, scale);
      const piece = new T.Mesh(source.geometry, source.material);
      piece.position.copy(position);
      piece.quaternion.copy(rotation);
      piece.scale.copy(scale);
      if (solid) {
        piece.scale.multiplyScalar(.35);
        piece.position.x += range(-.5, .5);
        piece.position.y += range(-.2, .4);
        piece.position.z += range(-.5, .5);
      }
      piece.castShadow = true;
      scene.add(piece);
      fragments.push({
        mesh: piece,
        velocity: new T.Vector3(range(-4, 4), range(3, 7), range(-5, 2)),
        spin: new T.Vector3(range(-5, 5), range(-4, 4), range(-5, 5)),
        initialScale: piece.scale.clone(),
        age: 0,
        lifetime: kind === 'fossil' ? 1.8 : 1.4,
        bounced: false,
      });
      while (fragments.length > maxFragments) removeFirst();
    }
    group.visible = false;
  }

  function update(dt) {
    for (let i = fragments.length - 1; i >= 0; i--) {
      const f = fragments[i];
      f.age += dt;
      if (f.age >= f.lifetime) {
        scene.remove(f.mesh);
        fragments.splice(i, 1);
        continue;
      }
      f.velocity.y -= 18 * dt;
      f.mesh.position.addScaledVector(f.velocity, dt);
      f.mesh.rotation.x += f.spin.x * dt;
      f.mesh.rotation.y += f.spin.y * dt;
      f.mesh.rotation.z += f.spin.z * dt;
      if (f.mesh.position.y < .18) {
        f.mesh.position.y = .18;
        f.velocity.y = f.bounced ? 0 : Math.abs(f.velocity.y) * .22;
        f.velocity.x *= .55;
        f.velocity.z *= .55;
        f.bounced = true;
      }
      const shrink = 1 - T.MathUtils.smoothstep(f.age / f.lifetime, .55, 1);
      f.mesh.scale.copy(f.initialScale).multiplyScalar(shrink);
    }
  }

  function clear() {
    while (fragments.length) removeFirst();
  }

  return { shatter, update, clear, get count() { return fragments.length; } };
}
