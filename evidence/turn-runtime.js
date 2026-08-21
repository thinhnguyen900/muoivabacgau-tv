(function(root,factory){
  const api=factory(
    typeof module==='object'&&module.exports?require('./brain.js'):root.BacGauBrain,
    typeof module==='object'&&module.exports?require('./liveness.js'):root.BacGauLiveness
  );
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BacGauTurnRuntime=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Brain,Liveness){
  if(!Brain||!Liveness) throw new Error('BacGauTurnRuntime requires Brain and Liveness');
  const VOICES={
    'vi-VN':'vi-VN-NamMinhNeural',
    'en-US':'en-US-GuyNeural'
  };
  function assertSpeechPlan(plan){
    if(!plan||typeof plan.text!=='string'||!plan.text.trim()) throw new Error('speech-plan-text-missing');
    if(!VOICES[plan.language]) throw new Error('speech-plan-locale-unsupported');
    if(plan.voice!==VOICES[plan.language]) throw new Error('speech-plan-voice-locale-mismatch');
    if(plan.mime!=='audio/mpeg') throw new Error('speech-plan-mime-invalid');
    if(plan.interruptible!==true) throw new Error('speech-plan-not-interruptible');
    return true;
  }
  function ttsRequest(plan){
    assertSpeechPlan(plan);
    return {
      text:plan.text,
      locale:plan.language,
      voice:plan.voice,
      mime:plan.mime,
      output:'mp3',
      cacheable:plan.cacheable===true,
      performance:plan.performance,
      interruptible:true
    };
  }
  function create(seed={}){
    return {
      childState:Brain.init(seed.childState||seed),
      previousPerformance:null,
      active:null,
      turnId:0,
      history:[]
    };
  }
  function begin(session,input,now=Date.now()){
    if(!session) session=create();
    if(session.active&&!session.active.endedAt) throw new Error('active-turn-must-be-interrupted-or-finished');
    const decision=Brain.decide(input,session.childState);
    session.childState=decision.stateData;
    assertSpeechPlan(decision.speechPlan);
    const idlePlan=Liveness.plan({performance:decision.performance,turn:session.childState.turn,text:decision.speech,previous:session.previousPerformance,speaking:false});
    const speakingPlan=Liveness.plan({performance:decision.performance,turn:session.childState.turn,text:decision.speech,previous:idlePlan,speaking:true});
    const req=ttsRequest(decision.speechPlan);
    const turn={
      id:++session.turnId,
      input:String(input||''),
      decision,
      idlePlan,
      speakingPlan,
      speechRequest:req,
      phase:'anticipating',
      startedAt:now,
      speechStartedAt:null,
      endedAt:null,
      interrupted:false,
      interrupt:null
    };
    session.active=turn;
    session.previousPerformance=speakingPlan;
    session.history.push({id:turn.id,language:req.locale,voice:req.voice,performance:req.performance,phase:'begun'});
    session.history=session.history.slice(-50);
    return {session,turn};
  }
  function markSpeechStarted(session,now=Date.now()){
    if(!session?.active||session.active.endedAt) throw new Error('no-active-turn');
    session.active.phase='speaking';
    session.active.speechStartedAt=now;
    return session.active;
  }
  function interrupt(session,event={kind:'child-speech'},now=Date.now()){
    if(!session?.active||session.active.endedAt) return {session,handled:false,reason:'no-active-turn'};
    const current=session.active;
    const action=Liveness.onInterrupt(current.speakingPlan,event);
    current.interrupted=true;
    current.interrupt=action;
    current.phase='interrupted';
    current.endedAt=now;
    session.previousPerformance=Liveness.plan({performance:action.nextPerformance||'listening',turn:session.childState.turn,text:'interrupt',previous:current.speakingPlan,speaking:false});
    session.history.push({id:current.id,phase:'interrupted',kind:event.kind||'child-speech',nextPerformance:action.nextPerformance,acknowledgeWithinMs:action.acknowledgeWithinMs});
    session.active=null;
    return {session,handled:true,action,previousTurn:current,listeningPlan:session.previousPerformance};
  }
  function finish(session,now=Date.now()){
    if(!session?.active||session.active.endedAt) return {session,handled:false,reason:'no-active-turn'};
    const current=session.active;
    current.phase='finished';current.endedAt=now;
    session.history.push({id:current.id,phase:'finished'});
    session.active=null;
    return {session,handled:true,previousTurn:current};
  }
  function audit(session){
    const issues=[];
    for(const h of session?.history||[]){
      if(h.language&&VOICES[h.language]!==h.voice) issues.push('history-voice-locale-mismatch');
    }
    if(session?.active){
      try{assertSpeechPlan(session.active.decision.speechPlan)}catch(e){issues.push(String(e.message||e))}
      if(session.active.phase==='speaking'&&!session.active.speechStartedAt) issues.push('speaking-without-start-time');
      if(!session.active.speakingPlan?.anticipatory) issues.push('missing-speech-anticipation');
    }
    return [...new Set(issues)];
  }
  return {VOICES,assertSpeechPlan,ttsRequest,create,begin,markSpeechStarted,interrupt,finish,audit};
});
