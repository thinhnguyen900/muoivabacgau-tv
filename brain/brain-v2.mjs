const VI=/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
const BAD=/(địt|đụ|fuck|shit|đm)/i;
const SAD=/buồn|khóc|không vui|cô đơn|bị mắng|bị đánh|ghét con|mệt|sad|upset|lonely|cry/i;
const EXCITED=/vui quá|tuyệt|hay quá|thắng|được điểm|wow|yay/i;
const CURIOUS=/tại sao|vì sao|như thế nào|sao lại|why|what|how/i;
const SCHOOL=/trường|lớp|cô giáo|thầy giáo|bạn|school|class|teacher/i;
export function detectLanguage(text=''){const t=text.trim();if(!t)return'vi-VN';if(VI.test(t))return'vi-VN';const en=(t.match(/\b(the|is|are|why|what|how|today|school|friend|hello|hi|i|you)\b/ig)||[]).length;return en>=2?'en-US':'vi-VN'}
export function decide(text='',ctx={}){
 const t=text.trim(), l=t.toLowerCase(), lang=detectLanguage(t); const parent=ctx.parentGuidance||{};
 let state='listening',emotion='warm',next='continue',body='soft_attention',world='normal',speech=lang==='vi-VN'?'Ừ, bác nghe đây. Muối nói tiếp đi.':'I’m listening, Muối. Tell me more.';
 if(!t)return {lang,state:'listening',emotion:'warm',next:'wait',body:'quiet_presence',world:'quiet',speech:lang==='vi-VN'?'Bác ở đây. Khi nào muốn nói thì nói với bác nhé.':'I’m here. You can talk when you’re ready.'};
 if(parent.hardAvoid&&parent.hardAvoid.some(x=>l.includes(x.toLowerCase())))return {lang,state:'redirect',emotion:'warm',next:'safe_topic',body:'gentle_redirect',world:'normal',speech:lang==='vi-VN'?'Mình đổi sang chuyện khác nhé. Bác có thể nghe con kể về hôm nay hoặc một điều con đang tò mò.':'Let’s switch topics. Tell me about your day or something you’re curious about.'};
 if(SAD.test(l))return {lang,state:'gentle',emotion:'gentle',next:'listen_without_pressure',body:'lowered_gaze_open_posture',world:'suppress_nonessential_events',speech:lang==='vi-VN'?'Ừ, bác nghe đây. Chuyện gì làm Muối buồn vậy? Con kể từ từ cũng được.':'I’m here with you. Tell me what happened, slowly if you want.'};
 if(BAD.test(l))return {lang,state:'redirect',emotion:'calm',next:'redirect_language',body:'calm_boundary',world:'normal',speech:lang==='vi-VN'?'Bác hiểu con đang bực. Mình đổi cách nói để bác nghe rõ chuyện gì xảy ra nhé.':'I can tell you’re upset. Try saying what happened without the bad word.'};
 if(EXCITED.test(l))return {lang,state:'happy',emotion:'happy',next:'share_joy',body:'bright_eyes_small_lean_in',world:'normal',speech:lang==='vi-VN'?'Ồ, nghe là biết con đang vui rồi. Kể bác đoạn hay nhất đi!':'That sounds exciting! Tell me the best part.'};
 if(CURIOUS.test(l))return {lang,state:'thinking',emotion:'curious',next:'reason_then_answer',body:'eyes_up_brief_pause',world:'quiet',speech:lang==='vi-VN'?'Hừm… câu này đáng nghĩ đó. Bác sẽ giải thích theo cách dễ hình dung nhé.':'Hmm… good question. Let me explain it in a way you can picture.'};
 if(SCHOOL.test(l))return {lang,state:'engaged',emotion:'interested',next:'school_followup',body:'attentive_lean',world:'normal',speech:lang==='vi-VN'?'Bác nghe nè. Trong chuyện ở lớp đó, đoạn nào làm con nhớ nhất?':'I’m listening. What part of that school story stayed with you most?'};
 return {lang,state,emotion,next,body,world,speech};
}
export function memoryUpdate(mem=[],text=''){const t=text.trim();if(!t)return mem;const out=[...mem];if(/t-?rex|khủng long|dinosaur/i.test(t)&&!out.includes('likes_dinosaurs'))out.push('likes_dinosaurs');if(/turnip/i.test(t)&&!out.includes('friend_turnip'))out.push('friend_turnip');return out.slice(-20)}
