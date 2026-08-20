import assert from 'node:assert/strict';
import { decide } from '../brain-core.mjs';
import { validateBrainAction } from '../brain-validator.mjs';

const cases = [
  {
    name: 'after school should reconnect, not teach',
    input: { transcript: 'bác gấu ơi', child: { mood: 'neutral' }, world: { context: 'after_school' } },
    check: a => assert.equal(a.nextIntent, 'reconnect_after_school')
  },
  {
    name: 'sad child suppresses random world events',
    input: { transcript: 'hôm nay con buồn', child: { mood: 'sad' }, world: { context: 'after_school' } },
    check: a => assert.equal(a.worldAction, 'suppress_nonessential_events')
  },
  {
    name: 'interest becomes a memory candidate, not a hard fact',
    input: { transcript: 'con thích T-rex', child: { mood: 'neutral' }, world: {} },
    check: a => {
      assert.equal(a.nextIntent, 'playful_discovery');
      assert.ok(a.memoryCandidates[0].confidence < 1);
    }
  }
];

for (const c of cases) {
  const action = decide(c.input);
  const valid = validateBrainAction(action);
  assert.equal(valid.ok, true, `${c.name}: ${valid.errors.join(', ')}`);
  c.check(action);
  console.log(`PASS: ${c.name}`);
}
