const L=require('./liveness.js');
const states=['welcoming','listening','thinking','gentle','playful'];
let previous=null;const plans=[];const failures=[];
for(let i=0;i<200;i++){
  const performance=states[i%states.length];
  const p=L.plan({performance,turn:i,text:'synthetic child turn '+i,previous,speaking:i%3===0});
  if(!p.idleAlive||p.blinkMs<=0||p.microShiftMs<=0||p.interruptWindowMs<=0||p.speechChunkMs<500) failures.push({i,reason:'missing-liveness',p});
  if(performance==='gentle'&&p.eventPolicy!=='suppress-nonessential') failures.push({i,reason:'gentle-event-leak',p});
  if(p.eyeOpen<0||p.eyeOpen>1||p.jawOpen<0||p.jawOpen>1||p.speechEnergy<0||p.speechEnergy>1) failures.push({i,reason:'invalid-face-range',p});
  if(i%3===0&&p.jawOpen<=.08) failures.push({i,reason:'speech-jaw-not-driven',p});
  plans.push(p);previous=p;
}
const issues=L.deadCharacterAudit(plans);if(issues.length) failures.push({reason:'dead-character-audit',issues});
if(new Set(states.map((s,i)=>L.plan({performance:s,turn:i,text:s}).eyeOpen.toFixed(2))).size<3) failures.push({reason:'eyelid-states-not-distinct'});
if(new Set(states.map((s,i)=>L.plan({performance:s,turn:i,text:s}).browLift.toFixed(2))).size<3) failures.push({reason:'brow-states-not-distinct'});
const ordinary=L.onInterrupt(plans[1],{kind:'child-speech'});if(!ordinary.stopSpeech||ordinary.acknowledgeWithinMs>220) failures.push({reason:'ordinary-interrupt',ordinary});
const safety=L.onInterrupt(plans[3],{kind:'distress'});if(safety.acknowledgeWithinMs>100||safety.nextPerformance!=='gentle'||safety.resumePolicy!=='do-not-auto-resume') failures.push({reason:'safety-interrupt',safety});
const result={executions:200,passed:200-failures.length,failed:failures.length,states,uniqueTiming:new Set(plans.map(p=>p.responseDelayMs)).size,uniqueBlink:new Set(plans.map(p=>p.blinkMs)).size,uniqueEyeOpen:new Set(plans.map(p=>p.eyeOpen.toFixed(2))).size,uniqueBrowLift:new Set(plans.map(p=>p.browLift.toFixed(2))).size,maxSpeechJaw:Math.max(...plans.filter(p=>p.speaking).map(p=>p.jawOpen)),eventPolicies:[...new Set(plans.map(p=>p.eventPolicy))],deadCharacterIssues:issues,interruptSafety:safety,failures:failures.slice(0,10)};
console.log(JSON.stringify(result,null,2));if(failures.length)process.exit(1);
