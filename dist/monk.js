import * as T from './vendor/three.module.js';

export function createMonk(scene, mesh) {
  const root = new T.Group();
  const torso = new T.Group();
  root.add(torso);
  scene.add(root);
  const robe = '#a34629', gold = '#e4ae59', cloth = '#432c2d', skin = '#dca880';
  const put = (shape, color, x, y, z, sx, sy, sz, parent = torso) =>
    mesh(shape, color, x, y, z, sx, sy, sz, parent);
  const joint = (parent, x, y, z) => {
    const node = new T.Group();
    node.position.set(x, y, z);
    parent.add(node);
    return node;
  };

  put('ball', robe, 0, 1.75, 0, .46, .66, .27);
  put('ball', skin, 0, 2.53, -.04, .28, .36, .27);
  put('ball', skin, 0, 2.43, -.26, .16, .14, .09);
  for (const side of [-1, 1]) {
    put('ball', skin, side * .27, 2.49, -.04, .052, .096, .055);
    put('ball', '#50322d', side * .095, 2.55, -.285, .029, .025, .022);
  }
  put('cyl', gold, 0, 1.33, 0, .42, .14, .29);
  put('box', '#f5bf6d', 0, 1.83, .255, .18, .81, .045).rotation.z = -.48;
  const scarf = joint(torso, -.18, 2.09, .25);
  put('box', gold, 0, -.27, .04, .16, .54, .055, scarf);
  const legs = [], arms = [];
  for (const side of [-1, 1]) {
    const hip = joint(torso, side * .22, 1.2, 0);
    const knee = joint(hip, 0, -.55, 0);
    put('ball', robe, 0, -.22, 0, .21, .36, .23, hip);
    put('cyl', cloth, 0, -.26, 0, .115, .54, .11, knee);
    put('ball', '#302629', 0, -.52, -.11, .135, .13, .23, knee);
    legs.push({ hip, knee });

    const shoulder = joint(torso, side * .44, 2.03, 0);
    const elbow = joint(shoulder, 0, -.38, 0);
    put('ball', robe, 0, -.14, 0, .17, .28, .17, shoulder);
    put('cyl', cloth, 0, -.16, 0, .087, .34, .09, elbow);
    put('ball', skin, 0, -.34, 0, .098, .11, .1, elbow);
    arms.push({ shoulder, elbow });
  }
  const staff = joint(arms[1].elbow, 0, -.34, 0);
  staff.name = 'Monk staff';
  staff.rotation.z = -.17;
  put('cyl', '#59392e', 0, .07, 0, .038, 2.48, .038, staff);
  for (const y of [-1.08, -.16, 1.17]) put('cyl', gold, 0, y, 0, .054, .11, .054, staff);
  put('ball', '#f6d181', 0, 1.37, 0, .112, .14, .11, staff);

  const swingMaterial = new T.MeshBasicMaterial({
    color: '#ffd18a', transparent: true, opacity: 0,
    depthWrite: false, side: T.DoubleSide, toneMapped: false,
  });
  const swingArc = new T.Mesh(new T.RingGeometry(1.25, 1.38, 32, 1, 0, Math.PI), swingMaterial);
  swingArc.name = 'Staff swing arc';
  swingArc.position.set(0, 1.6, -.7);
  swingArc.rotation.x = -Math.PI / 2;
  swingArc.visible = false;
  root.add(swingArc);

  return { root, pose({ phase = 0, speed = 0, steering = 0, airborne = false, attack = 0 } = {}) {
    const moving = Math.min(1, speed / 12);
    const remaining = T.MathUtils.clamp(attack, 0, 1);
    const swing = Math.sin(remaining * Math.PI) ** 2;
    torso.position.y = airborne ? 0 : Math.abs(Math.sin(phase)) * .065 * moving;
    torso.rotation.x = airborne ? -.1 : -.13 * moving;
    torso.rotation.z = steering * -.2;
    torso.rotation.y = -.45 * swing;
    torso.rotation.x -= .14 * swing;
    scarf.rotation.x = -.18 - .6 * moving + Math.sin(phase * 1.7) * .18 * moving;
    scarf.rotation.z = steering * .3;
    legs.forEach(({ hip, knee }, i) => {
      const stride = Math.sin(phase + i * Math.PI);
      hip.rotation.x = airborne ? .55 + i * .32 : stride * .7 * moving;
      knee.rotation.x = airborne ? -.87 : -Math.max(0, -stride) * .96 * moving;
      arms[i].shoulder.rotation.x = airborne ? -.65 : -stride * .58 * moving;
      arms[i].elbow.rotation.x = -.48;
    });
    arms[1].shoulder.rotation.y = -1.1 * swing;
    arms[1].shoulder.rotation.x = T.MathUtils.lerp(arms[1].shoulder.rotation.x, -1.65, swing);
    arms[1].elbow.rotation.x += .3 * swing;
    arms[0].shoulder.rotation.x = T.MathUtils.lerp(arms[0].shoulder.rotation.x, -.8, swing * .6);
    arms[0].elbow.rotation.x -= .35 * swing;
    staff.rotation.x = -.7 * swing;
    staff.rotation.z = -.17 + .6 * swing;
    swingArc.visible = remaining > 0 && remaining < 1;
    swingArc.rotation.z = (1 - remaining - .5) * .65;
    swingArc.scale.setScalar(1 + .35 * swing);
    swingMaterial.opacity = .5 * swing;
  }};
}
