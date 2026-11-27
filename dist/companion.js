import * as T from './vendor/three.module.js';
import { buildCreature, animateCreature } from './creatures.js';
import { creatureIds } from './encounters.js';

// Resolve once at run start. New discoveries/choices never change an active run.
export function resolveCompanion(preference, knownIds) {
  const known = creatureIds(knownIds);
  if (preference === null) return null;
  return known.includes(preference) ? preference : known[0] ?? null;
}

export function createCompanion(scene, mesh) {
  const anchor = new T.Group();
  anchor.name = 'spirit-companion';
  anchor.scale.setScalar(.6);
  anchor.visible = false;
  scene.add(anchor);
  let rig = null, current = null, firstFrame = true;
  const materials = new Map();
  function clear() {
    if (rig) anchor.remove(rig.root);
    for (const material of materials.values()) material.dispose();
    materials.clear();
    rig = null;
    current = null;
    anchor.visible = false;
  }
  return {
    get type() { return current; },
    begin(id) {
      const type = creatureIds([id])[0] ?? null;
      if (type !== current) clear();
      if (type !== null && !rig) {
        rig = buildCreature(type, anchor, mesh);
        // Clone only materials: roadside creatures keep their opaque appearance.
        rig.root.traverse(node => {
          if (!node.isMesh) return;
          if (!materials.has(node.material)) {
            const spirit = node.material.clone();
            spirit.transparent = true;
            spirit.opacity = .58;
            spirit.depthWrite = false;
            spirit.emissive.set('#79d9c4');
            spirit.emissiveIntensity = .4;
            materials.set(node.material, spirit);
          }
          node.material = materials.get(node.material);
          node.castShadow = node.receiveShadow = false;
        });
        current = type;
      }
      anchor.visible = false;
      firstFrame = true;
      if (rig) {
        rig.root.rotation.y = 0;
        animateCreature(rig, 0);
      }
    },
    update(x, z, time, dt) {
      if (!rig) return;
      const targetX = x + 2.1;
      anchor.position.x = firstFrame ? targetX : T.MathUtils.damp(anchor.position.x, targetX, 8, dt);
      anchor.position.y = .15;
      anchor.position.z = z + 2.8;
      rig.root.rotation.y = T.MathUtils.clamp((targetX - anchor.position.x) * -.15, -.3, .3);
      animateCreature(rig, time);
      anchor.visible = true;
      firstFrame = false;
    },
    hide() { anchor.visible = false; }
  };
}
