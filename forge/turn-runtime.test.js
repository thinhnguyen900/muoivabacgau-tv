const R=require('./turn-runtime.js');
let pass=0;const fail=[];function ok(name,cond,extra){if(cond)pass++;else fail.push({name,extra})}
const cases=[
 ['Bác Gấu ơi','vi-VN','welcoming'],
 ['Con buồn vì bị bạn chọc','vi-VN','gentle'],
 ['Tại sao khủng long tuyệt chủng?','vi-VN','thinking'],
 ['Wow hôm nay con thắng rồi!','vi-VN','welcoming'],
 ['Hello bear','en-US','welcoming'],
 ['Why did dinosaurs disappear?','en-US','thinking'],
 ['I am sad and lonely','en-US','gentle']
];
let s=R.create();
for(let round=0;round<40;round++){
 for(const [text,lang,perf] of cases){
  const started=R.begin(s,text,100000+round);s=started.session;const t=started.turn;
  ok('lang',t.speechRequest.locale===lang,t.speechRequest);
  ok('voice',t.speechRequest.voice===R.VOICES[lang],t.speechRequest);
  ok('performance',t.speechRequest.performance===perf,t.speechRequest);
  ok('anticipation',t.speakingPlan.anticipatory===true&&t.speakingPlan.anticipationMs>0,t.speakingPlan);
  ok('mime',t.speechRequest.mime==='audio/mpeg'&&t.speechRequest.output==='mp3',t.speechRequest);
  R.markSpeechStarted(s,100100+round);
  ok('speech-start',s.active.phase==='speaking'&&!!s.active.speechStartedAt,s.active);
  if(round%2===0){
   const intr=R.interrupt(s,{kind:round%4===0?'child-speech':'distress'},100200+round);s=intr.session;
   ok('interrupt-handled',intr.handled&&intr.action.stopSpeech===true,intr);
   ok('interrupt-latency',intr.action.acknowledgeWithinMs<=220,intr.action);
   ok('interrupt-next',intr.listeningPlan&&['listening','gentle'].includes(intr.listeningPlan.performance),intr.listeningPlan);
   ok('active-cleared',s.active===null,s.active);
  }else{
   const fin=R.finish(s,100300+round);s=fin.session;
   ok('finish-handled',fin.handled&&s.active===null,fin);
  }
  ok('audit',R.audit(s).length===0,R.audit(s));
 }
}
for(const bad of [
 {text:'x',language:'vi-VN',voice:'en-US-GuyNeural',mime:'audio/mpeg',interruptible:true},
 {text:'x',language:'en-US',voice:'vi-VN-NamMinhNeural',mime:'audio/mpeg',interruptible:true},
 {text:'x',language:'fr-FR',voice:'fr-FR-HenriNeural',mime:'audio/mpeg',interruptible:true},
 {text:'x',language:'vi-VN',voice:'vi-VN-NamMinhNeural',mime:'audio/wav',interruptible:true},
 {text:'x',language:'vi-VN',voice:'vi-VN-NamMinhNeural',mime:'audio/mpeg',interruptible:false}
]){
 let threw=false;try{R.assertSpeechPlan(bad)}catch(e){threw=true}ok('reject-invalid-speech-plan',threw,bad);
}
console.log(JSON.stringify({ok:fail.length===0,pass,fail:fail.length,turns:cases.length*40,interruptionCoverage:true,localeBoundSpeech:true,audit:R.audit(s)},null,2));
if(fail.length){console.error(JSON.stringify(fail.slice(0,20),null,2));process.exit(1)}
