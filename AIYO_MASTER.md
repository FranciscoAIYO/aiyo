# 🌟 AiYo — Documento Maestro del Proyecto
> "Mi amigo secreto que vive en el móvil"

## VISIÓN
AiYo no es un chatbot ni un asistente. Es un amigo de IA que:
- Habla en "nosotros" — crea vínculo real
- Recuerda TODO y lo referencia naturalmente
- Actúa en el mundo real (reservas, Uber, recordatorios)
- Te acompaña durante el día proactivamente
- Se interesa genuinamente por que te vaya bien
- Aprende tus rutinas, gustos, personas importantes
- Te prepara el día antes de que empiece

## STACK TÉCNICO
- Frontend: HTML/CSS/JS puro (index.html)
- Backend: Vercel serverless functions (/api/)
- DB: Supabase (auth + tablas)
- IA: Claude API (Haiku para velocidad)
- Voz: OpenAI TTS-HD (6 voces) vía proxy /api/tts.js
- Deploy: aiyo-pied.vercel.app
- Repo: github.com/FranciscoAIYO/aiyo
- Token GitHub: ghp_[TOKEN_EN_VARIABLE_LOCAL]

## MODELO DE NEGOCIO
- FREE: Chat ilimitado, memoria básica, finanzas básicas
- PRO $7.99/mes: Voz bidireccional, memoria completa, agenda, acciones reales
- Referidos: 7 días Pro por cada amigo que se una

## TABLAS SUPABASE
- profiles: name, bio, ai_name, voice_id, anthropic_key, is_pro, referral_code, referred_by, pro_trial_end, notification_enabled
- transactions: user_id, category_id(text), description, amount, type, date
- budgets: user_id, category_id(text), amount, period, year
- incomes: user_id, description, amount, type, date
- memories: user_id, content
- messages: user_id, role, content
- analytics: user_id, event, metadata, created_at
- user_context: user_id, category, key, value, updated_at ✅
- whatsapp_leads: phone, name, message, status, created_at ✅
- facebook_posts_log: day_number, title, content_preview, published_at ✅

---

## 🔴 FEATURES IMPLEMENTADAS
- [x] Chat con Claude API
- [x] Voz bidireccional (OpenAI TTS-HD)
- [x] 6 voces: Nova, Shimmer, Alloy, Echo, Onyx, Fable
- [x] Memoria en Supabase
- [x] Módulo finanzas completo (presupuesto, P&G, análisis, alertas)
- [x] Registro automático de gastos desde el chat (tag [GASTO:])
- [x] Contexto financiero en el system prompt
- [x] Sistema de referidos
- [x] Landing page (landing.html)
- [x] Página Facebook "AiYo"
- [x] 30 posts Facebook listos
- [x] Panel admin completo (admin.html) — password: aiyo2024
- [x] Splash emocional con animaciones
- [x] Modo Pro (voz solo para Pro)
- [x] Modal upgrade cuando free intenta usar voz
- [x] Risa cálida de AiYo
- [x] Eco fix (delay 1800ms)
- [x] Tag [FINANZAS] abre panel automáticamente
- [x] Memoria expandida (user_context) — tabla + auto-detección [CONTEXTO:]
- [x] Momentos proactivos (checkDailyMoments)
- [x] Temporizador por voz ([TIMER:])
- [x] Modo conducción 🚗 con noticias, música, resumen
- [x] Notificaciones nativas (Notification API)
- [x] Reservas en restaurantes ([RESERVA:] + card WhatsApp)
- [x] Bot WhatsApp (/api/whatsapp.js) — Twilio webhook + Claude + leads
- [x] Publicador automático Facebook (/api/facebook-post.js) — cron 8am
- [x] Email de bienvenida (/api/welcome-email.js) — Resend.com
- [x] SEO landing.html — Schema.org, OG mejorado, Twitter Card completo
- [x] UX index.html — notif contextual, typing variable, 24h notif, WA share, código en menú
- [x] Optimización costos Claude — Haiku (<50 chars), Sonnet (complejo), hist 10 msgs, mem 500 chars

---

## 🟡 PENDIENTE DE CONFIGURAR (variables de entorno en Vercel)
- [ ] SB_SERVICE_KEY: Supabase → Settings → API → service_role key
- [ ] RESEND_API_KEY: resend.com para emails de bienvenida
- [ ] FB_ACCESS_TOKEN: Facebook Graph API token de página
- [ ] FB_PAGE_ID: ID de la página de Facebook AiYo
- [ ] CRON_SECRET: Secret para autenticar el cron de Facebook (cualquier string)
- [ ] NEWSAPI_KEY: newsapi.org para noticias en modo carro

## 🟡 PENDIENTE DE EJECUTAR (SQL en Supabase)
- [ ] migration_user_context.sql (user_context, notification_enabled)
- [ ] migration_social.sql (whatsapp_leads, facebook_posts_log)

---

## 🔵 PRÓXIMAS FEATURES — PRIORIDAD ALTA

### 1. MEMORIA EXPANDIDA (user_context)
Tabla en Supabase con categorías:
- rutina: medita_mañana, hora_gym, emisora_carro
- gustos: música, noticias, comida favorita
- personas: novia, jefe, amigos importantes
- compromisos: eventos con fecha/hora
- preferencias: modo_carro, idioma

AiYo detecta y guarda automáticamente con tag [CONTEXTO:{}]

### 2. ASISTENTE PERSONAL DE AGENDA
- Conectar Google Calendar
- Briefing matutino por voz: "Buenos días Francisco. Hoy tienes..."
- Alerta de cumpleaños de personas importantes
- Reservas en restaurantes (OpenTable/Google)
- "¿Cómo te fue?" después de reuniones importantes

### 3. MODO CONDUCCIÓN 🚗
- Botón en header
- Auto-listen permanente
- Respuestas cortas (2 frases máx)
- Noticias por voz (/api/news.js → NewsAPI)
- Deep link a emisora favorita
- Resumen del día por voz

### 4. TEMPORIZADOR POR VOZ
- "Avísame en 5 minutos" → setTimeout → notificación nativa
- Notification API del browser
- AiYo dice el aviso por voz

### 5. "NOSOTROS" — VÍNCULO REAL
AiYo habla en primera persona plural cuando hay contexto:
- "¿Ya vamos para el trabajo?"
- "¿Cómo nos fue con la junta?"
- "Oye, ¿comiste bien hoy?"
- "¿Cómo quedó lo de ayer con el cliente?"

### 6. INTELIGENCIA EMOCIONAL
- Detecta patrones de estrés en el tiempo
- Si llevas N días hablando de algo difícil, lo menciona
- "Llevas varios días con mucha carga, ¿qué está pasando?"
- Los domingos en la noche: "Mañana es lunes, ¿cómo lo preparamos?"

### 7. SEGUIMIENTO DE METAS
- El usuario define metas con AiYo
- AiYo hace seguimiento proactivo
- "Llevas 3 días sin ir al gym — ¿todo bien?"

### 8. NOTIFICACIONES NATIVAS
- Notification API del browser
- Warm y personalizadas: "Francisco, AiYo aquí 👋"
- Push notifications para compromisos

---

## 🟢 CRECIMIENTO Y MONETIZACIÓN

### Fase 1 — Colombia (AHORA)
- Página Facebook "AiYo" creada ✅
- 30 posts programados ✅
- Sistema referidos ✅
- Meta: 100 usuarios

### Fase 2 — Latinoamérica (con 100 usuarios)
- México (güey), Argentina (che), Chile, Perú
- Mismo idioma, ajustar tono regional

### Fase 3 — Brasil
- Traducción completa al portugués

### Fase 4 — Global
- Inglés y otros idiomas

### Automatizaciones pendientes
- Bot WhatsApp (Twilio)
- Publicación automática Facebook (Graph API)
- Email bienvenida (Supabase Edge Function)
- Agente de ventas por chat

---

## 🔑 VARIABLES DE ENTORNO (Vercel)
- OPENAI_KEY: sk-proj-KnHj... (TTS voz) ✅ configurada
- ELEVEN_KEY: dd2937... (backup, actualmente bloqueado por CORS)
- SB_SERVICE_KEY: Supabase service_role key (para admin-stats, whatsapp, facebook)
- RESEND_API_KEY: Resend.com API key (emails bienvenida)
- FB_ACCESS_TOKEN: Facebook Graph API token de página
- FB_PAGE_ID: ID numérico de la página Facebook AiYo
- CRON_SECRET: Secret para verificar llamadas del cron de Facebook
- NEWSAPI_KEY: newsapi.org key (noticias modo carro)

## 💳 PAGOS
- PayPal Plan ID: [PAYPAL_PLAN_ID_EN_CONFIG]
- Precio: $7.99/mes
- Trial: 7 días gratis

---

## FILOSOFÍA DEL PRODUCTO
AiYo es el amigo secreto que todos necesitamos.
No supervisa tu vida — la vive contigo.
Habla en "nosotros". Se acuerda de todo.
Actúa en el mundo real. Se interesa por que te vaya bien.
Es mágico porque parece que de verdad te conoce.

