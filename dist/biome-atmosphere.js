import { Color, MathUtils } from './vendor/three.module.js';
import { BIOME_LENGTH } from './biome-scenery.js';

const BLEND_DISTANCE = 36;
const palettes = [
  { sky: '#d6af87', haze: .007, ambient: '#ffe9c5', sun: '#ffd9a0' },
  { sky: '#b7cdd3', haze: .009, ambient: '#e2efff', sun: '#fff1db' },
  { sky: '#accbba', haze: .006, ambient: '#e6f4df', sun: '#ffe4a5' },
  { sky: '#a0ccd1', haze: .010, ambient: '#d5f3f6', sun: '#fff0cc' },
  { sky: '#b0bccc', haze: .008, ambient: '#e0e5ff', sun: '#ffd2ad' },
].map(({ sky, haze, ambient, sun }) => ({
  sky: new Color(sky), haze, ambient: new Color(ambient), sun: new Color(sun),
}));

// Sample by distance so pausing, changes in pace and fresh runs need no timer.
export function createBiomeAtmosphere({ background, fog }, hemisphere, sunlight) {
  return function updateAtmosphere(distance) {
    const boundary = Math.floor((distance + BLEND_DISTANCE) / BIOME_LENGTH);
    const next = boundary % palettes.length;
    const current = palettes[(next + palettes.length - 1) % palettes.length];
    const incoming = palettes[next];
    const mix = boundary === 0 ? 1 : MathUtils.smoothstep(
      distance - boundary * BIOME_LENGTH, -BLEND_DISTANCE, BLEND_DISTANCE,
    );

    background.lerpColors(current.sky, incoming.sky, mix);
    fog.color.copy(background);
    fog.density = MathUtils.lerp(current.haze, incoming.haze, mix);
    hemisphere.color.lerpColors(current.ambient, incoming.ambient, mix);
    sunlight.color.lerpColors(current.sun, incoming.sun, mix);
  };
}
