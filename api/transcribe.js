async function readRaw(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  return Buffer.concat(chunks);
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!process.env.OPENAI_API_KEY) return res.status(503).json({ error: 'OPENAI_API_KEY missing' });

  try {
    const audio = await readRaw(req);
    if (!audio.length) return res.status(400).json({ error: 'audio required' });
    if (audio.length > 12 * 1024 * 1024) return res.status(413).json({ error: 'audio too large' });

    const mime = String(req.headers['content-type'] || 'audio/webm').split(';')[0];
    const ext = mime.includes('mp4') ? 'm4a' : mime.includes('ogg') ? 'ogg' : mime.includes('wav') ? 'wav' : 'webm';
    const form = new FormData();
    form.append('file', new Blob([audio], { type: mime }), `muoi.${ext}`);
    form.append('model', process.env.OPENAI_STT_MODEL || 'gpt-4o-mini-transcribe');
    form.append('language', 'vi');
    form.append('prompt', 'Giọng trẻ em Việt Nam. Tên riêng thường gặp: Muối, Bác Gấu, Messi, Ronaldo, T-rex, Coca-Cola, Pepsi.');

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: form
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data.error?.message || 'transcription failed' });
    return res.status(200).json({ text: String(data.text || '').trim() });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'transcription failed' });
  }
};

module.exports.config = { api: { bodyParser: false } };
