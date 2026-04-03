-- Script para o Supabase - Braskick
-- Execute este script no Editor SQL do seu projeto Supabase

-- Tabela de Times
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT,
  logo_url TEXT,
  stadium_capacity INTEGER DEFAULT 10000,
  ticket_price DECIMAL DEFAULT 20.00,
  budget DECIMAL DEFAULT 1000000,
  revenue DECIMAL DEFAULT 0,
  competition_id UUID,
  overall INTEGER DEFAULT 70,
  attack INTEGER DEFAULT 70,
  midfield INTEGER DEFAULT 70,
  defense INTEGER DEFAULT 70,
  points INTEGER DEFAULT 0,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  gf INTEGER DEFAULT 0,
  ga INTEGER DEFAULT 0,
  gd INTEGER DEFAULT 0,
  form JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna competition_id se não existir (caso a tabela já exista)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='teams' AND column_name='competition_id') THEN
    ALTER TABLE teams ADD COLUMN competition_id UUID;
  END IF;
END $$;

-- Tabela de Competições
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'LEAGUE', 'GROUPS', 'KNOCKOUT', 'GROUPS_KNOCKOUT'
  region TEXT,
  tier INTEGER,
  logo_url TEXT,
  country_name TEXT,
  country_flag TEXT,
  teams_count INTEGER,
  relegation_count INTEGER,
  promotion_count INTEGER,
  qualification_spots INTEGER,
  players_per_team INTEGER,
  detailed_rules JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Jogadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  overall INTEGER NOT NULL,
  age INTEGER NOT NULL,
  value DECIMAL NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  nationality TEXT,
  photo_url TEXT,
  energy INTEGER DEFAULT 100,
  is_injured BOOLEAN DEFAULT FALSE,
  is_suspended BOOLEAN DEFAULT FALSE,
  is_called_up BOOLEAN DEFAULT FALSE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Saves (Estado do Jogo)
CREATE TABLE IF NOT EXISTS saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Partidas
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID,
  week INTEGER,
  home_team_id UUID,
  away_team_id UUID,
  home_score INTEGER,
  away_score INTEGER,
  played BOOLEAN DEFAULT FALSE,
  events JSONB DEFAULT '[]'::jsonb,
  attendance INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE saves ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso
DROP POLICY IF EXISTS "Acesso público para leitura de times" ON teams;
CREATE POLICY "Acesso público para leitura de times" ON teams FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público para leitura de competições" ON competitions;
CREATE POLICY "Acesso público para leitura de competições" ON competitions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público para leitura de jogadores" ON players;
CREATE POLICY "Acesso público para leitura de jogadores" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Acesso público para leitura de partidas" ON matches;
CREATE POLICY "Acesso público para leitura de partidas" ON matches FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem gerenciar seus próprios saves" ON saves;
CREATE POLICY "Usuários podem gerenciar seus próprios saves" ON saves
  FOR ALL USING (auth.uid() = user_id);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_players_team_id ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_competition_id ON teams(competition_id);
CREATE INDEX IF NOT EXISTS idx_matches_competition_id ON matches(competition_id);
