export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voiceId } = req.body;
  if (!text || !voiceId) return res.status(400).json({ error: 'Missing text or voiceId' });

  const ELEVEN_KEY = process.env.ELEVEN_KEY;

  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVEN_KEY
      },
      body: JSON.stringify({
        text: text.slice(0, 500),
        model_id: 'eleven_turbo_v2_5',
        voice_settings: { stability: 0.5, similarity_boost: 0.8 }
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return res.status(r.status).json({ error: err });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Access-Control-Allow-Origin', '*');
    const buffer = await r.arrayBuffer();
    res.send(Buffer.from(buffer));

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
