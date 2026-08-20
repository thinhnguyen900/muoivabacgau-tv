import assert from 'node:assert/strict';
import { runBrainTurn } from '../brain-to-body.mjs';

const sad = runBrainTurn({
  transcript: 'Hôm nay con buồn.',
  child: { mood: 'sad' },
  world: { context: 'after_school' }
});

assert.equal(sad.ok, true);
assert.equal(sad.decision.emotion, 'gentle');
assert.equal(sad.performance.staging.pose, 'seated_forward_soft');
assert.equal(sad.performance.world.suppressNonessentialEvents, true);
assert.ok(sad.performance.facial.timing.preSpeechMs >= 500);
assert.ok(sad.performance.facial.eyes.openness < 0.8);

const afterSchool = runBrainTurn({
  transcript: 'Con mới về.',
  child: { mood: 'neutral' },
  world: { context: 'after_school' }
});

assert.equal(afterSchool.ok, true);
assert.equal(afterSchool.decision.emotion, 'happy');
assert.equal(afterSchool.performance.staging.pose, 'turn_from_task');
assert.ok(afterSchool.performance.facial.mouth.smile > sad.performance.facial.mouth.smile);
assert.ok(afterSchool.performance.facial.timing.preSpeechMs < sad.performance.facial.timing.preSpeechMs);

const dinosaur = runBrainTurn({
  transcript: 'Con muốn nói về T-rex.',
  child: { mood: 'neutral' },
  world: { context: 'free_time' }
});

assert.equal(dinosaur.ok, true);
assert.equal(dinosaur.decision.emotion, 'amused');
assert.equal(dinosaur.performance.staging.pose, 'standing_lean_in');
assert.equal(dinosaur.telemetry.memoryCandidateCount, 1);

console.log('PASS brain-to-body: sad, after-school and playful turns produce distinct validated performances');
