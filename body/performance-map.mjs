const EMOTION_PRESETS = {
  warm: {
    eyes: { openness: 0.88, focus: 0.72, blinkRate: 0.42 },
    brows: { innerUp: 0.10, outerUp: 0.08 },
    mouth: { smile: 0.22, jaw: 0.06, muzzleRelax: 0.78 },
    head: { tilt: 0.03, nod: 0.04 },
    body: { chestOpen: 0.42, shouldersDown: 0.55, lean: 0.04 },
    timing: { preSpeechMs: 180, reactionHoldMs: 220 },
    breath: 'calm'
  },
  happy: {
    eyes: { openness: 0.96, focus: 0.84, blinkRate: 0.48 },
    brows: { innerUp: 0.08, outerUp: 0.24 },
    mouth: { smile: 0.62, jaw: 0.18, muzzleRelax: 0.72 },
    head: { tilt: 0.05, nod: 0.13 },
    body: { chestOpen: 0.66, shouldersDown: 0.42, lean: 0.08 },
    timing: { preSpeechMs: 110, reactionHoldMs: 180 },
    breath: 'bright'
  },
  gentle: {
    eyes: { openness: 0.72, focus: 0.92, blinkRate: 0.30 },
    brows: { innerUp: 0.34, outerUp: -0.08 },
    mouth: { smile: 0.02, jaw: 0.03, muzzleRelax: 0.93 },
    head: { tilt: 0.10, nod: 0.02 },
    body: { chestOpen: 0.20, shouldersDown: 0.78, lean: 0.10 },
    timing: { preSpeechMs: 520, reactionHoldMs: 540 },
    breath: 'slow'
  },
  amused: {
    eyes: { openness: 0.86, focus: 0.78, blinkRate: 0.55 },
    brows: { innerUp: 0.04, outerUp: 0.30 },
    mouth: { smile: 0.52, jaw: 0.12, muzzleRelax: 0.68 },
    head: { tilt: 0.13, nod: 0.06 },
    body: { chestOpen: 0.52, shouldersDown: 0.46, lean: 0.16 },
    timing: { preSpeechMs: 150, reactionHoldMs: 250 },
    breath: 'playful'
  }
};

const ANIMATION_PRESETS = {
  listen_soft: {
    pose: 'standing_relaxed',
    gazeMode: 'steady_child',
    hands: 'resting',
    locomotion: 'hold'
  },
  sit_and_listen: {
    pose: 'seated_forward_soft',
    gazeMode: 'steady_child',
    hands: 'open_low',
    locomotion: 'settle_then_hold'
  },
  lean_in_playful: {
    pose: 'standing_lean_in',
    gazeMode: 'curious_child',
    hands: 'small_inviting_gesture',
    locomotion: 'micro_step_in'
  },
  notice_then_resume_task: {
    pose: 'turn_from_task',
    gazeMode: 'notice_then_child',
    hands: 'task_then_open',
    locomotion: 'quarter_turn'
  }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function mapBrainToPerformance(action = {}) {
  const emotion = EMOTION_PRESETS[action.emotion] ? action.emotion : 'warm';
  const animation = ANIMATION_PRESETS[action.animation] ? action.animation : 'listen_soft';
  const performance = {
    emotion,
    animation,
    facial: clone(EMOTION_PRESETS[emotion]),
    staging: clone(ANIMATION_PRESETS[animation]),
    gazeTarget: action.gaze || 'child',
    speech: {
      pace: action.pace || 'natural',
      interruptible: true,
      jawDrive: 'audio_envelope',
      visemeDrive: 'phoneme_or_realtime_viseme',
      smileBias: EMOTION_PRESETS[emotion].mouth.smile
    },
    world: {
      suppressNonessentialEvents: action.worldAction === 'suppress_nonessential_events'
    }
  };

  // Performance principles: eyes react before the head; the head reacts before speech.
  performance.sequence = [
    { atMs: 0, cue: 'eyes_to_target' },
    { atMs: 90, cue: 'head_follow' },
    { atMs: performance.facial.timing.preSpeechMs, cue: 'speech_start' }
  ];

  return performance;
}

export function performanceIsDistinct(a, b) {
  const pa = mapBrainToPerformance(a);
  const pb = mapBrainToPerformance(b);
  return JSON.stringify(pa.facial) !== JSON.stringify(pb.facial) ||
    JSON.stringify(pa.staging) !== JSON.stringify(pb.staging);
}
