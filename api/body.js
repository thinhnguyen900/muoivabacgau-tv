const PIN='f38df09002d9e8d1bf4fc522aa365474a4b73628';
const ROOT=`https://cdn.jsdelivr.net/gh/thinhnguyen900/muoivabacgau-tv@${PIN}/forge/`;

// One independent endpoint: fetch the pinned static review shell once, then apply all
// character refinements locally. No Vercel -> Vercel pass chaining.
const PATCHES=[
  // PASS 2 — softer face, framing, idle and speech motion.
  ['const head=S(1.08,1.06,.93,fur,.965);','const head=S(1.11,1.035,.91,fur,.975);'],
  ['const crown=S(.82,.47,.64,mid,.98);','const crown=S(.84,.445,.62,mid,.985);'],
  ['const cheek=S(.42,.38,.33,light,.985);','const cheek=S(.43,.365,.305,light,.99);'],
  ['const muzzleBridge=S(.25,.21,.16,muz,.985);','const muzzleBridge=S(.235,.19,.145,muz,.99);'],
  ['const muzzleBase=S(.43,.29,.27,muz,.985);','const muzzleBase=S(.405,.265,.245,muz,.99);'],
  ['const pad=S(.23,.18,.19,0xbc967b,.985);','const pad=S(.215,.165,.17,0xbc967b,.99);'],
  ['const jaw=S(.27,.12,.18,0xaa826a,.985);','const jaw=S(.245,.105,.155,0xaa826a,.99);'],
  ['const nose=S(.14,.09,.085,dark,.62);','const nose=S(.132,.082,.074,dark,.68);'],
  ['const white=S(.128,.102,.050,scl,.64);','const white=S(.116,.091,.046,scl,.72);'],
  ['const ir=S(.098,.090,.031,iris,.48);','const ir=S(.094,.086,.030,iris,.52);'],
  ['const pu=S(.050,.057,.018,pupil,.32);','const pu=S(.046,.052,.017,pupil,.36);'],
  ['const gl=new THREE.Mesh(new THREE.SphereGeometry(.014,12,8)','const gl=new THREE.Mesh(new THREE.SphereGeometry(.0105,12,8)'],
  ['const gl2=new THREE.Mesh(new THREE.SphereGeometry(.006,10,6)','const gl2=new THREE.Mesh(new THREE.SphereGeometry(.0045,10,6)'],
  ['upper.position.set(x,.414,.831);','upper.position.set(x,.398,.831);'],
  ['lower.position.set(x,.183,.822);','lower.position.set(x,.198,.822);'],
  ['const browL=S(.165,.015,.020,browMat,.92);','const browL=S(.155,.011,.017,browMat,.96);'],
  ['const mouth=new THREE.Mesh(new THREE.TorusGeometry(.116,.009,10,32,Math.PI)','const mouth=new THREE.Mesh(new THREE.TorusGeometry(.108,.0065,10,32,Math.PI)'],
  ["u.upperLidL.position.y=.414-.128*cl;u.upperLidR.position.y=.414-.120*Math.max(0,cl-asym);u.lowerLidL.position.y=.183+.086*cl;u.lowerLidR.position.y=.183+.081*Math.max(0,cl-asym);","u.upperLidL.position.y=.398-.106*cl;u.upperLidR.position.y=.398-.101*Math.max(0,cl-asym);u.lowerLidL.position.y=.198+.070*cl;u.lowerLidR.position.y=.198+.066*Math.max(0,cl-asym);"],
  ["u.browL.position.y=.53;u.browR.position.y=.53;u.browL.rotation.z=.055;u.browR.rotation.z=-.055;","u.browL.position.y=.525;u.browR.position.y=.525;u.browL.rotation.z=.040;u.browR.rotation.z=-.040;"],
  ["u.headRig.rotation.z=.006*Math.sin(t*.68);u.headRig.rotation.y=.009*Math.sin(t*.43);","u.headRig.rotation.z=.0038*Math.sin(t*.61);u.headRig.rotation.y=.0058*Math.sin(t*.39);"],
  ["u.torso.scale.y=1+.008*breath;u.torso.position.y=.008*breath;b.position.y=.010*Math.sin(t*.98);","u.torso.scale.y=1+.006*breath;u.torso.position.y=.006*breath;b.position.y=.0048*Math.sin(t*.88);"],
  ["u.saccadeX=(Math.random()-.5)*.010;u.saccadeY=(Math.random()-.5)*.006;u.nextSaccade=t+.78+Math.random()*1.65","u.saccadeX=(Math.random()-.5)*.007;u.saccadeY=(Math.random()-.5)*.004;u.nextSaccade=t+1.05+Math.random()*2.05"],
  ["const talk=speaking?(.30+.26*Math.abs(Math.sin(aTime*10.6))+.07*Math.abs(Math.sin(aTime*19.1))):0;u.mouth.scale.y=1-.20*talk;u.jaw.position.y=-.47-.036*talk;","const talk=speaking?(.24+.20*Math.abs(Math.sin(aTime*9.7))+.045*Math.abs(Math.sin(aTime*17.4))):0;u.mouth.scale.y=1+.10*talk;u.mouth.scale.x=1-.035*talk;u.jaw.position.y=-.47-.028*talk;"],
  ["if(state==='welcoming'){b.rotation.y=.034+.012*Math.sin(t*1.7);u.headRig.rotation.y=.062;u.armL.rotation.z=-.22+.045*Math.sin(t*2.2);u.browL.position.y=u.browR.position.y=.552}","if(state==='welcoming'){b.rotation.y=.020+.008*Math.sin(t*1.45);u.headRig.rotation.y=.038;u.armL.rotation.z=-.145+.026*Math.sin(t*1.8);u.browL.position.y=u.browR.position.y=.538}"],
  ["if(state==='gentle'){b.rotation.y=.024;u.headRig.rotation.x=-.046;u.headRig.rotation.z=.026;u.browL.rotation.z=.105;u.browR.rotation.z=-.105}","if(state==='gentle'){b.rotation.y=.014;u.headRig.rotation.x=-.027;u.headRig.rotation.z=.017;u.browL.rotation.z=.072;u.browR.rotation.z=-.072}"],
  ["if(state==='thinking'){u.headRig.rotation.z=.046;u.armR.rotation.z=.24;u.armR.rotation.x=-.10;u.browL.rotation.z=.132;u.browR.rotation.z=-.028;u.browL.position.y=.548}","if(state==='thinking'){u.headRig.rotation.z=.030;u.armR.rotation.z=.165;u.armR.rotation.x=-.065;u.browL.rotation.z=.088;u.browR.rotation.z=-.012;u.browL.position.y=.540}"],
  ["if(state==='playful'){b.rotation.y=.038*Math.sin(t*1.55);u.headRig.rotation.y=.030*Math.sin(t*2.4);u.armL.rotation.z=-.17+.058*Math.sin(t*2.35);u.armR.rotation.z=.17-.052*Math.sin(t*2.15);u.browL.position.y=.558;u.browR.position.y=.544}","if(state==='playful'){b.rotation.y=.024*Math.sin(t*1.35);u.headRig.rotation.y=.018*Math.sin(t*2.0);u.armL.rotation.z=-.115+.034*Math.sin(t*2.0);u.armR.rotation.z=.115-.030*Math.sin(t*1.9);u.browL.position.y=.542;u.browR.position.y=.535}"],
  ["camera.position.set(0,3.35,9.4);camera.lookAt(-.45,2.18,0);","camera.position.set(0,3.35,9.7);camera.lookAt(-.62,2.20,0);"],
  ["function resize(){const r=stage.getBoundingClientRect();renderer.setSize(Math.round(r.width),Math.round(r.height),false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}","function resize(){const r=stage.getBoundingClientRect();renderer.setSize(Math.round(r.width),Math.round(r.height),false);camera.aspect=r.width/r.height;const portrait=camera.aspect<.72;camera.position.z=portrait?11.45:9.7;camera.position.y=portrait?3.42:3.35;camera.lookAt(portrait?-.72:-.62,portrait?2.18:2.20,0);camera.updateProjectionMatrix()}"],
  ["visualVersion:'v9-soft-face-sheen'","visualVersion:'v11-character-pass2'"],

  // PASS 3 — geometry cleanup and smoother silhouette.
  ['philtrum.rotation.z=Math.PI/2;','philtrum.rotation.z=0;'],
  ['const browBridge=S(.67,.25,.34,fur,.985);','const browBridge=S(.61,.21,.30,fur,.99);'],
  ['const socket=S(.195,.152,.066,mid,.99);','const socket=S(.180,.138,.060,mid,.99);'],
  ['const temple=S(.40,.49,.34,mid,.985);','const temple=S(.38,.46,.31,mid,.99);'],
  ['const ear=S(.29,.31,.20,fur,.985);','const ear=S(.275,.292,.19,fur,.99);'],
  ['const body=S(1.11,1.40,.88,fur,.97);','const body=S(1.07,1.36,.86,fur,.98);'],
  ['const hip=S(.98,.82,.80,mid,.985);','const hip=S(.94,.79,.77,mid,.99);'],
  ['const belly=S(.70,.86,.54,mid,.985);','const belly=S(.68,.82,.52,mid,.99);'],
  ['const neck=S(.76,.51,.64,fur,.985);','const neck=S(.70,.46,.60,fur,.99);'],
  ['const sh=S(.45,.40,.46,fur,.985);','const sh=S(.41,.37,.42,fur,.99);'],
  ['const up=S(.27,.58,.30,fur,.985);','const up=S(.285,.55,.295,fur,.99);'],
  ['const fore=S(.255,.50,.275,mid,.99);','const fore=S(.27,.47,.27,mid,.99);'],
  ['const paw=S(.32,.27,.33,light,.99);','const paw=S(.315,.255,.32,light,.99);'],
  ['mouth.position.set(0,-.42,.902);','mouth.position.set(0,-.415,.892);'],
  ["visualVersion:'v11-character-pass2'","visualVersion:'v11-character-pass3'"],

  // PASS 4 — eased expression transitions instead of pose snapping.
  ["const b=bear();scene.add(b);","const b=bear();scene.add(b);const EM={headX:0,headY:0,headZ:0,bodyY:0,armL:-.045,armR:.045,browLY:.525,browRY:.525,browLZ:.040,browRZ:-.040,lid:.0};const EASE=.075;const mix=(a,z,k)=>a+(z-a)*k;"],
  ["function apply(k){state=k;bubble.textContent=text[k];stage.dataset.state=k;refresh()}","function apply(k){state=k;bubble.textContent=text[k];stage.dataset.state=k;stage.dataset.transition='1';setTimeout(()=>{if(stage.dataset.state===k)stage.dataset.transition='0'},520);refresh()}"],
  ["u.browL.position.y=.525;u.browR.position.y=.525;u.browL.rotation.z=.040;u.browR.rotation.z=-.040;u.headRig.rotation.x=0;b.rotation.y=0;if(state==='welcoming'){b.rotation.y=.020+.008*Math.sin(t*1.45);u.headRig.rotation.y=.038;u.armL.rotation.z=-.145+.026*Math.sin(t*1.8);u.browL.position.y=u.browR.position.y=.538}if(state==='gentle'){b.rotation.y=.014;u.headRig.rotation.x=-.027;u.headRig.rotation.z=.017;u.browL.rotation.z=.072;u.browR.rotation.z=-.072}if(state==='thinking'){u.headRig.rotation.z=.030;u.armR.rotation.z=.165;u.armR.rotation.x=-.065;u.browL.rotation.z=.088;u.browR.rotation.z=-.012;u.browL.position.y=.540}if(state==='playful'){b.rotation.y=.024*Math.sin(t*1.35);u.headRig.rotation.y=.018*Math.sin(t*2.0);u.armL.rotation.z=-.115+.034*Math.sin(t*2.0);u.armR.rotation.z=.115-.030*Math.sin(t*1.9);u.browL.position.y=.542;u.browR.position.y=.535}","let tx=0,ty=.0058*Math.sin(t*.39),tz=.0038*Math.sin(t*.61),by=0,al=-.045+.008*Math.sin(t*.82),ar=.045-.008*Math.sin(t*.78),bly=.525,bry=.525,blz=.040,brz=-.040,lid=0;if(state==='welcoming'){by=.018+.006*Math.sin(t*1.35);ty=.026;al=-.125+.022*Math.sin(t*1.7);bly=bry=.536;lid=.006}if(state==='gentle'){by=.010;tx=-.021;tz=.013;blz=.064;brz=-.064;lid=.015}if(state==='thinking'){tz=.024;ar=.138;blz=.078;brz=-.010;bly=.537;lid=.009}if(state==='playful'){by=.019*Math.sin(t*1.25);ty=.014*Math.sin(t*1.85);al=-.102+.028*Math.sin(t*1.9);ar=.102-.026*Math.sin(t*1.8);bly=.539;bry=.533;lid=.003}EM.headX=mix(EM.headX,tx,EASE);EM.headY=mix(EM.headY,ty,EASE);EM.headZ=mix(EM.headZ,tz,EASE);EM.bodyY=mix(EM.bodyY,by,EASE);EM.armL=mix(EM.armL,al,EASE);EM.armR=mix(EM.armR,ar,EASE);EM.browLY=mix(EM.browLY,bly,EASE);EM.browRY=mix(EM.browRY,bry,EASE);EM.browLZ=mix(EM.browLZ,blz,EASE);EM.browRZ=mix(EM.browRZ,brz,EASE);EM.lid=mix(EM.lid,lid,EASE);u.headRig.rotation.x=EM.headX;u.headRig.rotation.y=EM.headY;u.headRig.rotation.z=EM.headZ;b.rotation.y=EM.bodyY;u.armL.rotation.z=EM.armL;u.armR.rotation.z=EM.armR;u.browL.position.y=EM.browLY;u.browR.position.y=EM.browRY;u.browL.rotation.z=EM.browLZ;u.browR.rotation.z=EM.browRZ;u.upperLidL.position.y-=EM.lid;u.upperLidR.position.y-=EM.lid*.96;u.lowerLidL.position.y+=EM.lid*.35;u.lowerLidR.position.y+=EM.lid*.33;"],
  ["visualVersion:'v11-character-pass3'","visualVersion:'v11-character-pass4'"],

  // PASS 5 — calmer skin/fur response and more organic eye/nose highlights.
  ["const M=(c,r=.92)=>new THREE.MeshPhysicalMaterial({color:c,roughness:r,metalness:0,sheen:.18,sheenRoughness:.84,sheenColor:new THREE.Color(c).offsetHSL(0,0,.05),clearcoat:.015,clearcoatRoughness:.9})","const M=(c,r=.92)=>new THREE.MeshPhysicalMaterial({color:c,roughness:r,metalness:0,sheen:.24,sheenRoughness:.76,sheenColor:new THREE.Color(c).offsetHSL(0,0,.045),clearcoat:.006,clearcoatRoughness:.96})"],
  ["scene.add(new THREE.HemisphereLight(0xffead8,0x2b2425,1.14));const key=new THREE.DirectionalLight(0xffd2ad,2.18);","scene.add(new THREE.HemisphereLight(0xffead8,0x2b2425,1.02));const key=new THREE.DirectionalLight(0xffd2ad,1.82);"],
  ["const fill=new THREE.PointLight(0xffb574,3.05,10,2);","const fill=new THREE.PointLight(0xffb574,2.38,10,2);"],
  ["const faceFill=new THREE.PointLight(0xffd7bc,1.25,6,2);","const faceFill=new THREE.PointLight(0xffd7bc,.92,6,2);"],
  ["renderer.toneMappingExposure=1.02;","renderer.toneMappingExposure=1.04;"],
  ["const nose=S(.132,.082,.074,dark,.68);nose.position.set(0,-.11,.92);headRig.add(nose);","const nose=S(.132,.082,.074,dark,.68);nose.material=new THREE.MeshPhysicalMaterial({color:dark,roughness:.34,metalness:0,clearcoat:.20,clearcoatRoughness:.46,sheen:.04});nose.position.set(0,-.11,.92);headRig.add(nose);"],
  ["const white=S(.116,.091,.046,scl,.72);white.castShadow=false;sclera.add(white);","const white=S(.116,.091,.046,scl,.72);white.material=new THREE.MeshPhysicalMaterial({color:0xe2d6ca,roughness:.33,metalness:0,clearcoat:.18,clearcoatRoughness:.40});white.castShadow=false;sclera.add(white);"],
  ["const ir=S(.094,.086,.030,iris,.52);ir.castShadow=false;look.add(ir);","const ir=S(.094,.086,.030,iris,.52);ir.material=new THREE.MeshPhysicalMaterial({color:iris,roughness:.27,metalness:0,clearcoat:.32,clearcoatRoughness:.30});ir.castShadow=false;look.add(ir);"],
  ["const pu=S(.046,.052,.017,pupil,.36);pu.position.z=.027;pu.castShadow=false;look.add(pu);","const pu=S(.046,.052,.017,pupil,.36);pu.material=new THREE.MeshPhysicalMaterial({color:pupil,roughness:.20,metalness:0,clearcoat:.42,clearcoatRoughness:.24});pu.position.z=.027;pu.castShadow=false;look.add(pu);"],
  ["visualVersion:'v11-character-pass4'","visualVersion:'v11-character-pass5'"],

  // PASS 6 — mobile GPU guard and character-only review mode.
  ["renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));","const DPR=Math.min(devicePixelRatio||1,(innerWidth<700?1.35:1.8));renderer.setPixelRatio(DPR);"],
  ["async function play(k){viAudio.pause();enAudio.pause();scenarioAudio.pause();scenarioAudio.src=aud[k];scenarioAudio.currentTime=0;speaking=true;apply(k);await scenarioAudio.play();window.__BACGAU_SCENARIO_AUDIO__={state:k,src:scenarioAudio.currentSrc||scenarioAudio.src,played:true}}","async function play(k){viAudio.pause();enAudio.pause();scenarioAudio.pause();scenarioAudio.removeAttribute('src');scenarioAudio.load();speaking=false;apply(k);window.__BACGAU_SCENARIO_AUDIO__={state:k,src:null,played:false,reviewMode:true}}"],
  ["visualVersion:'v11-character-pass5'","visualVersion:'v11-character-pass6'"],

  // PASS 7 — frame-rate-independent blink + sustained viewer eye contact with short glances.
  ["blink:0,nextBlink:1.7,gazeX:0,gazeY:0,saccadeX:0,saccadeY:0,nextSaccade:.8","blinkStart:-10,nextBlink:1.55,gazeX:0,gazeY:0,saccadeX:0,saccadeY:0,nextSaccade:.8,lookAwayUntil:0,nextLookAway:3.2,lookAwayX:0,lookAwayY:0"],
  ["if(t>u.nextBlink){u.blink=1;u.nextBlink=t+3.4+Math.random()*4.3}u.blink=Math.max(0,u.blink-.090);const cl=Math.sin(Math.PI*u.blink),asym=.011*Math.sin(t*2.3);u.upperLidL.position.y=.398-.106*cl;u.upperLidR.position.y=.398-.101*Math.max(0,cl-asym);u.lowerLidL.position.y=.198+.070*cl;u.lowerLidR.position.y=.198+.066*Math.max(0,cl-asym);","if(t>u.nextBlink){u.blinkStart=t;u.nextBlink=t+3.6+Math.random()*4.8}const blinkAge=t-u.blinkStart,blinkP=Math.max(0,Math.min(1,blinkAge/.19)),cl=(blinkAge>=0&&blinkAge<.19)?Math.sin(Math.PI*blinkP):0,asym=.006*Math.sin(t*1.9);u.upperLidL.position.y=.398-.111*cl;u.upperLidR.position.y=.398-.107*Math.max(0,cl-asym);u.lowerLidL.position.y=.198+.073*cl;u.lowerLidR.position.y=.198+.070*Math.max(0,cl-asym);"],
  ["if(t>u.nextSaccade){u.saccadeX=(Math.random()-.5)*.007;u.saccadeY=(Math.random()-.5)*.004;u.nextSaccade=t+1.05+Math.random()*2.05}u.saccadeX*=.975;u.saccadeY*=.975;const gx=(state==='thinking'?.018:state==='playful'?.010*Math.sin(t*1.5):state==='gentle'?-.004:0)+u.saccadeX,gy=(state==='thinking'?.010:state==='gentle'?-.005:0)+u.saccadeY;u.gazeX+=(gx-u.gazeX)*.043;u.gazeY+=(gy-u.gazeY)*.043;u.eyeL.position.set(u.gazeX,u.gazeY,.050);u.eyeR.position.set(u.gazeX,u.gazeY,.050);","if(t>u.nextSaccade){u.saccadeX=(Math.random()-.5)*.0045;u.saccadeY=(Math.random()-.5)*.0028;u.nextSaccade=t+1.35+Math.random()*2.45}u.saccadeX*=.968;u.saccadeY*=.968;if(t>u.nextLookAway){if(Math.random()<.38){u.lookAwayUntil=t+.42+Math.random()*.62;u.lookAwayX=(Math.random()<.5?-1:1)*(.010+Math.random()*.010);u.lookAwayY=(Math.random()-.42)*.007}u.nextLookAway=t+2.9+Math.random()*4.4}const away=t<u.lookAwayUntil,baseGX=state==='thinking'?.012:state==='playful'?.004*Math.sin(t*1.35):state==='gentle'?-.002:0,baseGY=state==='thinking'?.006:state==='gentle'?-.003:0,gx=baseGX+(away?u.lookAwayX:0)+u.saccadeX,gy=baseGY+(away?u.lookAwayY:0)+u.saccadeY;u.gazeX+=(gx-u.gazeX)*.052;u.gazeY+=(gy-u.gazeY)*.052;u.eyeL.position.set(u.gazeX,u.gazeY,.050);u.eyeR.position.set(u.gazeX,u.gazeY,.050);"],
  ["visualVersion:'v11-character-pass6'","visualVersion:'v11-character-pass7'"],
];

const REVIEW_HARNESS=`<style id="reviewHarnessStyle">#reviewHarness{position:fixed;z-index:50;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:8px;padding:8px;background:#17110db8;border:1px solid #ffffff20;border-radius:999px;backdrop-filter:blur(14px)}#reviewHarness button{width:auto!important;margin:0!important;padding:10px 12px!important;border-radius:999px!important;font-size:14px!important;white-space:nowrap}.bubble{bottom:86px!important}@media(max-width:560px){#reviewHarness{gap:5px;padding:6px;max-width:calc(100vw - 12px)}#reviewHarness button{padding:9px 9px!important;font-size:12px!important}.badge{display:none!important}.bubble{bottom:76px!important}}</style><div id="reviewHarness"><button data-review="welcoming">🏠 Vui</button><button data-review="gentle">😔 Dịu</button><button data-review="thinking">🤔 Nghĩ</button><button data-review="playful">🦖 Tinh nghịch</button></div><script>document.querySelectorAll('#reviewHarness [data-review]').forEach(btn=>btn.addEventListener('click',()=>{const k=btn.dataset.review;const target=document.querySelector('[data-state="'+k+'"]');if(target)target.click();}));window.addEventListener('error',e=>{const b=document.querySelector('.bubble');if(b&&/WebGL|context|shader/i.test(String(e.message||'')))b.textContent='Thiết bị chưa khởi tạo được 3D. Đang dùng chế độ an toàn.';});window.__BACGAU_REVIEW_MODE__={characterOnly:true,audioMuted:true,mobileDprCap:true,naturalBlink:true,eyeContact:true};<\/script>`;

module.exports=async function handler(req,res){
  try{
    const r=await fetch(ROOT+'review-gate.html',{headers:{'User-Agent':'bacgau-character-v11-pass7-flat','Cache-Control':'no-cache'}});
    if(!r.ok)return res.status(502).send('pinned character shell fetch failed: '+r.status);
    let html=await r.text();

    for(const [from,to] of [
      ['./brain.js',ROOT+'brain.js'],['./liveness.js',ROOT+'liveness.js'],['./turn-runtime.js',ROOT+'turn-runtime.js'],
      ['./three.module.js',ROOT+'three.module.js'],['./three.core.js',ROOT+'three.core.js'],['./assets/',ROOT+'assets/']
    ])html=html.split(from).join(to);

    let applied=0;const missing=[];
    for(const [from,to] of PATCHES){
      if(html.includes(from)){html=html.split(from).join(to);applied++;}
      else missing.push(from.slice(0,96));
    }

    html=html.replace('</head>','<base target="_self"><style>.side{display:none!important}.app{grid-template-columns:1fr!important;padding:0!important;gap:0!important}.stage{min-height:100vh!important;border-radius:0!important}.badge{opacity:.62;font-size:12px}.bubble{bottom:max(16px,env(safe-area-inset-bottom));left:16px;right:16px;font-size:clamp(16px,2.2vw,22px)}</style><meta name="bacgau-character-pass" content="v11-character-pass7-flat"></head>');
    html=html.replace('BODY ↔ BRAIN · Living character v9','Bác Gấu · V11');
    html=html.replace('Warm cinematic character study · live WebGL','Character refinement · pass 7 · flat endpoint');
    html=html.replace('</body>',REVIEW_HARNESS+`<script>window.__BACGAU_CHARACTER_FLAT__={version:'v11-character-pass7-flat',applied:${applied},expected:${PATCHES.length},missing:${JSON.stringify(missing)},chainFree:true};<\/script></body>`);

    res.setHeader('Content-Type','text/html; charset=utf-8');
    res.setHeader('Cache-Control','no-store');
    res.setHeader('X-BacGau-Character','v11-character-pass7-flat');
    res.setHeader('X-BacGau-Patches',`${applied}/${PATCHES.length}`);
    res.setHeader('X-BacGau-Chain-Free','1');
    return res.status(200).send(html);
  }catch(e){
    return res.status(500).send('character v11 flat error: '+e.message);
  }
};
