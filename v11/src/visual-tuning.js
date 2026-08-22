import * as THREE from 'three';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

function softenMaterial(material){
  if(!material)return;
  material.roughness=clamp((material.roughness??.9)+.02,.72,.99);
  if('clearcoat' in material)material.clearcoat=Math.min(material.clearcoat??0,.035);
  if('clearcoatRoughness' in material)material.clearcoatRoughness=Math.max(material.clearcoatRoughness??.75,.80);
  if('sheen' in material)material.sheen=Math.max(material.sheen??0,.16);
  material.needsUpdate=true;
}

function tuneEye(eyeCtl,side){
  if(!eyeCtl)return;
  eyeCtl.position.x=side*.382;
  eyeCtl.position.y=.272;
  eyeCtl.position.z=.798;
  const [sclera,iris,pupil,catchlight,upperRim,lowerRim,lowerLid,lid]=eyeCtl.children;
  if(sclera){sclera.scale.set(.80,.60,.255);softenMaterial(sclera.material);}
  if(iris){iris.scale.set(1.05,.90,.92);iris.position.z=.186;}
  if(pupil){pupil.scale.set(1.06,.96,.93);pupil.position.z=.255;}
  if(catchlight){catchlight.scale.set(.78,.78,.78);catchlight.position.set(-.024,.032,.307);}
  if(upperRim){upperRim.scale.y=.86;upperRim.position.y=.036;}
  if(lowerRim){lowerRim.scale.y=.82;lowerRim.position.y=-.095;}
  if(lowerLid){lowerLid.position.y=-.151;lowerLid.scale.y=.082;}
  if(lid){lid.position.y=.120;lid.scale.y=.115;lid.userData.baseY=.120;}
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
  if(neck){neck.position.y=2.50;neck.scale.set(1.0,.97,1.0);}
  if(head){
    head.position.y=.055;
    head.scale.set(.94,1.02,.98);
    const headShell=head.children[0];
    const forehead=head.children[1];
    if(headShell)headShell.scale.set(.96,1.01,.90);
    if(forehead){forehead.position.y=.45;forehead.scale.x=1.05;forehead.scale.y=.56;forehead.scale.z=.22;}
  }

  tuneEye(character.controls.get('eyeLeft'),-1);
  tuneEye(character.controls.get('eyeRight'),1);

  for(const key of ['browL','browR']){
    const item=character.morph?.[key];
    if(item?.brow){
      item.brow.position.y=.545;
      item.brow.scale.set(.92,.84,.92);
      item.baseY=.545;
    }
  }

  if(muzzle){
    muzzle.position.set(0,-.345,.625);
    muzzle.scale.set(.94,1.01,.88);
    const base=muzzle.children[0];
    if(base){base.scale.x=1.02;base.scale.y=.58;base.scale.z=.18;}
    for(const cheek of muzzle.children.slice(1,3)){
      cheek.scale.x=.95;
      cheek.scale.y=.61;
      cheek.scale.z=.225;
    }
    const bridge=muzzle.children[3];
    if(bridge){bridge.scale.set(.92,.42,.19);bridge.position.y=.150;}
    const nose=muzzle.children[4];
    if(nose){nose.scale.set(.86,.57,.34);nose.position.y=.150;nose.position.z=.255;}
    const jaw=character.controls.get('jaw');
    if(jaw){jaw.position.y=-.242;jaw.position.z=.038;jaw.scale.set(.97,.96,.93);}
  }

  if(shoulderL)shoulderL.position.set(-.88,2.12,.005);
  if(shoulderR)shoulderR.position.set(.88,2.12,.005);
  for(const role of ['armLeft','armRight']){
    const arm=character.controls.get(role);
    if(arm)arm.position.y=-.10;
  }
  for(const role of ['handLeft','handRight']){
    const hand=character.controls.get(role);
    if(hand)hand.scale.multiplyScalar(.94);
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
    visual:'mature-v5-balanced-head-soulful-eyes-integrated-muzzle',
    notes:['reduced sclera exposure','de-projected muzzle','narrower shoulders','softer material response']
  };
}
