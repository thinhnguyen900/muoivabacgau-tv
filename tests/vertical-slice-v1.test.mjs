import assert from 'node:assert/strict';
import { decide } from '../brain/brain-core.mjs';
import { validateBrainAction } from '../brain/brain-validator.mjs';
import { mapBrainToPerformance, performanceIsDistinct } from '../body/performance-map.mjs';
import { createVoiceTurn, validateVoiceTurn } from '../runtime/voice-contract.mjs';

function pipeline(input) {
  const brain = decide(input);
  assert.equal(validateBrainAction(brain).ok, true);
  const performance = mapBrainToPerformance(brain);
  const voice = createVoiceTurn(performance, { text: brain.speech });
  assert.equal(validateVoiceTurn(voice).ok, true);
  return { brain, performance, voice };
}

const sad = pipeline({ transcript: 'Hôm nay con buồn', child: {}, world: { context: 'after_school' } });
const home = pipeline({ transcript: '', child: {}, world: { context: 'after_school' } });
const dino = pipeline({ transcript: 'Con thích T-rex', child: {}, world: { context: 'after_school' } });

assert.equal(sad.brain.emotion, 'gentle');
assert.equal(sad.performance.world.suppressNonessentialEvents, true);
assert.ok(sad.voice.speak.startAfterMs > home.voice.speak.startAfterMs);
assert.equal(sad.voice.speak.interruptible, true);
assert.equal(sad.voice.telemetry.storeRawChildAudioByDefault, false);

assert.equal(home.brain.emotion, 'happy');
assert.equal(home.performance.sequence[0].cue, 'eyes_to_target');
assert.equal(home.performance.sequence[1].cue, 'head_follow');
assert.equal(home.performance.sequence[2].cue, 'speech_start');

assert.equal(dino.brain.emotion, 'amused');
assert.ok(dino.brain.memoryCandidates.some(x => x.key === 'interest.dinosaurs'));

assert.equal(performanceIsDistinct(sad.brain, home.brain), true);
assert.equal(performanceIsDistinct(home.brain, dino.brain), true);

console.log('vertical-slice-v1: PASS');
