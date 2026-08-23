import { chromium, webkit, devices } from 'playwright';
import fs from 'node:fs';
import { PNG } from 'pngjs';

const base=process.env.V12_GATE_URL||'http://127.0.0.1:4173/forge/conversation-recovery.html';
fs.mkdirSync('forge/evidence',{recursive:true});

function diffRatio(aBuf,bBuf){
  const a=PNG.sync.read(aBuf),b=PNG.sync.read(bBuf);
  if(a.width!==b.width||a.height!==b.height)throw new Error('screenshot size mismatch');
  let changed=0,total=a.width*a.height;
  for(let i=0;i<a.data.length;i+=4){
    const d=Math.abs(a.data[i]-b.data[i])+Math.abs(a.data[i+1]-b.data[i+1])+Math.abs(a.data[i+2]-b.data[i+2]);
    if(d>24)changed++;
  }
  return changed/total;
}

async function run(name,browserType,contextOptions){
  const browser=await browserType.launch({headless:true});
  const context=await browser.newContext(contextOptions);
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:30000});
  await page.locator('#mic').waitFor({state:'visible',timeout:10000});
  const frameHandle=page.locator('#bodyFrame');
  await frameHandle.waitFor({state:'visible',timeout:10000});
  const frame=page.frames().find(f=>f.url().includes('/api/body'));
  if(!frame)throw new Error(`${name}: body iframe missing`);
  await frame.waitForFunction(()=>window.__BACGAU_READY__===true,null,{timeout:20000});
  const canvas=frame.locator('canvas');
  await canvas.waitFor({state:'visible',timeout:10000});
  const box=await canvas.boundingBox();
  if(!box||box.width<250||box.height<250)throw new Error(`${name}: body canvas too small`);
  const bootHidden=await frame.locator('#boot').evaluate(el=>el.hidden);
  if(!bootHidden)throw new Error(`${name}: body diagnostic overlay still visible`);

  const shots={};
  for(const spec of [
    {key:'listening',phase:'listening',emotion:'gentle'},
    {key:'thinking',phase:'thinking',emotion:'thinking'},
    {key:'speaking',phase:'speaking',emotion:'welcoming',speaking:true,level:.65}
  ]){
    await page.evaluate((payload)=>{
      const f=document.getElementById('bodyFrame');
      f.contentWindow.postMessage({type:'bacgau-state',text:`CI ${payload.key}`,...payload},'*');
    },spec);
    await frame.waitForFunction((text)=>document.getElementById('bubble')?.textContent===text,`CI ${spec.key}`,{timeout:3000});
    await page.waitForTimeout(700);
    shots[spec.key]=await frame.locator('#stage').screenshot();
  }
  const listeningThinking=diffRatio(shots.listening,shots.thinking);
  const thinkingSpeaking=diffRatio(shots.thinking,shots.speaking);
  if(listeningThinking<0.001)throw new Error(`${name}: listening/thinking visual response too small ${listeningThinking}`);
  if(thinkingSpeaking<0.001)throw new Error(`${name}: thinking/speaking visual response too small ${thinkingSpeaking}`);
  if(pageErrors.length)throw new Error(`${name}: page errors: ${pageErrors.join(' | ')}`);

  await browser.close();
  return {ok:true,canvas:{width:box.width,height:box.height},diff:{listeningThinking,thinkingSpeaking}};
}

const results={};
results.chromium=await run('chromium',chromium,{viewport:{width:1280,height:800}});
results.webkitIphone=await run('webkit-iphone',webkit,{...devices['iPhone 13']});
const evidence={ok:true,url:base,results,checkedAt:new Date().toISOString()};
fs.writeFileSync('forge/evidence/v12-conversation-gate.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(evidence,null,2));
