import { chromium, webkit } from '@playwright/test';
import { PNG } from 'pngjs';
import fs from 'node:fs/promises';

const url = process.env.V11_URL || 'http://127.0.0.1:4173';
await fs.mkdir('evidence', { recursive: true });

function variance(buf) {
  const png = PNG.sync.read(buf);
  let n=0,sum=0,sum2=0,nonSky=0;
  for(let y=0;y<png.height;y+=4) for(let x=0;x<png.width;x+=4){
    const i=(y*png.width+x)*4,r=png.data[i],g=png.data[i+1],b=png.data[i+2];
    const l=.2126*r+.7152*g+.0722*b;sum+=l;sum2+=l*l;n++;
    if(Math.abs(r-131)+Math.abs(g-164)+Math.abs(b-157)>38) nonSky++;
  }
  const mean=sum/n;return {std:Math.sqrt(Math.max(0,sum2/n-mean*mean)),nonBackdropRatio:nonSky/n};
}

function meanAbsDiff(a,b){
  const pa=PNG.sync.read(a),pb=PNG.sync.read(b);
  if(pa.width!==pb.width||pa.height!==pb.height)throw new Error('state screenshot dimensions differ');
  let sum=0,n=0;
  for(let y=80;y<Math.min(pa.height,720);y+=4)for(let x=40;x<Math.min(pa.width,900);x+=4){
    const i=(y*pa.width+x)*4;
    sum+=Math.abs(pa.data[i]-pb.data[i])+Math.abs(pa.data[i+1]-pb.data[i+1])+Math.abs(pa.data[i+2]-pb.data[i+2]);n+=3;
  }
  return sum/n;
}

for (const engine of [chromium, webkit]) {
  const browser = await engine.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForFunction(() => window.__BACGAU_V11__?.ready === true, null, { timeout: 20000 });
  const state = await page.evaluate(() => ({
    ready: document.querySelector('.app')?.dataset.appReady,
    posterHidden: document.querySelector('#poster')?.hidden,
    stage: document.querySelector('#stage')?.getBoundingClientRect().toJSON(),
    v11: window.__BACGAU_V11__,
    canvas: (() => { const c=document.querySelector('canvas'); return c?{width:c.width,height:c.height}:null; })(),
  }));
  if (state.ready !== 'true' || state.stage.width < 500 || state.stage.height < 400) throw new Error(`${engine.name()} layout gate failed ${JSON.stringify(state)}`);
  if (!state.posterHidden) throw new Error(`${engine.name()} poster fallback visible`);
  if (!state.v11?.model && state.v11?.mode !== 'authored-fallback') throw new Error(`${engine.name()} no reviewable character runtime ${JSON.stringify(state.v11)}`);
  if (state.v11?.mode === 'authored-fallback' && (state.v11?.report?.controls?.length || 0) < 10) throw new Error(`${engine.name()} fallback rig too shallow ${JSON.stringify(state.v11?.report)}`);
  if (state.v11?.mode === 'authored-fallback' && state.v11?.report?.visualTune?.applied !== true) throw new Error(`${engine.name()} mature visual tuning missing ${JSON.stringify(state.v11?.report)}`);
  if (state.v11?.visualPipeline !== 'authored-warm-v5-mature-portrait') throw new Error(`${engine.name()} wrong visual pipeline ${JSON.stringify(state.v11)}`);
  if (!state.canvas || state.canvas.width < 800 || state.canvas.height < 500) throw new Error(`${engine.name()} WebGL canvas gate failed ${JSON.stringify(state.canvas)}`);
  if (errors.length) throw new Error(`${engine.name()} errors: ${errors.join(' | ')}`);
  await page.waitForTimeout(1200);
  const shot=await page.screenshot({ path:`evidence/${engine.name()}-v11.png`, fullPage:true });
  const px=variance(shot);
  if(px.std<26 || px.nonBackdropRatio<.16) throw new Error(`${engine.name()} visual variance gate failed ${JSON.stringify(px)}`);

  const stateShots={};
  for(const [key,label] of [['welcoming','Muối về'],['gentle','Con buồn'],['thinking','Hỏi khó'],['playful','Kể chuyện']]){
    await page.getByRole('button',{name:new RegExp(label)}).click();
    await page.waitForTimeout(650);
    stateShots[key]=await page.screenshot({path:`evidence/${engine.name()}-${key}-v11.png`,fullPage:true});
  }
  const pairs=[];const keys=Object.keys(stateShots);
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)pairs.push([`${keys[i]}:${keys[j]}`,meanAbsDiff(stateShots[keys[i]],stateShots[keys[j]])]);
  const weakest=Math.min(...pairs.map(([,d])=>d));
  if(weakest<1.15)throw new Error(`${engine.name()} emotion visual distinctness too low ${JSON.stringify(pairs)}`);

  await browser.close();
  console.log(engine.name(), 'PASS', JSON.stringify({...state.v11,pixel:px,emotionDiff:pairs}));
}
