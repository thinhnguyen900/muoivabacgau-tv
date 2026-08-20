export const DEFAULT_VOICE_RUNTIME = Object.freeze({
  input: {
    mode: 'streaming_audio',
    bargeIn: true,
    vad: 'server_or_local',
    wakePhrase: 'bác gấu ơi'
  },
  output: {
    mode: 'streaming_audio',
    interruptible: true,
    audioEnvelope: true,
    visemes: 'preferred',
    fallbackLipSync: 'audio_envelope'
  },
  latencyBudgetMs: {
    acknowledgement: 350,
    firstMeaningfulAudio: 900
  }
});

export function createVoiceTurn(performance = {}, options = {}) {
  const preSpeechMs = performance?.facial?.timing?.preSpeechMs ?? 180;
  const speech = performance?.speech ?? {};

  return {
    listen: {
      bargeIn: options.bargeIn ?? DEFAULT_VOICE_RUNTIME.input.bargeIn,
      vad: options.vad ?? DEFAULT_VOICE_RUNTIME.input.vad
    },
    speak: {
      text: options.text ?? '',
      pace: speech.pace ?? 'natural',
      interruptible: speech.interruptible !== false,
      startAfterMs: preSpeechMs,
      jawDrive: speech.jawDrive ?? 'audio_envelope',
      visemeDrive: speech.visemeDrive ?? 'phoneme_or_realtime_viseme',
      fallbackLipSync: DEFAULT_VOICE_RUNTIME.output.fallbackLipSync
    },
    latencyBudgetMs: { ...DEFAULT_VOICE_RUNTIME.latencyBudgetMs },
    telemetry: {
      captureInterruptions: true,
      captureFirstAudioLatency: true,
      captureTurnDuration: true,
      storeRawChildAudioByDefault: false
    }
  };
}

export function validateVoiceTurn(turn = {}) {
  const errors = [];
  if (turn?.speak?.interruptible !== true) errors.push('child-facing speech must be interruptible');
  if (!['audio_envelope', 'blendshape_envelope'].includes(turn?.speak?.jawDrive)) errors.push('jawDrive must be audio driven');
  if (!turn?.speak?.visemeDrive) errors.push('visemeDrive required');
  if ((turn?.speak?.startAfterMs ?? 0) < 0) errors.push('startAfterMs cannot be negative');
  if (turn?.telemetry?.storeRawChildAudioByDefault !== false) errors.push('raw child audio must not be stored by default');
  return { ok: errors.length === 0, errors };
}
