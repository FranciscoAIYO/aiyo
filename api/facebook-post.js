// TAREA 4: Publicador automático de Facebook — lee facebook_strategy.md y publica el post del día
// Variables de entorno: FB_ACCESS_TOKEN, FB_PAGE_ID, SB_SERVICE_KEY, CRON_SECRET
// Cron en vercel.json: 0 13 * * * (8am Colombia = 13:00 UTC)

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const FB_TOKEN = process.env.FB_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FB_PAGE_ID;
const SB_URL = process.env.SB_URL || 'https://qvhcousyqtjebiekdiuf.supabase.co';
const SB_SERVICE_KEY = process.env.SB_SERVICE_KEY;
const CRON_SECRET = process.env.CRON_SECRET;

function parsePosts(content) {
  const posts = [];
  const parts = content.split(/^(?=##\s+.*D[ÍI]A\s+\d+)/m);
  for (const part of parts) {
    const match = part.match(/##\s+.*D[ÍI]A\s+(\d+)\s*[—–-]+\s*(.+)\n/);
    if (!match) continue;
    const day = parseInt(match[1]);
    const title = match[2].trim();
    const body = part
      .slice(match[0].length)
      .replace(/\n---\s*$/, '')
      .replace(/^\s*---\s*\n/, '')
      .trim();
    if (body) posts.push({ day, title, content: body });
  }
  return posts.sort((a, b) => a.day - b.day);
}

async function getNextDay() {
  if (!SB_SERVICE_KEY) return 1;
  try {
    const r = await fetch(
      `${SB_URL}/rest/v1/facebook_posts_log?select=day_number&order=day_number.desc&limit=1`,
      { headers: { 'apikey': SB_SERVICE_KEY, 'Authorization': `Bearer ${SB_SERVICE_KEY}` } }
    );
    if (!r.ok) return 1;
    const data = await r.json();
    return (data[0]?.day_number || 0) + 1;
  } catch {
    return 1;
  }
}

async function trackPublished(day, title, preview) {
  if (!SB_SERVICE_KEY) return;
  try {
    await fetch(`${SB_URL}/rest/v1/facebook_posts_log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_SERVICE_KEY,
        'Authorization': `Bearer ${SB_SERVICE_KEY}`
      },
      body: JSON.stringify({
        day_number: day,
        title,
        content_preview: preview.slice(0, 200),
        published_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('trackPublished error:', e);
  }
}

export default async function handler(req, res) {
  // Verify cron secret
  const secret = (req.headers['authorization'] || '').replace('Bearer ', '') || req.query.secret;
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!FB_TOKEN || !FB_PAGE_ID) {
    return res.status(500).json({ error: 'FB_ACCESS_TOKEN o FB_PAGE_ID no configurados en Vercel' });
  }

  try {
    const strategyPath = join(__dirname, '../facebook_strategy.md');
    const content = readFileSync(strategyPath, 'utf-8');
    const posts = parsePosts(content);

    if (!posts.length) {
      return res.status(500).json({ error: 'No se encontraron posts en facebook_strategy.md' });
    }

    const nextDay = await getNextDay();
    const post = posts.find(p => p.day === nextDay);

    if (!post) {
      return res.json({
        message: `Todos los posts publicados (${posts.length} días completados)`,
        totalPosts: posts.length
      });
    }

    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${FB_PAGE_ID}/feed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: post.content, access_token: FB_TOKEN })
    });

    const fbData = await fbRes.json();
    if (!fbRes.ok || fbData.error) {
      console.error('Facebook API error:', fbData.error);
      return res.status(500).json({ error: 'Error Facebook API', details: fbData.error });
    }

    await trackPublished(post.day, post.title, post.content);

    return res.json({ success: true, day: post.day, title: post.title, postId: fbData.id });
  } catch (e) {
    console.error('facebook-post error:', e);
    return res.status(500).json({ error: e.message });
  }
}
