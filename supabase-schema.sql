-- Tabela de Competições
CREATE TABLE IF NOT EXISTS competitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  region TEXT,
  tier INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Times
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#000000',
  overall INTEGER DEFAULT 50,
  attack INTEGER DEFAULT 50,
  midfield INTEGER DEFAULT 50,
  defense INTEGER DEFAULT 50,
  budget BIGINT DEFAULT 0,
  
  -- Estatísticas da Tabela de Classificação
  points INTEGER DEFAULT 0,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  gf INTEGER DEFAULT 0, -- Gols Favor
  ga INTEGER DEFAULT 0, -- Gols Contra
  gd INTEGER DEFAULT 0, -- Saldo de Gols
  form JSONB DEFAULT '[]'::jsonb, -- Últimos 5 resultados ['W', 'D', 'L']
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Jogadores
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  overall INTEGER NOT NULL,
  age INTEGER NOT NULL,
  value BIGINT DEFAULT 0,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabela de Partidas
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competition_id UUID REFERENCES competitions(id),
  week INTEGER NOT NULL,
  home_team_id UUID REFERENCES teams(id),
  away_team_id UUID REFERENCES teams(id),
  home_score INTEGER,
  away_score INTEGER,
  played BOOLEAN DEFAULT FALSE,
  events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Função para atualizar a classificação automaticamente
CREATE OR REPLACE FUNCTION update_league_standings()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas processa se a partida foi marcada como jogada e os scores foram preenchidos
  IF (NEW.played = TRUE AND OLD.played = FALSE) OR (NEW.played = TRUE AND (NEW.home_score != OLD.home_score OR NEW.away_score != OLD.away_score)) THEN
    
    -- Se for uma atualização de uma partida já jogada, precisamos primeiro reverter os stats antigos
    IF OLD.played = TRUE THEN
      -- Reverter Home Team
      UPDATE teams SET
        played = played - 1,
        won = won - (CASE WHEN OLD.home_score > OLD.away_score THEN 1 ELSE 0 END),
        drawn = drawn - (CASE WHEN OLD.home_score = OLD.away_score THEN 1 ELSE 0 END),
        lost = lost - (CASE WHEN OLD.home_score < OLD.away_score THEN 1 ELSE 0 END),
        points = points - (CASE WHEN OLD.home_score > OLD.away_score THEN 3 WHEN OLD.home_score = OLD.away_score THEN 1 ELSE 0 END),
        gf = gf - OLD.home_score,
        ga = ga - OLD.away_score,
        gd = gd - (OLD.home_score - OLD.away_score)
      WHERE id = OLD.home_team_id;

      -- Reverter Away Team
      UPDATE teams SET
        played = played - 1,
        won = won - (CASE WHEN OLD.away_score > OLD.home_score THEN 1 ELSE 0 END),
        drawn = drawn - (CASE WHEN OLD.away_score = OLD.home_score THEN 1 ELSE 0 END),
        lost = lost - (CASE WHEN OLD.away_score < OLD.home_score THEN 1 ELSE 0 END),
        points = points - (CASE WHEN OLD.away_score > OLD.home_score THEN 3 WHEN OLD.away_score = OLD.home_score THEN 1 ELSE 0 END),
        gf = gf - OLD.away_score,
        ga = ga - OLD.home_score,
        gd = gd - (OLD.away_score - OLD.home_score)
      WHERE id = OLD.away_team_id;
    END IF;

    -- Aplicar novos stats para Home Team
    UPDATE teams SET
      played = played + 1,
      won = won + (CASE WHEN NEW.home_score > NEW.away_score THEN 1 ELSE 0 END),
      drawn = drawn + (CASE WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END),
      lost = lost + (CASE WHEN NEW.home_score < NEW.away_score THEN 1 ELSE 0 END),
      points = points + (CASE WHEN NEW.home_score > NEW.away_score THEN 3 WHEN NEW.home_score = NEW.away_score THEN 1 ELSE 0 END),
      gf = gf + NEW.home_score,
      ga = ga + NEW.away_score,
      gd = gd + (NEW.home_score - NEW.away_score),
      form = (
        SELECT jsonb_agg(res) FROM (
          SELECT res FROM jsonb_array_elements_text(form || jsonb_build_array(CASE WHEN NEW.home_score > NEW.away_score THEN 'W' WHEN NEW.home_score = NEW.away_score THEN 'D' ELSE 'L' END)) res
          OFFSET GREATEST(0, jsonb_array_length(form || jsonb_build_array(CASE WHEN NEW.home_score > NEW.away_score THEN 'W' WHEN NEW.home_score = NEW.away_score THEN 'D' ELSE 'L' END)) - 5)
        ) t
      )
    WHERE id = NEW.home_team_id;

    -- Aplicar novos stats para Away Team
    UPDATE teams SET
      played = played + 1,
      won = won + (CASE WHEN NEW.away_score > NEW.home_score THEN 1 ELSE 0 END),
      drawn = drawn + (CASE WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END),
      lost = lost + (CASE WHEN NEW.away_score < NEW.home_score THEN 1 ELSE 0 END),
      points = points + (CASE WHEN NEW.away_score > NEW.home_score THEN 3 WHEN NEW.away_score = NEW.home_score THEN 1 ELSE 0 END),
      gf = gf + NEW.away_score,
      ga = ga + NEW.home_score,
      gd = gd + (NEW.away_score - NEW.home_score),
      form = (
        SELECT jsonb_agg(res) FROM (
          SELECT res FROM jsonb_array_elements_text(form || jsonb_build_array(CASE WHEN NEW.away_score > NEW.home_score THEN 'W' WHEN NEW.away_score = NEW.home_score THEN 'D' ELSE 'L' END)) res
          OFFSET GREATEST(0, jsonb_array_length(form || jsonb_build_array(CASE WHEN NEW.away_score > NEW.home_score THEN 'W' WHEN NEW.away_score = NEW.home_score THEN 'D' ELSE 'L' END)) - 5)
        ) t
      )
    WHERE id = NEW.away_team_id;

  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para chamar a função após atualizar uma partida
CREATE TRIGGER trg_update_league_standings
AFTER UPDATE ON matches
FOR EACH ROW
EXECUTE FUNCTION update_league_standings();

-- Habilitar RLS (Row Level Security)
ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Público para leitura, Autenticado para escrita - Ajuste conforme necessário)
CREATE POLICY "Permitir leitura pública de competições" ON competitions FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de times" ON teams FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de jogadores" ON players FOR SELECT USING (true);
CREATE POLICY "Permitir leitura pública de partidas" ON matches FOR SELECT USING (true);

-- Nota: Para escrita, você precisaria de políticas mais restritivas baseadas no auth.uid()
-- se o jogo for multi-usuário compartilhado. Para um jogo single-player com save no Supabase,
-- o ideal é que as tabelas tenham uma coluna user_id.
