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
assert.ok(gentle.facial.brows.innerUp > 0.25, 'gentle concern should lift inner brow');
assert.ok(gentle.facial.timing.preSpeechMs >= 500, 'gentle response needs a natural pause');
assert.equal(gentle.speech.jawDrive, 'audio_envelope');
assert.equal(gentle.sequence[0].cue, 'eyes_to_target');
assert.equal(gentle.sequence[1].cue, 'head_follow');

const happyAction = { emotion: 'happy', animation: 'notice_then_resume_task' };
const gentleAction = { emotion: 'gentle', animation: 'sit_and_listen' };
const amusedAction = { emotion: 'amused', animation: 'lean_in_playful' };
const warmAction = { emotion: 'warm', animation: 'listen_soft' };

assert.ok(performanceIsDistinct(happyAction, gentleAction), 'happy and gentle performances must differ');
assert.ok(performanceIsDistinct(amusedAction, warmAction), 'amused and warm performances must differ');
assert.ok(mapBrainToPerformance(happyAction).facial.mouth.smile > gentle.facial.mouth.smile);
assert.ok(mapBrainToPerformance(amusedAction).staging.pose === 'standing_lean_in');

console.log('PASS performance-map: facial, staging, timing, interruption and world-event cues');
