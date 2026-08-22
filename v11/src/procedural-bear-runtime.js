import * as THREE from 'three';

const clamp01=v=>THREE.MathUtils.clamp(v,0,1);
const mat=(color,rough=.88,opts={})=>new THREE.MeshPhysicalMaterial({
  color,roughness:rough,metalness:0,clearcoat:opts.clearcoat??.015,clearcoatRoughness:opts.clearcoatRoughness??.86,
  sheen:opts.sheen??.18,sheenRoughness:opts.sheenRoughness??.9,sheenColor:new THREE.Color(opts.sheenColor??color)
});
const fur=mat(0x765039,.92,{sheen:.28,sheenColor:0x9a755c});
const furMid=mat(0x62422f,.94,{sheen:.22,sheenColor:0x80634e});
const furDark=mat(0x483127,.95,{sheen:.16,sheenColor:0x6b4c3b});
const muzzleMat=mat(0xb99172,.91,{sheen:.18,sheenColor:0xd0ad8c});
const muzzleShade=mat(0x9d7559,.94,{sheen:.12});
const noseMat=mat(0x2b201d,.43,{clearcoat:.08,clearcoatRoughness:.64});
const eyeWhite=mat(0xf2e8dc,.58,{clearcoat:.04,clearcoatRoughness:.65});
const irisMat=mat(0x6a482b,.36,{clearcoat:.08,clearcoatRoughness:.52});
const pupilMat=mat(0x17110e,.28,{clearcoat:.08,clearcoatRoughness:.48});
const mouthMat=mat(0x4b2925,.67,{clearcoat:.025});
const innerEar=mat(0x9d6d5d,.93,{sheen:.14});

function lathe(points,segments=72){return new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),segments);}
function mesh(g,m=fur){const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=true;return x;}
function groupAt(parent,name,pos=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...pos);parent.add(g);return g;}
function oval(radius=1,sy=1,sz=1,m=fur,seg=48){const x=mesh(new THREE.SphereGeometry(radius,seg,Math.max(24,seg/2)),m);x.scale.set(1,sy,sz);return x;}
function browGeometry(){const c=new THREE.CatmullRomCurve3([new THREE.Vector3(-.34,0,0),new THREE.Vector3(0,.055,.018),new THREE.Vector3(.34,0,0)]);return new THREE.TubeGeometry(c,20,.045,8,false);}
function wedgeNose(){const g=new THREE.SphereGeometry(.31,40,24);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);const k=1-THREE.MathUtils.clamp((y+.31)/.62,0,1)*.18;p.setX(i,p.getX(i)*k);}p.needsUpdate=true;g.computeVertexNormals();return g;}

export class ProceduralBearRuntime{
  constructor({scene,onStatus=()=>{}}){
    this.scene=scene;this.onStatus=onStatus;this.root=new THREE.Group();this.root.name='BacGauProceduralV11';this.controls=new Map();this.bind=new Map();this.morph={};this.t=0;this.ready=false;
  }
  build(){
    this.onStatus('Đang dựng Bác Gấu authored fallback…');
    const root=this.root;

    // Broad pear-shaped torso with a slightly recessed upper chest, avoiding stacked-ball anatomy.
    const torso=mesh(lathe([[0,0],[.68,.10],[1.08,.52],[1.25,1.18],[1.22,1.72],[1.08,2.20],[.80,2.62],[.46,2.82],[0,2.88]]));
    torso.scale.z=.79;root.add(torso);
    const chest=mesh(lathe([[0,0],[.42,.05],[.67,.32],[.73,.70],[.61,1.03],[.36,1.27],[0,1.34]]),72),muzzleMat);
    chest.position.set(0,.82,.72);chest.scale.set(.82,1,.18);root.add(chest);

    const neck=groupAt(root,'neck',[0,2.58,0]);this._bind('neck',neck);
    const headCtl=groupAt(neck,'head',[0,.02,0]);this._bind('head',headCtl);

    // Mature bear head: softer temple/cheek transition and less spherical crown.
    const head=mesh(lathe([[0,-1.06],[.49,-1.02],[.83,-.82],[1.02,-.43],[1.09,.04],[1.02,.50],[.83,.88],[.47,1.13],[0,1.20]]));
    head.scale.set(1.02,1,.90);headCtl.add(head);

    // Side cheek planes add warmth and break the primitive lathe symmetry in the face.
    for(const s of [-1,1]){
      const sideCheek=oval(.48,.82,.30,furMid,44);sideCheek.position.set(s*.72,-.27,.57);sideCheek.rotation.y=s*.18;headCtl.add(sideCheek);
    }

    // Ears smaller, lower and more embedded in the skull than prior V11.
    for(const s of [-1,1]){
      const ear=oval(.37,.90,.48,furDark,44);ear.position.set(s*.75,.78,-.08);ear.rotation.z=s*.12;headCtl.add(ear);
      const ie=oval(.225,.86,.22,innerEar,40);ie.position.set(s*.75,.79,.23);ie.rotation.z=s*.12;headCtl.add(ie);
    }

    // Eye sockets first: dark warm fur rim creates depth and keeps sclera from reading bug-eyed.
    for(const s of [-1,1]){
      const socket=oval(.292,.74,.20,furDark,44);socket.position.set(s*.42,.28,.73);socket.scale.x=1.06;headCtl.add(socket);
      const eyeCtl=groupAt(headCtl,s<0?'eyeLeft':'eyeRight',[s*.42,.27,.815]);this._bind(s<0?'eyeLeft':'eyeRight',eyeCtl);
      const sclera=oval(.232,.72,.30,eyeWhite,44);sclera.scale.x=.93;eyeCtl.add(sclera);
      const iris=oval(.126,.75,.105,irisMat,36);iris.position.z=.213;eyeCtl.add(iris);
      const pupil=oval(.071,.80,.075,pupilMat,32);pupil.position.z=.289;eyeCtl.add(pupil);
      const catchlight=oval(.020,1,1,mat(0xffffff,.16,{clearcoat:.02}),18);catchlight.position.set(-.024,.036,.349);eyeCtl.add(catchlight);

      // Upper lid hugs the eye instead of a floating oval slab.
      const lid=oval(.248,.72,.13,furMid,44);lid.position.set(0,.135,.175);lid.scale.set(.98,.18,1);lid.userData.baseY=.135;eyeCtl.add(lid);
      this.morph[s<0?'blinkLeft':'blinkRight']={lid};

      const brow=mesh(browGeometry(),furDark);brow.position.set(s*.42,.61,.83);brow.rotation.z=s*.035;headCtl.add(brow);
      this.morph[s<0?'browL':'browR']={brow,baseY:brow.position.y,baseZ:brow.rotation.z};
    }

    // Muzzle sits closer to the skull: smaller lateral lobes, lower bridge, tapered nose.
    const muzzle=groupAt(headCtl,'muzzle',[0,-.37,.76]);this.controls.set('muzzle',muzzle);
    const muzzleBase=oval(.56,.67,.25,muzzleShade,52);muzzleBase.position.set(0,-.04,-.02);muzzleBase.scale.x=1.12;muzzle.add(muzzleBase);
    for(const s of [-1,1]){
      const cheek=oval(.43,.67,.30,muzzleMat,48);cheek.position.set(s*.265,.015,.12);cheek.rotation.y=s*.10;muzzle.add(cheek);
    }
    const bridge=oval(.35,.50,.27,muzzleMat,44);bridge.position.set(0,.19,.12);muzzle.add(bridge);
    const nose=mesh(wedgeNose(),noseMat);nose.position.set(0,.19,.37);nose.scale.set(1,.72,.48);nose.rotation.x=-.07;muzzle.add(nose);

    // Separate jaw with a restrained mouth slit; speech opens downward rather than inflating the mouth.
    const jaw=groupAt(muzzle,'jaw',[0,-.30,.11]);this._bind('jaw',jaw);
    const chin=oval(.39,.38,.24,muzzleMat,46);chin.position.set(0,-.14,-.01);jaw.add(chin);
    const mouth=oval(.245,.095,.075,mouthMat,40);mouth.position.set(0,.015,.285);jaw.add(mouth);
    const lowerLip=oval(.22,.055,.055,muzzleShade,36);lowerLip.position.set(0,-.045,.31);jaw.add(lowerLip);

    // Soft shoulders and forearms; hands are broader and turned slightly inward for a welcoming pose.
    for(const s of [-1,1]){
      const sh=groupAt(root,s<0?'shoulderLeft':'shoulderRight',[s*.99,2.16,.02]);this._bind(s<0?'shoulderLeft':'shoulderRight',sh);
      const cap=oval(.43,.72,.72,fur,44);cap.position.set(s*.06,-.16,.02);sh.add(cap);
      const arm=groupAt(sh,s<0?'armLeft':'armRight',[0,-.12,0]);this._bind(s<0?'armLeft':'armRight',arm);
      const upper=mesh(new THREE.CapsuleGeometry(.34,1.18,10,22),fur);upper.position.set(s*.10,-.75,.02);upper.rotation.z=s*.12;arm.add(upper);
      const hand=oval(.42,.66,.76,furMid,44);hand.position.set(s*.20,-1.49,.10);hand.rotation.y=-s*.10;arm.add(hand);this.controls.set(s<0?'handLeft':'handRight',hand);
    }

    for(const s of [-1,1]){const foot=oval(.54,.36,.88,furDark,44);foot.position.set(s*.57,.18,.30);foot.rotation.x=.05;root.add(foot);}

    root.position.y=.02;this.scene.add(root);this.ready=true;
    this.onStatus('V11 authored fallback v2 ✓ · softened face planes + mature eye/muzzle proportions');
    return this.inspect();
  }

  _bind(role,obj){this.controls.set(role,obj);this.bind.set(role,{rot:obj.rotation.clone(),pos:obj.position.clone()});}
  inspect(){return{fallback:true,controls:[...this.controls.keys()],facial:['jawOpen','smile','blinkLeft','blinkRight','browInnerUp'],visual:'authored-lathe-v2-soft-face'};}
  play(){return true;}
  setMorph(role,value){
    const v=clamp01(value);
    if(role==='jawOpen'){
      const j=this.controls.get('jaw');if(j){const b=this.bind.get('jaw');j.rotation.x=b.rot.x+.025+v*.18;j.position.y=b.pos.y-v*.075;}return true;
    }
    if(role==='smile'){const j=this.controls.get('jaw');if(j)j.rotation.z=(v-.1)*.010;return true;}
    if(role==='blinkLeft'||role==='blinkRight'){
      const e=this.morph[role];if(e){e.lid.scale.y=.18+v*2.95;e.lid.position.y=e.lid.userData.baseY-v*.128;}return true;
    }
    if(role==='browInnerUp'){
      for(const k of ['browL','browR']){const e=this.morph[k];if(e){e.brow.position.y=e.baseY+v*.09;e.brow.rotation.z=e.baseZ+(k==='browL'?1:-1)*v*.045;}}return true;
    }
    return false;
  }
  setBonePose(role,{x=0,y=0,z=0}={},strength=1){const o=this.controls.get(role),b=this.bind.get(role);if(!o||!b)return false;o.rotation.set(b.rot.x+x*strength,b.rot.y+y*strength,b.rot.z+z*strength);return true;}
  setGaze(x=0,y=0){const yaw=THREE.MathUtils.clamp(x,-1,1)*.15,pitch=THREE.MathUtils.clamp(y,-1,1)*.10;for(const role of ['eyeLeft','eyeRight'])this.setBonePose(role,{x:pitch,y:yaw});return true;}
  setHeadPose(x=0,y=0,z=0){return this.setBonePose('head',{x,y,z});}
  setNeckPose(x=0,y=0,z=0){return this.setBonePose('neck',{x,y,z});}
  setShoulders(left={},right={}){this.setBonePose('shoulderLeft',left);this.setBonePose('shoulderRight',right);}
  setArms(left={},right={}){this.setBonePose('armLeft',left);this.setBonePose('armRight',right);}
  update(dt){
    this.t+=dt;
    const breath=Math.sin(this.t*1.18)*.0085;
    this.root.scale.y=1+breath;this.root.scale.x=1-breath*.22;
  }
}
