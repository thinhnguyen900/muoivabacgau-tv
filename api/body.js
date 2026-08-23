module.exports = async function handler(req, res) {
  const html = String.raw`<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Bác Gấu 3D · Conversation First</title>
<style>
html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#8ea89b;font-family:system-ui,-apple-system,sans-serif}*{box-sizing:border-box}#stage{position:fixed;inset:0;background:linear-gradient(#8bb0a7 0 58%,#6c5d47 58%);overflow:hidden}canvas{display:block;width:100%;height:100%}.badge{position:fixed;left:16px;top:max(16px,env(safe-area-inset-top));z-index:3;padding:9px 12px;border-radius:999px;background:#1c1510bb;color:#ffe0a2;font-size:12px;font-weight:800;backdrop-filter:blur(10px)}#bubble{position:fixed;left:50%;bottom:110px;transform:translateX(-50%);z-index:3;max-width:min(720px,86vw);padding:12px 16px;border-radius:18px;background:#17110dcc;color:#fff;font-size:16px;line-height:1.35;text-align:center;backdrop-filter:blur(12px);box-shadow:0 10px 30px #0004}.boot{position:fixed;inset:0;display:grid;place-items:center;z-index:5;background:radial-gradient(circle at 50% 35%,#9eb7a9,#6d6552);color:#fff;text-align:center;padding:28px}.boot[hidden]{display:none}.boot b{display:block;font-size:22px}.boot span{display:block;margin-top:8px;opacity:.8;font-size:13px}.error{background:radial-gradient(circle at 50% 30%,#614b3d,#201612)}
</style>
</head>
<body>
<div id="stage"></div>
<div class="badge">BÁC GẤU · CONVERSATION FIRST · V12</div>
<div id="bubble">Bác ở đây nè. Muối muốn kể gì cho bác nghe?</div>
<div id="boot" class="boot"><div><b>Đang gọi Bác Gấu ra…</b><span>Giữ nguyên giao tiếp · dựng nhân vật 3D ổn định trước</span></div></div>
<script type="module">
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js';

const stage = document.getElementById('stage');
const boot = document.getElementById('boot');
const bubble = document.getElementById('bubble');
const state = {phase:'idle', emotion:'welcoming', speaking:false, speechLevel:0, blink:0, nextBlink:2.4, gazeX:0, gazeY:0, targetGazeX:0, targetGazeY:0, stateTime:0};

function fail(message){
  boot.hidden=false;
  boot.classList.add('error');
  boot.innerHTML='<div><b>3D chưa khởi tạo được</b><span>'+String(message).replace(/[<>&]/g,'')+'</span></div>';
  window.__BACGAU_BODY_ERROR__=String(message);
}

try {
  const renderer = new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.04;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x8ea99f);
  scene.fog=new THREE.Fog(0x8ea99f,10,22);
  const camera=new THREE.PerspectiveCamera(31,1,.1,100);
  camera.position.set(0,3.0,9.0);
  camera.lookAt(0,2.45,0);

  scene.add(new THREE.HemisphereLight(0xffeddb,0x30453a,1.55));
  const key=new THREE.DirectionalLight(0xffd0a5,3.1);key.position.set(-4,7,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);scene.add(key);
  const fill=new THREE.DirectionalLight(0xe4f3ff,.7);fill.position.set(4,4,5);scene.add(fill);
  const rim=new THREE.DirectionalLight(0xd4fff0,.5);rim.position.set(5,6,-4);scene.add(rim);

  const ground=new THREE.Mesh(new THREE.CircleGeometry(7,64),new THREE.MeshStandardMaterial({color:0x695b46,roughness:.98}));
  ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);

  const root=new THREE.Group();scene.add(root);
  const fur=new THREE.MeshStandardMaterial({color:0x684837,roughness:.94,metalness:0});
  const furDark=new THREE.MeshStandardMaterial({color:0x38271f,roughness:.97,metalness:0});
  const muzzleMat=new THREE.MeshStandardMaterial({color:0xb68c6b,roughness:.93,metalness:0});
  const muzzleShadow=new THREE.MeshStandardMaterial({color:0x8f674f,roughness:.96,metalness:0});
  const hoodieMat=new THREE.MeshStandardMaterial({color:0xd8a72f,roughness:.82});
  const hoodieDark=new THREE.MeshStandardMaterial({color:0xaa7a1d,roughness:.88});
  const eyeWhite=new THREE.MeshStandardMaterial({color:0xe9e1d7,roughness:.72});
  const irisMat=new THREE.MeshStandardMaterial({color:0x6a431f,roughness:.48});
  const pupilMat=new THREE.MeshStandardMaterial({color:0x120e0c,roughness:.40});
  const noseMat=new THREE.MeshStandardMaterial({color:0x211916,roughness:.60});
  const mouthMat=new THREE.MeshStandardMaterial({color:0x44241f,roughness:.84});

  const smooth=(mesh)=>{mesh.castShadow=true;mesh.receiveShadow=true;return mesh};
  const ellipsoid=(r,sx,sy,sz,mat,seg=40)=>{const m=smooth(new THREE.Mesh(new THREE.SphereGeometry(r,seg,Math.max(20,seg/2)),mat));m.scale.set(sx,sy,sz);return m};
  const lathe=(pts,mat)=>smooth(new THREE.Mesh(new THREE.LatheGeometry(pts.map(p=>new THREE.Vector2(p[0],p[1])),64),mat));

  const body=lathe([[0,0],[.58,.06],[.96,.42],[1.14,.98],[1.11,1.6],[.92,2.05],[.58,2.34],[0,2.42]],fur);
  body.scale.z=.80;root.add(body);

  const hoodie=lathe([[0,.30],[.72,.34],[1.03,.65],[1.13,1.05],[1.04,1.52],[.82,1.82],[.52,1.98],[0,2.02]],hoodieMat);
  hoodie.scale.set(1.025,1,.835);hoodie.position.y=.12;root.add(hoodie);
  const belly=ellipsoid(.75,.86,.93,.18,hoodieDark,44);belly.position.set(0,1.14,.77);root.add(belly);

  const neck=new THREE.Group();neck.position.set(0,2.36,0);root.add(neck);
  const hoodRing=smooth(new THREE.Mesh(new THREE.TorusGeometry(.70,.14,18,64),hoodieDark));hoodRing.rotation.x=Math.PI/2;hoodRing.position.y=.08;hoodRing.scale.y=.78;neck.add(hoodRing);
  const head=new THREE.Group();head.position.y=.57;neck.add(head);
  const headShell=ellipsoid(1,.91,1.00,.88,fur,56);head.add(headShell);
  const forehead=ellipsoid(.62,1.02,.62,.27,fur,48);forehead.position.set(0,.39,.69);head.add(forehead);

  for(const s of [-1,1]){
    const ear=ellipsoid(.31,.94,.94,.50,furDark,40);ear.position.set(s*.68,.72,-.04);ear.rotation.z=s*.08;head.add(ear);
    const inner=ellipsoid(.18,.82,.82,.22,muzzleMat,34);inner.position.set(s*.68,.72,.15);inner.rotation.z=s*.08;head.add(inner);
    const cheek=ellipsoid(.39,.94,.64,.19,fur,42);cheek.position.set(s*.43,-.06,.70);cheek.rotation.z=s*.04;head.add(cheek);
  }

  const eyes=[];
  const brows=[];
  for(const s of [-1,1]){
    const eyeGroup=new THREE.Group();eyeGroup.position.set(s*.355,.19,.80);head.add(eyeGroup);
    const sclera=ellipsoid(.18,.82,.60,.29,eyeWhite,40);eyeGroup.add(sclera);
    const iris=ellipsoid(.122,.86,.91,.10,irisMat,34);iris.position.z=.175;eyeGroup.add(iris);
    const pupil=ellipsoid(.070,.94,.98,.07,pupilMat,30);pupil.position.z=.237;eyeGroup.add(pupil);
    const catchlight=ellipsoid(.014,1,1,.5,new THREE.MeshBasicMaterial({color:0xffffff}),16);catchlight.position.set(-.024,.028,.278);eyeGroup.add(catchlight);
    eyes.push(eyeGroup);
    const brow=smooth(new THREE.Mesh(new THREE.CapsuleGeometry(.041,.34,6,14),furDark));
    brow.position.set(s*.355,.48,.80);brow.rotation.z=s*(Math.PI/2-.14);head.add(brow);brows.push(brow);
  }

  const muzzle=new THREE.Group();muzzle.position.set(0,-.30,.70);head.add(muzzle);
  for(const s of [-1,1]){
    const lobe=ellipsoid(.37,.98,.67,.28,muzzleMat,46);lobe.position.set(s*.19,-.02,.02);lobe.rotation.z=s*.03;muzzle.add(lobe);
  }
  const bridge=ellipsoid(.22,.62,1.05,.18,muzzleShadow,38);bridge.position.set(0,.19,.12);muzzle.add(bridge);
  const nose=ellipsoid(.245,1,.58,.35,noseMat,40);nose.position.set(0,.20,.28);muzzle.add(nose);
  const philtrum=smooth(new THREE.Mesh(new THREE.CapsuleGeometry(.018,.16,5,10),muzzleShadow));philtrum.position.set(0,-.075,.285);muzzle.add(philtrum);
  const jaw=new THREE.Group();jaw.position.set(0,-.24,.06);muzzle.add(jaw);
  const chin=ellipsoid(.38,1.06,.40,.22,muzzleMat,42);chin.position.set(0,-.10,0);jaw.add(chin);
  const mouth=ellipsoid(.17,1,.16,.085,mouthMat,34);mouth.position.set(0,.015,.235);jaw.add(mouth);

  const shoulders=[];const arms=[];
  for(const s of [-1,1]){
    const shoulder=new THREE.Group();shoulder.position.set(s*.94,2.02,0);root.add(shoulder);shoulders.push(shoulder);
    const upper=ellipsoid(.38,.94,1.48,.88,fur,40);upper.position.set(0,-.42,.03);upper.rotation.z=s*.10;shoulder.add(upper);
    const arm=new THREE.Group();arm.position.set(0,-.58,.03);shoulder.add(arm);arms.push(arm);
    const fore=ellipsoid(.33,.92,1.55,.90,fur,40);fore.position.set(s*.08,-.55,.09);fore.rotation.z=s*.08;arm.add(fore);
    const hand=ellipsoid(.38,1.02,.78,.82,furDark,40);hand.position.set(s*.12,-1.07,.17);arm.add(hand);
  }

  for(const s of [-1,1]){const foot=ellipsoid(.47,1.0,.62,1.18,furDark,40);foot.position.set(s*.52,.18,.30);root.add(foot);}

  const stringMat=new THREE.MeshStandardMaterial({color:0xf5d77f,roughness:.75});
  for(const s of [-1,1]){
    const cord=smooth(new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.48,12),stringMat));cord.position.set(s*.18,1.98,.84);cord.rotation.z=s*.06;root.add(cord);
    const tip=ellipsoid(.055,1,1,1,stringMat,20);tip.position.set(s*.195,1.73,.84);root.add(tip);
  }

  const badge=smooth(new THREE.Mesh(new THREE.CircleGeometry(.13,36),hoodieDark));badge.position.set(.52,1.43,.86);badge.rotation.x=0;root.add(badge);

  root.position.y=.02;
  root.rotation.y=0;

  function setPose(emotion){
    state.emotion=emotion||'welcoming';
  }
  function applyMessage(data){
    if(!data||data.type!=='bacgau-state')return;
    if(data.phase)state.phase=data.phase;
    if(data.emotion)setPose(data.emotion);
    if(typeof data.speaking==='boolean')state.speaking=data.speaking;
    if(typeof data.level==='number')state.speechLevel=Math.max(0,Math.min(1,data.level));
    if(data.text)bubble.textContent=data.text;
    state.stateTime=0;
  }
  window.addEventListener('message',e=>applyMessage(e.data));

  const clock=new THREE.Clock();
  let elapsed=0;
  function animate(){
    const dt=Math.min(.05,clock.getDelta());elapsed+=dt;state.stateTime+=dt;
    const breath=Math.sin(elapsed*1.25)*.008;
    root.scale.y=1+breath;root.scale.x=1-breath*.16;

    state.nextBlink-=dt;
    if(state.nextBlink<=0){state.blink=1;state.nextBlink=3+Math.random()*4.5;}
    if(state.blink>0)state.blink=Math.max(0,state.blink-dt*7.5);
    const blink=Math.sin(state.blink*Math.PI);
    eyes.forEach(e=>{e.scale.y=1-blink*.76});

    if(Math.random()<dt*.22){state.targetGazeX=(Math.random()-.5)*.052;state.targetGazeY=(Math.random()-.5)*.030;}
    state.gazeX=THREE.MathUtils.damp(state.gazeX,state.targetGazeX,3.2,dt);
    state.gazeY=THREE.MathUtils.damp(state.gazeY,state.targetGazeY,3.2,dt);
    eyes.forEach(e=>{e.rotation.y=state.gazeX;e.rotation.x=state.gazeY});

    let headX=.01,headY=0,headZ=0,armLZ=-.02,armRZ=.02,smile=0,browTilt=.14;
    if(state.phase==='listening'||state.emotion==='gentle'){headX=.052;headY=.028;headZ=-.022;armLZ=.08;armRZ=-.08;browTilt=.10;}
    if(state.phase==='thinking'||state.emotion==='thinking'){headX=-.023;headY=-.085;headZ=.032;armRZ=-.30;browTilt=.19;}
    if(state.emotion==='playful'){headX=-.014;headY=.046;headZ=-.022;armLZ=-.18;armRZ=.20;smile=.08;browTilt=.11;}
    if(state.emotion==='welcoming'){headX=-.008;headY=-.018;headZ=.008;armRZ=.18;smile=.045;browTilt=.13;}
    head.rotation.x=THREE.MathUtils.damp(head.rotation.x,headX,3.5,dt);
    head.rotation.y=THREE.MathUtils.damp(head.rotation.y,headY+Math.sin(elapsed*.4)*.007,3.5,dt);
    head.rotation.z=THREE.MathUtils.damp(head.rotation.z,headZ,3.5,dt);
    arms[0].rotation.z=THREE.MathUtils.damp(arms[0].rotation.z,armLZ,3,dt);
    arms[1].rotation.z=THREE.MathUtils.damp(arms[1].rotation.z,armRZ+(state.phase==='speaking'?Math.sin(elapsed*2.2)*.022:0),3,dt);
    brows[0].position.y=.48+(state.emotion==='gentle'?.018:state.emotion==='thinking'?.010:0);
    brows[1].position.y=.48+(state.emotion==='gentle'?.018:state.emotion==='thinking'?.010:0);
    brows[0].rotation.z=THREE.MathUtils.damp(brows[0].rotation.z,-(Math.PI/2-browTilt),5,dt);
    brows[1].rotation.z=THREE.MathUtils.damp(brows[1].rotation.z,(Math.PI/2-browTilt),5,dt);

    const autoSpeech=state.phase==='speaking'?(.16+.29*Math.abs(Math.sin(elapsed*10.5))):0;
    const jawOpen=Math.max(autoSpeech,state.speechLevel*.52);
    jaw.rotation.x=THREE.MathUtils.damp(jaw.rotation.x,.018+jawOpen*.18,10,dt);
    mouth.scale.x=1+smile;

    renderer.render(scene,camera);
    requestAnimationFrame(animate);
  }

  function resize(){
    const w=stage.clientWidth||window.innerWidth,h=stage.clientHeight||window.innerHeight;
    renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
  }
  resize();window.addEventListener('resize',resize);

  boot.hidden=true;
  window.__BACGAU_READY__=true;
  window.__BACGAU_BODY__={version:'v12-conversation-first-2-wise-face',setPose,applyMessage};
  parent.postMessage({type:'bacgau-body-ready',version:'v12-conversation-first-2-wise-face'},'*');
  animate();
} catch(error){
  console.error(error);fail(error&&error.message?error.message:error);
}
</script>
</body>
</html>`;
  res.setHeader('Content-Type','text/html; charset=utf-8');
  res.setHeader('Cache-Control','no-store');
  res.setHeader('X-BacGau-Architecture','conversation-first-v12');
  return res.status(200).send(html);
};
