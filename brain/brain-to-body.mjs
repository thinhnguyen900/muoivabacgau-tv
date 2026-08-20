import { decide } from './brain-core.mjs';
import { validateBrainAction } from './brain-validator.mjs';
import { mapBrainToPerformance } from '../body/performance-map.mjs';

export function runBrainTurn(input) {
  const decision = decide(input);
  const validation = validateBrainAction(decision);

  if (!validation.ok) {
    return {
      ok: false,
      errors: validation.errors,
      decision,
      performance: null
    };
  }

  const performance = mapBrainToPerformance(decision);
  return {
    ok: true,
    errors: [],
    decision,
    performance,
    telemetry: {
      emotion: decision.emotion,
      animation: decision.animation,
      pose: performance.staging.pose,
      preSpeechMs: performance.facial.timing.preSpeechMs,
      suppressNonessentialEvents: performance.world.suppressNonessentialEvents,
      memoryCandidateCount: decision.memoryCandidates?.length || 0,
      parentSignalCount: decision.parentSignals?.length || 0
    }
  };
}
