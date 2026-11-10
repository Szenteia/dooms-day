import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, BoxGeometry, Mesh, MeshBasicMaterial, Scene, Vector3 } from '../dist/vendor/three.module.js';
import { createShrine, occupiesShrineGate } from '../dist/shrine.js';

function makeShrine() {
  const scene = new Scene();
  const geometry = new BoxGeometry();
  const material = new MeshBasicMaterial();
  const mesh = (_shape, _color, x, y, z, width, height, depth, parent) => {
    const part = new Mesh(geometry, material);
    part.position.set(x, y, z);
    part.scale.set(width, height, depth);
    parent.add(part);
    return part;
  };
  const update = createShrine(scene, mesh, '#ce995d');
  return { update, root: scene.children[0], gate: scene.getObjectByName('Shrine departure gate') };
}

test('the gate leaves space for the runner to jump in any lane', () => {
  const { update, gate } = makeShrine();
  const corridor = new Box3(new Vector3(-6.4, .1, -14), new Vector3(6.4, 4.7, -8));
  for (let step = 0; step < 30; step++) {
    update(.04, 11);
    gate.traverse(part => {
      if (part.isMesh) assert.ok(!new Box3().setFromObject(part).intersectsBox(corridor));
    });
  }
  assert.ok(occupiesShrineGate(-7.2, -11));
  assert.ok(occupiesShrineGate(7.2, -11));
  assert.ok(!occupiesShrineGate(3, -11));
  assert.ok(!occupiesShrineGate(7.2, -20));
});

test('flags move on active frames and the shrine reappears on restart', () => {
  const { update, root, gate } = makeShrine();
  const flag = gate.children.find(child => child.isGroup);
  update(0, 0);
  const first = flag.rotation.x;
  update(.25, 8);
  assert.notEqual(flag.rotation.x, first);
  const moving = flag.rotation.x;
  update(0, 8);
  assert.equal(flag.rotation.x, moving);
  update(.04, 100);
  assert.equal(root.visible, false);
  update(.04, 0);
  assert.equal(root.visible, true);
});
