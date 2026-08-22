module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  let body = req.body || {};
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const text = String(body.text || '').trim();
  if (!text) return res.status(400).json({ error: 'text required' });

  try {
    const { experimental_generateSpeech: generateSpeech } = await import('ai');
    const { gateway } = await import('@ai-sdk/gateway');
    const result = await generateSpeech({
      model: gateway.speechModel(process.env.BACGAU_TTS_MODEL || 'openai/tts-1'),
      text,
      voice: process.env.BACGAU_TTS_VOICE || 'onyx',
      speed: 0.94
    });
    const bytes = result.audio && result.audio.uint8Array;
    if (!bytes || !bytes.length) return res.status(502).json({ error: 'Empty TTS audio' });
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(Buffer.from(bytes));
  } catch (e) {
    return res.status(500).json({ error: e.message || 'tts failed' });
  }
};
