const STONE_COLORS = ['#ac7952', '#687580', '#577263', '#587b81', '#636278'];
const BONE = '#ffe4ac';

// Reliefs face the approaching runner (+Z) and use the shared primitive cache.
export function buildFossil(biome, group, mesh) {
  const put = (shape, color, x, y, z, sx, sy, sz) =>
    mesh(shape, color, x, y, z, sx, sy, sz, group);
  put('ball', STONE_COLORS[biome], 0, .57, 0, .98, .57, .46);
  put('box', STONE_COLORS[biome], 0, .59, .35, 1.38, .86, .2);
  const bone = (x1, y1, x2, y2, radius = .038) => {
    const dx = x2 - x1, dy = y2 - y1;
    const part = put('cyl', BONE, (x1 + x2) / 2, (y1 + y2) / 2, .54,
      radius, Math.hypot(dx, dy), radius);
    part.rotation.z = -Math.atan2(dx, dy);
  };

  if (biome === 0) {
    let previous = { x: 0, y: .59 };
    for (let i = 1; i <= 12; i++) {
      const angle = i * Math.PI / 4;
      const radius = i / 12 * .38;
      const next = { x: Math.cos(angle) * radius, y: .59 + Math.sin(angle) * radius };
      bone(previous.x, previous.y, next.x, next.y, .045);
      previous = next;
    }
  } else if (biome === 1) {
    bone(0, .28, 0, .84, .06);
    put('ball', BONE, 0, .88, .54, .19, .12, .07);
    for (let i = 0; i < 5; i++) {
      const y = .34 + i * .1, width = .15 + Math.sin(i / 4 * Math.PI) * .15;
      bone(-width, y - .045, 0, y);
      bone(0, y, width, y - .045);
    }
  } else if (biome === 2) {
    bone(-.15, .25, .14, .96);
    for (let i = 0; i < 4; i++) {
      const y = .36 + i * .14, x = -.1 + i * .055, width = .31 - i * .055;
      bone(x, y, x - width, y + .08);
      bone(x, y, x + width, y + .16);
    }
  } else if (biome === 3) {
    bone(-.44, .58, .33, .58, .045);
    put('ball', BONE, .43, .58, .54, .16, .14, .07);
    for (let i = 0; i < 3; i++) {
      const x = -.23 + i * .18;
      bone(x, .58, x - .1, .8 - i * .025);
      bone(x, .58, x - .1, .36 + i * .025);
    }
    bone(-.43, .58, -.61, .78);
    bone(-.43, .58, -.61, .38);
  } else {
    put('ball', BONE, 0, .4, .54, .24, .16, .07);
    for (let i = -1; i <= 1; i++) {
      const x = i * .23;
      bone(i * .1, .45, x, .7, .055);
      bone(x, .7, x + i * .08, .94 - Math.abs(i) * .06, .04);
    }
  }
}
