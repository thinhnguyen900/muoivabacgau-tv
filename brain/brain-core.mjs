export function decide(input) {
  const text = (input.transcript || '').toLowerCase();
  const child = input.child || {};
  const world = input.world || {};

  const out = {
    speech: '',
    emotion: 'warm',
    animation: 'listen_soft',
    gaze: 'child',
    pace: 'natural',
    worldAction: null,
    memoryCandidates: [],
    parentSignals: [],
    safety: { level: 'ok', reason: null },
    nextIntent: 'continue_conversation'
  };

  if (child.mood === 'sad' || /buồn|khóc|không vui/.test(text)) {
    out.speech = 'Ừ, bác nghe đây. Chuyện gì làm Muối buồn vậy? Con kể từ từ cũng được.';
    out.emotion = 'gentle';
    out.animation = 'sit_and_listen';
    out.worldAction = 'suppress_nonessential_events';
    out.parentSignals.push({ type: 'emotional_observation', severity: 'low', note: 'Child expressed sadness; observe recurrence before surfacing.' });
    return out;
  }

  if (/khủng long|t-?rex|dinosaur/.test(text)) {
    out.speech = 'À, lại tới hội khủng long rồi. Bác có một chuyện hơi kỳ về T-rex, nhưng bác muốn nghe con đoán trước.';
    out.emotion = 'amused';
    out.animation = 'lean_in_playful';
    out.memoryCandidates.push({ key: 'interest.dinosaurs', value: true, confidence: 0.72, ttl: 'long' });
    out.nextIntent = 'playful_discovery';
    return out;
  }

  if (world.context === 'after_school') {
    out.speech = 'Muối về rồi hả? Bác đang làm dở chút này thôi. Hôm nay có chuyện gì đáng kể nhất ở lớp?';
    out.emotion = 'happy';
    out.animation = 'notice_then_resume_task';
    out.nextIntent = 'reconnect_after_school';
    return out;
  }

  out.speech = 'Ừ, bác nghe đây. Muối nói tiếp đi.';
  return out;
}
