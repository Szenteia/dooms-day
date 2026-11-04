import * as T from './vendor/three.module.js';

export const SPECIES = ['Homokróka', 'Felhőszarvas', 'Jáde teknős', 'Tavi sárkány', 'Kristályőrző'];

// mesh() reuses the game's cached geometry and materials; no asset downloads.
export function buildCreature(type, parent, mesh) {
  const root = new T.Group();
  parent.add(root);
  const joints = [];
  const color = ['#dc9a60','#e4d3af','#6bba97','#73c3cd','#b7a8df'][type];
  function part(shape, tint, x,y,z, sx,sy,sz, target=root) {
    return mesh(shape,tint,x,y,z,sx,sy,sz,target);
  }
  function joint(name,x,y,z, axis, amplitude, speed, phase=0) {
    const g = new T.Group();g.name=name;g.position.set(x,y,z);root.add(g);
    joints.push({g,axis,amplitude,speed,phase});return g;
  }
  function eyes(y,z,x=.25) {
    for(const side of [-1,1])part('ball','#203941',side*x,y,z,.075,.08,.06);
  }
  function legs(height,spread,length) {
    for(const side of [-1,1])for(const front of [-1,1]) {
      const g=joint('leg',side*spread,height,front*length,'x',.25,type===2?1.8:3.5,side*front>0?0:Math.PI);
      part('cyl',color,0,-height*.5,0,.12,height,.13,g);
    }
  }
  if(type===0) {
    part('ball',color,0,.75,0,.48,.45,.9);legs(.55,.32,.5);
    part('ball',color,0,1.05,-.85,.36,.35,.45);
    part('cone','#f4dab1',0,.95,-1.22,.23,.45,.23).rotation.x=-Math.PI/2;
    for(const side of [-1,1])part('cone',color,side*.25,1.55,-.8,.18,.65,.18);
    eyes(1.14,-1.17,.21);
    const tail=joint('fox-tail',0,.8,.65,'y',.4,2.8);
    part('ball',color,0,.12,.55,.24,.28,.8,tail);
    part('ball','#f4dab1',0,.15,1.14,.18,.21,.3,tail);
  } else if(type===1) {
    part('ball',color,0,1.3,0,.55,.6,1);legs(1,.38,.65);
    part('cyl',color,0,1.85,-.7,.23,1.2,.24);
    part('ball',color,0,2.5,-.9,.32,.38,.5);eyes(2.55,-1.33,.21);
    for(const side of [-1,1]) {
      part('cyl','#b5a28a',side*.26,3.05,-.75,.055,.8,.055).rotation.z=side*.3;
      for(let i=0;i<3;i++)part('cone','#d7c3a5',side*(.4+i*.09),2.9+i*.22,-.75,.045,.45,.045).rotation.z=side*.9;
    }
  } else if(type===2) {
    part('ball','#346f64',0,.6,0,1.1,.55,1.3);
    for(let i=0;i<5;i++)part('ball',color,Math.sin(i*2.4)*.48,.98,Math.cos(i*2.4)*.55,.3,.18,.35);
    legs(.3,.85,.7);part('ball',color,0,.5,-1.25,.36,.3,.45);eyes(.58,-1.62);
  } else if(type===3) {
    for(let i=0;i<5;i++) {
      const g=joint('dragon-segment',0,.75+i*.1,i*.55,'y',.22,2.4,i*.6);
      part('ball',color,0,0,0,.48-i*.065,.4-i*.045,.48,g);
      part('cone','#d7f1cc',0,.45,0,.14,.5,.15,g);
    }
    part('ball',color,0,1,-.6,.45,.4,.65);eyes(1.13,-1.12,.27);
    for(const side of [-1,1]) {
      const fin=joint('dragon-fin',side*.4,.85,.1,'z',.4,2.4,side<0?Math.PI:0);
      part('cone','#b0e5db',side*.65,0,.15,.85,.12,.75,fin);
    }
  } else {
    part('ball','#61557f',0,1,0,.7,.8,.55);
    part('cone',color,0,2,0,.42,.9,.42);eyes(2,-.33);
    for(const side of [-1,1]) {
      const arm=joint('guardian-arm',side*.8,1.4,0,'z',.2,1.7,side<0?Math.PI:0);
      part('ball',color,side*.2,-.2,0,.4,.65,.4,arm);
      part('cone','#e5d6ff',side*.35,.4,0,.22,.8,.22,arm);
      part('ball','#61557f',side*.35,.3,0,.28,.35,.3);
    }
    for(let i=0;i<3;i++)part('cone','#e5d6ff',(i-1)*.35,1.5,.3,.17,.9,.17);
  }
  return { root, type, joints };
}

export function animateCreature(rig, time, phase=0) {
  const t=time+phase;
  rig.root.position.y=rig.type===3?.18+Math.sin(t*2)*.15:rig.type===4?.15+Math.sin(t*1.7)*.12:Math.sin(t*2)*.025;
  for(const j of rig.joints)j.g.rotation[j.axis]=Math.sin(t*j.speed+j.phase)*j.amplitude;
}
