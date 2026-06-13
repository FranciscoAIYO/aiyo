const SB_URL = process.env.SB_URL || 'https://qvhcousyqtjebiekdiuf.supabase.co';
const SB_SERVICE_KEY = process.env.SB_SERVICE_KEY;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const checks = {};
  const errors = [];

  // Check ANTHROPIC_KEY
  checks.anthropic_key = !!process.env.ANTHROPIC_KEY;
  if (!checks.anthropic_key) errors.push('ANTHROPIC_KEY not set');

  // Check OPENAI_KEY
  checks.openai_key = !!process.env.OPENAI_KEY;
  if (!checks.openai_key) errors.push('OPENAI_KEY not set');

  // Check Supabase connectivity
  try {
    if (!SB_SERVICE_KEY) throw new Error('SB_SERVICE_KEY not set');
    const r = await fetch(`${SB_URL}/rest/v1/profiles?select=id&limit=1`, {
      headers: {
        'apikey': SB_SERVICE_KEY,
        'Authorization': `Bearer ${SB_SERVICE_KEY}`,
      },
    });
    checks.supabase = r.ok;
    if (!r.ok) errors.push(`Supabase HTTP ${r.status}`);
  } catch (e) {
    checks.supabase = false;
    errors.push(`Supabase: ${e.message}`);
  }

  const ok = errors.length === 0;
  return res.status(ok ? 200 : 503).json({
    status: ok ? 'ok' : 'error',
    checks,
    ...(errors.length ? { details: errors } : {}),
    ts: new Date().toISOString(),
  });
}
