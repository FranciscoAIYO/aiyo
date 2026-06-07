// TAREA 5: Email de bienvenida con Resend.com
// Variable de entorno: RESEND_API_KEY (https://resend.com → API Keys)
// Llamar desde saveProfile() en index.html tras crear cuenta

const RESEND_KEY = process.env.RESEND_API_KEY;
const APP_URL = 'https://aiyo-pied.vercel.app';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, name = 'amigo', referralCode = '' } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email requerido' });
  if (!RESEND_KEY) return res.status(500).json({ error: 'RESEND_API_KEY no configurada' });

  const refUrl = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09070F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:560px;margin:0 auto;padding:40px 24px;">

  <div style="text-align:center;margin-bottom:32px;">
    <div style="width:80px;height:80px;background:rgba(123,94,255,0.15);border:1px solid rgba(123,94,255,0.3);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
      <div style="display:flex;gap:12px;">
        <div style="width:10px;height:10px;background:#A78BFA;border-radius:50%;"></div>
        <div style="width:10px;height:10px;background:#A78BFA;border-radius:50%;"></div>
      </div>
    </div>
    <div style="font-size:1.8rem;font-weight:800;color:#A78BFA;letter-spacing:-0.02em;">AiYo</div>
    <div style="font-size:0.85rem;color:#9B8FC0;margin-top:4px;">Tu amigo de IA</div>
  </div>

  <div style="background:#0E0C1E;border:1px solid rgba(255,255,255,0.07);border-radius:20px;padding:32px;margin-bottom:24px;">
    <p style="font-size:1.2rem;font-weight:700;color:#EDE9F8;margin:0 0 16px;">Hola, ${escapeHtml(name)} 👋</p>
    <p style="color:#9B8FC0;line-height:1.7;margin:0 0 16px;">
      Ya estás adentro. AiYo está listo para acompañarte — escucharte, ayudarte con tus finanzas, recordar lo que le cuentes.
    </p>
    <p style="color:#9B8FC0;line-height:1.7;margin:0 0 28px;">
      No es un chatbot. Es algo diferente. Cuanto más le cuentes, mejor te conoce.
    </p>
    <div style="text-align:center;">
      <a href="${APP_URL}" style="display:inline-block;background:linear-gradient(135deg,#7B5EFF,#A78BFA);color:#fff;text-decoration:none;border-radius:14px;padding:16px 40px;font-size:1rem;font-weight:700;">
        Hablar con AiYo →
      </a>
    </div>
  </div>

  ${referralCode ? `
  <div style="background:#0E0C1E;border:1px solid rgba(167,139,250,0.2);border-radius:16px;padding:24px;margin-bottom:24px;text-align:center;">
    <div style="font-size:0.85rem;color:#9B8FC0;margin-bottom:8px;">Tu código de referido</div>
    <div style="font-size:1.8rem;font-weight:800;color:#A78BFA;letter-spacing:0.2em;font-family:monospace;">${escapeHtml(referralCode)}</div>
    <div style="font-size:0.8rem;color:#6B6480;margin-top:8px;">Compártelo y gana 7 días de AiYo Pro por cada amigo</div>
    <a href="${refUrl}" style="display:inline-block;margin-top:16px;background:rgba(123,94,255,0.15);color:#A78BFA;text-decoration:none;border-radius:10px;padding:10px 24px;font-size:0.85rem;font-weight:600;border:1px solid rgba(167,139,250,0.2);">
      Copiar link de invitación
    </a>
  </div>
  ` : ''}

  <div style="text-align:center;color:#6B6480;font-size:0.75rem;line-height:1.8;">
    <p>AiYo — El amigo que siempre está ahí</p>
    <p>Si no creaste esta cuenta, ignora este email.</p>
  </div>
</div>
</body>
</html>`;

  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_KEY}`
      },
      body: JSON.stringify({
        from: 'AiYo <hola@aiyo.app>',
        to: [email],
        subject: `${name}, tu AiYo te está esperando 👋`,
        html
      })
    });

    const data = await r.json();
    if (!r.ok) {
      console.error('Resend error:', data);
      return res.status(500).json({ error: 'Error enviando email', details: data });
    }

    return res.json({ success: true, id: data.id });
  } catch (e) {
    console.error('welcome-email error:', e);
    return res.status(500).json({ error: e.message });
  }
}

function escapeHtml(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
