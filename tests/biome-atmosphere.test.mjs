import test from 'node:test';
import assert from 'node:assert/strict';
import { Color, DirectionalLight, FogExp2, HemisphereLight, Scene } from '../dist/vendor/three.module.js';
import { createBiomeAtmosphere } from '../dist/biome-atmosphere.js';
import { BIOME_LENGTH } from '../dist/biome-scenery.js';

function atmosphere() {
  const scene = new Scene();
  scene.background = new Color();
  scene.fog = new FogExp2(0);
  const hemisphere = new HemisphereLight();
  const sun = new DirectionalLight();
  const update = createBiomeAtmosphere(scene, hemisphere, sun);
  return distance => {
    update(distance);
    assert.ok(scene.fog.color.equals(scene.background));
    return {
      sky: scene.background.clone(),
      fog: scene.fog.density,
      ambient: hemisphere.color.clone(),
      sun: sun.color.clone(),
    };
  };
}

test('the sky, fog and lighting blend smoothly around every boundary', () => {
  const sample = atmosphere();
  for (let biome = 1; biome <= 6; biome++) {
    const boundary = biome * BIOME_LENGTH;
    const before = sample(boundary - 36);
    const after = sample(boundary + 36);
    const middle = sample(boundary);
    const outgoingPlateau = sample(boundary - 60);
    const incomingPlateau = sample(boundary + 60);
    const justBefore = sample(boundary - .01);
    const justAfter = sample(boundary + .01);
    for (const color of ['sky', 'ambient', 'sun']) {
      assert.ok(!before[color].equals(after[color]));
      for (const channel of ['r', 'g', 'b']) {
        assert.ok(Math.abs(before[color][channel] - outgoingPlateau[color][channel]) < 1e-8);
        assert.ok(Math.abs(after[color][channel] - incomingPlateau[color][channel]) < 1e-8);
        const midpoint = (before[color][channel] + after[color][channel]) / 2;
        assert.ok(Math.abs(middle[color][channel] - midpoint) < 1e-8);
        assert.ok(Math.abs(justBefore[color][channel] - justAfter[color][channel]) < .001);
      }
    }
    assert.ok(Math.abs(middle.fog - (before.fog + after.fog) / 2) < 1e-8);
  }
});

test('the fifth biome wraps to desert and a restart restores the desert instantly', () => {
  const sample = atmosphere();
  const desert = sample(0);
  assert.equal(desert.sky.getHexString(), 'd6af87');
  assert.deepEqual(sample(5 * BIOME_LENGTH + 36), desert);
  assert.notDeepEqual(sample(4 * BIOME_LENGTH + 100), desert);
  assert.deepEqual(sample(0), desert);
});
