// Proxy de noticias — soporta búsqueda por tema (?q=) y top-headlines (?categories=)
const CAT_MAP = {
  'deportes': 'sports', 'tecnologia': 'technology', 'tecnología': 'technology',
  'negocios': 'business', 'salud': 'health', 'ciencia': 'science',
  'entretenimiento': 'entertainment', 'sports': 'sports', 'technology': 'technology',
  'business': 'business', 'health': 'health', 'science': 'science',
  'entertainment': 'entertainment', 'general': 'general'
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const NEWS_KEY = process.env.NEWSAPI_KEY;
  if (!NEWS_KEY) {
    return res.json({ articles: [], error: 'NEWSAPI_KEY not configured' });
  }

  const query = (req.query.q || '').trim();
  const rawCat = (req.query.categories || 'general').split('+')[0].toLowerCase().trim();
  const category = CAT_MAP[rawCat] || 'general';

  try {
    // ── Mode 1: specific topic search via /everything ──
    if (query) {
      // Try Spanish first
      const url1 = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=es&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_KEY}`;
      const r1 = await fetch(url1);
      if (r1.ok) {
        const d1 = await r1.json();
        if (d1.status === 'ok' && d1.articles?.length) {
          return res.json({ articles: filterArticles(d1.articles, 5), topic: query });
        }
      }

      // Fallback: no language filter (catches international stories)
      const url2 = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_KEY}`;
      const r2 = await fetch(url2);
      if (r2.ok) {
        const d2 = await r2.json();
        if (d2.status === 'ok' && d2.articles?.length) {
          return res.json({ articles: filterArticles(d2.articles, 5), topic: query });
        }
      }

      return res.json({ articles: [], topic: query });
    }

    // ── Mode 2: general / top-headlines ──
    const url1 = `https://newsapi.org/v2/top-headlines?country=co&pageSize=5&apiKey=${NEWS_KEY}`;
    const r1 = await fetch(url1);
    if (r1.ok) {
      const d1 = await r1.json();
      if (d1.status === 'ok' && d1.articles?.length) {
        return res.json({ articles: filterArticles(d1.articles, 5) });
      }
    }

    const url2 = `https://newsapi.org/v2/top-headlines?language=es&category=${category}&pageSize=5&apiKey=${NEWS_KEY}`;
    const r2 = await fetch(url2);
    if (r2.ok) {
      const d2 = await r2.json();
      if (d2.status === 'ok' && d2.articles?.length) {
        return res.json({ articles: filterArticles(d2.articles, 5) });
      }
    }

    const url3 = `https://newsapi.org/v2/top-headlines?language=es&pageSize=5&apiKey=${NEWS_KEY}`;
    const r3 = await fetch(url3);
    if (r3.ok) {
      const d3 = await r3.json();
      return res.json({ articles: filterArticles(d3.articles || [], 5) });
    }

    return res.json({ articles: [] });
  } catch (e) {
    console.error('news proxy error:', e);
    return res.status(500).json({ error: e.message, articles: [] });
  }
}

function filterArticles(articles, limit) {
  return articles
    .filter(a => a.title && a.title !== '[Removed]' && a.url)
    .map(a => ({
      title: a.title,
      description: a.description || '',
      url: a.url,
      publishedAt: a.publishedAt,
      source: { name: a.source?.name || '' },
    }))
    .slice(0, limit);
}
