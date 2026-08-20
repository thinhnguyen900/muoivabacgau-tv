import { decide } from './brain-core.mjs';
import { validateBrainAction } from './brain-validator.mjs';
import { applyParentGuidance } from './parent-guidance.mjs';

export function runBrain(input = {}) {
  const raw = decide(input);
  const validation = validateBrainAction(raw);
  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      decision: null
    };
  }

  const decision = applyParentGuidance(
    raw,
    input.parentGuidance || [],
    { childMood: input?.child?.mood || inferMood(input.transcript) }
  );

  return { ok: true, errors: [], decision };
}

function inferMood(transcript = '') {
  const text = String(transcript).toLowerCase();
  if (/buồn|khóc|không vui/.test(text)) return 'sad';
  return 'unknown';
}
