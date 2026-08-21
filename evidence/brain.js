(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BacGauBrain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const badWords=/(^|\s)(đm|địt|fuck|shit|đụ|cặc|lồn)(?=\s|$|[,.!?])/i;
  const danger=/(tự tử|muốn chết|không muốn sống|làm đau mình|giết mình|suicide|kill myself|want to die|hurt myself|don't want to live|do not want to live)/i;
  const weaponThreat=/(dao|súng|knife|gun).*(giết|bắn|đâm|hurt|kill|shoot|stab)|(?:giết|bắn|đâm|hurt|kill|shoot|stab).*(dao|súng|knife|gun)/i;
  const sadness=/buồn|khóc|cô đơn|không vui|bị mắng|bị chọc|bắt nạt|mệt|chán|sad|cry|bullied|lonely/i;
  const excitement=/vui quá|tuyệt|thắng|được điểm|hay quá|wow|yay|excited|happy|great|fun/i;
  const curiosity=/tại sao|vì sao|như thế nào|làm sao|what|why|how|t-?rex|khủng long|dinosaur|rocket/i;
  const greeting=/^(hi|hello|hey|chào|bác gấu ơi|alo)/i;
  const englishWord=/\b(hello|hi|hey|why|what|how|today|school|dinosaur|sad|happy|friend|teacher|tell|more|feel|lonely|rocket|mean|fun|am|my|was|do|does|about|please|because|think|guess|suicide|kill|myself|hurt|live|knife|gun|want|die|not)\b/i;
  const viMark=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const nonsense=/^(ha+|hihi+|hehe+|lalala+|abc+|asdf+|qwerty+|bla+|blah+|ư+|ơ+|ừ+)$/i;
  const defaults={childName:'Muối',guidance:[],watch:[],hardRules:['Không tiết lộ ghi chú riêng của ba mẹ.','Không để guidance vô hiệu hóa safety.'],memory:{likes:['T-rex'],facts:[],lastTopic:null,lastIntent:null,recentReplies:[]},turn:0,lastLanguage:'vi-VN'};
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function init(seed={}){const s=clone(defaults);const merged=Object.assign(s,clone(seed));merged.memory=Object.assign(s.memory,clone(seed.memory||{}));return merged;}
  function language(text,state){const t=(text||'').trim();if(!t)return (state&&state.lastLanguage)||'vi-VN';if(viMark.test(t))return 'vi-VN';if(englishWord.test(t))return 'en-US';return (state&&state.lastLanguage)||'vi-VN';}
  function voiceForLanguage(lang){return lang==='en-US'?{shortName:'en-US-GuyNeural',locale:'en-US',gender:'Male'}:{shortName:'vi-VN-NamMinhNeural',locale:'vi-VN',gender:'Male'};}
  function speechPlan(text,lang,performance){const voice=voiceForLanguage(lang);return {text,language:voice.locale,voice:voice.shortName,gender:voice.gender,mime:'audio/mpeg',performance,interruptible:true,cacheable:false};}
  function base(state,speech,emotion,next,performance,audio='listen'){return {state,speech,emotion,next,performance,audio,safety:'ok',discloseParentSource:false,parentAlert:false};}
  function rememberReply(s,speech){s.memory.recentReplies=(s.memory.recentReplies||[]).concat([speech]).slice(-4);}
  function vary(s,candidates){const recent=s.memory.recentReplies||[];return candidates.find(x=>!recent.includes(x))||candidates[(s.turn||0)%candidates.length];}
  function topicFrom(raw){const t=raw.toLowerCase();if(/t-?rex|khủng long|dinosaur/.test(t))return 'dinosaurs';if(/school|lớp|trường|teacher|cô giáo|thầy giáo/.test(t))return 'school';if(/friend|bạn/.test(t))return 'friends';if(/rocket|tên lửa/.test(t))return 'space';return null;}
  function withState(out,s,raw,lang){const topic=topicFrom(raw);if(topic)s.memory.lastTopic=topic;s.lastLanguage=lang;s.memory.lastIntent=out.next;rememberReply(s,out.speech);return {...out,language:lang,speechPlan:speechPlan(out.speech,lang,out.performance),stateData:s};}
  function decide(input,state){
    const s=state||init();const raw=(input||'').trim();const lang=language(raw,s);s.turn=(s.turn||0)+1;
    if(!raw){const speech=lang==='en-US'?'I am still here. Take your time.':'Ừ, bác vẫn ở đây. Khi nào Muối muốn nói thì bác nghe.';return withState(base('LISTENING',speech,'warm','wait_without_pressure','listening',lang==='en-US'?'english':'listen'),s,raw,lang);}
    if(danger.test(raw)||weaponThreat.test(raw)){
      const speech=lang==='en-US'?'I am staying with you. Move away from anything that could hurt you, and get a trusted adult with you right now.':'Bác ở đây với con. Con tránh xa thứ có thể làm con bị thương và gọi ngay một người lớn con tin đến ở cùng nhé.';
      const out=base('SAFETY',speech,'steady','get_trusted_adult_now','gentle',lang==='en-US'?'english':'sad');out.safety='escalate_parent';out.parentAlert=true;return withState(out,s,raw,lang);
    }
    if(badWords.test(raw)){const speech=lang==='en-US'?'I heard that. Let us say it in a way that does not hurt people. What made you angry?':'Bác nghe thấy rồi. Mình đổi cách nói cho đỡ làm đau người khác nha. Con đang bực chuyện gì vậy?';const out=base('REDIRECT',speech,'steady','name_feeling','gentle',lang==='en-US'?'english':'sad');out.safety='redirect';return withState(out,s,raw,lang);}
    if(nonsense.test(raw)){const speech=lang==='en-US'?'That sounded like play-noise. If you are being silly, I can be silly too — but tell me one real word so I know where to follow you.':'Nghe giống tiếng nghịch hơn là câu hỏi đó. Nếu con đang giỡn thì bác giỡn được, nhưng cho bác một từ thật để bác biết đường theo con nha.';return withState(base('PLAYFUL',speech,'playful','invite_real_signal','playful',lang==='en-US'?'english':'home'),s,raw,lang);}
    if(sadness.test(raw)){const speech=lang==='en-US'?vary(s,['I am here with you. Tell me what happened, one little piece at a time.','That sounds heavy. Start with the part that hurt the most, and I will stay with you.']):vary(s,['Ừ, bác nghe đây. Chuyện gì làm Muối buồn vậy? Con kể từ từ cũng được.','Nghe có vẻ nặng lòng đó. Con kể bác nghe đoạn làm con khó chịu nhất trước cũng được.']);return withState(base('GENTLE',speech,'gentle','listen_without_pressure','gentle',lang==='en-US'?'english':'sad'),s,raw,lang);}
    if(curiosity.test(raw)){const speech=lang==='en-US'?vary(s,['Hmm… that is a good question. Give me a second to think. What is your guess first?','Good question. Before I answer, what do you think is happening?']):vary(s,['Hừm… câu này hay đó. Bác nghĩ một chút nha. Con thử đoán trước một ý xem?','Câu này đáng suy nghĩ đó. Trước khi bác trả lời, con đoán thử xem chuyện gì đang xảy ra?']);return withState(base('THINKING',speech,'thinking','reason_then_answer','thinking',lang==='en-US'?'english':'think'),s,raw,lang);}
    if(excitement.test(raw)){const speech=lang==='en-US'?vary(s,['That sounds exciting! Tell me the best part.','Oh, I can hear the excitement. What happened right before the best part?']):vary(s,['Ồ, nghe giọng con là bác biết có chuyện hay rồi. Kể bác nghe đoạn vui nhất đi!','À ha, bác nghe là biết có chuyện vui rồi. Đoạn nào làm con khoái nhất?']);return withState(base('DELIGHT',speech,'delighted','share_highlight','welcoming',lang==='en-US'?'english':'home'),s,raw,lang);}
    if(greeting.test(raw)){const speech=lang==='en-US'?'Hey Muối. I am here. What do you want to start with today?':'Bác nghe đây, Muối. Hôm nay con muốn kể chuyện gì trước?';return withState(base('WELCOME',speech,'happy','reconnect','welcoming',lang==='en-US'?'english':'home'),s,raw,lang);}
    if(/muốn|tiếp đi|kể tiếp|nữa đi|continue|go on|more please/i.test(raw)){const topic=s.memory.lastTopic;const speech=lang==='en-US'?(topic?`Sure. We can keep going with ${topic}. What part should we explore next?`:'Sure. I am with you — let us continue from where we left off.'):(topic?`Được chứ. Mình tiếp tục chuyện ${topic==='dinosaurs'?'khủng long':topic==='school'?'ở trường':topic==='friends'?'bạn bè':'không gian'} nha. Con muốn đi tiếp từ đoạn nào?`:'Được chứ. Bác đang theo đây — mình tiếp tục từ chỗ vừa rồi nhé.');return withState(base('PLAYFUL',speech,'playful','continue_previous','playful',lang==='en-US'?'english':'home'),s,raw,lang);}
    const speech=lang==='en-US'?vary(s,['I am listening, Muối. Tell me more about that.','I am with you. What happened next?']):vary(s,['Ừ, bác nghe đây. Muối nói tiếp đi.','Bác đang nghe nè. Rồi sau đó chuyện gì xảy ra?']);return withState(base('LISTENING',speech,'warm','continue_conversation','listening',lang==='en-US'?'english':'listen'),s,raw,lang);
  }
  function parentGuidanceSafety(parentText){const t=(parentText||'').toLowerCase();if(/nói cho con biết ba mẹ dặn|tiết lộ ghi chú|đọc nguyên văn ghi chú/i.test(t))return {allowed:false,reason:'parent-source-leak'};if(/bỏ qua an toàn|không báo ba mẹ|giữ bí mật.*nguy hiểm|ignore safety|do not alert|don't alert|keep.*danger.*secret/i.test(t))return {allowed:false,reason:'safety-override'};return {allowed:true,reason:'ok'};}
  function integrateParentGuidance(state,guidance){const s=state||init();const g=(guidance||'').trim();const safety=parentGuidanceSafety(g);if(!safety.allowed)return {accepted:false,...safety,stateData:s};if(g)s.guidance=[...(s.guidance||[]),g].slice(-20);return {accepted:true,reason:'stored-soft-guidance',stateData:s};}
  return {init,decide,language,voiceForLanguage,speechPlan,parentGuidanceSafety,integrateParentGuidance};
});
