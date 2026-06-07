// TAREA 2: API de estadísticas para el panel admin
// Requiere: SB_SERVICE_KEY en Vercel (Supabase → Settings → API → service_role)
// Acceso: GET /api/admin-stats?password=aiyo2024

const SB_URL = process.env.SB_URL || 'https://qvhcousyqtjebiekdiuf.supabase.co';
const SB_SERVICE_KEY = process.env.SB_SERVICE_KEY;

async function sbCount(table, queryParam = '') {
  const url = `${SB_URL}/rest/v1/${table}?select=*${queryParam}`;
  const r = await fetch(url, {
    method: 'HEAD',
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`,
      'Prefer': 'count=exact'
    }
  });
  const range = r.headers.get('content-range') || '*/0';
  return parseInt(range.split('/')[1]) || 0;
}

async function sbQuery(table, params = '') {
  const r = await fetch(`${SB_URL}/rest/v1/${table}${params}`, {
    headers: {
      'apikey': SB_SERVICE_KEY,
      'Authorization': `Bearer ${SB_SERVICE_KEY}`
    }
  });
  if (!r.ok) return [];
  return r.json();
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { password } = req.query;
  if (password !== 'aiyo2024') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!SB_SERVICE_KEY) {
    return res.status(500).json({
      error: 'SB_SERVICE_KEY no configurada. Agregar en Vercel → Settings → Environment Variables'
    });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const [totalUsers, proUsers, newUsers, totalMsgs, waLeads, fbPosts] = await Promise.all([
      sbCount('profiles'),
      sbCount('profiles', '&is_pro=eq.true'),
      sbCount('profiles', `&created_at=gte.${sevenDaysAgo}`),
      sbCount('messages'),
      sbCount('whatsapp_leads').catch(() => 0),
      sbCount('facebook_posts_log').catch(() => 0)
    ]);

    // Registros por día (últimos 7 días)
    const recentProfiles = await sbQuery(
      'profiles',
      `?select=created_at&created_at=gte.${sevenDaysAgo}&order=created_at.asc`
    );
    const byDay = {};
    for (const p of (recentProfiles || [])) {
      const day = (p.created_at || '').slice(0, 10);
      if (day) byDay[day] = (byDay[day] || 0) + 1;
    }
    const registrations_by_day = Object.entries(byDay).map(([date, count]) => ({ date, count }));

    const [fb_posts_log, wa_leads_list] = await Promise.all([
      sbQuery('facebook_posts_log', '?select=*&order=day_number.desc&limit=30').catch(() => []),
      sbQuery('whatsapp_leads', '?select=*&order=created_at.desc&limit=20').catch(() => [])
    ]);

    return res.json({
      total_users: totalUsers,
      pro_users: proUsers,
      new_this_week: newUsers,
      total_messages: totalMsgs,
      wa_leads: waLeads,
      fb_posts: fbPosts,
      registrations_by_day,
      fb_posts_log: Array.isArray(fb_posts_log) ? fb_posts_log : [],
      wa_leads_list: Array.isArray(wa_leads_list) ? wa_leads_list : []
    });
  } catch (e) {
    console.error('admin-stats error:', e);
    return res.status(500).json({ error: e.message });
  }
}
