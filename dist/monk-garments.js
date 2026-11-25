import * as T from './vendor/three.module.js';

// Articulated cloth, using the same cached primitives/materials as the hero.
// This is a bounded visual rig, not a physics simulation or collision geometry.
export function createMonkGarments(torso, mesh) {
  const root = new T.Group();
  root.name = 'monk-garments';
  torso.add(root);
  const robe = '#a34629', dark = '#793b2c', gold = '#e4ae59';
  const joint = (parent, name, x, y, z) => {
    const node = new T.Group();
    node.name = name;
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  };
  const put = (shape, color, x, y, z, sx, sy, sz, parent) =>
    mesh(shape, color, x, y, z, sx, sy, sz, parent);

  // Six separated panels leave the lower legs and stride visible.
  const panels = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i + .5) * Math.PI / 3;
    const panel = joint(root, `robe-panel-${i}`, Math.sin(angle) * .32, 1.29, Math.cos(angle) * .23);
    panel.rotation.y = angle;
    put('box', i % 2 ? dark : robe, 0, -.26, .02, .29, .55, .065, panel);
    put('box', gold, 0, -.51, .06, .29, .04, .016, panel);
    panels.push({ panel, angle });
  }
  // Shoulder drape and mala are visible both from the shrine and chase camera.
  put('ball', gold, -.13, 2.08, .22, .36, .22, .13, root);
  const beads = joint(root, 'prayer-beads', 0, 0, 0);
  for (let i = 0; i < 18; i++) {
    const angle = i * Math.PI / 9;
    const bead = put('ball', i % 6 === 0 ? gold : '#50322d',
      Math.sin(angle) * .4, 2.18 - .24 * Math.abs(Math.cos(angle)) + .05 * Math.cos(angle),
      Math.cos(angle) * .3, .047, .047, .047, beads);
    bead.name = `prayer-bead-${i}`;
  }
  put('ball', gold, 0, 1.89, -.31, .065, .09, .04, beads);

  const ribbons = [-1, 1].map((side, i) => {
    let parent = root;
    return Array.from({ length: 3 }, (_, segment) => {
      const node = joint(parent, `sash-${i}-${segment}`, segment ? 0 : side * .17, segment ? -.34 : 2, segment ? 0 : .34);
      put('box', segment === 1 ? robe : gold, 0, -.17, 0, .13 - segment * .015, .35, .035, node);
      parent = node;
      return node;
    });
  });

  return function pose({ phase = 0, speed = 0, steering = 0, airborne = false } = {}) {
    const moving = T.MathUtils.clamp(speed / 12, 0, 1);
    const wind = T.MathUtils.clamp(speed / 24, 0, 1);
    const turn = T.MathUtils.clamp(steering, -1, 1);
    for (const { panel, angle } of panels) {
      panel.rotation.x = -.12 - moving * .1 - (airborne ? .12 : 0)
        + Math.sin(phase * 2 + angle) * .055 * moving;
      panel.rotation.z = turn * .07 + Math.sin(phase + angle) * .035 * moving;
    }
    ribbons.forEach((segments, i) => segments.forEach((node, segment) => {
      node.rotation.x = -.12 - wind * (.7 - segment * .1) - (airborne ? .2 : 0)
        + Math.sin(phase * 1.4 + i * 1.7 - segment * .8) * .13 * moving;
      node.rotation.z = turn * (.12 + segment * .04)
        + Math.sin(phase * 1.1 + i * 2 + segment) * .07 * moving;
    }));
    beads.rotation.z = turn * -.035;
    beads.position.y = Math.sin(phase * 2) * .012 * moving;
  };
}
