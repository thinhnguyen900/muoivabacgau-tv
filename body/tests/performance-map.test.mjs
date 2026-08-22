import assert from 'node:assert/strict';
import { mapBrainToPerformance, performanceIsDistinct } from '../performance-map.mjs';

const gentle = mapBrainToPerformance({
  emotion: 'gentle',
  animation: 'sit_and_listen',
  gaze: 'child',
  pace: 'slow',
  worldAction: 'suppress_nonessential_events'
});

assert.equal(gentle.staging.pose, 'seated_forward_soft');
assert.equal(gentle.world.suppressNonessentialEvents, true);
assert.ok(gentle.facial.eyes.openness < 0.8, 'gentle eyes should soften');
assert.ok(gentle.facial.eyes.scleraLimit <= 0.12, 'gentle eye whites must stay tightly capped');
assert.ok(gentle.facial.eyes.pupilScale >= 0.95, 'gentle pupils should remain warm, not pin-like');
assert.ok(gentle.facial.brows.innerUp > 0.25, 'gentle concern should lift inner brow');
assert.ok(gentle.facial.brows.softness >= 0.95, 'gentle brows should avoid a hard/aggressive read');
assert.ok(gentle.facial.timing.preSpeechMs >= 500, 'gentle response needs a natural pause');
assert.ok(gentle.facial.microMotion.saccade <= 0.12, 'gentle gaze should not dart around');
assert.ok(gentle.facial.microMotion.asymmetry > 0, 'idle performance should not be mechanically symmetric');
assert.equal(gentle.speech.jawDrive, 'audio_envelope');
assert.equal(gentle.sequence[0].cue, 'eyes_to_target');
assert.equal(gentle.sequence[1].cue, 'micro_saccade_settle');
assert.equal(gentle.sequence[2].cue, 'head_follow');
assert.equal(gentle.sequence[3].cue, 'shoulder_weight_settle');
assert.equal(gentle.sequence.at(-1).cue, 'speech_start');
assert.ok(gentle.sequence.at(-1).atMs >= gentle.sequence[3].atMs, 'speech must follow eye/head/body anticipation');

const happyAction = { emotion: 'happy', animation: 'notice_then_resume_task' };
const gentleAction = { emotion: 'gentle', animation: 'sit_and_listen' };
const amusedAction = { emotion: 'amused', animation: 'lean_in_playful' };
const warmAction = { emotion: 'warm', animation: 'listen_soft' };

assert.ok(performanceIsDistinct(happyAction, gentleAction), 'happy and gentle performances must differ');
assert.ok(performanceIsDistinct(amusedAction, warmAction), 'amused and warm performances must differ');
assert.ok(mapBrainToPerformance(happyAction).facial.mouth.smile > gentle.facial.mouth.smile);
assert.ok(mapBrainToPerformance(amusedAction).staging.pose === 'standing_lean_in');

for (const action of [happyAction, gentleAction, amusedAction, warmAction]) {
  const p = mapBrainToPerformance(action);
  assert.ok(p.facial.eyes.scleraLimit <= 0.18, `${action.emotion} sclera exposure must stay child-safe`);
  assert.ok(p.facial.eyes.pupilScale >= 0.92, `${action.emotion} pupils must not become pin-like`);
  assert.ok(p.facial.brows.softness >= 0.8, `${action.emotion} brows must stay soft`);
  assert.ok(p.facial.microMotion.saccade <= 0.3, `${action.emotion} micro-saccades must remain subtle`);
  assert.ok(p.facial.microMotion.asymmetry > 0 && p.facial.microMotion.asymmetry <= 0.22, `${action.emotion} asymmetry must be subtle and non-zero`);
}

console.log('PASS performance-map: anti-uncanny eyes/brows, staging, anticipation, speech timing and micro-motion');
