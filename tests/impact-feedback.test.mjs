import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, Group } from '../dist/vendor/three.module.js';
import { createImpactFeedback } from '../dist/impact-feedback.js';

function feedback() {
  const scene=new Scene(),hero=new Group();
  const element={hidden:true,style:{},classList:{toggle(_name,value){this.shield=value;}}};
  return {...createImpactFeedback(scene,hero,element),scene,hero,element,shield:scene.children[0]};
}

test('damage and shield impacts have different feedback and expire', () => {
  const effect=feedback();
  effect.trigger(false);effect.update(.1);
  assert.equal(effect.shield.visible,false);
  assert.equal(effect.element.hidden,false);
  assert.equal(effect.element.classList.shield,false);
  assert.ok(effect.element.style.opacity>0);
  effect.update(.4);
  assert.equal(effect.element.hidden,true);
  effect.trigger(true);effect.update(.1);
  assert.equal(effect.shield.visible,true);
  assert.equal(effect.element.classList.shield,true);
  effect.update(.6);
  assert.equal(effect.shield.visible,false);
});

test('shield follows the jumping runner while zero time freezes feedback', () => {
  const effect=feedback();
  effect.hero.position.set(3,2,-50);
  effect.trigger(true);effect.update(.1);
  assert.equal(effect.shield.position.x,3);
  assert.equal(effect.shield.position.y,3.4);
  assert.equal(effect.shield.position.z,-50);
  const opacity=effect.element.style.opacity;
  const scale=effect.shield.scale.clone();
  effect.update(0);
  assert.equal(effect.element.style.opacity,opacity);
  assert.ok(effect.shield.scale.equals(scale));
  effect.clear();
  assert.equal(effect.element.hidden,true);
  assert.equal(effect.shield.visible,false);
});

test('repeated impacts reuse one geometry and material', () => {
  const effect=feedback();
  const geometry=effect.shield.geometry,material=effect.shield.material;
  for(let i=0;i<1000;i++){effect.trigger(i%2===0);effect.update(.04);}
  assert.equal(effect.scene.children.length,1);
  assert.equal(effect.shield.geometry,geometry);
  assert.equal(effect.shield.material,material);
});
