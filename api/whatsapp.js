// TAREA 3: Bot de WhatsApp vía Twilio — ventas y soporte de AiYo
// Variables de entorno: ANTHROPIC_KEY, SB_URL, SB_SERVICE_KEY
// Configurar en Twilio: webhook POST → https://aiyo-pied.vercel.app/api/whatsapp

const SB_URL = process.env.SB_URL || 'https://qvhcousyqtjebiekdiuf.supabase.co';
const SB_SERVICE_KEY = process.env.SB_SERVICE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_KEY;

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'text/xml');
  if (req.method === 'GET') return res.status(200).send('<Response></Response>');
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const phone = (body.From || '').replace('whatsapp:', '');
  const msg = (body.Body || '').trim();
  const name = body.ProfileName || 'amigo';

  if (!msg || !phone) return res.status(200).send('<Response></Response>');

  await saveLead(phone, name, msg);
  const reply = await generateReply(msg, name);

  return res.status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message><Body>${escapeXml(reply)}</Body></Message></Response>`
  );
}

async function generateReply(msg, name) {
  const t = msg.toLowerCase();

  if (/precio|costo|vale|cuánto|cuanto|tarifa|plan/i.test(t)) {
    return `Hola! 💜 AiYo tiene dos planes:\n\n✅ *GRATIS* — Chat ilimitado, finanzas básicas, memoria\n⭐ *PRO $7.99/mes* — Voz bidireccional, memoria completa, modo carro, agenda\n\nTienes 7 días de Pro gratis cuando te registras 👉 https://aiyo-pied.vercel.app`;
  }

  if (/quiero probar|probar(lo)?|registrar(me)?|como entro|cómo entro|crear cuenta/i.test(t)) {
    return `¡Dale! 🚀 Crea tu cuenta aquí (es gratis):\n👉 https://aiyo-pied.vercel.app\n\nEn 30 segundos tienes a AiYo contigo. Te va a sorprender lo humano que es 💜`;
  }

  if (/qué es|que es|qué hace|para qué|para que|como funciona|cómo funciona/i.test(t)) {
    return `AiYo es como tener un amigo de IA que:\n\n🧠 Se acuerda de todo lo que le cuentas\n💰 Te ayuda con tus finanzas\n🎙️ Habla y te escucha (voz real)\n🚗 Modo carro para cuando vas manejando\n\nNo es un robot. Es un parcero que aprende de vos.\n\n👉 Pruébalo gratis: https://aiyo-pied.vercel.app`;
  }

  if (/hola|buenas|hey|saludos|buenos días|buenas tardes/i.test(t)) {
    return `¡Hola ${name}! 👋 Soy el asistente de *AiYo*.\n\nAiYo es tu amigo de IA más humano — te escucha, recuerda todo y te ayuda en el día a día.\n\n¿Quieres saber más o probarlo gratis? 💜`;
  }

  if (ANTHROPIC_KEY) {
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 200,
          system: `Eres el agente de ventas de AiYo por WhatsApp. AiYo es una app de IA que actúa como amigo personal en Colombia.
Habla en español colombiano casual (parcero, bacano, qué más, ey).
Respuestas MUY cortas (máx 3 frases). Siempre termina con: https://aiyo-pied.vercel.app
Precio: GRATIS básico, PRO $7.99/mes. 7 días gratis de Pro al registrarse.
Sé cálido, genuino. No seas robótico.`,
          messages: [{ role: 'user', content: msg }]
        })
      });
      if (r.ok) {
        const d = await r.json();
        const text = d.content?.[0]?.text;
        if (text) return text;
      }
    } catch (e) {
      console.error('Claude WA error:', e);
    }
  }

  return `¡Hola ${name}! 👋 AiYo es tu amigo de IA más humano — recuerda todo, te ayuda con finanzas y habla de verdad.\n\n👉 Pruébalo gratis: https://aiyo-pied.vercel.app`;
}

async function saveLead(phone, name, message) {
  if (!SB_SERVICE_KEY) return;
  try {
    await fetch(`${SB_URL}/rest/v1/whatsapp_leads`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SB_SERVICE_KEY,
        'Authorization': `Bearer ${SB_SERVICE_KEY}`,
        'Prefer': 'resolution=ignore-duplicates'
      },
      body: JSON.stringify({
        phone, name, message,
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    });
  } catch (e) {
    console.error('saveLead error:', e);
  }
}

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
