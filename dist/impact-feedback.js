import * as T from './vendor/three.module.js';

export function createImpactFeedback(scene, hero, element) {
  const material = new T.MeshBasicMaterial({
    color: '#f9bd65', transparent: true, opacity: 0, wireframe: true,
    depthWrite: false, toneMapped: false,
  });
  const shield = new T.Mesh(new T.IcosahedronGeometry(1, 1), material);
  shield.name = 'Relic shield pulse';
  scene.add(shield);
  let remaining = 0, duration = 0;

  function clear() {
    remaining = 0;
    shield.visible = false;
    material.opacity = 0;
    element.style.opacity = 0;
    element.hidden = true;
  }
  clear();

  function trigger(protectedHit) {
    duration = protectedHit ? .6 : .45;
    remaining = duration;
    shield.visible = protectedHit;
    element.classList.toggle('shield', protectedHit);
    element.hidden = false;
  }

  function update(dt) {
    if (dt <= 0 || remaining <= 0) return;
    remaining = Math.max(0, remaining - dt);
    if (remaining === 0) {
      clear();
      return;
    }
    const strength = remaining / duration;
    element.style.opacity = .6 * strength;
    material.opacity = .38 * strength;
    shield.position.copy(hero.position);
    shield.position.y += 1.4;
    const expansion = 1 + (1 - strength) * .25;
    shield.scale.set(expansion, expansion * 1.55, expansion);
  }
  return { trigger, update, clear };
}
