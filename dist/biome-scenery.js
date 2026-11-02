export const CHUNK_LENGTH = 32;
export const BIOME_LENGTH = 420;
export const biomeAt = distance => Math.floor(Math.max(0, distance) / BIOME_LENGTH) % 5;

// A chunk's layout is independent of the order in which chunks are requested.
export function planScenery(chunkIndex, runSeed) {
  let seed = ((runSeed >>> 0) ^ Math.imul(chunkIndex + 1, 0x9e3779b1)) >>> 0;
  const random = () => {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
  const result = [];
  for(let i=0;i<12;i++) {
    const distance = chunkIndex * CHUNK_LENGTH + random() * CHUNK_LENGTH;
    const x = random() * 38 - 19;
    const roll = random();
    const scale = .8 + random() * .4;
    const rotation = random() * Math.PI * 2;
    if(chunkIndex < 2 && Math.abs(x) < 5) continue;
    result.push({ kind:roll < .4 ? 'tree' : roll < .7 ? 'bush' : 'rock', x, z:-distance,
      biome:biomeAt(distance), scale, rotation });
  }
  return result;
}

// All meshes belong to the destructible object's group and share cached assets.
export function buildScenery(kind, biome, group, mesh, colors) {
  const put=(shape,color,x,y,z,sx,sy,sz)=>mesh(shape,color,x,y,z,sx,sy,sz,group);
  if(kind==='rock') {
    if(biome===4) {
      for(let i=0;i<3;i++)put('cone',colors.rock,(i-1)*.45,1.2+i*.25,0,.55,2.5+i*.5,.6);
      return 1.3;
    }
    put('ball',colors.rock,0,.7,0,1,.9,.85);return 1;
  }
  if(kind==='tree') {
    if(biome===0) {
      put('cyl',colors.tree,0,1.5,0,.3,3,.3);
      for(const side of [-1,1]) {
        put('box',colors.tree,side*.5,1.4,0,1,.25,.3);
        put('cyl',colors.tree,side*.9,1.9,0,.2,1.2,.2);
      }
      return 1.2;
    }
    if(biome===1) {
      put('cyl','#75604a',0,1.6,0,.23,3.2,.23);
      for(let i=0;i<3;i++)put('cone',colors.tree,0,2.5+i*.85,0,1.7-i*.35,2,1.7-i*.35);
      put('cone','#e0e6df',0,4.45,0,.55,.8,.55);return 1.25;
    }
    if(biome===2) {
      put('cyl','#75604a',0,1.4,0,.25,2.8,.25);
      for(let i=0;i<3;i++)put('ball',colors.tree,(i-1)*.75,2.8+ (i===1?.6:0),0,1.1,1,1.1);
      return 1.7;
    }
    if(biome===3) {
      for(let i=0;i<5;i++) {
        const x=(i-2)*.3,y=1.1+(i%3)*.25;
        put('cyl',colors.tree,x,y,0,.045,y*2,.045);
        put('cyl','#bda074',x,y*2,0,.1,.5,.1);
      }
      return .9;
    }
    for(let i=0;i<3;i++)put('ball',colors.rock,(i-1)*.3,.6+i*.65,0,.7-i*.12,.6,.65-i*.1);
    return 1.1;
  }
  for(let i=0;i<3;i++)put('ball',colors.tree,(i-1)*.45,.5,0,.65,.7,.65);
  if(biome===2)for(let i=0;i<4;i++)put('ball','#efbf8d',(i-1.5)*.3,.95,Math.sin(i)*.25,.12,.12,.12);
  return .9;
}
