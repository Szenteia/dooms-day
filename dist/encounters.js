const SPECIES_COUNT = 5;
export const ENCOUNTER_WIDTH = 2.6;
export const ENCOUNTER_DEPTH = 5;

export function creatureIds(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter(id => Number.isInteger(id) && id >= 0 && id < SPECIES_COUNT))];
}

export function canMeetCreature(playerX, playerZ, creatureX, creatureZ) {
  return Math.abs(playerX - creatureX) <= ENCOUNTER_WIDTH && Math.abs(playerZ - creatureZ) <= ENCOUNTER_DEPTH;
}

export function createCreatureRun(knownIds) {
  const known = new Set(creatureIds(knownIds));
  const discoveries = new Set();

  return {
    discoveries,
    meet(id) {
      if (!Number.isInteger(id) || id < 0 || id >= SPECIES_COUNT) return 'none';
      if (known.has(id)) return 'blessing';
      if (discoveries.has(id)) return 'none';
      discoveries.add(id);
      return 'discovered';
    },
  };
}
