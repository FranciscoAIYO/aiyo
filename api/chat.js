export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
  if (!ANTHROPIC_KEY) return res.status(500).json({ error: 'ANTHROPIC_KEY not configured' });

  const { model, max_tokens, system, messages } = req.body;
  if (!messages) return res.status(400).json({ error: 'Missing messages' });

  try {
    const body = {
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: max_tokens || 1000,
      messages,
    };
    if (system) body.system = system;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await r.json();
    return res.status(r.status).json(data);
  } catch (e) {
    console.error('chat proxy error:', e);
    return res.status(500).json({ error: e.message });
  }
}
