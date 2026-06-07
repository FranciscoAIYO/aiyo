-- TAREA 1: Tabla user_context para memoria expandida de AiYo
-- Ejecutar en Supabase SQL Editor

CREATE TABLE IF NOT EXISTS user_context (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL CHECK (category IN ('rutina','gustos','personas','compromisos','preferencias')),
  key text NOT NULL,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, category, key)
);

-- Row Level Security
ALTER TABLE user_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own context" ON user_context
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Índice para consultas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_user_context_user_id ON user_context(user_id);
CREATE INDEX IF NOT EXISTS idx_user_context_category ON user_context(user_id, category);

-- También agregar notification_enabled al perfil si no existe
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notification_enabled boolean DEFAULT false;
