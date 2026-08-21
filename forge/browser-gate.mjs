import { chromium } from 'playwright';
import fs from 'node:fs';

const url = process.env.FORGE_GATE_URL || 'http://127.0.0.1:4173/forge/review-gate.html';
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',msg=>{ if(msg.type()==='error') pageErrors.push(msg.text()); });
await page.goto(url,{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.querySelector('#hero')?.complete && document.querySelector('#hero')?.naturalWidth>0);
const geometry = await page.evaluate(()=>{
  const s=document.querySelector('#stage').getBoundingClientRect();
  const h=document.querySelector('#hero').getBoundingClientRect();
  return {stage:{x:s.x,y:s.y,w:s.width,h:s.height},hero:{x:h.x,y:h.y,w:h.width,h:h.height},natural:[hero.naturalWidth,hero.naturalHeight]};
});
if(geometry.natural[0]!==1280 || geometry.natural[1]!==900) throw new Error(`Unexpected hero dimensions ${geometry.natural}`);
if(Math.abs(geometry.stage.w-geometry.hero.w)>2 || Math.abs(geometry.stage.h-geometry.hero.h)>2) throw new Error(`Hero does not cover stage: ${JSON.stringify(geometry)}`);

const stateDumps=[];
for(const state of ['welcoming','gentle','thinking','playful']){
  await page.click(`[data-state="${state}"]`);
  const dump=await page.textContent('#stateDump');
  if(!dump.includes(`"performance": "${state}"`)) throw new Error(`Runtime did not consume liveness state ${state}`);
  stateDumps.push(dump);
}
if(new Set(stateDumps).size!==4) throw new Error('Brain->Body state outputs are not visibly distinct');

for(const spec of [
  {button:'#viBtn',audio:'#viAudio',label:'vi'},
  {button:'#enBtn',audio:'#enAudio',label:'en'}
]){
  const duration=await page.$eval(spec.audio,a=>new Promise((resolve,reject)=>{if(Number.isFinite(a.duration)&&a.duration>0)return resolve(a.duration); a.addEventListener('loadedmetadata',()=>resolve(a.duration),{once:true}); a.addEventListener('error',()=>reject(new Error('audio metadata error')),{once:true});}));
  if(!(duration>0)) throw new Error(`${spec.label} duration invalid`);
  await page.click(spec.button);
  await page.waitForFunction(sel=>{const a=document.querySelector(sel); return !a.paused && a.currentTime>=0;},spec.audio,{timeout:5000});
}
await page.screenshot({path:'forge/evidence/forge-gate-1920x1080.png',fullPage:true});
if(pageErrors.length) throw new Error(`Browser console/page errors: ${pageErrors.join(' | ')}`);
fs.writeFileSync('forge/evidence/browser-gate.json',JSON.stringify({ok:true,url,geometry,states:4,pageErrors},null,2));
await browser.close();
console.log('browser-gate PASS',JSON.stringify(geometry));
