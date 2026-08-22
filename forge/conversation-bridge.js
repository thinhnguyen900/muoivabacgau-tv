(() => {
  const history = [];
  let recorder = null;
  let stream = null;
  let chunks = [];
  let recording = false;
  let playing = null;

  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(`bacgau:${name}`, { detail }));
  const status = (phase, extra = {}) => emit('conversation', { phase, ...extra });

  async function apiJson(url, options) {
    const r = await fetch(url, options);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `${url} failed (${r.status})`);
    return data;
  }

  async function transcribe(blob) {
    const r = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': blob.type || 'audio/webm' },
      body: blob
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `STT failed (${r.status})`);
    return String(data.text || '').trim();
  }

  async function replyTo(text) {
    const data = await apiJson('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, history })
    });
    return String(data.reply || '').trim();
  }

  async function synthesize(text) {
    const r = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      throw new Error(data.error || `TTS failed (${r.status})`);
    }
    return await r.blob();
  }

  function classify(text) {
    const s = String(text || '').toLowerCase();
    if (/buồn|khóc|sợ|đau|không vui|bị mắng|bị bắt nạt/.test(s)) return 'gentle';
    if (/tại sao|vì sao|như thế nào|sao lại|khó quá/.test(s)) return 'thinking';
    if (/khủng long|t-?rex|dinosaur|trò chơi|vui|haha|hihi/.test(s)) return 'playful';
    return 'welcoming';
  }

  async function play(blob, reply, userText) {
    if (playing) {
      playing.pause();
      URL.revokeObjectURL(playing.src);
    }
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    playing = audio;
    const emotion = classify(userText + ' ' + reply);
    emit('reply', { text: reply, userText, emotion, audio });
    status('speaking', { reply, emotion });
    audio.onplay = () => emit('speech-start', { reply, emotion, audio });
    audio.ontimeupdate = () => emit('speech-progress', { currentTime: audio.currentTime, duration: audio.duration || 0, emotion });
    audio.onended = () => {
      emit('speech-end', { reply, emotion });
      status('idle');
      URL.revokeObjectURL(url);
      playing = null;
    };
    await audio.play();
  }

  async function processBlob(blob) {
    try {
      status('transcribing');
      const text = await transcribe(blob);
      if (!text) throw new Error('Bác chưa nghe rõ. Con nói lại nhé.');
      emit('heard', { text });
      status('thinking', { text });
      const reply = await replyTo(text);
      history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
      while (history.length > 12) history.shift();
      status('synthesizing', { text, reply });
      const speech = await synthesize(reply);
      await play(speech, reply, text);
      return { text, reply };
    } catch (error) {
      status('error', { error: error.message || String(error) });
      emit('error', { error });
      throw error;
    }
  }

  async function startRecording() {
    if (recording) return;
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
    const preferred = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    recorder = preferred ? new MediaRecorder(stream, { mimeType: preferred }) : new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: recorder.mimeType || chunks[0]?.type || 'audio/webm' });
      stream?.getTracks().forEach(t => t.stop());
      stream = null;
      recording = false;
      emit('recording-stop', { bytes: blob.size, type: blob.type });
      if (blob.size > 100) await processBlob(blob);
    };
    recorder.start(200);
    recording = true;
    status('listening');
    emit('recording-start');
  }

  function stopRecording() {
    if (!recording || !recorder || recorder.state === 'inactive') return;
    recorder.stop();
  }

  async function askText(text) {
    text = String(text || '').trim();
    if (!text) return;
    emit('heard', { text });
    status('thinking', { text });
    const reply = await replyTo(text);
    history.push({ role: 'user', content: text }, { role: 'assistant', content: reply });
    while (history.length > 12) history.shift();
    status('synthesizing', { text, reply });
    const speech = await synthesize(reply);
    await play(speech, reply, text);
  }

  window.BacGauConversation = {
    startRecording,
    stopRecording,
    askText,
    processBlob,
    get recording() { return recording; },
    get history() { return history.slice(); },
    stopSpeech() { if (playing) playing.pause(); }
  };
})();
