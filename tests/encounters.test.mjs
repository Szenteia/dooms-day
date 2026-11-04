import test from 'node:test';
import assert from 'node:assert/strict';
import {canMeetCreature, createCreatureRun, creatureIds} from '../dist/encounters.js';

test('the center and opposite lane miss a roadside creature', () => {
  assert.equal(canMeetCreature(0, -72, -5, -72), false);
  assert.equal(canMeetCreature(6, -72, -5, -72), false);
  assert.equal(canMeetCreature(-3, -67, -5, -72), true);
  assert.equal(canMeetCreature(-6, -66, -5, -72), false);
});

test('persisted discovery survives refresh but cannot bless the current run', () => {
  const saved = [2];
  const firstRun = createCreatureRun(saved);
  assert.equal(firstRun.meet(0), 'discovered');
  saved.push(0);
  assert.equal(firstRun.meet(0), 'none');
  assert.equal(firstRun.meet(2), 'blessing');
  assert.equal(firstRun.discoveries.size, 1);
  const reloaded = JSON.parse(JSON.stringify(saved));
  assert.equal(createCreatureRun(reloaded).meet(0), 'blessing');
});

test('legacy duplicates and invalid creature IDs cannot become discoveries', () => {
  assert.deepEqual(creatureIds([1, 1, -1, 5, '2', null, 4]), [1, 4]);
  assert.deepEqual(creatureIds(null), []);
  const run = createCreatureRun([]);
  assert.equal(run.meet(5), 'none');
  assert.equal(run.discoveries.size, 0);
});
