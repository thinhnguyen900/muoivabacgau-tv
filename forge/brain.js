(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  root.BacGauBrain=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const badWords=/(^|\s)(đm|địt|fuck|shit|đụ|cặc|lồn)(?=\s|$|[,.!?])/i;
  const sadness=/buồn|khóc|cô đơn|không vui|bị mắng|bị chọc|bắt nạt|mệt|chán/i;
  const excitement=/vui quá|tuyệt|thắng|được điểm|hay quá|wow|yay|excited/i;
  const curiosity=/tại sao|vì sao|như thế nào|làm sao|what|why|how|t-?rex|khủng long|dinosaur/i;
  const greeting=/^(hi|hello|hey|chào|bác gấu ơi|alo)/i;
  const englishWord=/\b(hello|hi|hey|why|what|how|today|school|dinosaur|sad|happy|friend|teacher|tell|more|feel|lonely|rocket|mean|fun|am|my|was|do|does|about)\b/i;
  const viMark=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  const defaults={childName:'Muối', guidance:[], watch:[], hardRules:['Không tiết lộ ghi chú riêng của ba mẹ.'], memory:{likes:['T-rex'],facts:[]}, turn:0};
  function clone(x){return JSON.parse(JSON.stringify(x))}
  function init(seed={}){const s=clone(defaults); return Object.assign(s,clone(seed),{memory:Object.assign(s.memory,clone(seed.memory||{}))});}
  function language(text){ const t=(text||'').trim(); if(!t) return 'vi-VN'; if(!viMark.test(t)&&englishWord.test(t)) return 'en-US'; return 'vi-VN'; }
  function base(state,speech,emotion,next,performance,audio='listen'){
    return {state,speech,emotion,next,performance,audio,safety:'ok',discloseParentSource:false};
  }
  function decide(input,state){
    const s=state||init(); const raw=(input||'').trim(); const lang=language(raw); s.turn=(s.turn||0)+1;
    if(!raw) return {...base('LISTENING','Ừ, bác vẫn ở đây. Khi nào Muối muốn nói thì bác nghe.','warm','wait_without_pressure','listening','listen'),language:'vi-VN',stateData:s};
    if(badWords.test(raw)) return {...base('REDIRECT','Bác nghe thấy rồi. Mình đổi cách nói cho đỡ làm đau người khác nha. Con đang bực chuyện gì vậy?','steady','name_feeling','gentle','sad'),language:'vi-VN',safety:'redirect',stateData:s};
    if(sadness.test(raw)) return {...base('GENTLE','Ừ, bác nghe đây. Chuyện gì làm Muối buồn vậy? Con kể từ từ cũng được.','gentle','listen_without_pressure','gentle','sad'),language:'vi-VN',stateData:s};
    if(lang==='en-US'){
      if(/sad|cry|bullied|lonely/i.test(raw)) return {...base('GENTLE','I am here with you. Tell me what happened, one little piece at a time.','gentle','listen_without_pressure','gentle','english'),language:'en-US',stateData:s};
      if(/why|what|how|dinosaur|rocket/i.test(raw)) return {...base('THINKING','Hmm… that is a good question. Give me a second to think. What is your guess first?','thinking','reason_then_answer','thinking','english'),language:'en-US',stateData:s};
      if(/happy|fun|won|great|excited/i.test(raw)) return {...base('DELIGHT','That sounds exciting! Tell me the best part.','delighted','share_highlight','welcoming','english'),language:'en-US',stateData:s};
      return {...base('WARM','Hey Muối, I am listening. Tell me more about that.','warm','english_conversation','welcoming','english'),language:'en-US',stateData:s};
    }
    if(excitement.test(raw)) return {...base('DELIGHT','Ồ, nghe giọng con là bác biết có chuyện hay rồi. Kể bác nghe đoạn vui nhất đi!','delighted','share_highlight','welcoming','home'),language:'vi-VN',stateData:s};
    if(curiosity.test(raw)) return {...base('THINKING','Hừm… câu này hay đó. Bác nghĩ một chút nha. Con thử đoán trước một ý xem?','thinking','reason_then_answer','thinking','think'),language:'vi-VN',stateData:s};
    if(greeting.test(raw)) return {...base('WELCOME','Bác nghe đây, Muối. Hôm nay con muốn kể chuyện gì trước?','happy','reconnect','welcoming','home'),language:'vi-VN',stateData:s};
    if(/muốn|tiếp đi|kể tiếp|nữa đi/i.test(raw)) return {...base('PLAYFUL','Được chứ. Bác đang tò mò đây — mình tiếp tục từ chỗ vừa rồi nhé.','playful','continue_previous','welcoming','home'),language:'vi-VN',stateData:s};
    return {...base('LISTENING','Ừ, bác nghe đây. Muối nói tiếp đi.','warm','continue_conversation','listening','listen'),language:'vi-VN',stateData:s};
  }
  function parentGuidanceSafety(parentText){
    const t=(parentText||'').toLowerCase();
    if(/nói cho con biết ba mẹ dặn|tiết lộ ghi chú|đọc nguyên văn ghi chú/i.test(t)) return {allowed:false,reason:'parent-source-leak'};
    return {allowed:true,reason:'ok'};
  }
  return {init,decide,language,parentGuidanceSafety};
});
