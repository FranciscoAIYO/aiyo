-- ============================================================
-- AiYo — Migration: Referrals, Analytics, Pro Trial
-- Ejecutar en Supabase SQL Editor (Settings → SQL Editor)
-- ============================================================

-- 1. Agregar columnas a profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pro_trial_end TIMESTAMPTZ;

-- Índice para búsquedas rápidas por referral_code
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 2. Tabla de analytics
CREATE TABLE IF NOT EXISTS analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_user_id ON analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_event ON analytics(event);

-- Row Level Security para analytics
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can insert their own analytics"
  ON analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can read their own analytics"
  ON analytics FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Política para que los usuarios puedan leer el referral_code de otros
--    (necesario para que el referido pueda encontrar al referidor)
CREATE POLICY IF NOT EXISTS "Anyone can read referral_code from profiles"
  ON profiles FOR SELECT
  USING (true);

-- ============================================================
-- VERIFICACIÓN — ejecutar después para confirmar:
-- SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT COUNT(*) FROM analytics;
-- ============================================================
