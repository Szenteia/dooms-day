import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../dist/vendor/three.module.js';
import { createMonk } from '../dist/monk.js';

function setup() {
  const scene = new T.Scene();
  const geometry = {box:new T.BoxGeometry(1,1,1),ball:new T.IcosahedronGeometry(1,1),cyl:new T.CylinderGeometry(1,1,1,8)};
  const materials = new Map();
  const mesh = (shape,color,x,y,z,sx,sy,sz,parent) => {
    if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color}));
    const node=new T.Mesh(geometry[shape],materials.get(color));
    node.position.set(x,y,z);node.scale.set(sx,sy,sz);parent.add(node);return node;
  };
  const monk=createMonk(scene,mesh);
  return {monk,scene,geometry,materials,cloth:monk.root.getObjectByName('monk-garments')};
}
const transforms=root=>{const values=[];root.traverse(n=>values.push([...n.position,...n.quaternion,...n.scale]));return values;};
const meshes=root=>{const values=[];root.traverse(n=>{if(n.isMesh)values.push(n);});return values;};

test('layered outfit has six panels, six ribbon joints and eighteen visible mala beads',()=>{
  const {monk,scene,cloth,geometry,materials}=setup();
  assert.equal(monk.root.parent,scene);
  for(let i=0;i<6;i++)assert(cloth.getObjectByName(`robe-panel-${i}`));
  for(let i=0;i<2;i++)for(let j=0;j<3;j++)assert(cloth.getObjectByName(`sash-${i}-${j}`));
  for(let i=0;i<18;i++)assert(cloth.getObjectByName(`prayer-bead-${i}`));
  const additions=meshes(cloth);
  assert.equal(additions.length,38);
  assert(meshes(monk.root).length<100);
  assert(additions.every(n=>Object.values(geometry).includes(n.geometry)&&[...materials.values()].includes(n.material)));
});

test('cloth responds to gait, steering, speed and airborne pose through the hero pose API',()=>{
  const {monk,cloth}=setup();
  monk.pose();const idle=transforms(cloth);
  monk.pose({phase:1,speed:12});const run=transforms(cloth);
  assert.notDeepEqual(run,idle);
  monk.pose({phase:2,speed:12});assert.notDeepEqual(transforms(cloth),run);
  monk.pose({phase:1,speed:24});const fast=cloth.getObjectByName('sash-0-0').rotation.x;
  monk.pose({phase:1,speed:6});assert(fast<cloth.getObjectByName('sash-0-0').rotation.x);
  monk.pose({phase:1,speed:12,steering:-1});const left=cloth.getObjectByName('sash-0-0').rotation.z;
  monk.pose({phase:1,speed:12,steering:1});assert(cloth.getObjectByName('sash-0-0').rotation.z>left);
  monk.pose({phase:1,speed:12,airborne:true});assert.notDeepEqual(transforms(cloth),run);
});

test('pose is deterministic, resets to idle and never moves gameplay root or allocates model parts',()=>{
  const {monk,cloth}=setup();
  monk.root.position.set(6,2,-300);
  const before=meshes(monk.root);const geometries=before.map(m=>m.geometry);const materials=before.map(m=>m.material);
  const pose={phase:1.2,speed:18,steering:.8,airborne:true,attack:.5};
  monk.pose(pose);const expected=transforms(cloth);monk.pose(pose);assert.deepEqual(transforms(cloth),expected);
  monk.pose();const idle=transforms(cloth);
  for(let i=0;i<2000;i++)monk.pose({phase:i*.2,speed:i%25,steering:Math.sin(i),airborne:i%2===0,attack:(i%10)/10});
  monk.pose();assert.deepEqual(transforms(cloth),idle);
  assert.deepEqual(monk.root.position.toArray(),[6,2,-300]);
  assert.deepEqual(meshes(monk.root),before);
  assert.deepEqual(meshes(monk.root).map(m=>m.geometry),geometries);
  assert.deepEqual(meshes(monk.root).map(m=>m.material),materials);
});

test('all new garment parts stay finite, above ground and within a bounded silhouette',()=>{
  const {monk,cloth}=setup();
  for(const speed of [0,5.4,12,24])for(const steering of [-1,0,1])for(const airborne of [false,true])for(let phase=0;phase<6.3;phase+=.4){
    monk.pose({phase,speed,steering,airborne});
    const bounds=new T.Box3().setFromObject(cloth);
    assert(bounds.min.toArray().every(Number.isFinite)&&bounds.max.toArray().every(Number.isFinite));
    assert(bounds.min.y>.45,`ground clearance ${bounds.min.y}`);
    assert(bounds.min.x>-1&&bounds.max.x<1);
    assert(bounds.min.z>-.7&&bounds.max.z<1.6);
  }
});
