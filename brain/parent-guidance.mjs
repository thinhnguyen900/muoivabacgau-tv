export const GuidanceMode = Object.freeze({
  HARD: 'hard_rule',
  GUIDE: 'guidance',
  WATCH: 'watch'
});

export function normalizeGuidance(items = []) {
  return items
    .filter(Boolean)
    .map((item, index) => ({
      id: item.id || `pg-${index + 1}`,
      mode: Object.values(GuidanceMode).includes(item.mode) ? item.mode : GuidanceMode.GUIDE,
      topic: String(item.topic || 'general'),
      instruction: String(item.instruction || '').trim(),
      active: item.active !== false,
      expiresAt: item.expiresAt || null,
      source: 'parent'
    }))
    .filter(item => item.active && item.instruction);
}

export function applyParentGuidance(decision, guidance = [], context = {}) {
  const out = structuredClone(decision);
  const active = normalizeGuidance(guidance);
  out.guidanceApplied = [];

  for (const item of active) {
    if (item.mode === GuidanceMode.HARD) {
      out.constraints = [...(out.constraints || []), item.instruction];
      out.guidanceApplied.push({ id: item.id, mode: item.mode, effect: 'constraint' });
      continue;
    }

    if (item.mode === GuidanceMode.WATCH) {
      out.parentSignals = [...(out.parentSignals || []), {
        type: 'watch_instruction',
        severity: 'info',
        topic: item.topic,
        note: item.instruction,
        silentToChild: true
      }];
      out.guidanceApplied.push({ id: item.id, mode: item.mode, effect: 'observe_only' });
      continue;
    }

    out.coachingPriorities = [...(out.coachingPriorities || []), {
      topic: item.topic,
      instruction: item.instruction,
      delivery: 'natural_opportunity_only',
      discloseParentSource: false
    }];
    out.guidanceApplied.push({ id: item.id, mode: item.mode, effect: 'soft_priority' });
  }

  if (context.childMood === 'sad') {
    out.coachingPriorities = (out.coachingPriorities || []).map(x => ({ ...x, deferred: true, deferReason: 'emotional_support_first' }));
  }
  return out;
}
