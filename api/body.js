const PIN='f38df09002d9e8d1bf4fc522aa365474a4b73628';
const ROOT=`https://cdn.jsdelivr.net/gh/thinhnguyen900/muoivabacgau-tv@${PIN}/forge/`;

const CHARACTER_PATCHES=[
  // FACE PASS 1 — softer silhouette and integrated muzzle.
  ['const head=S(1.08,1.06,.93,fur,.965);','const head=S(1.11,1.035,.91,fur,.975);'],
  ['const crown=S(.82,.47,.64,mid,.98);','const crown=S(.84,.445,.62,mid,.985);'],
  ['const cheek=S(.42,.38,.33,light,.985);','const cheek=S(.43,.365,.305,light,.99);'],
  ['const muzzleBridge=S(.25,.21,.16,muz,.985);','const muzzleBridge=S(.235,.19,.145,muz,.99);'],
  ['const muzzleBase=S(.43,.29,.27,muz,.985);','const muzzleBase=S(.405,.265,.245,muz,.99);'],
  ['const pad=S(.23,.18,.19,0xbc967b,.985);','const pad=S(.215,.165,.17,0xbc967b,.99);'],
  ['const jaw=S(.27,.12,.18,0xaa826a,.985);','const jaw=S(.245,.105,.155,0xaa826a,.99);'],
  ['const nose=S(.14,.09,.085,dark,.62);','const nose=S(.132,.082,.074,dark,.68);'],
  // EYES — calmer white exposure, warmer iris dominance and smaller catchlights.
  ['const white=S(.128,.102,.050,scl,.64);','const white=S(.116,.091,.046,scl,.72);'],
  ['const ir=S(.098,.090,.031,iris,.48);','const ir=S(.094,.086,.030,iris,.52);'],
  ['const pu=S(.050,.057,.018,pupil,.32);','const pu=S(.046,.052,.017,pupil,.36);'],
  ['const gl=new THREE.Mesh(new THREE.SphereGeometry(.014,12,8)','const gl=new THREE.Mesh(new THREE.SphereGeometry(.0105,12,8)'],
  ['const gl2=new THREE.Mesh(new THREE.SphereGeometry(.006,10,6)','const gl2=new THREE.Mesh(new THREE.SphereGeometry(.0045,10,6)'],
  ['upper.position.set(x,.414,.831);','upper.position.set(x,.398,.831);'],
  ['lower.position.set(x,.183,.822);','lower.position.set(x,.198,.822);'],
  // BROWS + SMILE — less graphic, less uncanny.
  ['const browL=S(.165,.015,.020,browMat,.92);','const browL=S(.155,.011,.017,browMat,.96);'],
  ['const mouth=new THREE.Mesh(new THREE.TorusGeometry(.116,.009,10,32,Math.PI)','const mouth=new THREE.Mesh(new THREE.TorusGeometry(.108,.0065,10,32,Math.PI)'],
  ["u.upperLidL.position.y=.414-.128*cl;u.upperLidR.position.y=.414-.120*Math.max(0,cl-asym);u.lowerLidL.position.y=.183+.086*cl;u.lowerLidR.position.y=.183+.081*Math.max(0,cl-asym);","u.upperLidL.position.y=.398-.106*cl;u.upperLidR.position.y=.398-.101*Math.max(0,cl-asym);u.lowerLidL.position.y=.198+.070*cl;u.lowerLidR.position.y=.198+.066*Math.max(0,cl-asym);"],
  ["u.browL.position.y=.53;u.browR.position.y=.53;u.browL.rotation.z=.055;u.browR.rotation.z=-.055;","u.browL.position.y=.525;u.browR.position.y=.525;u.browL.rotation.z=.040;u.browR.rotation.z=-.040;"],
  // IDLE PASS — less mechanical bobbing and smaller micro-saccades.
  ["u.headRig.rotation.z=.006*Math.sin(t*.68);u.headRig.rotation.y=.009*Math.sin(t*.43);","u.headRig.rotation.z=.0038*Math.sin(t*.61);u.headRig.rotation.y=.0058*Math.sin(t*.39);"],
  ["u.torso.scale.y=1+.008*breath;u.torso.position.y=.008*breath;b.position.y=.010*Math.sin(t*.98);","u.torso.scale.y=1+.006*breath;u.torso.position.y=.006*breath;b.position.y=.0048*Math.sin(t*.88);"],
  ["u.saccadeX=(Math.random()-.5)*.010;u.saccadeY=(Math.random()-.5)*.006;u.nextSaccade=t+.78+Math.random()*1.65","u.saccadeX=(Math.random()-.5)*.007;u.saccadeY=(Math.random()-.5)*.004;u.nextSaccade=t+1.05+Math.random()*2.05"],
  // SPEECH MOTION — mouth/jaw movement softer and more vertical, less rubbery.
  ["const talk=speaking?(.30+.26*Math.abs(Math.sin(aTime*10.6))+.07*Math.abs(Math.sin(aTime*19.1))):0;u.mouth.scale.y=1-.20*talk;u.jaw.position.y=-.47-.036*talk;","const talk=speaking?(.24+.20*Math.abs(Math.sin(aTime*9.7))+.045*Math.abs(Math.sin(aTime*17.4))):0;u.mouth.scale.y=1+.10*talk;u.mouth.scale.x=1-.035*talk;u.jaw.position.y=-.47-.028*talk;"],
  // EMOTION PASS — readable but restrained.
  ["if(state==='welcoming'){b.rotation.y=.034+.012*Math.sin(t*1.7);u.headRig.rotation.y=.062;u.armL.rotation.z=-.22+.045*Math.sin(t*2.2);u.browL.position.y=u.browR.position.y=.552}","if(state==='welcoming'){b.rotation.y=.020+.008*Math.sin(t*1.45);u.headRig.rotation.y=.038;u.armL.rotation.z=-.145+.026*Math.sin(t*1.8);u.browL.position.y=u.browR.position.y=.538}"],
  ["if(state==='gentle'){b.rotation.y=.024;u.headRig.rotation.x=-.046;u.headRig.rotation.z=.026;u.browL.rotation.z=.105;u.browR.rotation.z=-.105}","if(state==='gentle'){b.rotation.y=.014;u.headRig.rotation.x=-.027;u.headRig.rotation.z=.017;u.browL.rotation.z=.072;u.browR.rotation.z=-.072}"],
  ["if(state==='thinking'){u.headRig.rotation.z=.046;u.armR.rotation.z=.24;u.armR.rotation.x=-.10;u.browL.rotation.z=.132;u.browR.rotation.z=-.028;u.browL.position.y=.548}","if(state==='thinking'){u.headRig.rotation.z=.030;u.armR.rotation.z=.165;u.armR.rotation.x=-.065;u.browL.rotation.z=.088;u.browR.rotation.z=-.012;u.browL.position.y=.540}"],
  ["if(state==='playful'){b.rotation.y=.038*Math.sin(t*1.55);u.headRig.rotation.y=.030*Math.sin(t*2.4);u.armL.rotation.z=-.17+.058*Math.sin(t*2.35);u.armR.rotation.z=.17-.052*Math.sin(t*2.15);u.browL.position.y=.558;u.browR.position.y=.544}","if(state==='playful'){b.rotation.y=.024*Math.sin(t*1.35);u.headRig.rotation.y=.018*Math.sin(t*2.0);u.armL.rotation.z=-.115+.034*Math.sin(t*2.0);u.armR.rotation.z=.115-.030*Math.sin(t*1.9);u.browL.position.y=.542;u.browR.position.y=.535}"],
  // FRAMING PASS — center character and zoom out on portrait/mobile.
  ["camera.position.set(0,3.35,9.4);camera.lookAt(-.45,2.18,0);","camera.position.set(0,3.35,9.7);camera.lookAt(-.62,2.20,0);"],
  ["function resize(){const r=stage.getBoundingClientRect();renderer.setSize(Math.round(r.width),Math.round(r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}","function resize(){const r=stage.getBoundingClientRect();renderer.setSize(Math.round(r.width),Math.round(r.height),false);camera.aspect=r.width/r.height;const portrait=camera.aspect<.72;camera.position.z=portrait?11.45:9.7;camera.position.y=portrait?3.42:3.35;camera.lookAt(portrait?-.72:-.62,portrait?2.18:2.20,0);camera.updateProjectionMatrix()}"],
  ["visualVersion:'v9-soft-face-sheen'","visualVersion:'v11-character-pass2'"]
];

module.exports = async function handler(req,res){
  try{
    const r=await fetch(ROOT+'review-gate.html',{headers:{'User-Agent':'bacgau-character-v11-pass2'}});
    if(!r.ok) return res.status(502).send('3D body fetch failed');
    let html=await r.text();
    for(const [from,to] of [
      ['./brain.js',ROOT+'brain.js'],['./liveness.js',ROOT+'liveness.js'],['./turn-runtime.js',ROOT+'turn-runtime.js'],
      ['./three.module.js',ROOT+'three.module.js'],['./three.core.js',ROOT+'three.core.js'],['./assets/',ROOT+'assets/']
    ]) html=html.split(from).join(to);

    let applied=0;
    const missing=[];
    for(const [from,to] of CHARACTER_PATCHES){
      if(html.includes(from)){html=html.split(from).join(to);applied++;} else missing.push(from.slice(0,70));
    }

    html=html.replace('</head>','<base target="_self"><style>.side{display:none!important}.app{grid-template-columns:1fr!important;padding:0!important;gap:0!important}.stage{min-height:100vh!important;border-radius:0!important}.badge{opacity:.62;font-size:12px}.bubble{bottom:max(16px,env(safe-area-inset-bottom));left:16px;right:16px;font-size:clamp(16px,2.2vw,22px)}</style><meta name="bacgau-character-pass" content="v11-character-pass2"></head>');
    html=html.replace('BODY ↔ BRAIN · Living character v9','Bác Gấu · V11');
    html=html.replace('Warm cinematic character study · live WebGL','Character refinement · pass 2');
    html=html.replace('</body>',`<script>window.__BACGAU_CHARACTER_PATCH__={version:'v11-character-pass2',applied:${applied},expected:${CHARACTER_PATCHES.length},missing:${JSON.stringify(missing)}};<\/script></body>`);

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-BacGau-Character','v11-character-pass2');
    res.setHeader('X-BacGau-Patches',`${applied}/${CHARACTER_PATCHES.length}`);
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('3D body bridge error');
  }
};
