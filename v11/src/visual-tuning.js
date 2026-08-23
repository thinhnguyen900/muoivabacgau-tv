import * as THREE from 'three';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function softenMaterial(material){
  if(!material)return;
  material.roughness=clamp((material.roughness??.9)+.025,.76,.99);
  if('clearcoat' in material)material.clearcoat=Math.min(material.clearcoat??0,.028);
  if('clearcoatRoughness' in material)material.clearcoatRoughness=Math.max(material.clearcoatRoughness??.75,.84);
  if('sheen' in material)material.sheen=Math.max(material.sheen??0,.18);
  material.needsUpdate=true;
}

function tuneEye(eyeCtl,side){
  if(!eyeCtl)return;
  eyeCtl.position.x=side*.365;
  eyeCtl.position.y=.274;
  eyeCtl.position.z=.790;
  eyeCtl.rotation.z=side*-.009;
  const [sclera,iris,pupil,catchlight,upperRim,lowerRim,lowerLid,lid]=eyeCtl.children;
  if(sclera){
    // Keep a calm almond-shaped sclera that actually contains the iris.
    // Previous tuning made the iris vertically larger than the sclera,
    // which could read as doll-like or clipped at normal portrait distance.
    sclera.scale.set(.92,.72,.252);
    softenMaterial(sclera.material);
  }
  if(iris){
    iris.scale.set(.88,.84,.93);
    iris.position.set(side*-.004,-.008,.183);
  }
  if(pupil){
    pupil.scale.set(.92,.92,.94);
    pupil.position.set(side*-.004,-.010,.251);
  }
  if(catchlight){
    catchlight.scale.set(.80,.80,.80);
    catchlight.position.set(-.020,.027,.304);
  }
  if(upperRim){upperRim.scale.set(.91,.66,.94);upperRim.position.y=.026;upperRim.position.z=.238;}
  if(lowerRim){lowerRim.scale.set(.88,.62,.92);lowerRim.position.y=-.083;lowerRim.position.z=.232;}
  if(lowerLid){lowerLid.position.y=-.139;lowerLid.scale.set(.88,.064,.94);}
  if(lid){lid.position.y=.102;lid.scale.set(.89,.092,.95);lid.userData.baseY=.102;}
}

function softenEyeSocket(head,index){
  const socket=head?.children?.[index];
  if(!socket?.isMesh)return;
  // The authored fallback used a large dark oval behind each eye. It read as
  // a hard mask in portrait framing. Turn it into a subtle warm eyelid/socket
  // shadow so the gaze stays soulful rather than raccoon-like.
  socket.scale.set(.82,.54,.12);
  socket.position.y=.262;
  socket.position.z=.700;
  if(socket.material){
    socket.material=socket.material.clone();
    socket.material.color.setHex(0x5f4537);
    socket.material.roughness=.98;
    if('sheen' in socket.material)socket.material.sheen=.18;
    if('clearcoat' in socket.material)socket.material.clearcoat=.005;
    socket.material.needsUpdate=true;
  }
}

export function tuneAuthoredBear(character){
  if(!character?.root || !character?.controls || character.root.name!=='BacGauProceduralV11')return {applied:false,reason:'not-authored-fallback'};

  const root=character.root;
  const head=character.controls.get('head');
  const neck=character.controls.get('neck');
  const muzzle=character.controls.get('muzzle');
  const shoulderL=character.controls.get('shoulderLeft');
  const shoulderR=character.controls.get('shoulderRight');

  root.scale.set(.99,1.0,.99);
  if(neck){neck.position.y=2.49;neck.scale.set(1.0,.97,1.0);}
  if(head){
    head.position.y=.045;
    head.scale.set(.935,1.018,.98);
    const headShell=head.children[0];
    const forehead=head.children[1];
    const cheekL=head.children[2];
    const cheekR=head.children[3];
    if(headShell)headShell.scale.set(.955,1.005,.895);
    if(forehead){forehead.position.set(0,.435,.642);forehead.scale.set(1.02,.545,.218);}
    for(const cheek of [cheekL,cheekR]){
      if(!cheek)continue;
      cheek.scale.set(.94,.78,.255);
      cheek.position.y=-.245;
      cheek.position.z=.500;
    }
    // Stable authored-fallback child order: left socket=8, right socket=11.
    softenEyeSocket(head,8);
    softenEyeSocket(head,11);
  }

  tuneEye(character.controls.get('eyeLeft'),-1);
  tuneEye(character.controls.get('eyeRight'),1);

  for(const key of ['browL','browR']){
    const item=character.morph?.[key];
    if(item?.brow){
      item.brow.position.y=.522;
      item.brow.position.z=.778;
      item.brow.scale.set(.84,.68,.86);
      item.baseY=.522;
    }
  }

  if(muzzle){
    muzzle.position.set(0,-.350,.600);
    muzzle.scale.set(.91,.99,.82);
    const base=muzzle.children[0];
    if(base){base.scale.set(.98,.56,.16);base.position.y=-.028;}
    for(const cheek of muzzle.children.slice(1,3)){
      cheek.scale.set(.91,.58,.205);
      cheek.position.y=.008;
    }
    const bridge=muzzle.children[3];
    if(bridge){bridge.scale.set(.87,.39,.17);bridge.position.y=.140;bridge.position.z=.060;}
    const nose=muzzle.children[4];
    if(nose){nose.scale.set(.80,.52,.30);nose.position.y=.142;nose.position.z=.238;}
    const philtrum=muzzle.children[5];
    if(philtrum){philtrum.scale.set(.84,.92,.84);philtrum.position.z=.252;}
    const jaw=character.controls.get('jaw');
    if(jaw){jaw.position.y=-.238;jaw.position.z=.026;jaw.scale.set(.94,.93,.88);}
  }

  if(shoulderL)shoulderL.position.set(-.86,2.10,-.005);
  if(shoulderR)shoulderR.position.set(.86,2.10,-.005);
  for(const role of ['armLeft','armRight']){
    const arm=character.controls.get(role);
    if(arm)arm.position.y=-.095;
  }
  for(const role of ['handLeft','handRight']){
    const hand=character.controls.get(role);
    if(hand)hand.scale.multiplyScalar(.92);
  }

  root.traverse(obj=>{
    if(obj.isMesh){
      softenMaterial(obj.material);
      obj.castShadow=true;
      obj.receiveShadow=true;
    }
  });

  return {
    applied:true,
    visual:'mature-v7-contained-almond-eyes-soft-sockets',
    notes:['iris contained inside calm almond sclera','slightly closer relaxed gaze','soft warm eye sockets instead of dark mask','lighter eyelid rims','lower softer brows','integrated side cheeks','shorter flatter muzzle and nose','narrower relaxed shoulders']
  };
}
