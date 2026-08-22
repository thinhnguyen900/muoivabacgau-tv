async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const audio = await readRaw(req);
    if (!audio.length) return res.status(400).json({ error: 'audio required' });
    if (audio.length > 12 * 1024 * 1024) return res.status(413).json({ error: 'audio too large' });

    const { experimental_transcribe: transcribe } = await import('ai');
    const { gateway } = await import('@ai-sdk/gateway');
    const result = await transcribe({
      model: gateway.transcriptionModel(process.env.BACGAU_STT_MODEL || 'openai/gpt-4o-mini-transcribe'),
      audio: new Uint8Array(audio),
      providerOptions: {
        openai: {
          language: 'vi',
          prompt: 'Giọng trẻ em Việt Nam. Tên riêng thường gặp: Muối, Bác Gấu, Messi, Ronaldo, T-rex, Coca-Cola, Pepsi.'
        }
      }
    });
    return res.status(200).json({ text: String(result.text || '').trim(), provider: 'vercel-ai-gateway-oidc' });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'transcription failed' });
  }
};

module.exports.config = { api: { bodyParser: false } };
