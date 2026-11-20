import { creatureIds } from './encounters.js';
import { relicIds } from './relics.js';

function count(value) {
  return Number.isFinite(value) && value >= 0
    ? Math.min(Number.MAX_SAFE_INTEGER, Math.floor(value)) : 0;
}

export function readProgress(read) {
  let value;
  try { value = JSON.parse(read()); } catch {}
  const saved = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    ...saved,
    best: count(saved.best),
    shards: count(saved.shards),
    runs: count(saved.runs),
    creatures: creatureIds(saved.creatures),
    fossils: relicIds(saved.fossils),
  };
}
