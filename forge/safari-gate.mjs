import { webkit } from 'playwright';
import fs from 'node:fs';

const url=process.env.FORGE_GATE_URL||'http://127.0.0.1:4173/forge/review-gate.html';
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:393,height:852},
  screen:{width:393,height:852},
  deviceScaleFactor:3,
  isMobile:true,
  hasTouch:true,
  locale:'vi-VN',
  userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
});
const page=await context.newPage();
const errors=[];
const ignored=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{
  if(m.type()!=='error')return;
  const text=m.text();
  if(text.includes('Button failed to load')&&text.includes('invalid-placard')){ignored.push(text);return;}
  errors.push(text);
});
await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});

try{
  await page.waitForFunction(()=>window.__BACGAU_READY__===true,null,{timeout:18000});
}catch(e){
  const diag=await page.evaluate(()=>({status:document.querySelector('#visualStatus')?.textContent||'',state:document.querySelector('#stateDump')?.textContent||'',canvas:!!document.querySelector('#stage canvas'),ready:window.__BACGAU_READY__===true}));
  fs.mkdirSync('forge/evidence',{recursive:true});
  await page.screenshot({path:'forge/evidence/safari-boot-failure.png',fullPage:true});
  throw new Error(`WebKit/iPhone boot timeout: ${JSON.stringify(diag)} errors=${errors.join(' | ')}`);
}

const boot=await page.evaluate(()=>{
  const stage=document.querySelector('#stage').getBoundingClientRect();
  const canvas=document.querySelector('#stage canvas');
  const c=canvas?.getBoundingClientRect();
  const gl=canvas?.getContext('webgl2')||canvas?.getContext('webgl');
  return {ready:window.__BACGAU_READY__===true,stage:{w:stage.width,h:stage.height},canvas:c?{w:c.width,h:c.height}:null,webgl:!!gl,status:document.querySelector('#visualStatus')?.textContent||''};
});
if(!boot.ready||!boot.canvas||!boot.webgl)throw new Error(`WebKit canvas not live: ${JSON.stringify(boot)}`);
if(boot.canvas.w<300||boot.canvas.h<500)throw new Error(`Mobile canvas too small/cropped: ${JSON.stringify(boot)}`);

const states=[];
for(const state of ['welcoming','gentle','thinking','playful']){
  await page.locator(`[data-state="${state}"]`).scrollIntoViewIfNeeded();
  await page.click(`[data-state="${state}"]`);
  await page.waitForFunction(s=>document.querySelector('#stateDump')?.textContent.includes(`"state": "${s}"`),state,{timeout:6000});
  await page.waitForFunction(s=>window.__BACGAU_SCENARIO_AUDIO__?.state===s&&window.__BACGAU_SCENARIO_AUDIO__?.played===true,state,{timeout:10000});
  const evidence=await page.evaluate(s=>({state:s,dump:document.querySelector('#stateDump')?.textContent||'',bubble:document.querySelector('#bubble')?.textContent||'',audio:{paused:document.querySelector('#scenarioAudio')?.paused,duration:document.querySelector('#scenarioAudio')?.duration,currentTime:document.querySelector('#scenarioAudio')?.currentTime}}),state);
  if(!evidence.dump.includes(`"state": "${state}"`))throw new Error(`State ${state} did not activate`);
  if(!(evidence.audio.duration>0))throw new Error(`State ${state} audio metadata invalid: ${JSON.stringify(evidence.audio)}`);
  states.push(evidence);
}

fs.mkdirSync('forge/evidence',{recursive:true});
await page.screenshot({path:'forge/evidence/safari-iphone-393x852.png',fullPage:true});
const stageShot=await page.locator('#stage').screenshot({path:'forge/evidence/safari-stage.png'});
if(stageShot.length<12000)throw new Error(`Safari stage screenshot suspiciously small: ${stageShot.length}`);
if(errors.length)throw new Error(`WebKit console/page errors: ${errors.join(' | ')}`);
fs.writeFileSync('forge/evidence/safari-gate.json',JSON.stringify({ok:true,url,boot,states:states.map(x=>({state:x.state,bubble:x.bubble,audio:x.audio})),screenshotBytes:stageShot.length,errors,ignoredHostNoise:ignored.length},null,2));
await browser.close();
console.log('safari-gate PASS',JSON.stringify({boot,states:states.map(x=>x.state),screenshotBytes:stageShot.length,ignoredHostNoise:ignored.length}));
