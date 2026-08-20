const L=require('./liveness.js');
const states=['welcoming','listening','thinking','gentle','playful'];
let previous=null;const plans=[];const failures=[];
for(let i=0;i<200;i++){
  const performance=states[i%states.length];
  const p=L.plan({performance,turn:i,text:'synthetic child turn '+i,previous,speaking:i%3===0});
  if(!p.idleAlive||p.blinkMs<=0||p.microShiftMs<=0||p.interruptWindowMs<=0||p.speechChunkMs<500) failures.push({i,reason:'missing-liveness',p});
  if(performance==='gentle'&&p.eventPolicy!=='suppress-nonessential') failures.push({i,reason:'gentle-event-leak',p});
  plans.push(p);previous=p;
}
const issues=L.deadCharacterAudit(plans);if(issues.length) failures.push({reason:'dead-character-audit',issues});
const ordinary=L.onInterrupt(plans[1],{kind:'child-speech'});if(!ordinary.stopSpeech||ordinary.acknowledgeWithinMs>220) failures.push({reason:'ordinary-interrupt',ordinary});
const safety=L.onInterrupt(plans[3],{kind:'distress'});if(safety.acknowledgeWithinMs>100||safety.nextPerformance!=='gentle'||safety.resumePolicy!=='do-not-auto-resume') failures.push({reason:'safety-interrupt',safety});
const result={executions:200,passed:200-failures.length,failed:failures.length,states,uniqueTiming:new Set(plans.map(p=>p.responseDelayMs)).size,uniqueBlink:new Set(plans.map(p=>p.blinkMs)).size,eventPolicies:[...new Set(plans.map(p=>p.eventPolicy))],deadCharacterIssues:issues,interruptSafety:safety,failures:failures.slice(0,10)};
console.log(JSON.stringify(result,null,2));if(failures.length)process.exit(1);
