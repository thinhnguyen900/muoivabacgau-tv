import assert from 'node:assert/strict';
import { LivingWorldModel } from '../engine-model.mjs';

const w = new LivingWorldModel('buổi chiều');
assert.equal(w.story,'xếp sách');
assert.match(w.arrive(),/Không mở đầu/);
assert.equal(w.childPresent,true);
assert.match(w.talk(),/xếp sách dở/);
assert.match(w.knock(),/continuity/);
assert.equal(w.story,'Thỏ ghé chơi');
assert.ok(w.memories.includes('Muối vừa về nhà'));
assert.ok(w.memories.includes('Thỏ xám vừa ghé chơi'));
assert.equal(w.engagement,7);
console.log('PASS living-world continuity regression');
