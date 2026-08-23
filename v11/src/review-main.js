import * as THREE from 'three';
import { ProceduralBearRuntime } from './procedural-bear-runtime.js';
import { MotionController } from './motion-controller.js';
import { LipSync } from './lip-sync.js';
import { tuneAuthoredBear } from './visual-tuning.js';

const app=document.querySelector('#app');
app.innerHTML=`<main class="app" data-app-ready="false"><section class="stage" id="stage"><div class="pill">V11 · INTERIM MATURE PREVIEW</div><div class="loading" id="loading"><div><div class="spinner"></div><b>Đang dựng Bác Gấu…</b></div></div><div class="caption" id="caption">Bác Gấu đang ở đây với Muối.</div></section><aside class="panel"><div class="brand"><div class="avatar">🐾</div><div><h1>Bác Gấu</h1><div class="sub">Mature mentor visual review</div></div></div><div class="status"><span class="dot"></span><b id="status">Đang khởi tạo WebGL…</b></div><button data-state="welcoming">🏠 Muối về — vẫy tay</button><button data-state="gentle">🙂 Con buồn — cúi nghe</button><button data-state="thinking">🤔 Hỏi khó — suy nghĩ</button><button data-state="playful">🎲 Kể chuyện — hào hứng</button><button class="secondary" id="voiceTest">🔊 Test giọng + lip-sync</button><audio id="voice" preload="auto" playsinline crossorigin="anonymous" src="https://bacgau-pass82-safari-full.vercel.app/api/asset?name=vi-test.mp3"></audio><div class="quality">INTERIM ONLY · authored mature fallback để review mắt / mõm / tỷ lệ / motion. Free GLB candidate vẫn đang được forge riêng.</div><pre class="debug" id="debug">booting…</pre></aside></main>`;

const stage=document.querySelector('#stage');
const loading=document.querySelector('#loading');
const status=document.querySelector('#status');
const debug=document.querySelector('#debug');
const caption=document.querySelector('#caption');

const scene=new THREE.Scene();
scene.background=new THREE.Color(0x87a9a1);
scene.fog=new THREE.FogExp2(0x91aa9c,0.024);

const camera=new THREE.PerspectiveCamera(31,1,.1,100);
camera.position.set(0,2.86,9.30);
camera.lookAt(0,2.28,.04);

const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance',alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=.98;
stage.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffead3,0x29483b,1.12));
const key=new THREE.DirectionalLight(0xffd9b6,2.05);key.position.set(-4.8,7.4,6.2);key.castShadow=true;scene.add(key);
const fill=new THREE.DirectionalLight(0xfff2e5,.82);fill.position.set(4.4,3.8,6.2);scene.add(fill);
const rim=new THREE.DirectionalLight(0xb9d9ce,.45);rim.position.set(5.0,5.8,-4.4);scene.add(rim);
const face=new THREE.PointLight(0xffead2,.56,9,2);face.position.set(0,3.35,4.8);scene.add(face);

const floor=new THREE.Mesh(new THREE.CircleGeometry(6.8,96),new THREE.MeshStandardMaterial({color:0x665441,roughness:.98,metalness:0}));
floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);

const character=new ProceduralBearRuntime({scene,onStatus:t=>status.textContent=t});
const report=character.build();
report.visualTune=tuneAuthoredBear(character);

const motion=new MotionController(character,t=>caption.textContent=t);
motion.setState('idle');

const voice=document.querySelector('#voice');
const lip=new LipSync(character);lip.attach(voice);
document.querySelector('#voiceTest').onclick=async()=>{try{voice.currentTime=0;await voice.play();}catch(err){status.textContent='Audio cần tap lại trên Safari';console.warn(err);}};
document.querySelectorAll('[data-state]').forEach(btn=>btn.onclick=()=>motion.setState(btn.dataset.state));

debug.textContent=JSON.stringify({mode:'authored-fallback',visualPipeline:'mature-v7-contained-almond-eyes-soft-sockets',report},null,2);
window.__BACGAU_REVIEW__={ready:true,mode:'authored-fallback',report};
loading.hidden=true;document.querySelector('.app').dataset.appReady='true';

function resize(){const r=stage.getBoundingClientRect();renderer.setSize(Math.max(1,r.width),Math.max(1,r.height),false);camera.aspect=Math.max(.1,r.width/Math.max(1,r.height));camera.updateProjectionMatrix();}
resize();window.addEventListener('resize',resize,{passive:true});

const clock=new THREE.Clock();
function tick(){const dt=Math.min(.05,clock.getDelta());character.update(dt);motion.update(dt);lip.update();renderer.render(scene,camera);requestAnimationFrame(tick);}
tick();
