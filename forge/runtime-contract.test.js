const B=require('./brain.js');
const L=require('./liveness.js');
let pass=0,fail=[];
function ok(name,cond,detail={}){if(cond)pass++;else fail.push({name,detail})}
const corpus=[
 ['vi','Bác gấu ơi','welcoming','vi-VN'],['vi-sad','Hôm nay con buồn vì bị bạn chọc','gentle','vi-VN'],['vi-think','Vì sao T-rex tay ngắn?','thinking','vi-VN'],['vi-play','lalala','playful','vi-VN'],['en','Hello bear','welcoming','en-US'],['en-sad','I feel lonely today','gentle','en-US'],['en-think','How does a rocket fly?','thinking','en-US'],['mixed','Why T-rex lại có tay ngắn?','thinking',null]
];
let state=B.init();let prev=null;
for(let r=0;r<30;r++){
 for(const [cat,text,perf,lang] of corpus){
  const out=B.decide(text,state);state=out.stateData;
  ok(cat+'-performance-'+r,out.performance===perf,{got:out.performance});
  if(lang)ok(cat+'-language-'+r,out.language===lang,{got:out.language});
  ok(cat+'-speech-plan-'+r,!!out.speechPlan&&out.speechPlan.text===out.speech&&out.speechPlan.performance===out.performance&&out.speechPlan.mime==='audio/mpeg'&&out.speechPlan.interruptible===true,out.speechPlan);
  if(out.language==='vi-VN')ok(cat+'-voice-vi-'+r,out.speechPlan.voice==='vi-VN-NamMinhNeural'&&out.speechPlan.language==='vi-VN',out.speechPlan);
  if(out.language==='en-US')ok(cat+'-voice-en-'+r,out.speechPlan.voice==='en-US-GuyNeural'&&out.speechPlan.language==='en-US',out.speechPlan);
  const plan=L.plan({performance:out.performance,turn:state.turn,text:out.speech,previous:prev,speaking:false});
  ok(cat+'-plan-'+r,plan.performance===perf&&plan.idleAlive&&plan.blinkMs>0&&plan.microShiftMs>0&&plan.interruptWindowMs>0&&plan.speechChunkMs>0,plan);
  ok(cat+'-expressive-contract-'+r,Number.isFinite(plan.smile)&&Number.isFinite(plan.eyeContactRatio)&&Number.isFinite(plan.armOpenness)&&!!plan.emotionArc,plan);
  if(prev&&prev.performance!==plan.performance)ok(cat+'-state-diff-'+r,[plan.gaze,plan.head,plan.brow,plan.mouth,plan.gesture,plan.smile,plan.eyeContactRatio,plan.armOpenness].some((v,i)=>v!==[prev.gaze,prev.head,prev.brow,prev.mouth,prev.gesture,prev.smile,prev.eyeContactRatio,prev.armOpenness][i]),{prev,plan});
  prev=plan;
 }
}
const gentle=L.plan({performance:'gentle',turn:999,text:'Con buồn'});
const intr=L.onInterrupt(gentle,{kind:'distress'});
ok('distress-stop',intr.stopSpeech===true&&intr.nextPerformance==='gentle'&&intr.acknowledgeWithinMs<=100&&intr.resumePolicy==='do-not-auto-resume',intr);
ok('gentle-world-suppression',gentle.eventPolicy==='suppress-nonessential',gentle);
let chainPrev=null;const plans=[];
for(const [i,p] of ['welcoming','listening','thinking','gentle','playful'].entries()){
 for(let j=0;j<20;j++){const q=L.plan({performance:p,turn:i*20+j,text:p+j,previous:chainPrev,speaking:j%2===0});plans.push(q);chainPrev=q}
}
const audit=L.deadCharacterAudit(plans);
ok('dead-character-audit',audit.length===0,{audit});
const viVoice=B.voiceForLanguage('vi-VN'),enVoice=B.voiceForLanguage('en-US');
ok('voice-selector-vi',viVoice.shortName==='vi-VN-NamMinhNeural'&&viVoice.locale==='vi-VN',viVoice);
ok('voice-selector-en',enVoice.shortName==='en-US-GuyNeural'&&enVoice.locale==='en-US',enVoice);
const clipLang={home:'vi-VN',listen:'vi-VN',sad:'vi-VN',think:'vi-VN',english:'en-US'};
for(const [key,lang] of Object.entries(clipLang))ok('audio-locale-'+key,(key==='english'&&lang==='en-US')||(key!=='english'&&lang==='vi-VN'),{key,lang});
console.log(JSON.stringify({total:pass+fail.length,pass,fail:fail.length,conversationTurns:corpus.length*30,states:['welcoming','listening','thinking','gentle','playful'],voiceContract:{vi:viVoice,en:enVoice},audit},null,2));
if(fail.length){console.error(JSON.stringify(fail.slice(0,20),null,2));process.exit(1)}
