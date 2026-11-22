import test from 'node:test';
import assert from 'node:assert/strict';
import { createSmashChain } from '../dist/smash-chain.js';

test('consecutive destruction adds a bounded bonus and refreshes the window', () => {
  const chain=createSmashChain();
  assert.equal(chain.smash(),0);
  chain.update(2);
  assert.equal(chain.smash(),1);
  assert.equal(chain.progress,1);
  assert.deepEqual(Array.from({length:6},()=>chain.smash()),[2,3,4,4,4,4]);
  assert.equal(chain.count,5);
});

test('expiration and damage/reset end the chain, while zero time freezes it', () => {
  const chain=createSmashChain();
  chain.smash();chain.smash();
  chain.update(1);
  const progress=chain.progress;
  chain.update(0);
  assert.equal(chain.progress,progress);
  chain.update(1.5);
  assert.equal(chain.count,0);
  assert.equal(chain.bonus,0);
  assert.equal(chain.smash(),0);
  chain.clear();
  assert.equal(chain.progress,0);
  assert.equal(chain.smash(),0);
});

test('a chain expires after the same elapsed time at different frame rates', () => {
  for(const fps of [30,60,120]) {
    const chain=createSmashChain();
    chain.smash();chain.smash();
    for(let i=0;i<fps*2;i++)chain.update(1/fps);
    assert.equal(chain.count,2);
    for(let i=0;i<fps;i++)chain.update(1/fps);
    assert.equal(chain.count,0);
  }
});
