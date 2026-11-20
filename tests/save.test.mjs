import test from 'node:test';
import assert from 'node:assert/strict';
import { readProgress } from '../dist/save.js';
import { createRunBlessings } from '../dist/relics.js';

const empty = {best:0,shards:0,runs:0,creatures:[],fossils:[]};
const load = value => readProgress(() => JSON.stringify(value));

test('valid old saves retain progress and additional fields', () => {
  const saved = {best:1840,shards:222,runs:12,creatures:[4,0],fossils:[3,1],extension:{value:true}};
  assert.deepEqual(load(saved),saved);
  assert.deepEqual(createRunBlessings(load(saved).fossils).active,[1,3]);
});

test('bad fields recover independently while valid rewards remain', () => {
  const saved=load({best:810,shards:-10,runs:'many',creatures:[0,0,4,5,'2'],fossils:[1,1,2,-1,8,'4']});
  assert.deepEqual(saved,{best:810,shards:0,runs:0,creatures:[0,4],fossils:[1,2]});
  saved.fossils.push(3);
  assert.deepEqual(saved.fossils,[1,2,3]);
  assert.deepEqual(load({best:99,shards:15,runs:4,fossils:null}).fossils,[]);
  assert.equal(load({best:99,shards:15,runs:4,fossils:null}).shards,15);
});

test('missing, malformed and unavailable storage produce playable defaults', () => {
  for(const value of [null,[],true,42,'hello'])assert.deepEqual(load(value),empty);
  assert.deepEqual(readProgress(()=>null),empty);
  assert.deepEqual(readProgress(()=>'{bad json'),empty);
  assert.deepEqual(readProgress(()=>{throw Error('storage denied');}),empty);
});

test('counters are finite nonnegative integers after loading', () => {
  for(const value of [null,'20',{},-1,NaN,Infinity])assert.equal(load({shards:value}).shards,0);
  assert.equal(load({best:33.9}).best,33);
  assert.equal(load({runs:1e100}).runs,Number.MAX_SAFE_INTEGER);
});
