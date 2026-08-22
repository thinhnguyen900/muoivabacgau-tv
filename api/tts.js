module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY missing' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = String(body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text required' });

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: process.env.OPENAI_TTS_MODEL || 'gpt-4o-mini-tts',
        voice: process.env.OPENAI_TTS_VOICE || 'cedar',
        input: text,
        response_format: 'mp3',
        instructions: 'Nói tiếng Việt tự nhiên, giọng nam ấm áp như một người bác thân thiện nói chuyện với trẻ em. Phát âm rõ dấu tiếng Việt, nhịp vừa phải, không đọc kiểu tiếng Anh.'
      })
    });
    if (!r.ok) {
      let msg = 'tts failed';
      try { const data = await r.json(); msg = data.error?.message || msg; } catch {}
      return res.status(r.status).json({ error: msg });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (e) {
    return res.status(500).json({ error: e.message || 'tts failed' });
  }
};
