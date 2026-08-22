import * as THREE from 'three';

const clamp01=v=>THREE.MathUtils.clamp(v,0,1);
const mat=(color,rough=.88)=>new THREE.MeshPhysicalMaterial({color,roughness:rough,metalness:0,clearcoat:.02,clearcoatRoughness:.82});
const fur=mat(0x6f482e,.94), furDark=mat(0x4d2f20,.96), muzzleMat=mat(0xb88963,.93), noseMat=mat(0x2d211d,.5), eyeWhite=mat(0xf7eee3,.62), irisMat=mat(0x6b4a2c,.42), pupilMat=mat(0x17110e,.34), mouthMat=mat(0x4c241f,.7), innerEar=mat(0x9f684f,.93);

function lathe(points,segments=64){return new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),segments);}
function mesh(g,m=fur){const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=true;return x;}
function groupAt(parent,name,pos=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...pos);parent.add(g);return g;}
function oval(radius=1,sy=1,sz=1,m=fur,seg=48){const x=mesh(new THREE.SphereGeometry(radius,seg,Math.max(24,seg/2)),m);x.scale.set(1,sy,sz);return x;}
function browGeometry(){const c=new THREE.CatmullRomCurve3([new THREE.Vector3(-.38,0,0),new THREE.Vector3(0,.07,.02),new THREE.Vector3(.38,0,0)]);return new THREE.TubeGeometry(c,18,.055,8,false);}

export class ProceduralBearRuntime{
  constructor({scene,onStatus=()=>{}}){
    this.scene=scene;this.onStatus=onStatus;this.root=new THREE.Group();this.root.name='BacGauProceduralV11';this.controls=new Map();this.bind=new Map();this.morph={};this.t=0;this.ready=false;
  }
  build(){
    this.onStatus('Đang dựng Bác Gấu authored fallback…');
    const root=this.root;
    // Torso is a hand-authored lathed silhouette, not stacked primitive balls.
    const torso=mesh(lathe([[0,0],[.72,.12],[1.12,.62],[1.28,1.28],[1.18,2.05],[.88,2.62],[.52,2.88],[0,2.94]]));torso.scale.z=.78;root.add(torso);
    const chest=mesh(lathe([[0,0],[.46,.06],[.72,.38],[.74,.82],[.58,1.16],[.28,1.42],[0,1.47]]),64),muzzleMat);chest.position.set(0,.72,.73);chest.scale.set(.82,1,.22);root.add(chest);
    const neck=groupAt(root,'neck',[0,2.62,0]);this._bind('neck',neck);
    // Head silhouette: broad crown, narrower lower face, slightly deeper back skull.
    const head=mesh(lathe([[0,-1.12],[.52,-1.06],[.92,-.72],[1.08,-.18],[1.03,.42],[.83,.9],[.46,1.18],[0,1.24]]));head.scale.set(1.03,1,.92);neck.add(head);
    const headCtl=groupAt(neck,'head',[0,0,0]);this._bind('head',headCtl);head.removeFromParent();headCtl.add(head);
    // Ears are tucked into crown to avoid Mickey/doll silhouette.
    for(const s of [-1,1]){const ear=oval(.43,.94,.54,furDark);ear.position.set(s*.78,.78,-.04);ear.rotation.z=s*.14;headCtl.add(ear);const ie=oval(.27,.9,.25,innerEar);ie.position.set(s*.78,.79,.30);ie.rotation.z=s*.14;headCtl.add(ie);}
    // Muzzle is two soft cheek lobes plus bridge, kept close to face.
    const muzzle=groupAt(headCtl,'muzzle',[0,-.35,.82]);this.controls.set('muzzle',muzzle);
    for(const s of [-1,1]){const cheek=oval(.57,.72,.38,muzzleMat);cheek.position.set(s*.34,0,0);muzzle.add(cheek);}
    const bridge=oval(.47,.58,.32,muzzleMat);bridge.position.set(0,.19,.05);muzzle.add(bridge);
    const nose=oval(.31,.62,.38,noseMat,40);nose.position.set(0,.18,.36);nose.rotation.x=-.08;muzzle.add(nose);
    // Jaw/lower lip are independent for speech-driven motion.
    const jaw=groupAt(muzzle,'jaw',[0,-.34,.18]);this._bind('jaw',jaw);
    const chin=oval(.46,.42,.28,muzzleMat);chin.position.set(0,-.12,-.03);jaw.add(chin);
    const mouth=oval(.29,.16,.12,mouthMat,36);mouth.position.set(0,.055,.285);jaw.add(mouth);
    // Eyes: narrower, deeper set, with real sclera/iris/pupil and separate lids.
    for(const s of [-1,1]){
      const eyeCtl=groupAt(headCtl,s<0?'eyeLeft':'eyeRight',[s*.43,.25,.82]);this._bind(s<0?'eyeLeft':'eyeRight',eyeCtl);
      const sclera=oval(.255,.78,.34,eyeWhite,40);eyeCtl.add(sclera);
      const iris=oval(.128,.78,.10,irisMat,32);iris.position.z=.245;eyeCtl.add(iris);
      const pupil=oval(.067,.82,.08,pupilMat,28);pupil.position.z=.325;eyeCtl.add(pupil);
      const catchlight=oval(.022,1,1,mat(0xffffff,.18),20);catchlight.position.set(-.025,.035,.39);eyeCtl.add(catchlight);
      const lid=oval(.275,.82,.15,furDark,40);lid.position.set(0,.13,.20);lid.scale.y=.23;lid.userData.baseY=.13;headCtl.add(lid);this.morph[s<0?'blinkLeft':'blinkRight']={lid};
      const brow=mesh(browGeometry(),furDark);brow.position.set(s*.43,.63,.87);brow.rotation.z=s*.025;headCtl.add(brow);this.morph[s<0?'browL':'browR']={brow,baseY:brow.position.y,baseZ:brow.rotation.z};
    }
    // Shoulder/arm forms taper along capsules for a coherent relaxed stance.
    for(const s of [-1,1]){
      const sh=groupAt(root,s<0?'shoulderLeft':'shoulderRight',[s*1.02,2.2,0]);this._bind(s<0?'shoulderLeft':'shoulderRight',sh);
      const arm=groupAt(sh,s<0?'armLeft':'armRight',[0,0,0]);this._bind(s<0?'armLeft':'armRight',arm);
      const upper=mesh(new THREE.CapsuleGeometry(.35,1.28,10,20),fur);upper.position.set(s*.11,-.76,0);upper.rotation.z=s*.14;arm.add(upper);
      const hand=oval(.40,.72,.72,fur,40);hand.position.set(s*.22,-1.55,.04);arm.add(hand);this.controls.set(s<0?'handLeft':'handRight',hand);
    }
    // feet give grounded, mature stance
    for(const s of [-1,1]){const foot=oval(.55,.38,.90,furDark,40);foot.position.set(s*.58,.20,.28);foot.rotation.x=.06;root.add(foot);}
    root.position.y=.02;this.scene.add(root);this.ready=true;this.onStatus('V11 authored fallback ✓ · modular face/body rig');return this.inspect();
  }
  _bind(role,obj){this.controls.set(role,obj);this.bind.set(role,{rot:obj.rotation.clone(),pos:obj.position.clone()});}
  inspect(){return{fallback:true,controls:[...this.controls.keys()],facial:['jawOpen','smile','blinkLeft','blinkRight','browInnerUp'],visual:'authored-lathe-v1'};}
  play(){return true;}
  setMorph(role,value){const v=clamp01(value);if(role==='jawOpen'){const j=this.controls.get('jaw');if(j){j.rotation.x=.03+v*.22;j.position.y=-.34-v*.09;}return true;}if(role==='smile'){const j=this.controls.get('jaw');if(j)j.rotation.z=(v-.1)*.012;return true;}if(role==='blinkLeft'||role==='blinkRight'){const e=this.morph[role];if(e){e.lid.scale.y=.23+v*2.7;e.lid.position.y=e.lid.userData.baseY-v*.14;}return true;}if(role==='browInnerUp'){for(const k of ['browL','browR']){const e=this.morph[k];if(e){e.brow.position.y=e.baseY+v*.10;e.brow.rotation.z=e.baseZ+(k==='browL'?1:-1)*v*.05;}}return true;}return false;}
  setBonePose(role,{x=0,y=0,z=0}={},strength=1){const o=this.controls.get(role),b=this.bind.get(role);if(!o||!b)return false;o.rotation.set(b.rot.x+x*strength,b.rot.y+y*strength,b.rot.z+z*strength);return true;}
  setGaze(x=0,y=0){const yaw=THREE.MathUtils.clamp(x,-1,1)*.18,pitch=THREE.MathUtils.clamp(y,-1,1)*.12;for(const role of ['eyeLeft','eyeRight'])this.setBonePose(role,{x:pitch,y:yaw});return true;}
  setHeadPose(x=0,y=0,z=0){return this.setBonePose('head',{x,y,z});}
  setNeckPose(x=0,y=0,z=0){return this.setBonePose('neck',{x,y,z});}
  setShoulders(left={},right={}){this.setBonePose('shoulderLeft',left);this.setBonePose('shoulderRight',right);}
  setArms(left={},right={}){this.setBonePose('armLeft',left);this.setBonePose('armRight',right);}
  update(dt){this.t+=dt;const breath=Math.sin(this.t*1.25)*.010;this.root.scale.y=1+breath;this.root.scale.x=1-breath*.25;}
}
