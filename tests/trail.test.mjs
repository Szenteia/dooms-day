import test from 'node:test';
import assert from 'node:assert/strict';
import { planTrailObstacle, biomeAt } from '../dist/biome-scenery.js';

test('every seed retains the opening rock, tall gate and first fossil', () => {
  for (let seed = 0; seed < 100; seed++) {
    assert.equal(planTrailObstacle(0,seed),null);
    assert.deepEqual([1,2,3].map(n=>planTrailObstacle(n,seed)),[
      {kind:'rock',x:0,z:-48,biome:0},
      {kind:'cave',x:3,z:-80,biome:0},
      {kind:'fossil',x:-3,z:-112,biome:0},
    ]);
  }
});

test('trail plans repeat independently of loading order and differ across runs', () => {
  const forward=Array.from({length:100},(_,i)=>planTrailObstacle(i+4,123));
  const reverse=Array.from({length:100},(_,i)=>planTrailObstacle(103-i,123)).reverse();
  assert.deepEqual(forward,reverse);
  const other=Array.from({length:100},(_,i)=>planTrailObstacle(i+4,456));
  assert.notDeepEqual(forward,other);
  assert.ok(forward.some((o,i)=>o.x!==other[i].x));
  assert.ok(forward.some((o,i)=>o.kind!==other[i].kind));
  assert.equal(new Set(forward.map(o=>o.x)).size,3);
});

test('planned obstacles keep spacing, fossil cadence and the biome at their actual position', () => {
  const fossilBiomes=new Set();
  for (let seed = 0; seed < 100; seed++) {
    let previous=-112;
    for (let n = 4; n < 1000; n++) {
      const obstacle=planTrailObstacle(n,seed);
      const distance=-obstacle.z;
      assert.ok(distance>=n*32+10 && distance<n*32+22);
      assert.ok(previous-obstacle.z>=20);
      assert.ok(['rock','cave','bush','fossil'].includes(obstacle.kind));
      assert.equal(obstacle.kind==='fossil',n%3===0);
      assert.equal(obstacle.biome,biomeAt(distance));
      if(obstacle.kind==='fossil')fossilBiomes.add(obstacle.biome);
      previous=obstacle.z;
    }
  }
  assert.equal(fossilBiomes.size,5);
});
