import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene } from '../dist/vendor/three.module.js';
import { createEncounterCue } from '../dist/encounter-cue.js';

function cue() {
  const scene = new Scene();
  const status = {hidden: true, classList: {toggle(_name, active) {this.unlocked = active;}}};
  return {scene, status, update: createEncounterCue(scene, status)};
}
const creature = (x, z, type=0) => ({kind: 'creature', x, z, type});

test('the nearest available creature gets a directional cue without revealing its name', () => {
  const {scene, status, update} = cue();
  update([creature(5,-24), creature(-5,-12), {...creature(5,-4),done:true}],0,0,[],new Set(),true);
  assert.match(status.textContent,/Ismeretlen lény · 12 m\n← Húzódj balra/);
  assert.equal(scene.children[0].position.x,-5);
  assert.equal(scene.children[0].visible,true);
  update([creature(5,-12)],5,0,[],new Set(),true);
  assert.match(status.textContent,/Tartsd az irányt/);
  update([creature(5,-12)],0,0,[],new Set(),true);
  assert.match(status.textContent,/Húzódj jobbra →/);
});

test('new discoveries and next-run blessings have different cues and reuse the marker', () => {
  const {scene, status, update} = cue();
  const objects=[creature(-5,-12)];
  update(objects,0,0,[0],new Set([0]),true);
  assert.match(status.textContent,/Feloldás a következő körtől/);
  assert.equal(status.classList.unlocked,false);
  const marker=scene.children[0], geometry=marker.geometry, material=marker.material;
  update(objects,0,0,[0],new Set(),true);
  assert.match(status.textContent,/Homokróka.*\n.*áldást ad/);
  assert.equal(status.classList.unlocked,true);
  assert.equal(marker.geometry,geometry);
  assert.equal(marker.material,material);
  assert.equal(scene.children.length,1);
});

test('pause, a completed encounter and passing the encounter window hide the cue', () => {
  const {scene, status, update} = cue();
  const objects=[creature(-5,-12)];
  update(objects,0,0,[],new Set(),true);
  for (const [list, z, running] of [
    [objects,0,false], [[{...objects[0],done:true}],0,true],
    [objects,-18,true], [[creature(-5,-33)],0,true], [[{kind:'rock',x:0,z:-2}],0,true],
  ]) {
    update(list,0,z,[],new Set(),running);
    assert.equal(status.hidden,true);
    assert.equal(scene.children[0].visible,false);
  }
});
