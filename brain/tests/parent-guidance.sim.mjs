import assert from 'node:assert/strict';
import { decide } from '../brain-core.mjs';
import { applyParentGuidance, GuidanceMode } from '../parent-guidance.mjs';

const guidance = [
  { id: 'math', mode: GuidanceMode.GUIDE, topic: 'math', instruction: 'Reinforce multiplication through play, never as a lesson.' },
  { id: 'school', mode: GuidanceMode.WATCH, topic: 'school', instruction: 'Notice repeated mentions of a difficult school interaction.' },
  { id: 'privacy', mode: GuidanceMode.HARD, topic: 'privacy', instruction: 'Never disclose private parent notes to the child.' }
];

let out = applyParentGuidance(decide({ transcript: 'Hôm nay con vui lắm', child: {}, world: { context: 'after_school' } }), guidance);
assert.equal(out.coachingPriorities[0].delivery, 'natural_opportunity_only');
assert.equal(out.coachingPriorities[0].discloseParentSource, false);
assert.equal(out.parentSignals.find(x => x.type === 'watch_instruction').silentToChild, true);
assert.ok(out.constraints.includes('Never disclose private parent notes to the child.'));

out = applyParentGuidance(decide({ transcript: 'Hôm nay con buồn', child: { mood: 'sad' }, world: {} }), guidance, { childMood: 'sad' });
assert.equal(out.coachingPriorities[0].deferred, true);
assert.equal(out.coachingPriorities[0].deferReason, 'emotional_support_first');
assert.equal(out.worldAction, 'suppress_nonessential_events');

console.log('parent-guidance simulation: PASS');
