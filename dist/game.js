import { createBiomeAtmosphere } from './biome-atmosphere.js';
import * as T from './vendor/three.module.js';
import { createDestruction } from './destruction.js';
import { SPECIES, buildCreature, animateCreature } from './creatures.js';
import { BIOME_LENGTH as SPAN, planScenery, buildScenery } from './biome-scenery.js';
import { RELICS, createRunBlessings } from './relics.js';
import { canMeetCreature, createCreatureRun, creatureIds } from './encounters.js';
import { findUpcomingObstacle } from './obstacle-cue.js';
import { createMonk } from './monk.js';
import { ROAD_WIDTH, JUMP_DURATION, LOW_OBSTACLE_HEIGHT, TALL_OBSTACLE_HEIGHT, isOffRoad, targetRunSpeed, jumpHeight, touchesObstacle } from './movement.js';

let blessings=createRunBlessings([]);
const $=s=>document.querySelector(s);let save;try{save=JSON.parse(localStorage.getItem('dooms-day-v1'))}catch{}save={best:0,shards:0,creatures:[],fossils:[],runs:0,...save};save.creatures=creatureIds(save.creatures);const persist=()=>{try{localStorage.setItem('dooms-day-v1',JSON.stringify(save))}catch{}};
let renderer;try{renderer=new T.WebGLRenderer({canvas:$('#world'),antialias:true})}catch(e){$('#loading').textContent='A 3D játékhoz WebGL szükséges. Engedélyezd a böngésző hardveres gyorsítását, majd töltsd újra az oldalt.';throw e}renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;const scene=new T.Scene();scene.background=new T.Color('#cfa880');scene.fog=new T.FogExp2('#cfa880',.007);const camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.1,500);const hemisphere=new T.HemisphereLight('#ffe9c5','#466575',2.5);scene.add(hemisphere);const sun=new T.DirectionalLight('#ffd9a0',3);sun.position.set(-35,65,-50);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:60,bottom:-45});scene.add(sun);scene.add(sun.target);
const updateAtmosphere = createBiomeAtmosphere(scene, hemisphere, sun);
updateAtmosphere(0);
const destruction=createDestruction(scene);
const mats=new Map(),geo={box:new T.BoxGeometry(1,1,1),ball:new T.IcosahedronGeometry(1,1),cone:new T.ConeGeometry(1,1,7),cyl:new T.CylinderGeometry(1,1,1,8)};function mat(c){if(!mats.has(c))mats.set(c,new T.MeshStandardMaterial({color:c,roughness:.85}));return mats.get(c)}function mesh(g,c,x=0,y=0,z=0,sx=1,sy=1,sz=1,parent=scene){const m=new T.Mesh(geo[g],mat(c));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=m.receiveShadow=true;parent.add(m);return m}
const biomes=[{name:'Aranyló sivatag',ground:'#ce995d',rock:'#aa7654',tree:'#8a9356'},{name:'A felhők kapuja',ground:'#9c9d92',rock:'#777e87',tree:'#486e6a'},{name:'Smaragd rétek',ground:'#719477',rock:'#818d87',tree:'#2d7161'},{name:'Ezer tükör vidéke',ground:'#638e87',rock:'#849d9a',tree:'#427a72'},{name:'Az ősi gerinc',ground:'#7c8590',rock:'#626d7e',tree:'#43696b'}];
let state='menu',distance=0,hp=3,shards=0,lane=0,x=0,jumpElapsed=JUMP_DURATION,jumpY=0,speed=12,stridePhase=0,attack=0,cooldown=0,invul=0,nextChunk=0,time=0,biomeIndex=-1,creatureRun=createCreatureRun(save.creatures),chunks=[],objects=[],found=0;const LENGTH=32;const rand=(a,b)=>a+Math.random()*(b-a);const monk=createMonk(scene,mesh);
const hero=monk.root;
const groundStatus=$('#ground-status');
const obstacleStatus=$('#obstacle-status');
const obstacleMarker=new T.Group();
const stripeGeometry=new T.PlaneGeometry(1, .14);
const stripeMaterial=new T.MeshBasicMaterial({color:0x9ef6da, toneMapped:false});
for (const z of [0, .32]) {
  const stripe=new T.Mesh(stripeGeometry,stripeMaterial);
  stripe.rotation.x=-Math.PI/2;
  stripe.position.z=z;
  obstacleMarker.add(stripe);
}
obstacleMarker.visible=false;
scene.add(obstacleMarker);

function updateObstacleCue() {
  const cue=state==='run' ? findUpcomingObstacle(objects,lane*3,hero.position.z,speed) : null;
  obstacleStatus.hidden=!cue;
  obstacleMarker.visible=!!cue;
  if (!cue) return;

  const { min,max }=cue.bounds;
  obstacleMarker.position.set((min.x+max.x)/2,.09,max.z+.24);
  obstacleMarker.scale.x=Math.max(1,max.x-min.x);
  obstacleMarker.children[1].visible=cue.tall;
  stripeMaterial.color.setHex(cue.tall ? 0xffb45e : 0x9ef6da);

  const action=cue.tall ? 'Kerüld ki vagy üsd' : 'Átugorható';
  const label=action+' · '+Math.ceil(cue.distance)+' m';
  if (obstacleStatus.textContent!==label) obstacleStatus.textContent=label;
  obstacleStatus.classList.toggle('tall',cue.tall);
}


function temple(){const g=new T.Group();scene.add(g);g.position.z=13;mesh('box','#bca685',0,.1,0,13,.4,11,g);for(let k=0;k<3;k++){mesh('box','#b5825b',0,1+k*2.5,0,8-k*1.6,2,6-k,g);const roof=mesh('cone','#354d4b',0,2.8+k*2.5,0,7-k,1.3,5-k*.6,g);roof.rotation.y=Math.PI/4}for(let s of [-1,1]){mesh('cyl','#a3523b',s*5,2,0,.25,4,.25,g);mesh('box','#394f49',s*5,4,0,3,.4,2,g)}mesh('ball','#e6b760',0,9,0,.25,.5,.25,g);return g}const shrine=temple();
const species=SPECIES;
let worldSeed=(Math.random()*4294967296)>>>0;
function spawn(kind,xx,zz,b,chunk,scale=1,rotation=0){const g=new T.Group();g.position.set(xx,0,zz);chunk.add(g);let rig=null;if(['tree','bush','rock'].includes(kind)){buildScenery(kind,biomes.indexOf(b),g,mesh,b)}else if(kind==='fossil'){mesh('ball','#b99973',0,.7,0,1.1,.8,.8,g);const ring=new T.Mesh(new T.TorusGeometry(.43,.08,6,16),mat('#ffe4ac'));ring.position.set(0,.8,-.66);g.add(ring);mesh('ball','#ffe4ac',0,.8,-.68,.12,.12,.1,g)}else if(kind==='creature'){rig=buildCreature(Math.floor((-zz)/SPAN)%5,g,mesh)}else if(kind==='cave'){mesh('ball',b.rock,-1,1,0,1,1.7,1.2,g);mesh('ball',b.rock,1,1,0,1,1.7,1.2,g);mesh('box',b.rock,0,2.3,0,3,1,2,g)}else{mesh('ball',b.rock,0,.7,0,rand(.6,1.2),rand(.6,1.4),.85,g)}let bounds=null;
if(kind!=='creature'){
  g.scale.setScalar(scale);
  g.rotation.y=rotation;
  bounds=new T.Box3().setFromObject(g);
  const tall=kind==='tree'||kind==='cave'||(kind==='rock'&&b===biomes[4]);
  const top=bounds.max.y;
  if(tall&&top<TALL_OBSTACLE_HEIGHT)g.scale.y*=TALL_OBSTACLE_HEIGHT/top;
  if(!tall&&top>LOW_OBSTACLE_HEIGHT)g.scale.y*=LOW_OBSTACLE_HEIGHT/top;
  bounds.setFromObject(g);
}
const object={g,rig,kind,z:zz,x:xx,bounds,done:false,type:Math.floor((-zz)/SPAN)%5};objects.push(object);return object;}
function chunk(n){let z=-n*LENGTH,bi=Math.floor(n*LENGTH/SPAN)%5,b=biomes[bi];const g=new T.Group();scene.add(g);chunks.push({g,z});mesh('box',b.ground,0,-.5,z-16,90,1,32,g);mesh('box',bi===3?'#d5bf8e':'#d7b98b',0,.015,z-16,ROAD_WIDTH,.08,32,g);if(bi===3)for(let s of [-1,1])mesh('box','#559fa9',s*22,-.1,z-16,27,.15,32,g);for(let i=0;i<6;i++){let s=i%2?1:-1;mesh('cone',b.rock,s*rand(24,65),rand(2,8),z-rand(0,32),rand(8,19),rand(20,55),rand(8,15),g)}for(const p of planScenery(n,worldSeed)){spawn(p.kind,p.x,p.z,biomes[p.biome],g,p.scale,p.rotation);}if(n>0){spawn(n%3===0?'fossil':(n===2||n%5===0)?'cave':'rock',[-3,0,3][n%3],z-16,b,g);if(n%4===2)spawn('creature',[-5,5][Math.floor(n/4)%2],z-8,b,g)}}
function toast(t){$('#toast').textContent=t;$('#toast').style.opacity=1;clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').style.opacity=0,3000)}function burst(o){o.done=true;o.g.visible=false;shards+=blessings.destructionReward(o.kind);destruction.shatter(o.g,o.kind);if(o.kind==='fossil'){const id=o.type;if(!save.fossils.includes(id)){save.fossils.push(id);persist();toast('✦ '+RELICS[id].name+' · áldás a következő körtől')}hp=Math.min(blessings.maxHealth,hp+1)}}
function hit(){if(state!=='run'||cooldown>0)return;attack=.45;cooldown=blessings.hitCooldown;for(const o of objects)if(!o.done&&o.kind!=='creature'&&Math.abs(o.x-x)<3.5&&o.z<hero.position.z+2&&o.z>hero.position.z-blessings.hitReach)burst(o)}function move(d){if(state==='run')lane=T.MathUtils.clamp(lane+d,-2,2)}function jump(){if(state==='run'&&jumpElapsed>=JUMP_DURATION)jumpElapsed=0}function book(){const was=state;if(state==='run')state='pause';$('#modal').hidden=false;$('#modal').innerHTML='<small>AZ UTAZÁS NYOMAI</small><h2>A felfedezések könyve</h2><p>Rekord: '+save.best+' m · '+save.runs+' utazás · '+save.shards+' szilánk</p>'+species.map((s,i)=>'<div class="entry">'+(save.creatures.includes(i)?s:'Ismeretlen lény')+'<span>'+(creatureRun.discoveries.has(i)&&state!=='over'?'Következő körben':save.creatures.includes(i)?'Feloldva':'?')+'</span></div>').join('')+'<h3>Ősi áldások</h3>'+RELICS.map((r,id)=>'<div class="entry"><b>'+(save.fossils.includes(id)?r.name:'Ismeretlen fosszília')+'</b><p>'+(save.fossils.includes(id)?r.effect:'Keresd a tájak fosszíliaköveiben.')+'</p><small>'+(blessings.active.includes(id)?(id===1&&blessings.shieldCharges===0?'Ebben a körben elhasználva':'Ebben a körben aktív'):save.fossils.includes(id)?'A következő körtől aktív':'Még nem találtad meg')+'</small></div>').join('')+'<button id="close">Vissza</button>';$('#close').onclick=()=>{$('#modal').hidden=true;if(was==='run')state='run'}}
function start(){worldSeed=(Math.random()*4294967296)>>>0;blessings=createRunBlessings(save.fossils);for(const c of chunks)scene.remove(c.g);destruction.clear();chunks=[];objects=[];distance=0;hp=blessings.maxHealth;shards=0;lane=x=jumpY=attack=cooldown=invul=stridePhase=0;jumpElapsed=JUMP_DURATION;speed=12;groundStatus.hidden=true;nextChunk=0;biomeIndex=-1;creatureRun=createCreatureRun(save.creatures);found=0;hero.visible=true;state='run';$('#menu').hidden=true;$('#modal').hidden=true;save.runs++;persist();toast(blessings.active.length?'Aktív áldások: '+blessings.active.map(id=>RELICS[id].name).join(' · '):'Alacsony kő: ugorj · magas kapu: kerüld ki vagy üss')}
function end(){state='over';save.best=Math.max(save.best,Math.floor(distance));save.shards+=shards;persist();$('#modal').hidden=false;$('#modal').innerHTML='<small>AZ UTAZÁS MEGMARAD BENNED</small><h2>Visszatérés a szentélybe</h2><p>'+Math.floor(distance)+' méter · '+shards+' szilánk · '+creatureRun.discoveries.size+' új lény</p><p>A felfedezett lények a következő körben már segítenek. Fosszíliáid és rekordod megmaradnak.</p><button class="primary" id="again">Új utazás →</button>';$('#again').onclick=start}
$('#start').onclick=start;$('#collection').onclick=book;$('#book').onclick=book;$('#pause').onclick=()=>{if(state==='run'){state='pause';$('#pause').textContent='▶'}else if(state==='pause'&&$('#modal').hidden){state='run';$('#pause').textContent='Ⅱ'}};addEventListener('keydown',e=>{if(['Space','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.repeat)return;if(['KeyA','ArrowLeft'].includes(e.code))move(-1);if(['KeyD','ArrowRight'].includes(e.code))move(1);if(e.code==='Space')jump();if(['KeyJ','KeyK'].includes(e.code))hit();if(e.code==='Escape')$('#pause').click()});document.querySelectorAll('[data-action]').forEach(b=>b.onpointerdown=e=>{e.preventDefault();({left:()=>move(-1),right:()=>move(1),jump,hit})[b.dataset.action]()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='run'){$('#pause').click()}});addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});renderer.setSize(innerWidth,innerHeight);
for(let i=0;i<10;i++)chunk(nextChunk++);$('#loading').hidden=true;const clock=new T.Clock();function frame(){requestAnimationFrame(frame);let dt=Math.min(clock.getDelta(),.04);time+=dt;if(state==='run'){x=T.MathUtils.damp(x,lane*3,10,dt);
const offRoad=isOffRoad(x);
speed=T.MathUtils.damp(speed,targetRunSpeed(distance,x),14,dt);
groundStatus.hidden=!offRoad;
distance+=dt*speed;
updateAtmosphere(distance);
hero.position.z=-distance;while(nextChunk*LENGTH<distance+270)chunk(nextChunk++);for(let i=chunks.length-1;i>=0;i--)if(chunks[i].z>hero.position.z+70){scene.remove(chunks[i].g);chunks.splice(i,1)}objects=objects.filter(o=>o.z<hero.position.z+70);hero.position.x=x;
jumpElapsed=Math.min(JUMP_DURATION,jumpElapsed+dt);
jumpY=jumpHeight(jumpElapsed);
hero.position.y=jumpY;
attack=Math.max(0,attack-dt);
cooldown-=dt;
invul-=dt;
stridePhase+=dt*speed*1.25;
monk.pose({phase:stridePhase,speed,steering:T.MathUtils.clamp((lane*3-x)/3,-1,1),airborne:jumpElapsed<JUMP_DURATION,attack:attack/.45});
hero.visible=invul<=0||Math.floor(time*16)%2===0;
for(const o of objects){if(o.rig)animateCreature(o.rig,time,o.z*.1);if(o.done)continue;let dz=o.z-hero.position.z;if(o.kind==='creature'){if (!o.hinted && dz >= -24 && dz < -5) {
  o.hinted = true;
  const side = o.x < 0 ? 'balra' : 'jobbra';
  toast('Lény az ösvény mellett · húzódj ' + side);
}
if (canMeetCreature(x, hero.position.z, o.x, o.z)) {
  o.done = true;
  const result = creatureRun.meet(o.type);
  if (result === 'discovered') {
    save.creatures.push(o.type);
    persist();
    toast('Új felfedezés · ' + species[o.type] + ' · következő körben feloldva');
  } else if (result === 'blessing') {
    shards += 5;
    hp = Math.min(blessings.maxHealth, hp + 1);
    toast(species[o.type] + ' áldása · +1 életerő');
  }
}
}else if(touchesObstacle(o.bounds,x,hero.position.z,jumpY)){o.done=true;destruction.shatter(o.g,o.kind);if(invul<=0){const protectedHit=blessings.absorbHit();if(!protectedHit)hp--;invul=1.5;toast(protectedHit?'✦ A magaslat oltalma kivédte az ütközést!':(o.bounds.max.y>LOW_OBSTACLE_HEIGHT+.01?'Magas akadály · kerüld ki vagy üss J-vel.':'Alacsony akadály · ugorj korábban vagy üss J-vel.'));if(hp<=0){end();break}}}}
let bi=Math.floor(distance/SPAN)%5;if(bi!==biomeIndex){biomeIndex=bi;$('#biome').textContent=biomes[bi].name;$('#chapter').textContent=['I · AZ ÉBREDÉS','II · A MAGASLAT','III · ÚJJÁSZÜLETÉS','IV · VÍZTÜKÖR','V · AZ ŐSI GERINC'][bi];if(distance>10)toast(biomes[bi].name)}$('#distance').textContent=Math.floor(distance)+' m';$('#shards').textContent=shards;$('#health').textContent='● '.repeat(Math.max(0,hp));$('#progress').style.width=(distance%SPAN/SPAN*100)+'%'}
if(state==='run')destruction.update(dt);
updateObstacleCue();
let z=hero.position.z;if(state==='menu'){hero.position.set(2,0,0);monk.pose();camera.position.set(16,9,25);camera.lookAt(0,2,-23)}else{camera.position.lerp(new T.Vector3(x*.4,6.8+jumpY*.2,z+12),.09);camera.lookAt(x*.3,1.7,z-15)}sun.position.set(x-35,65,z-50);sun.target.position.set(x,0,z-30);renderer.render(scene,camera)}frame();
