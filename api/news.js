// TAREA 4: Proxy de noticias para Modo Carro
// Requiere variable de entorno: NEWSAPI_KEY (registrarse gratis en newsapi.org)

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
    // Sin key: retornar noticias de ejemplo para no bloquear el modo carro
    return res.json({
      articles: [
        { title: 'Configura tu clave de NewsAPI para ver noticias reales', description: 'Visita newsapi.org para obtener una clave gratuita' }
      ],
      note: 'NEWSAPI_KEY no configurada'
    });
  }

  const rawCat = (req.query.categories || 'general').split('+')[0].toLowerCase().trim();
  const category = CAT_MAP[rawCat] || 'general';

  try {
    // Intento 1: Colombia
    const url1 = `https://newsapi.org/v2/top-headlines?country=co&pageSize=5&apiKey=${NEWS_KEY}`;
    const r1 = await fetch(url1);
    if (r1.ok) {
      const d1 = await r1.json();
      if (d1.status === 'ok' && d1.articles?.length) {
        return res.json({ articles: d1.articles.slice(0, 5) });
      }
    }

    // Intento 2: español por categoría
    const url2 = `https://newsapi.org/v2/top-headlines?language=es&category=${category}&pageSize=5&apiKey=${NEWS_KEY}`;
    const r2 = await fetch(url2);
    if (r2.ok) {
      const d2 = await r2.json();
      if (d2.status === 'ok' && d2.articles?.length) {
        return res.json({ articles: d2.articles.slice(0, 5) });
      }
    }

    // Intento 3: español sin categoría
    const url3 = `https://newsapi.org/v2/top-headlines?language=es&pageSize=5&apiKey=${NEWS_KEY}`;
    const r3 = await fetch(url3);
    if (r3.ok) {
      const d3 = await r3.json();
      return res.json({ articles: (d3.articles || []).slice(0, 5) });
    }

    return res.json({ articles: [] });
  } catch (e) {
    console.error('news proxy error:', e);
    return res.status(500).json({ error: e.message, articles: [] });
  }
}
