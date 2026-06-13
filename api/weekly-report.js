// Vercel cron: lunes 7am Colombia (UTC-5) = 12:00 UTC → "0 12 * * 1"
const SB_URL = process.env.SB_URL || 'https://qvhcousyqtjebiekdiuf.supabase.co';
const SB_SERVICE_KEY = process.env.SB_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const REPORT_EMAIL = 'franciscorovida@gmail.com';

async function sbQuery(table, params = '') {
  const r = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
    },
  });
  if (!r.ok) return [];
  return r.json();
}

async function sbCount(table, params = '') {
  const r = await fetch(`${SB_URL}/rest/v1/${table}?select=id${params}`, {
    method: 'HEAD',
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
      'Prefer': 'count=exact',
    },
  });
  const range = r.headers.get('content-range') || '*/0';
  return parseInt(range.split('/')[1]) || 0;
}

export default async function handler(req, res) {
  // Allow manual POST trigger with auth, plus cron (no auth header)
  const authHeader = req.headers.authorization;
  const cronHeader = req.headers['x-vercel-cron'];
  if (!cronHeader && authHeader !== `Bearer ${SB_SERVICE_KEY}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SB_SERVICE_KEY || !ANTHROPIC_KEY || !RESEND_KEY) {
    return res.status(500).json({ error: 'Missing env vars' });
  }

  const now = new Date();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    // Gather data from last 7 days in parallel
    const [events, errors, feedbacks, newUsers, activeUserRows] = await Promise.all([
      sbQuery('usage_events', `?select=event_type,metadata,created_at&created_at=gte.${sevenDaysAgo}&order=created_at.desc&limit=500`),
      sbQuery('error_log', `?select=error_message,url,created_at&created_at=gte.${sevenDaysAgo}&order=created_at.desc&limit=200`),
      sbQuery('feedback', `?select=rating,comment,created_at&created_at=gte.${sevenDaysAgo}&order=created_at.desc&limit=200`),
      sbCount('profiles', `&created_at=gte.${sevenDaysAgo}`),
      sbQuery('usage_events', `?select=user_id&event_type=eq.session_start&created_at=gte.${sevenDaysAgo}`),
    ]);

    const activeUsers = new Set(activeUserRows.map(r => r.user_id)).size;

    // Aggregate events
    const eventCounts = {};
    events.forEach(e => { eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1; });

    // Aggregate feedback
    const thumbsUp = feedbacks.filter(f => f.rating === 1).length;
    const thumbsDown = feedbacks.filter(f => f.rating === -1).length;
    const comments = feedbacks.filter(f => f.comment).map(f => `"${f.comment}"`).slice(0, 10);

    // Top errors
    const errorCounts = {};
    errors.forEach(e => {
      const key = (e.error_message || '').slice(0, 80);
      errorCounts[key] = (errorCounts[key] || 0) + 1;
    });
    const topErrors = Object.entries(errorCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([msg, n]) => `${n}x: ${msg}`);

    const dataStr = `
DATOS SEMANA (${sevenDaysAgo.slice(0, 10)} → ${now.toISOString().slice(0, 10)}):

USUARIOS:
- Nuevos registros: ${newUsers}
- Usuarios activos (≥1 sesión): ${activeUsers}

EVENTOS DE USO:
${Object.entries(eventCounts).map(([k, v]) => `- ${k}: ${v}`).join('\n') || '- Sin eventos'}

FEEDBACK:
- 👍 Positivo: ${thumbsUp}
- 👎 Negativo: ${thumbsDown}
- Comentarios negativos: ${comments.length ? comments.join(' | ') : 'ninguno'}

ERRORES FRECUENTES:
${topErrors.length ? topErrors.join('\n') : '- Sin errores registrados'}
    `.trim();

    // Ask Claude for analysis
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: `Eres el analista de producto de AiYo, una app de IA compañera en español. Analiza estos datos y genera un reporte ejecutivo en español: métricas clave, problemas detectados, y las 3 mejoras de mayor impacto recomendadas esta semana. Sé directo y concreto. Usa formato de texto plano, sin markdown complejo.\n\n${dataStr}`,
        }],
      }),
    });

    const claudeData = await claudeRes.json();
    const analysis = claudeData.content?.[0]?.text || 'Sin análisis disponible.';

    const emailHtml = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09070F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:640px;margin:0 auto;padding:32px 24px;">
  <div style="text-align:center;margin-bottom:28px;">
    <div style="font-size:1.6rem;font-weight:800;color:#A78BFA;">AiYo — Reporte Semanal</div>
    <div style="font-size:0.85rem;color:#6B6480;margin-top:4px;">${now.toLocaleDateString('es-CO',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</div>
  </div>
  <div style="background:#0E0C1E;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;margin-bottom:20px;">
    <div style="font-size:0.75rem;font-weight:700;color:#7B5EFF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">MÉTRICAS</div>
    <div style="display:flex;gap:16px;flex-wrap:wrap;">
      <div style="background:#1a1a35;border-radius:10px;padding:14px 18px;flex:1;min-width:100px;text-align:center;">
        <div style="font-size:1.8rem;font-weight:800;color:#fff;">${newUsers}</div>
        <div style="font-size:0.75rem;color:#6B6480;margin-top:4px;">Nuevos usuarios</div>
      </div>
      <div style="background:#1a1a35;border-radius:10px;padding:14px 18px;flex:1;min-width:100px;text-align:center;">
        <div style="font-size:1.8rem;font-weight:800;color:#fff;">${activeUsers}</div>
        <div style="font-size:0.75rem;color:#6B6480;margin-top:4px;">Usuarios activos</div>
      </div>
      <div style="background:#1a1a35;border-radius:10px;padding:14px 18px;flex:1;min-width:100px;text-align:center;">
        <div style="font-size:1.8rem;font-weight:800;color:#5DCAA5;">${thumbsUp}</div>
        <div style="font-size:0.75rem;color:#6B6480;margin-top:4px;">👍 Positivo</div>
      </div>
      <div style="background:#1a1a35;border-radius:10px;padding:14px 18px;flex:1;min-width:100px;text-align:center;">
        <div style="font-size:1.8rem;font-weight:800;color:#F87171;">${thumbsDown}</div>
        <div style="font-size:0.75rem;color:#6B6480;margin-top:4px;">👎 Negativo</div>
      </div>
    </div>
  </div>
  <div style="background:#0E0C1E;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:24px;margin-bottom:20px;">
    <div style="font-size:0.75rem;font-weight:700;color:#7B5EFF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">ANÁLISIS IA</div>
    <div style="color:#EDE9F8;line-height:1.7;font-size:0.9rem;white-space:pre-wrap;">${analysis.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</div>
  </div>
  ${topErrors.length ? `
  <div style="background:#0E0C1E;border:1px solid rgba(248,113,113,0.2);border-radius:16px;padding:24px;">
    <div style="font-size:0.75rem;font-weight:700;color:#F87171;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:12px;">ERRORES</div>
    ${topErrors.map(e => `<div style="font-size:0.82rem;color:#9B8FC0;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.04);">${e.replace(/</g,'&lt;')}</div>`).join('')}
  </div>` : ''}
  <div style="text-align:center;color:#6B6480;font-size:0.72rem;margin-top:24px;">AiYo · Reporte automático semanal</div>
</div>
</body>
</html>`;

    // Send via Resend
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`,
      },
      body: JSON.stringify({
        from: 'AiYo Analytics <hola@aiyo.app>',
        to: [REPORT_EMAIL],
        subject: `AiYo — Reporte semanal ${now.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`,
        html: emailHtml,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      console.error('Resend error:', err);
      return res.status(500).json({ error: 'Email failed', details: err });
    }

    return res.json({ status: 'ok', new_users: newUsers, active_users: activeUsers, events_tracked: events.length });
  } catch (e) {
    console.error('weekly-report error:', e);
    return res.status(500).json({ error: e.message });
  }
}
