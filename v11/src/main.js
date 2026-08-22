import * as THREE from 'three';
import './styles.css';
import { CharacterRuntime } from './character-runtime.js';
import { MotionController } from './motion-controller.js';
import { LipSync } from './lip-sync.js';
const app=document.querySelector('#app');
app.innerHTML=`<main class="app" data-app-ready="false"><section class="stage" id="stage"><div class="poster" id="poster"><div><strong>Bác Gấu V11</strong><p>Runtime đã chuyển sang nhân vật GLB có rig thật. Poster chỉ xuất hiện khi asset 3D chưa được gắn vào build.</p></div></div><div class="pill">V11 · RIGGED CHARACTER</div><div class="loading" id="loading"><div><div class="spinner"></div><b>Đang khởi tạo Bác Gấu…</b></div></div><div class="caption" id="caption">Xin chào Muối! 👋</div></section><aside class="panel"><div class="brand"><div class="avatar">🐾</div><div><h1>Bác Gấu</h1><div class="sub">Người bạn đồng hành của Muối</div></div></div><div class="status"><span class="dot"></span><b id="status">Đang khởi tạo runtime…</b><div class="wave">${'<i></i>'.repeat(28)}</div></div><button data-state="welcoming">🏠 Muối về — vẫy tay</button><button data-state="gentle">🙂 Con buồn — cúi nghe</button><button data-state="thinking">🤔 Hỏi khó — suy nghĩ</button><button data-state="playful">🎲 Kể chuyện — hào hứng</button><button class="secondary" id="voiceTest">🔊 Test giọng + lip-sync</button><audio id="voice" preload="auto" playsinline src="https://bacgau-pass82-safari-full.vercel.app/api/asset?name=vi-test.mp3"></audio><div class="quality">QUALITY GATE: không procedural spheres/boxes · GLB skeleton · facial morph targets · animation mixer · audio-driven jaw · same artifact on Chrome/WebKit.</div><pre class="debug" id="debug">booting…</pre></aside></main>`;
for(const [i,e] of [...document.querySelectorAll('.wave i')].entries())e.style.setProperty('--h',`${8+(i*13%27)}px`);
const stage=document.querySelector('#stage'),loading=document.querySelector('#loading'),poster=document.querySelector('#poster'),status=document.querySelector('#status'),debug=document.querySelector('#debug'),caption=document.querySelector('#caption');
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x8fc8e7);
scene.fog=new THREE.FogExp2(0x8fc8e7,0.035);
const camera=new THREE.PerspectiveCamera(31,1,.1,100);
camera.position.set(0,2.92,9.35);
camera.lookAt(0,2.28,0);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.03;
stage.prepend(renderer.domElement);

// Warm, soft three-point portrait lighting. Keep fill below key so facial volumes survive.
const hemi=new THREE.HemisphereLight(0xffeed7,0x31543d,1.35);scene.add(hemi);
const key=new THREE.DirectionalLight(0xffddb4,3.25);key.position.set(-4.2,7.4,5.6);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.camera.near=.1;key.shadow.camera.far=24;key.shadow.camera.left=-5;key.shadow.camera.right=5;key.shadow.camera.top=7;key.shadow.camera.bottom=-2;key.shadow.bias=-0.00018;key.shadow.normalBias=0.028;scene.add(key);
const fill=new THREE.DirectionalLight(0xfff3df,0.72);fill.position.set(4.5,3.4,6.2);scene.add(fill);
const rim=new THREE.DirectionalLight(0xb4d9ff,0.78);rim.position.set(5.2,5.1,-4.6);scene.add(rim);
const eyeBounce=new THREE.PointLight(0xffead2,0.48,10,2);eyeBounce.position.set(0,3.45,4.8);scene.add(eyeBounce);

const floor=new THREE.Mesh(new THREE.CircleGeometry(6.8,96),new THREE.MeshStandardMaterial({color:0x765338,roughness:.94,metalness:0}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const contact=new THREE.Mesh(new THREE.CircleGeometry(2.2,64),new THREE.MeshBasicMaterial({color:0x1d251c,transparent:true,opacity:.12,depthWrite:false}));contact.rotation.x=-Math.PI/2;contact.position.y=.006;contact.scale.set(1,.58,1);scene.add(contact);

const character=new CharacterRuntime({scene,onStatus:t=>status.textContent=t});let motion=null;const lip=new LipSync(character);const voice=document.querySelector('#voice');lip.attach(voice);const MODEL_URL='/character/bac-gau.glb';
try{const report=await character.load(MODEL_URL);poster.hidden=true;motion=new MotionController(character,t=>caption.textContent=t);motion.setState('idle');debug.textContent=JSON.stringify(report,null,2);window.__BACGAU_V11__={ready:true,model:true,report,visualPipeline:'warm-portrait-v2'};}catch(err){poster.hidden=false;status.textContent='V11 runtime ✓ · đang chờ rigged GLB';debug.textContent=`MODEL PENDING\n${err?.message||err}`;window.__BACGAU_V11__={ready:true,model:false,error:String(err),visualPipeline:'warm-portrait-v2'}}finally{loading.hidden=true;document.querySelector('.app').dataset.appReady='true'}
document.querySelectorAll('[data-state]').forEach(btn=>btn.onclick=()=>motion?.setState(btn.dataset.state));document.querySelector('#voiceTest').onclick=async()=>{voice.currentTime=0;await voice.play()};function resize(){const r=stage.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}resize();addEventListener('resize',resize);const clock=new THREE.Clock();function tick(){const dt=Math.min(.05,clock.getDelta());character.update(dt);motion?.update(dt);lip.update();renderer.render(scene,camera);requestAnimationFrame(tick)}tick();
