import test from 'node:test';
import assert from 'node:assert/strict';
import { RELICS,createRunBlessings } from '../dist/relics.js';
test('unexplored runs retain original balance',()=>{
 const b=createRunBlessings([]);
 assert.equal(b.maxHealth,3);assert.equal(b.hitReach,9);assert.equal(b.hitCooldown,.55);
 assert.equal(b.absorbHit(),false);assert.equal(b.destructionReward('rock'),2);assert.equal(b.destructionReward('fossil'),12);
});
test('each fossil grants only its own power',()=>{
 const powers=RELICS.map((_,i)=>createRunBlessings([i]));
 assert.equal(powers[0].hitReach,10.5);assert.equal(powers[0].maxHealth,3);
 assert.equal(powers[1].shieldCharges,1);assert.equal(powers[1].hitReach,9);
 assert.equal(powers[2].maxHealth,4);assert.equal(powers[2].hitCooldown,.55);
 assert.equal(powers[3].destructionReward('tree'),3);assert.equal(powers[3].destructionReward('fossil'),13);
 assert.equal(powers[4].hitCooldown,.4);assert.equal(powers[4].shieldCharges,0);
});
test('new finds wait for next run and consumed shield resets at the temple',()=>{
 const fossils=[];const current=createRunBlessings(fossils);fossils.push(0,1,2,3,4);
 assert.deepEqual(current.active,[]);assert.equal(current.absorbHit(),false);assert.equal(current.maxHealth,3);
 const next=createRunBlessings(fossils);assert.deepEqual(next.active,[0,1,2,3,4]);
 assert.equal(next.absorbHit(),true);assert.equal(next.absorbHit(),false);assert.equal(next.shieldCharges,0);
 assert.equal(createRunBlessings(fossils).absorbHit(),true);
});
test('duplicate or invalid relic IDs cannot stack or create powers',()=>{
 for(const value of [null,{},'01234',undefined])assert.deepEqual(createRunBlessings(value).active,[]);
 const b=createRunBlessings([1,1,-1,9,'2',NaN,2.5]);assert.deepEqual(b.active,[1]);
 assert.equal(b.absorbHit(),true);assert.equal(b.absorbHit(),false);assert.equal(b.maxHealth,3);
 assert.throws(()=>b.active.push(2));
});
test('saved fossils survive a JSON round trip and combine their effects',()=>{
 const save=JSON.parse(JSON.stringify({fossils:[4,2,1,0,3]}));const b=createRunBlessings(save.fossils);
 assert.equal(b.maxHealth,4);assert.equal(b.hitReach,10.5);assert.equal(b.hitCooldown,.4);
 assert.equal(b.destructionReward('bush'),3);assert.equal(b.shieldCharges,1);
 assert.deepEqual(save.fossils,[4,2,1,0,3]);
});
