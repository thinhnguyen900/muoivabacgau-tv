(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BacGauLiveness=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STATES={
    welcoming:{gaze:'child',blink:[1800,4200],breath:0.90,head:'open',brow:'lift-soft',mouth:'smile-soft',gesture:['small-wave','open-palm'],latency:[120,380],interrupt:[180,320],chunk:[900,1500],event:'normal'},
    listening:{gaze:'child-soft',blink:[2200,5200],breath:0.75,head:'micro-nod',brow:'neutral-soft',mouth:'rest',gesture:['micro-nod','ear-tilt'],latency:[80,240],interrupt:[80,180],chunk:[600,1100],event:'normal'},
    thinking:{gaze:'up-side',blink:[2600,5600],breath:0.65,head:'tilt',brow:'pinch-soft',mouth:'ponder',gesture:['chin-think','small-pause'],latency:[450,1100],interrupt:[120,240],chunk:[700,1200],event:'quiet'},
    gentle:{gaze:'child-steady',blink:[3000,6200],breath:0.58,head:'lower-soft',brow:'inner-up',mouth:'soft-closed',gesture:['slow-nod','hand-heart'],latency:[260,700],interrupt:[70,150],chunk:[500,900],event:'suppress-nonessential'},
    playful:{gaze:'child-bright',blink:[1500,3600],breath:1.00,head:'tilt-bounce',brow:'asym-lift',mouth:'smirk',gesture:['peek','tiny-shrug'],latency:[100,320],interrupt:[120,220],chunk:[700,1100],event:'normal'}
  };
  function hash(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function pick(arr,seed){return arr[seed%arr.length]}
  function range(pair,seed){return pair[0]+(seed%(pair[1]-pair[0]+1))}
  function plan({performance='listening',turn=0,text='',previous=null,speaking=false}={}){
    const key=STATES[performance]?performance:'listening';
    const cfg=STATES[key];
    const seed=hash(`${turn}|${text}|${key}`);
    let gesture=pick(cfg.gesture,seed);
    if(previous&&gesture===previous.gesture&&cfg.gesture.length>1) gesture=cfg.gesture[(cfg.gesture.indexOf(gesture)+1)%cfg.gesture.length];
    const p={performance:key,gaze:cfg.gaze,blinkMs:range(cfg.blink,seed),breathScale:cfg.breath,head:cfg.head,brow:cfg.brow,mouth:cfg.mouth,gesture,responseDelayMs:range(cfg.latency,seed>>>8),microShiftMs:900+((seed>>>16)%1800),interruptWindowMs:range(cfg.interrupt,seed>>>4),speechChunkMs:range(cfg.chunk,seed>>>12),eventPolicy:cfg.event,resumePolicy:key==='gentle'?'ask-before-resume':'resume-if-context-valid',speaking:!!speaking,idleAlive:true};
    if(speaking){p.gaze=key==='thinking'?'child-soft':p.gaze;p.mouth='speech-animated';}
    return p;
  }
  function onInterrupt(plan,event={}){
    const danger=event.kind==='safety'||event.kind==='distress';
    return {stopSpeech:true,acknowledgeWithinMs:Math.min(plan.interruptWindowMs||180,danger?100:220),nextPerformance:danger?'gentle':'listening',discardQueuedGesture:true,preserveTopic:event.topic!==false,resumePolicy:danger?'do-not-auto-resume':plan.resumePolicy||'resume-if-context-valid'};
  }
  function deadCharacterAudit(plans){
    const issues=[];
    if(!plans.length)return ['no-plans'];
    for(const f of ['gaze','head','brow','mouth','gesture']) if(new Set(plans.map(p=>p[f])).size<2) issues.push(`static-${f}`);
    if(new Set(plans.map(p=>p.responseDelayMs)).size<3) issues.push('robotic-timing');
    if(plans.some(p=>!p.blinkMs||!p.microShiftMs||!p.interruptWindowMs||!p.speechChunkMs||!p.idleAlive)) issues.push('missing-micro-motion');
    for(let i=1;i<plans.length;i++) if(plans[i].gesture===plans[i-1].gesture) issues.push('repeated-gesture');
    if(plans.some(p=>p.performance==='gentle'&&p.eventPolicy!=='suppress-nonessential')) issues.push('gentle-event-leak');
    return [...new Set(issues)];
  }
  return {STATES,plan,onInterrupt,deadCharacterAudit};
});
