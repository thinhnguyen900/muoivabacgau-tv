(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BacGauLiveness=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STATES={
    welcoming:{gaze:'child',blink:[1800,4200],breath:0.90,head:'open',brow:'lift-soft',mouth:'smile-soft',gesture:['small-wave','open-palm'],latency:[120,380]},
    listening:{gaze:'child-soft',blink:[2200,5200],breath:0.75,head:'micro-nod',brow:'neutral-soft',mouth:'rest',gesture:['micro-nod','ear-tilt'],latency:[80,240]},
    thinking:{gaze:'up-side',blink:[2600,5600],breath:0.65,head:'tilt',brow:'pinch-soft',mouth:'ponder',gesture:['chin-think','small-pause'],latency:[450,1100]},
    gentle:{gaze:'child-steady',blink:[3000,6200],breath:0.58,head:'lower-soft',brow:'inner-up',mouth:'soft-closed',gesture:['slow-nod','hand-heart'],latency:[260,700]},
    playful:{gaze:'child-bright',blink:[1500,3600],breath:1.00,head:'tilt-bounce',brow:'asym-lift',mouth:'smirk',gesture:['peek','tiny-shrug'],latency:[100,320]}
  };
  function hash(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function pick(arr,seed){return arr[seed%arr.length]}
  function plan({performance='listening',turn=0,text='',previous=null}={}){
    const key=STATES[performance]?performance:'listening';
    const cfg=STATES[key];
    const seed=hash(`${turn}|${text}|${key}`);
    let gesture=pick(cfg.gesture,seed);
    if(previous&&gesture===previous.gesture&&cfg.gesture.length>1) gesture=cfg.gesture[(cfg.gesture.indexOf(gesture)+1)%cfg.gesture.length];
    const blinkMs=cfg.blink[0]+(seed%(cfg.blink[1]-cfg.blink[0]+1));
    const responseDelayMs=cfg.latency[0]+((seed>>>8)%(cfg.latency[1]-cfg.latency[0]+1));
    const microShiftMs=900+((seed>>>16)%1800);
    return {performance:key,gaze:cfg.gaze,blinkMs,breathScale:cfg.breath,head:cfg.head,brow:cfg.brow,mouth:cfg.mouth,gesture,responseDelayMs,microShiftMs,idleAlive:true};
  }
  function deadCharacterAudit(plans){
    const issues=[];
    if(!plans.length)return ['no-plans'];
    for(const f of ['gaze','head','brow','mouth','gesture']) if(new Set(plans.map(p=>p[f])).size<2) issues.push(`static-${f}`);
    if(new Set(plans.map(p=>p.responseDelayMs)).size<3) issues.push('robotic-timing');
    if(plans.some(p=>!p.blinkMs||!p.microShiftMs||!p.idleAlive)) issues.push('missing-micro-motion');
    for(let i=1;i<plans.length;i++) if(plans[i].gesture===plans[i-1].gesture) issues.push('repeated-gesture');
    return [...new Set(issues)];
  }
  return {STATES,plan,deadCharacterAudit};
});
