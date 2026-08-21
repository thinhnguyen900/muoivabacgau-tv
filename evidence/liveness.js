(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BacGauLiveness=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const STATES={
    welcoming:{gaze:'child',blink:[1800,4200],breath:0.90,head:'open',brow:'lift-soft',mouth:'smile-soft',gesture:['small-wave','open-palm'],latency:[120,380],interrupt:[180,320],chunk:[900,1500],event:'normal',face:{eyeOpen:.96,browLift:.22,jawRest:.05,speechEnergy:.72}},
    listening:{gaze:'child-soft',blink:[2200,5200],breath:0.75,head:'micro-nod',brow:'neutral-soft',mouth:'rest',gesture:['micro-nod','ear-tilt'],latency:[80,240],interrupt:[80,180],chunk:[600,1100],event:'normal',face:{eyeOpen:.90,browLift:.05,jawRest:.015,speechEnergy:.34}},
    thinking:{gaze:'up-side',blink:[2600,5600],breath:0.65,head:'tilt',brow:'pinch-soft',mouth:'ponder',gesture:['chin-think','small-pause'],latency:[450,1100],interrupt:[120,240],chunk:[700,1200],event:'quiet',face:{eyeOpen:.76,browLift:-.08,jawRest:.03,speechEnergy:.40}},
    gentle:{gaze:'child-steady',blink:[3000,6200],breath:0.58,head:'lower-soft',brow:'inner-up',mouth:'soft-closed',gesture:['slow-nod','hand-heart'],latency:[260,700],interrupt:[70,150],chunk:[500,900],event:'suppress-nonessential',face:{eyeOpen:.82,browLift:.16,jawRest:.01,speechEnergy:.26}},
    playful:{gaze:'child-bright',blink:[1500,3600],breath:1.00,head:'tilt-bounce',brow:'asym-lift',mouth:'smirk',gesture:['peek','tiny-shrug'],latency:[100,320],interrupt:[120,220],chunk:[700,1100],event:'normal',face:{eyeOpen:1,browLift:.28,jawRest:.06,speechEnergy:.86}}
  };
  function hash(s=''){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
  function pick(arr,seed){return arr[seed%arr.length]}
  function range(pair,seed){return pair[0]+(seed%(pair[1]-pair[0]+1))}
  function clamp(n,min=0,max=1){return Math.max(min,Math.min(max,n))}
  function plan({performance='listening',turn=0,text='',previous=null,speaking=false}={}){
    const key=STATES[performance]?performance:'listening';
    const cfg=STATES[key];
    const seed=hash(`${turn}|${text}|${key}`);
    let gesture=pick(cfg.gesture,seed);
    if(previous&&gesture===previous.gesture&&cfg.gesture.length>1) gesture=cfg.gesture[(cfg.gesture.indexOf(gesture)+1)%cfg.gesture.length];
    const syllablePulse=.78+((seed>>>20)%17)/100;
    const p={performance:key,gaze:cfg.gaze,blinkMs:range(cfg.blink,seed),breathScale:cfg.breath,head:cfg.head,brow:cfg.brow,mouth:cfg.mouth,gesture,responseDelayMs:range(cfg.latency,seed>>>8),microShiftMs:900+((seed>>>16)%1800),interruptWindowMs:range(cfg.interrupt,seed>>>4),speechChunkMs:range(cfg.chunk,seed>>>12),eventPolicy:cfg.event,resumePolicy:key==='gentle'?'ask-before-resume':'resume-if-context-valid',speaking:!!speaking,idleAlive:true,eyeOpen:cfg.face.eyeOpen,browLift:cfg.face.browLift,jawOpen:cfg.face.jawRest,speechEnergy:cfg.face.speechEnergy};
    if(speaking){p.gaze=key==='thinking'?'child-soft':p.gaze;p.mouth='speech-animated';p.jawOpen=clamp(cfg.face.jawRest+cfg.face.speechEnergy*syllablePulse*.58,.08,.62);p.eyeOpen=clamp(cfg.face.eyeOpen-(cfg.face.speechEnergy*.035),.62,1);}
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
    if(new Set(plans.map(p=>p.eyeOpen.toFixed(2))).size<3) issues.push('static-eyelids');
    if(new Set(plans.map(p=>p.browLift.toFixed(2))).size<3) issues.push('static-brows');
    if(!plans.some(p=>p.speaking&&p.jawOpen>.08)) issues.push('dead-jaw');
    if(plans.some(p=>!p.blinkMs||!p.microShiftMs||!p.interruptWindowMs||!p.speechChunkMs||!p.idleAlive)) issues.push('missing-micro-motion');
    if(plans.some(p=>p.eyeOpen<0||p.eyeOpen>1||p.jawOpen<0||p.jawOpen>1||p.speechEnergy<0||p.speechEnergy>1)) issues.push('face-range-invalid');
    for(let i=1;i<plans.length;i++) if(plans[i].gesture===plans[i-1].gesture) issues.push('repeated-gesture');
    if(plans.some(p=>p.performance==='gentle'&&p.eventPolicy!=='suppress-nonessential')) issues.push('gentle-event-leak');
    return [...new Set(issues)];
  }
  return {STATES,plan,onInterrupt,deadCharacterAudit};
});
