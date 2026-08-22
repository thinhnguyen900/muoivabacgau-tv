import * as THREE from 'three';
import './styles.css';
import { CharacterRuntime } from './character-runtime.js';
import { ProceduralBearRuntime } from './procedural-bear-runtime.js';
import { MotionController } from './motion-controller.js';
import { LipSync } from './lip-sync.js';
import { tuneAuthoredBear } from './visual-tuning.js';

const app=document.querySelector('#app');
app.innerHTML=`<main class="app" data-app-ready="false"><section class="stage" id="stage"><div class="poster" id="poster"><div><strong>Bác Gấu V11</strong><p>Đang khởi tạo nhân vật 3D…</p></div></div><div class="pill">V11 · CHARACTER FORGE</div><div class="loading" id="loading"><div><div class="spinner"></div><b>Đang khởi tạo Bác Gấu…</b></div></div><div class="caption" id="caption">Xin chào Muối! 👋</div></section><aside class="panel"><div class="brand"><div class="avatar">🐾</div><div><h1>Bác Gấu</h1><div class="sub">Người bạn đồng hành của Muối</div></div></div><div class="status"><span class="dot"></span><b id="status">Đang khởi tạo runtime…</b><div class="wave">${'<i></i>'.repeat(28)}</div></div><button data-state="welcoming">🏠 Muối về — vẫy tay</button><button data-state="gentle">🙂 Con buồn — cúi nghe</button><button data-state="thinking">🤔 Hỏi khó — suy nghĩ</button><button data-state="playful">🎲 Kể chuyện — hào hứng</button><button class="secondary" id="voiceTest">🔊 Test giọng + lip-sync</button><audio id="voice" preload="auto" playsinline src="https://bacgau-pass82-safari-full.vercel.app/api/asset?name=vi-test.mp3"></audio><div class="quality">VISUAL GATE: mature authored silhouette · soulful eyes · modular face/body controls · audio-driven jaw · GLB hot-swap ready.</div><pre class="debug" id="debug">booting…</pre></aside></main>`;
for(const [i,e] of [...document.querySelectorAll('.wave i')].entries())e.style.setProperty('--h',`${8+(i*13%27)}px`);
const stage=document.querySelector('#stage'),loading=document.querySelector('#loading'),poster=document.querySelector('#poster'),status=document.querySelector('#status'),debug=document.querySelector('#debug'),caption=document.querySelector('#caption');

function makeBackdropTexture(){
  const c=document.createElement('canvas');c.width=1024;c.height=1024;const x=c.getContext('2d');
  const g=x.createLinearGradient(0,0,0,1024);g.addColorStop(0,'#73958f');g.addColorStop(.48,'#8bad96');g.addColorStop(1,'#c8b78f');x.fillStyle=g;x.fillRect(0,0,1024,1024);
  const glows=[[190,245,210,'rgba(255,238,196,.20)'],[800,220,250,'rgba(225,245,222,.11)'],[720,620,190,'rgba(255,224,174,.10)'],[300,720,245,'rgba(68,101,72,.10)']];
  for(const [cx,cy,r,color] of glows){const q=x.createRadialGradient(cx,cy,0,cx,cy,r);q.addColorStop(0,color);q.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=q;x.fillRect(cx-r,cy-r,r*2,r*2);}
  x.globalAlpha=.09;x.fillStyle='#315548';for(let i=0;i<16;i++){const px=(i*197)%1120-50,py=680+(i*83)%250,rr=90+(i*29)%120;x.beginPath();x.arc(px,py,rr,0,Math.PI*2);x.fill();}x.globalAlpha=1;
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.minFilter=THREE.LinearFilter;return tex;
}

const scene=new THREE.Scene();scene.background=new THREE.Color(0x83a49d);scene.fog=new THREE.FogExp2(0x91aa9c,0.026);
const camera=new THREE.PerspectiveCamera(31,1,.1,100);camera.position.set(0,2.86,9.30);camera.lookAt(0,2.26,.04);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.97;stage.prepend(renderer.domElement);

const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(14,9),new THREE.MeshBasicMaterial({map:makeBackdropTexture(),fog:false,toneMapped:false}));backdrop.position.set(0,3.25,-3.35);scene.add(backdrop);
const hemi=new THREE.HemisphereLight(0xffead3,0x29483b,1.08);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffd9b6,2.10);key.position.set(-4.9,7.6,6.4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=.1;key.shadow.camera.far=24;key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=7;key.shadow.camera.bottom=-2;key.shadow.bias=-0.00016;key.shadow.normalBias=0.035;key.shadow.radius=3;scene.add(key);
const fill=new THREE.DirectionalLight(0xfff1e2,.84);fill.position.set(4.6,3.8,6.6);scene.add(fill);
const rim=new THREE.DirectionalLight(0xb9d9ce,.46);rim.position.set(5.4,5.9,-4.8);scene.add(rim);
const faceBounce=new THREE.PointLight(0xffead2,.60,9,2);faceBounce.position.set(-.15,3.44,4.75);scene.add(faceBounce);
const eyeBounce=new THREE.PointLight(0xfff7e9,.20,5,2);eyeBounce.position.set(.16,3.22,5.05);scene.add(eyeBounce);
const floor=new THREE.Mesh(new THREE.CircleGeometry(6.8,96),new THREE.MeshStandardMaterial({color:0x6b5944,roughness:.98,metalness:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const contact=new THREE.Mesh(new THREE.CircleGeometry(2.05,64),new THREE.MeshBasicMaterial({color:0x263126,transparent:true,opacity:.10,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.006;contact.scale.set(1,.56,1);scene.add(contact);

const MODEL_URL='/character/bac-gau.glb';
let character=new CharacterRuntime({scene,onStatus:t=>status.textContent=t});let modelMode='glb';let report;
try{report=await character.load(MODEL_URL);}
catch(err){
  modelMode='authored-fallback';
  character=new ProceduralBearRuntime({scene,onStatus:t=>status.textContent=t});
  report=character.build();
  report.glbError=String(err?.message||err);
  report.visualTune=tuneAuthoredBear(character);
}
poster.hidden=true;
const motion=new MotionController(character,t=>caption.textContent=t);motion.setState('idle');
const voice=document.querySelector('#voice');const lip=new LipSync(character);lip.attach(voice);
debug.textContent=JSON.stringify(report,null,2);window.__BACGAU_V11__={ready:true,model:modelMode==='glb',mode:modelMode,report,visualPipeline:'authored-warm-v6-soft-portrait'};
loading.hidden=true;document.querySelector('.app').dataset.appReady='true';

document.querySelectorAll('[data-state]').forEach(btn=>btn.onclick=()=>motion.setState(btn.dataset.state));
document.querySelector('#voiceTest').onclick=async()=>{voice.currentTime=0;await voice.play()};
function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}resize();addEventListener('resize',resize);
const clock=new THREE.Clock();function tick(){const dt=Math.min(.05,clock.getDelta());character.update(dt);motion.update(dt);lip.update();renderer.render(scene,camera);requestAnimationFrame(tick)}tick();
