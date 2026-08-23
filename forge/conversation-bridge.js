(() => {
  const history = [];
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recorder = null, recognition = null, stream = null, chunks = [], recording = false, playing = null;

  const emit = (name, detail = {}) => window.dispatchEvent(new CustomEvent(`bacgau:${name}`, { detail }));
  const status = (phase, extra = {}) => emit('conversation', { phase, ...extra });
  const lower = s => String(s || '').toLowerCase();

  function classify(text) {
    const s = lower(text);
    if (/buồn|khóc|sợ|đau|không vui|bị mắng|bị bắt nạt/.test(s)) return 'gentle';
    if (/tại sao|vì sao|như thế nào|sao lại|khó quá/.test(s)) return 'thinking';
    if (/khủng long|t-?rex|dinosaur|trò chơi|vui|haha|hihi/.test(s)) return 'playful';
    return 'welcoming';
  }

  function localReply(text) {
    const s = lower(text);
    if (/tự tử|muốn chết|không muốn sống|làm đau mình/.test(s)) return 'Bác ở đây với con. Con tránh xa thứ có thể làm con bị thương và gọi ngay một người lớn con tin đến ở cùng nhé.';
    if (/buồn|khóc|sợ|cô đơn|bị mắng|bắt nạt/.test(s)) return 'Ừ, bác nghe đây. Chuyện gì làm Muối buồn vậy? Con kể từ từ cũng được.';
    if (/tại sao|vì sao|như thế nào|làm sao|khủng long|t-?rex/.test(s)) return 'Hừm… câu này hay đó. Con thử nói cho bác nghe con đang đoán thế nào trước nhé.';
    if (/vui quá|tuyệt|thắng|được điểm|hay quá|wow/.test(s)) return 'Ồ, nghe là bác biết có chuyện hay rồi. Kể bác nghe đoạn vui nhất đi!';
    if (/^(chào|alo|bác gấu ơi|hello|hi)/.test(s)) return 'Bác nghe đây, Muối. Hôm nay con muốn kể chuyện gì trước?';
    return 'Ừ, bác nghe đây. Muối nói tiếp đi, rồi sau đó chuyện gì xảy ra?';
  }

  async function replyTo(text) {
    try {
      const r = await fetch('/api/chat', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text, history }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !String(data.reply || '').trim()) throw new Error(data.error || `chat ${r.status}`);
      return String(data.reply).trim();
    } catch (_) {
      return localReply(text);
    }
  }

  async function browserSpeak(text, emotion) {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) throw new Error('speechSynthesis unavailable');
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN'; utterance.rate = 0.90; utterance.pitch = 0.82;
    const voice = speechSynthesis.getVoices().find(v => /^vi/i.test(v.lang));
    if (voice) utterance.voice = voice;
    emit('speech-start', { reply:text, emotion, audio:null });
    status('speaking', { reply:text, emotion, fallback:'browser-tts' });
    return new Promise((resolve, reject) => {
      utterance.onend = () => { emit('speech-end', { reply:text, emotion }); status('idle'); resolve(); };
      utterance.onerror = e => reject(new Error(e.error || 'speech synthesis failed'));
      speechSynthesis.speak(utterance);
    });
  }

  async function playReply(reply, userText) {
    const emotion = classify(userText + ' ' + reply);
    emit('reply', { text:reply, userText, emotion });
    try {
      const r = await fetch('/api/tts', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text:reply }) });
      if (!r.ok) throw new Error(`tts ${r.status}`);
      const blob = await r.blob();
      if (playing) playing.pause();
      const url = URL.createObjectURL(blob), audio = new Audio(url); playing = audio;
      status('speaking', { reply, emotion });
      audio.onplay = () => emit('speech-start', { reply, emotion, audio });
      audio.ontimeupdate = () => emit('speech-progress', { currentTime:audio.currentTime, duration:audio.duration || 0, emotion });
      await new Promise((resolve, reject) => { audio.onended = resolve; audio.onerror = () => reject(new Error('audio playback failed')); audio.play().catch(reject); });
      emit('speech-end', { reply, emotion }); status('idle'); URL.revokeObjectURL(url); playing = null;
    } catch (_) {
      await browserSpeak(reply, emotion);
    }
  }

  async function processText(text) {
    text = String(text || '').trim();
    if (!text) throw new Error('Bác chưa nghe rõ. Con nói lại nhé.');
    emit('heard', { text }); status('thinking', { text });
    const reply = await replyTo(text);
    history.push({ role:'user', content:text }, { role:'assistant', content:reply });
    while (history.length > 12) history.shift();
    status('synthesizing', { text, reply });
    await playReply(reply, text);
    return { text, reply };
  }

  async function processBlob(blob) {
    status('transcribing');
    const r = await fetch('/api/transcribe', { method:'POST', headers:{'Content-Type':blob.type || 'audio/webm'}, body:blob });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data.error || `STT failed (${r.status})`);
    return processText(data.text);
  }

  async function startRecording() {
    if (recording) return;
    if (SpeechRecognitionCtor) {
      recognition = new SpeechRecognitionCtor();
      recognition.lang = 'vi-VN'; recognition.continuous = false; recognition.interimResults = false; recognition.maxAlternatives = 1;
      let gotResult = false;
      recognition.onstart = () => { recording = true; status('listening'); emit('recording-start', { mode:'browser-speech' }); };
      recognition.onresult = e => { gotResult = true; recording = false; const text = e.results?.[0]?.[0]?.transcript || ''; emit('recording-stop', { mode:'browser-speech' }); processText(text).catch(error => { status('error', { error:error.message }); emit('error', { error }); }); };
      recognition.onerror = e => { recording = false; emit('recording-stop', { mode:'browser-speech' }); if (e.error !== 'aborted') status('error', { error:'Bác chưa nghe rõ. Muối thử lại nhé.' }); };
      recognition.onend = () => { recording = false; if (!gotResult) emit('recording-stop', { mode:'browser-speech' }); };
      recognition.start();
      return;
    }

    stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true, autoGainControl:true } });
    const preferred = ['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t => window.MediaRecorder && MediaRecorder.isTypeSupported(t));
    recorder = preferred ? new MediaRecorder(stream, { mimeType:preferred }) : new MediaRecorder(stream);
    chunks = [];
    recorder.ondataavailable = e => { if (e.data?.size) chunks.push(e.data); };
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type:recorder.mimeType || chunks[0]?.type || 'audio/webm' });
      stream?.getTracks().forEach(t => t.stop()); stream = null; recording = false; emit('recording-stop', { bytes:blob.size, type:blob.type });
      try { if (blob.size > 100) await processBlob(blob); } catch (error) { status('error', { error:error.message }); emit('error', { error }); }
    };
    recorder.start(200); recording = true; status('listening'); emit('recording-start', { mode:'media-recorder' });
  }

  function stopRecording() {
    if (!recording) return;
    if (recognition) { try { recognition.stop(); } catch {} return; }
    if (recorder && recorder.state !== 'inactive') recorder.stop();
  }

  async function askText(text) { return processText(text); }

  window.BacGauConversation = {
    startRecording, stopRecording, askText, processBlob,
    get recording(){ return recording; },
    get history(){ return history.slice(); },
    stopSpeech(){ if (playing) playing.pause(); if (window.speechSynthesis) speechSynthesis.cancel(); }
  };
})();
