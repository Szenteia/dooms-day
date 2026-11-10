import { Group } from './vendor/three.module.js';
import { ROAD_WIDTH } from './movement.js';

const STONE = '#9a8065';
const PLASTER = '#d0ad7d';
const WOOD = '#813b32';
const ROOF = '#304b4d';
const GOLD = '#e6ac58';
const GATE_Z = -11;
const POST_X = 7.2;
const FLAGS = ['#e2a347', '#b85b47', '#83a9a1', '#dbca9a'];

export function occupiesShrineGate(x, z) {
  return Math.abs(Math.abs(x) - POST_X) < 2 && Math.abs(z - GATE_Z) < 2.5;
}

export function createShrine(scene, mesh, groundColor) {
  const root = new Group();
  root.name = 'Starting shrine';
  scene.add(root);

  mesh('box', groundColor, 0, -.5, 6, 90, 1, 12, root);
  mesh('box', '#d7b98b', 0, .015, 6, ROAD_WIDTH, .08, 12, root);

  const temple = new Group();
  temple.position.set(10.8, 0, 4.8);
  root.add(temple);
  const put = (shape, color, x, y, z, width, height, depth) =>
    mesh(shape, color, x, y, z, width, height, depth, temple);

  put('box', STONE, 0, -.35, 0, 11, 1, 9);
  for (let tier = 0; tier < 3; tier++) {
    const width = 7.5 - tier * 1.65;
    const y = tier * 2.15;
    put('box', PLASTER, 0, y + 1, 0, width, 2, width * .8);
    put('box', WOOD, 0, y + 1.96, 0, width + .38, .24, width * .8 + .4);
    put('roof', ROOF, 0, y + 2.29, 0, width + 1.6, .94, width * .8 + 1.5);
    put('box', GOLD, 0, y + 1.81, 0, width + 1.5, .08, width * .8 + 1.4);
  }
  put('cyl', WOOD, 0, 7.3, 0, .18, 1.1, .18);
  put('ball', GOLD, 0, 7.93, 0, .32, .32, .32);
  put('box', WOOD, 0, 1, 3.05, 1.55, 1.9, .17);
  for (const side of [-1, 1]) {
    put('box', GOLD, side * .52, 1.2, 3.15, .09, 1.44, .1);
    put('cyl', WOOD, side * 2.85, 1, 3.35, .16, 2, .16);
  }

  const gate = new Group();
  gate.name = 'Shrine departure gate';
  gate.position.z = GATE_Z;
  root.add(gate);
  const beam = (shape, color, x, y, z, width, height, depth) =>
    mesh(shape, color, x, y, z, width, height, depth, gate);
  beam('box', WOOD, 0, 5.8, 0, 15.2, .54, 1.1);
  beam('box', GOLD, 0, 6.13, 0, 15.75, .12, 1.85);
  beam('roof', ROOF, 0, 6.66, 0, 16.2, .96, 2.55);

  const flags = [];
  for (const side of [-1, 1]) {
    const x = side * POST_X;
    beam('box', STONE, x, .25, 0, 1.25, .6, 1.25);
    beam('box', WOOD, x, 3.15, 0, .62, 5.3, .62);
    beam('box', GOLD, x, 4.88, .42, .36, .58, .25);
    for (let i = 0; i < FLAGS.length; i++) {
      const pivot = new Group();
      pivot.position.set(side * (3.1 + i * .91), 5.52, .15);
      gate.add(pivot);
      mesh('box', FLAGS[i], 0, -.31, 0, .57, .62, .028, pivot);
      flags.push(pivot);
    }
  }

  let time = 0;
  return function updateShrine(dt, distance) {
    root.visible = distance < 56;
    if (!root.visible) return;
    time += dt;
    flags.forEach((flag, i) => {
      flag.rotation.x = .24 + Math.sin(time * 2.6 + i * .72) * .18;
      flag.rotation.z = Math.sin(time * 1.8 + i * .65) * .065;
    });
  };
}
