-- TAREAS 3 y 4: Tablas para WhatsApp leads y Facebook posts
-- Ejecutar en Supabase → SQL Editor

-- =============================================
-- Tabla: whatsapp_leads
-- =============================================
CREATE TABLE IF NOT EXISTS whatsapp_leads (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  phone text NOT NULL,
  name text DEFAULT 'Usuario',
  message text,
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'registered', 'converted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(phone)
);

-- Sin RLS para esta tabla (solo accesible con service key)
ALTER TABLE whatsapp_leads DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Tabla: facebook_posts_log
-- =============================================
CREATE TABLE IF NOT EXISTS facebook_posts_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  day_number integer NOT NULL UNIQUE,
  title text,
  content_preview text,
  published_at timestamptz DEFAULT now()
);

ALTER TABLE facebook_posts_log DISABLE ROW LEVEL SECURITY;

-- =============================================
-- Función: get_aiyo_stats (opcional, para RPC)
-- Permite llamar desde anon key sin exponer datos
-- =============================================
CREATE OR REPLACE FUNCTION get_aiyo_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'pro_users', (SELECT COUNT(*) FROM profiles WHERE is_pro = true),
    'new_this_week', (SELECT COUNT(*) FROM profiles WHERE created_at > now() - interval '7 days'),
    'total_messages', (SELECT COUNT(*) FROM messages),
    'wa_leads', (SELECT COUNT(*) FROM whatsapp_leads),
    'fb_posts', (SELECT COUNT(*) FROM facebook_posts_log)
  ) INTO result;
  RETURN result;
END;
$$;
