// Each new run owns its checkpoint ledger. Repeated saves bank only new rewards.
export function createRunCheckpoint(save, persist) {
  let bankedShards = 0;
  let lastBucket = 0;
  return function checkpoint(distance, shards, force = false) {
    const bucket = Math.floor(distance / 25);
    if (!force && bucket === lastBucket && shards === bankedShards) return;
    save.shards += shards - bankedShards;
    save.best = Math.max(save.best, Math.floor(distance));
    bankedShards = shards;
    lastBucket = bucket;
    persist();
  };
}
