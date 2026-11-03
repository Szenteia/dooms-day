export const RELICS = Object.freeze([
  Object.freeze({name:'A homok emléke', effect:'Nagyobb ütéstáv (+1,5 m)'}),
  Object.freeze({name:'A magaslat oltalma', effect:'Körönként egy ütközést kivéd'}),
  Object.freeze({name:'A rétek életereje', effect:'Négy életerővel indulsz, és eddig gyógyulhatsz'}),
  Object.freeze({name:'A tavak ajándéka', effect:'Rombolásonként +1 szilánk'}),
  Object.freeze({name:'A gerinc ereje', effect:'Gyorsabb ütés (0,4 mp várakozás)'}),
]);

// Capture owned relics once, at the temple: discoveries affect the next run only.
export function createRunBlessings(fossils) {
  const owned = new Set(Array.isArray(fossils) ? fossils.filter(id=>Number.isInteger(id)&&id>=0&&id<RELICS.length) : []);
  const active = Object.freeze([...owned].sort((a,b)=>a-b));
  let shield = owned.has(1) ? 1 : 0;
  return Object.freeze({
    active,
    maxHealth: owned.has(2) ? 4 : 3,
    hitReach: owned.has(0) ? 10.5 : 9,
    hitCooldown: owned.has(4) ? .4 : .55,
    get shieldCharges() { return shield; },
    absorbHit() { if(!shield)return false;shield--;return true; },
    destructionReward(kind) { return (kind==='fossil'?12:2)+(owned.has(3)?1:0); },
  });
}
