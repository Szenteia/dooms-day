import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunCheckpoint } from '../dist/progress.js';

test('rewards survive a reload and repeated checkpoints do not duplicate them', () => {
  const save={shards:40,best:90,creatures:[0],fossils:[2],runs:7};
  let stored;
  const checkpoint=createRunCheckpoint(save,()=>{stored=JSON.stringify(save);});
  checkpoint(41,2);
  assert.equal(JSON.parse(stored).shards,42);
  checkpoint(47,2,true);
  checkpoint(47,2,true);
  assert.equal(JSON.parse(stored).shards,42);
  checkpoint(80,7);
  checkpoint(82,7,true);
  assert.equal(save.shards,47);
  assert.equal(save.best,90);
  const reloaded=JSON.parse(stored);
  const next=createRunCheckpoint(reloaded,()=>{});
  next(25,2);
  assert.equal(reloaded.shards,49);
  assert.deepEqual(reloaded.creatures,[0]);
  assert.deepEqual(reloaded.fossils,[2]);
  assert.equal(reloaded.runs,7);
});

test('distance writes are throttled and forced departure saves the exact distance', () => {
  const save={shards:0,best:0};
  let writes=0;
  const checkpoint=createRunCheckpoint(save,()=>writes++);
  for(let distance=0;distance<100;distance+=.5)checkpoint(distance,0);
  assert.equal(writes,3);
  assert.equal(save.best,75);
  checkpoint(99.5,0,true);
  assert.equal(save.best,99);
});

test('a later storage retry preserves rewards once after an unavailable write', () => {
  const save={shards:10,best:0};
  let unavailable=true, stored;
  const checkpoint=createRunCheckpoint(save,()=>{
    try {
      if(unavailable)throw Error('storage unavailable');
      stored=JSON.stringify(save);
    } catch {}
  });
  checkpoint(40,2);
  unavailable=false;
  checkpoint(41,2,true);
  assert.equal(JSON.parse(stored).shards,12);
  checkpoint(42,2,true);
  assert.equal(JSON.parse(stored).shards,12);
});
