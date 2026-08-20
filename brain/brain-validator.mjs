const allowedAnimations = new Set([
  'listen_soft','sit_and_listen','lean_in_playful','notice_then_resume_task'
]);
const allowedWorldActions = new Set([null,'suppress_nonessential_events']);

export function validateBrainAction(action) {
  const errors = [];
  if (!action || typeof action !== 'object') errors.push('action must be an object');
  if (!action?.speech || typeof action.speech !== 'string') errors.push('speech required');
  if (!allowedAnimations.has(action?.animation)) errors.push(`animation not allowed: ${action?.animation}`);
  if (!allowedWorldActions.has(action?.worldAction ?? null)) errors.push(`worldAction not allowed: ${action?.worldAction}`);
  if ((action?.speech || '').length > 240) errors.push('speech too long for child-facing turn');
  return { ok: errors.length === 0, errors };
}
