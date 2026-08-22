import { chromium } from 'playwright';
import fs from 'node:fs';

const url=process.env.FORGE_GATE_URL||'http://127.0.0.1:4173/forge/review-gate.html';
const browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader','--enable-webgl','--ignore-gpu-blocklist','--autoplay-policy=no-user-gesture-required']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(m.text())});
await page.goto(url,{waitUntil:'networkidle',timeout:45000});

try{
  await page.waitForFunction(()=>window.__BACGAU_READY__===true,null,{timeout:15000});
}catch(e){
  const diag=await page.evaluate(()=>({status:document.querySelector('#visualStatus')?.textContent||'',state:document.querySelector('#stateDump')?.textContent||'',canvas:!!document.querySelector('#stage canvas'),ready:window.__BACGAU_READY__===true}));
  await page.screenshot({path:'forge/evidence/webgl-boot-failure.png',fullPage:true});
  throw new Error(`WebGL boot timeout: ${JSON.stringify(diag)} pageErrors=${pageErrors.join(' | ')}`);
}

const geometry=await page.evaluate(()=>{
  const s=document.querySelector('#stage').getBoundingClientRect(),canvas=document.querySelector('#stage canvas'),c=canvas?.getBoundingClientRect(),gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
  return{stage:{x:s.x,y:s.y,w:s.width,h:s.height},canvas:c?{x:c.x,y:c.y,w:c.width,h:c.height}:null,webgl:!!gl};
});
if(!geometry.canvas||!geometry.webgl)throw new Error(`WebGL canvas not live: ${JSON.stringify(geometry)}`);
if(Math.abs(geometry.stage.w-geometry.canvas.w)>2||Math.abs(geometry.stage.h-geometry.canvas.h)>2)throw new Error(`Canvas does not cover stage: ${JSON.stringify(geometry)}`);

const scenarioEvidence=[],stateDumps=[];
for(const state of ['welcoming','gentle','thinking','playful']){
  await page.click(`[data-state="${state}"]`);
  await page.waitForFunction(s=>document.querySelector('#stateDump')?.textContent.includes(`"state": "${s}"`),state,{timeout:5000});
  await page.waitForFunction(()=>window.__BACGAU_SPEAKING__===true,null,{timeout:5000});
  await page.waitForFunction(s=>window.__BACGAU_SCENARIO_AUDIO__?.state===s&&window.__BACGAU_SCENARIO_AUDIO__?.played===true,state,{timeout:8000});
  const audio=await page.$eval('#scenarioAudio',a=>({paused:a.paused,currentTime:a.currentTime,duration:a.duration,src:a.currentSrc||a.src}));
  if(audio.paused||!(audio.duration>0))throw new Error(`Scenario ${state} did not play audio: ${JSON.stringify(audio)}`);
  await page.waitForTimeout(300);
  const dump=await page.textContent('#stateDump');
  if(!dump.includes(`"state": "${state}"`)||!dump.includes('"speaking": true'))throw new Error(`Scenario ${state} state not active while speaking: ${dump}`);
  stateDumps.push(dump);scenarioEvidence.push({state,...audio});
}
if(new Set(stateDumps).size!==4)throw new Error('State outputs are not distinct');

for(const spec of [{button:'#viBtn',audio:'#viAudio',label:'vi'},{button:'#enBtn',audio:'#enAudio',label:'en'}]){
  const duration=await page.$eval(spec.audio,a=>new Promise((res,rej)=>{if(Number.isFinite(a.duration)&&a.duration>0)return res(a.duration);a.addEventListener('loadedmetadata',()=>res(a.duration),{once:true});a.addEventListener('error',()=>rej(new Error('audio metadata error')),{once:true})}));
  if(!(duration>0))throw new Error(`${spec.label} duration invalid`);
  await page.click(spec.button);
  await page.waitForFunction(sel=>{const a=document.querySelector(sel);return !a.paused&&a.currentTime>=0},spec.audio,{timeout:5000});
}

await page.waitForTimeout(250);
await page.screenshot({path:'forge/evidence/forge-gate-1920x1080.png',fullPage:true});
if(pageErrors.length)throw new Error(`Browser console/page errors: ${pageErrors.join(' | ')}`);
const body=await page.evaluate(()=>window.__BACGAU_BODY_V2__||null);
const required=['faceGeometryRepaired','eyesVisible','muzzleForward','blink','gaze','breathing','brows','jaw','audioDrivenMouth','visibleStateGestures'];
for(const k of required)if(!body?.[k])throw new Error(`Body contract missing ${k}: ${JSON.stringify(body)}`);
if(body.visualVersion!=='v10.1-safari-boot')throw new Error(`Wrong visual version: ${JSON.stringify(body)}`);
fs.mkdirSync('forge/evidence',{recursive:true});
fs.writeFileSync('forge/evidence/browser-gate.json',JSON.stringify({ok:true,url,geometry,states:4,scenarioSpeech:scenarioEvidence,body,render:'procedural-webgl-threejs',pageErrors},null,2));
await browser.close();
console.log('browser-gate PASS',JSON.stringify({geometry,states:scenarioEvidence.map(x=>x.state),visualVersion:body.visualVersion}));
