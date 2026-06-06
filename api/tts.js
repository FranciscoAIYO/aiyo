export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text, voiceId } = req.body;
  if (!text) return res.status(400).json({ error: 'Missing text' });

  // Mapear voiceId a voz de OpenAI
  const voiceMap = {
    'nova':    'nova',     // femenina cálida
    'shimmer': 'shimmer',  // femenina suave
    'alloy':   'alloy',    // neutral
    'echo':    'echo',     // masculina clara
    'onyx':    'onyx',     // masculina profunda
    'fable':   'fable',    // masculina expresiva
  };

  // Compatibilidad con voice IDs anteriores de ElevenLabs
  let voice = voiceMap[voiceId] || 'nova';
  if (voiceId === '3ttovAt5bt3Kk38UGIob') voice = 'nova';    // femenina
  if (voiceId === '9ZVfdvBemUaGEWZgCiv0') voice = 'onyx';    // masculina

  const OPENAI_KEY = process.env.OPENAI_KEY;

  try {
    const r = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_KEY}`
      },
      body: JSON.stringify({
        model: 'tts-1-hd',
        input: text.slice(0, 500),
        voice: voice,
        response_format: 'mp3'
      })
    });

    if (!r.ok) {
      const err = await r.text();
      console.error('OpenAI TTS error:', r.status, err);
      return res.status(r.status).json({ error: err });
    }

    const buffer = await r.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'no-cache');
    res.send(Buffer.from(buffer));

  } catch (e) {
    console.error('TTS proxy error:', e);
    res.status(500).json({ error: e.message });
  }
}
