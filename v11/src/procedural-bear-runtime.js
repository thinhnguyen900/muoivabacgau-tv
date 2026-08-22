import * as THREE from 'three';

const clamp01=v=>THREE.MathUtils.clamp(v,0,1);
const mat=(color,rough=.88,opts={})=>new THREE.MeshPhysicalMaterial({
  color,roughness:rough,metalness:0,clearcoat:opts.clearcoat??.015,clearcoatRoughness:opts.clearcoatRoughness??.86,
  sheen:opts.sheen??.18,sheenRoughness:opts.sheenRoughness??.9,sheenColor:new THREE.Color(opts.sheenColor??color)
});
const fur=mat(0x72503b,.94,{sheen:.34,sheenColor:0x9f7b61});
const furMid=mat(0x654632,.95,{sheen:.28,sheenColor:0x8b6a52});
const furDark=mat(0x453027,.97,{sheen:.18,sheenColor:0x6b4d3d});
const muzzleMat=mat(0xb88f70,.94,{sheen:.22,sheenColor:0xd3ad8c});
const muzzleShade=mat(0x9d765c,.96,{sheen:.14});
const noseMat=mat(0x2a201d,.48,{clearcoat:.055,clearcoatRoughness:.72});
const eyeWhite=mat(0xeee7de,.72,{clearcoat:.018,clearcoatRoughness:.78});
const irisMat=mat(0x76502e,.42,{clearcoat:.06,clearcoatRoughness:.58});
const pupilMat=mat(0x17110e,.30,{clearcoat:.075,clearcoatRoughness:.52});
const mouthMat=mat(0x452723,.78,{clearcoat:.012});
const innerEar=mat(0x96695d,.95,{sheen:.15});

function lathe(points,segments=72){return new THREE.LatheGeometry(points.map(([r,y])=>new THREE.Vector2(r,y)),segments);}
function mesh(g,m=fur){const x=new THREE.Mesh(g,m);x.castShadow=true;x.receiveShadow=true;return x;}
function groupAt(parent,name,pos=[0,0,0]){const g=new THREE.Group();g.name=name;g.position.set(...pos);parent.add(g);return g;}
function oval(radius=1,sy=1,sz=1,m=fur,seg=48){const x=mesh(new THREE.SphereGeometry(radius,seg,Math.max(24,seg/2)),m);x.scale.set(1,sy,sz);return x;}
function browGeometry(){const c=new THREE.CatmullRomCurve3([new THREE.Vector3(-.30,0,0),new THREE.Vector3(-.11,.035,.014),new THREE.Vector3(.10,.044,.017),new THREE.Vector3(.30,.005,0)]);return new THREE.TubeGeometry(c,24,.034,8,false);}
function lidRimGeometry(upper=true){const y=upper?.042:-.020;const c=new THREE.CatmullRomCurve3([new THREE.Vector3(-.19,0,0),new THREE.Vector3(-.09,y,0),new THREE.Vector3(.09,y,0),new THREE.Vector3(.19,0,0)]);return new THREE.TubeGeometry(c,20,.014,7,false);}
function philtrumGeometry(){const c=new THREE.CatmullRomCurve3([new THREE.Vector3(0,.08,0),new THREE.Vector3(-.006,.02,.006),new THREE.Vector3(0,-.075,0)]);return new THREE.TubeGeometry(c,14,.013,7,false);}
function wedgeNose(){const g=new THREE.SphereGeometry(.285,40,24);const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);const k=1-THREE.MathUtils.clamp((y+.285)/.57,0,1)*.22;p.setX(i,p.getX(i)*k);}p.needsUpdate=true;g.computeVertexNormals();return g;}
function capsuleBetween(parent,a,b,r,m){const mid=a.clone().add(b).multiplyScalar(.5),len=a.distanceTo(b);const c=mesh(new THREE.CapsuleGeometry(r,Math.max(.01,len-r*2),10,24),m);c.position.copy(mid);c.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),b.clone().sub(a).normalize());parent.add(c);return c;}

export class ProceduralBearRuntime{
  constructor({scene,onStatus=()=>{}}){this.scene=scene;this.onStatus=onStatus;this.root=new THREE.Group();this.root.name='BacGauProceduralV11';this.controls=new Map();this.bind=new Map();this.morph={};this.t=0;this.ready=false;}
  build(){
    this.onStatus('Đang dựng Bác Gấu authored fallback…');
    const root=this.root;

    const torso=mesh(lathe([[0,0],[.60,.08],[1.02,.46],[1.22,1.08],[1.19,1.65],[1.03,2.12],[.78,2.48],[.43,2.67],[0,2.72]]));
    torso.scale.z=.80;root.add(torso);
    const chest=mesh(lathe([[0,0],[.38,.05],[.63,.30],[.69,.67],[.57,1.00],[.31,1.19],[0,1.24]]),72),muzzleMat);
    chest.position.set(0,.87,.72);chest.scale.set(.86,1,.17);root.add(chest);
    const neckRuff=oval(.74,.42,.62,furMid,52);neckRuff.position.set(0,2.48,.06);root.add(neckRuff);

    const neck=groupAt(root,'neck',[0,2.54,0]);this._bind('neck',neck);
    const headCtl=groupAt(neck,'head',[0,.07,0]);this._bind('head',headCtl);

    const head=mesh(lathe([[0,-1.00],[.45,-.98],[.78,-.82],[.98,-.50],[1.07,-.08],[1.03,.40],[.88,.80],[.61,1.06],[.30,1.18],[0,1.21]]));
    head.scale.set(.99,1,.88);headCtl.add(head);
    const forehead=oval(.66,.58,.23,fur,52);forehead.position.set(0,.48,.66);forehead.scale.x=1.12;headCtl.add(forehead);
    for(const s of [-1,1]){const sideCheek=oval(.50,.86,.29,furMid,48);sideCheek.position.set(s*.69,-.26,.53);sideCheek.rotation.y=s*.16;headCtl.add(sideCheek);}

    for(const s of [-1,1]){
      const ear=oval(.34,.88,.46,furDark,44);ear.position.set(s*.72,.79,-.10);ear.rotation.z=s*.11;headCtl.add(ear);
      const ie=oval(.205,.84,.20,innerEar,40);ie.position.set(s*.72,.79,.20);ie.rotation.z=s*.11;headCtl.add(ie);
    }

    for(const s of [-1,1]){
      const socket=oval(.267,.72,.17,furDark,44);socket.position.set(s*.395,.255,.716);socket.scale.x=.98;headCtl.add(socket);
      const eyeCtl=groupAt(headCtl,s<0?'eyeLeft':'eyeRight',[s*.395,.252,.803]);this._bind(s<0?'eyeLeft':'eyeRight',eyeCtl);
      const sclera=oval(.205,.68,.285,eyeWhite,44);sclera.scale.x=.86;eyeCtl.add(sclera);
      const iris=oval(.143,.79,.101,irisMat,38);iris.position.z=.195;eyeCtl.add(iris);
      const pupil=oval(.086,.84,.073,pupilMat,34);pupil.position.z=.269;eyeCtl.add(pupil);
      const catchlight=oval(.017,1,1,mat(0xffffff,.20,{clearcoat:.018}),18);catchlight.position.set(-.026,.037,.325);eyeCtl.add(catchlight);

      const upperRim=mesh(lidRimGeometry(true),furDark);upperRim.position.set(0,.045,.245);upperRim.rotation.z=s*.012;eyeCtl.add(upperRim);
      const lowerRim=mesh(lidRimGeometry(false),furMid);lowerRim.position.set(0,-.103,.238);lowerRim.rotation.z=-s*.008;eyeCtl.add(lowerRim);
      const lowerLid=oval(.218,.64,.105,furMid,42);lowerLid.position.set(0,-.160,.154);lowerLid.scale.set(.94,.10,1);eyeCtl.add(lowerLid);
      const lid=oval(.226,.67,.112,furMid,44);lid.position.set(0,.129,.164);lid.scale.set(.95,.135,1);lid.userData.baseY=.129;eyeCtl.add(lid);this.morph[s<0?'blinkLeft':'blinkRight']={lid};

      const brow=mesh(browGeometry(),furDark);brow.position.set(s*.395,.558,.795);brow.rotation.z=s*.018;headCtl.add(brow);this.morph[s<0?'browL':'browR']={brow,baseY:brow.position.y,baseZ:brow.rotation.z};
    }

    const muzzle=groupAt(headCtl,'muzzle',[0,-.33,.685]);this.controls.set('muzzle',muzzle);
    const muzzleBase=oval(.505,.61,.20,muzzleShade,52);muzzleBase.position.set(0,-.035,-.025);muzzleBase.scale.x=1.08;muzzle.add(muzzleBase);
    for(const s of [-1,1]){const cheek=oval(.392,.64,.255,muzzleMat,48);cheek.position.set(s*.235,.014,.078);cheek.rotation.y=s*.07;muzzle.add(cheek);}
    const bridge=oval(.295,.45,.215,muzzleMat,44);bridge.position.set(0,.165,.070);muzzle.add(bridge);
    const nose=mesh(wedgeNose(),noseMat);nose.position.set(0,.166,.286);nose.scale.set(.94,.66,.40);nose.rotation.x=-.048;muzzle.add(nose);
    const philtrum=mesh(philtrumGeometry(),muzzleShade);philtrum.position.set(0,-.018,.272);muzzle.add(philtrum);

    const jaw=groupAt(muzzle,'jaw',[0,-.255,.055]);this._bind('jaw',jaw);
    const chin=oval(.405,.38,.205,muzzleMat,46);chin.position.set(0,-.125,-.010);chin.scale.x=1.04;jaw.add(chin);
    const mouth=oval(.202,.060,.050,mouthMat,40);mouth.position.set(0,.018,.242);jaw.add(mouth);
    const lowerLip=oval(.176,.034,.040,muzzleShade,36);lowerLip.position.set(0,-.032,.258);jaw.add(lowerLip);

    for(const s of [-1,1]){
      const sh=groupAt(root,s<0?'shoulderLeft':'shoulderRight',[s*.95,2.13,.02]);this._bind(s<0?'shoulderLeft':'shoulderRight',sh);
      const cap=oval(.43,.69,.70,fur,44);cap.position.set(s*.03,-.13,.015);sh.add(cap);
      const arm=groupAt(sh,s<0?'armLeft':'armRight',[0,-.12,0]);this._bind(s<0?'armLeft':'armRight',arm);
      const elbow=new THREE.Vector3(s*.13,-.74,.08),wrist=new THREE.Vector3(s*.23,-1.34,.22);
      capsuleBetween(arm,new THREE.Vector3(0,-.12,0),elbow,.31,fur);
      capsuleBetween(arm,elbow,wrist,.285,furMid);
      const hand=oval(.39,.61,.73,furMid,44);hand.position.copy(wrist).add(new THREE.Vector3(s*.08,-.24,.04));hand.rotation.set(.04,-s*.12,-s*.05);arm.add(hand);this.controls.set(s<0?'handLeft':'handRight',hand);
    }

    for(const s of [-1,1]){const foot=oval(.52,.34,.84,furDark,44);foot.position.set(s*.55,.17,.30);foot.rotation.x=.05;root.add(foot);}

    root.position.y=.02;this.scene.add(root);this.ready=true;
    this.onStatus('V11 authored fallback v4 ✓ · almond eyes + integrated muzzle');
    return this.inspect();
  }
  _bind(role,obj){this.controls.set(role,obj);this.bind.set(role,{rot:obj.rotation.clone(),pos:obj.position.clone()});}
  inspect(){return{fallback:true,controls:[...this.controls.keys()],facial:['jawOpen','smile','blinkLeft','blinkRight','browInnerUp'],visual:'authored-lathe-v4-almond-eyes-integrated-muzzle'};}
  play(){return true;}
  setMorph(role,value){const v=clamp01(value);if(role==='jawOpen'){const j=this.controls.get('jaw');if(j){const b=this.bind.get('jaw');j.rotation.x=b.rot.x+.014+v*.145;j.position.y=b.pos.y-v*.055;}return true;}if(role==='smile'){const j=this.controls.get('jaw');if(j)j.rotation.z=(v-.1)*.006;return true;}if(role==='blinkLeft'||role==='blinkRight'){const e=this.morph[role];if(e){e.lid.scale.y=.135+v*3.25;e.lid.position.y=e.lid.userData.baseY-v*.119;}return true;}if(role==='browInnerUp'){for(const k of ['browL','browR']){const e=this.morph[k];if(e){e.brow.position.y=e.baseY+v*.078;e.brow.rotation.z=e.baseZ+(k==='browL'?1:-1)*v*.035;}}return true;}return false;}
  setBonePose(role,{x=0,y=0,z=0}={},strength=1){const o=this.controls.get(role),b=this.bind.get(role);if(!o||!b)return false;o.rotation.set(b.rot.x+x*strength,b.rot.y+y*strength,b.rot.z+z*strength);return true;}
  setGaze(x=0,y=0){const yaw=THREE.MathUtils.clamp(x,-1,1)*.115,pitch=THREE.MathUtils.clamp(y,-1,1)*.072;for(const role of ['eyeLeft','eyeRight'])this.setBonePose(role,{x:pitch,y:yaw});return true;}
  setHeadPose(x=0,y=0,z=0){return this.setBonePose('head',{x,y,z});}
  setNeckPose(x=0,y=0,z=0){return this.setBonePose('neck',{x,y,z});}
  setShoulders(left={},right={}){this.setBonePose('shoulderLeft',left);this.setBonePose('shoulderRight',right);}
  setArms(left={},right={}){this.setBonePose('armLeft',left);this.setBonePose('armRight',right);}
  update(dt){this.t+=dt;const breath=Math.sin(this.t*1.12)*.0075;this.root.scale.y=1+breath;this.root.scale.x=1-breath*.18;}
}
