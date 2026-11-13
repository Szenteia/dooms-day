import { Mesh, MeshBasicMaterial, RingGeometry } from './vendor/three.module.js';
import { SPECIES } from './creatures.js';
import { ENCOUNTER_WIDTH, ENCOUNTER_DEPTH } from './encounters.js';

export function createEncounterCue(scene, status) {
  const material = new MeshBasicMaterial({color: '#f9bd65', toneMapped: false});
  const marker = new Mesh(new RingGeometry(.94, 1, 40), material);
  marker.rotation.x = -Math.PI / 2;
  marker.scale.set(ENCOUNTER_WIDTH, ENCOUNTER_DEPTH, 1);
  marker.visible = false;
  scene.add(marker);

  return function update(objects, playerX, playerZ, knownIds, discoveries, running) {
    let nearest = null;
    let nearestDistance = Infinity;
    if (running) for (const object of objects) {
      if (object.kind !== 'creature' || object.done) continue;
      const ahead = playerZ - object.z;
      if (ahead < -ENCOUNTER_DEPTH || ahead > 32) continue;
      const distance = Math.abs(ahead);
      if (distance < nearestDistance) {
        nearest = object;
        nearestDistance = distance;
      }
    }
    marker.visible = !!nearest;
    status.hidden = !nearest;
    if (!nearest) return;

    marker.position.set(nearest.x, .1, nearest.z);
    const unlocked = knownIds.includes(nearest.type) && !discoveries.has(nearest.type);
    material.color.setHex(unlocked ? 0x9ef6da : 0xf9bd65);
    status.classList.toggle('unlocked', unlocked);
    const name = knownIds.includes(nearest.type) ? SPECIES[nearest.type] : 'Ismeretlen lény';
    const direction = Math.abs(nearest.x - playerX) <= ENCOUNTER_WIDTH ? 'Tartsd az irányt'
      : nearest.x < playerX ? '← Húzódj balra' : 'Húzódj jobbra →';
    const reward = unlocked ? 'Találkozáskor áldást ad' : 'Feloldás a következő körtől';
    const label = name + ' · ' + Math.ceil(Math.max(0, playerZ - nearest.z)) + ' m\n' + direction + ' · ' + reward;
    if (status.textContent !== label) status.textContent = label;
  };
}
