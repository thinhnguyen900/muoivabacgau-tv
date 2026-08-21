import { chromium } from 'playwright';
import fs from 'node:fs';

const url=process.env.FORGE_V3_URL||'http://127.0.0.1:4173/forge/review-gate-v3.html';
const browser=await chromium.launch({headless:true,args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')pageErrors.push(`console:${m.text()}`)});
await page.goto(url,{waitUntil:'networkidle'});
await page.waitForFunction(()=>window.__BACGAU_READY__===true,null,{timeout:10000});
const geometry=await page.evaluate(()=>{
 const stage=document.querySelector('#stage')?.getBoundingClientRect();
 const canvas=document.querySelector('#stage canvas');
 const c=canvas?.getBoundingClientRect();
 const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
 return {stage:stage&&{x:stage.x,y:stage.y,w:stage.width,h:stage.height},canvas:c&&{x:c.x,y:c.y,w:c.width,h:c.height},webgl:!!gl};
});
if(!geometry.canvas||!geometry.webgl)throw new Error(`Visual v4 WebGL canvas not live: ${JSON.stringify(geometry)}`);
if(Math.abs(geometry.stage.w-geometry.canvas.w)>2||Math.abs(geometry.stage.h-geometry.canvas.h)>2)throw new Error(`Visual v4 canvas does not cover stage: ${JSON.stringify(geometry)}`);

const body=await page.evaluate(()=>window.__BACGAU_BODY_V4__||null);
if(!body?.facialRig||!body?.scleraIrisPupil||!body?.eyelids||!body?.softBrows||!body?.splitMuzzle||!body?.roundedArms||!body?.cinematicLighting||!body?.audioDrivenMouth){
 throw new Error(`Warm visual v4 contract incomplete: ${JSON.stringify(body)}`);
}

const states=['welcoming','gentle','thinking','playful'];
const evidence=[];
for(const state of states){
 await page.click(`[data-state="${state}"]`);
 await page.waitForFunction(s=>{
   const dump=document.querySelector('#stateDump')?.textContent||'';
   const a=document.querySelector('#scenarioAudio');
   return dump.includes(`\"performance\": \"${s}\"`)&&a&&!a.paused&&Number.isFinite(a.duration)&&a.duration>0;
 },state,{timeout:6000});
 await page.waitForTimeout(360);
 const audio=await page.$eval('#scenarioAudio',a=>({paused:a.paused,currentTime:a.currentTime,duration:a.duration,src:a.currentSrc||a.src}));
 const dump=await page.textContent('#stateDump');
 if(audio.paused||!(audio.duration>0))throw new Error(`Visual v4 scenario ${state} did not play audio`);
 if(!dump.includes(`\"performance\": \"${state}\"`))throw new Error(`Visual v4 did not consume ${state}`);
 const shot=`forge/evidence/visual-v3-${state}.png`;
 await page.locator('#stage').screenshot({path:shot});
 evidence.push({state,audio,screenshot:shot});
}
await page.screenshot({path:'forge/evidence/visual-v3-1920x1080.png',fullPage:true});
if(pageErrors.length)throw new Error(`Visual v4 page errors: ${pageErrors.join(' | ')}`);
fs.writeFileSync('forge/evidence/visual-v3-gate.json',JSON.stringify({ok:true,visualVersion:'v4-warm',url,geometry,body,states:evidence,pageErrors},null,2));
await browser.close();
console.log('visual-v4-gate PASS',JSON.stringify({states:states.length,geometry,body}));