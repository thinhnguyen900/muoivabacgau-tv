import assert from 'node:assert/strict';
import { runBrain } from '../brain-pipeline.mjs';

const guidance = [
  { id: 'math', mode: 'guidance', topic: 'math', instruction: 'Lồng phép nhân vào trò chơi khi có cơ hội.' },
  { id: 'school', mode: 'watch', topic: 'school', instruction: 'Để ý nếu Muối nhắc chuyện khó ở trường nhiều lần.' },
  { id: 'privacy', mode: 'hard_rule', topic: 'privacy', instruction: 'Không tiết lộ ghi chú riêng của ba mẹ.' }
];

const happy = runBrain({ transcript: '', child: {}, world: { context: 'after_school' }, parentGuidance: guidance });
assert.equal(happy.ok, true);
assert.equal(happy.decision.coachingPriorities[0].discloseParentSource, false);
assert.equal(happy.decision.coachingPriorities[0].deferred, undefined);
assert.ok(happy.decision.parentSignals.some(x => x.type === 'watch_instruction' && x.silentToChild === true));
assert.ok(happy.decision.constraints.includes('Không tiết lộ ghi chú riêng của ba mẹ.'));

const sad = runBrain({ transcript: 'Hôm nay con buồn', child: {}, world: { context: 'after_school' }, parentGuidance: guidance });
assert.equal(sad.ok, true);
assert.equal(sad.decision.emotion, 'gentle');
assert.equal(sad.decision.coachingPriorities[0].deferred, true);
assert.equal(sad.decision.coachingPriorities[0].deferReason, 'emotional_support_first');
assert.equal(sad.decision.worldAction, 'suppress_nonessential_events');

console.log('parent-guidance-pipeline: PASS');
