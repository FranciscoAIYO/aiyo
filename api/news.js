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
    // Primero intentar Colombia en español
    const url = `https://newsapi.org/v2/top-headlines?country=co&pageSize=5&apiKey=${NEWS_KEY}`;
    const r = await fetch(url, { headers: { 'User-Agent': 'AiYo/1.0' } });
    const d = await r.json();

    if (r.ok && d.status === 'ok' && d.articles?.length) {
      return res.json({ articles: d.articles.slice(0, 5) });
    }

    // Fallback: noticias en español por categoría
    const url2 = `https://newsapi.org/v2/top-headlines?language=es&category=${category}&pageSize=5&apiKey=${NEWS_KEY}`;
    const r2 = await fetch(url2, { headers: { 'User-Agent': 'AiYo/1.0' } });
    const d2 = await r2.json();

    return res.json({ articles: (d2.articles || []).slice(0, 5) });
  } catch (e) {
    console.error('news proxy error:', e);
    return res.status(500).json({ error: e.message, articles: [] });
  }
}
