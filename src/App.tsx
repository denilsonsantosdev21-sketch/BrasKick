/// <reference types="vite/client" />
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Play, 
  BarChart3, 
  Calendar,
  DollarSign,
  Shield,
  Zap,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Menu,
  X,
  History as HistoryIcon,
  Newspaper,
  Loader2,
  Coins,
  Settings,
  ChevronRight,
  Search,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronDown,
  RotateCcw,
  AlertTriangle,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Match, Player, GameState } from './types';
import { simulateMatch, updateStandings, generateInitialTeams, generateSchedule, COMPETITIONS, resetTeamsForNewSeason, generateNextTournamentRound } from './gameEngine';
import { useGameStore } from './gameStore';
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';
import AdminPanel from './components/AdminPanel';

export default function App() {
  const { 
    gameState, 
    setGameState, 
    moedas, 
    adicionarMoedas, 
    gastarMoedas, 
    resetGame,
    nextWeek,
    nextSeason,
    updateTeams,
    addHistory
  } = useGameStore();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'squad' | 'league' | 'market' | 'history' | 'fixtures'>('dashboard');
  const [activeCompetitionId, setActiveCompetitionId] = useState<string>('f9e8d7c6-b5a4-4321-8765-432109876543');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<'all' | 'GK' | 'DF' | 'MF' | 'FW'>('all');
  const [historySort, setHistorySort] = useState<'round' | 'date'>('round');

  const sortedHistory = useMemo(() => {
    const history = [...(gameState?.history || [])];
    if (historySort === 'round') {
      return history.sort((a, b) => b.week - a.week);
    } else {
      return history.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
  }, [gameState?.history, historySort]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<Match | null>(null);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedCalendarMatch, setSelectedCalendarMatch] = useState<Match | null>(null);
  const [news, setNews] = useState<string[]>(["Bem-vindo ao BrasKick! O seu destino no futebol começa aqui."]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.email === 'denilson.santos.dev21@gmail.com';
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLocalPlay, setIsLocalPlay] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const lastLoadedUserId = useRef<string | null>(null);

  const isSupabaseConfigured = useMemo(() => {
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    return !!url && !!key && url !== '' && key !== '';
  }, []);

  // Monitora o estado de autenticação
  useEffect(() => {
    if (!isSupabaseConfigured) {
      setIsAuthLoading(false);
      return;
    }

    // O onAuthStateChange já dispara o evento INITIAL_SESSION na criação
    // o que substitui a necessidade de um getSession manual e evita conflitos de lock
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      setUser(session?.user ?? null);
      setIsAuthLoading(false);
      if (session?.user) setAuthError(null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [isSupabaseConfigured]);

  // Carrega o save do Supabase quando o usuário loga
  useEffect(() => {
    if (user && !gameState && !isLoadingSave && lastLoadedUserId.current !== user.id) {
      loadGame(user.id);
    }
  }, [user, gameState, isLoadingSave]);

  const loadGame = async (userId: string) => {
    if (isLoadingSave) return;
    
    setIsLoadingSave(true);
    lastLoadedUserId.current = userId;
    
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('game_state')
        .eq('user_id', userId)
        .maybeSingle(); // maybeSingle evita erro se não houver registro

      if (error) throw error;

      if (data) {
        setGameState(data.game_state);
        setNews(prev => [...prev, "Seu progresso foi carregado com sucesso!"]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar save:", error);
      // Se for erro de rede, podemos tentar novamente mais tarde
      if (error.message === 'Failed to fetch') {
        lastLoadedUserId.current = null;
      }
    } finally {
      setIsLoadingSave(false);
    }
  };

  const [isSyncing, setIsSyncing] = useState(false);

  const syncToSupabase = async () => {
    if (!user || !gameState) return;
    setIsSyncing(true);
    try {
      // 1. Sincronizar Competições
      const { data: compsData, error: compsError } = await supabase
        .from('competitions')
        .upsert(COMPETITIONS.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          region: c.region,
          tier: c.tier
        })));
      
      if (compsError) throw compsError;

      // 2. Sincronizar Times
      const { error: teamsError } = await supabase
        .from('teams')
        .upsert((gameState.teams || []).filter(t => !!t).map(t => ({
          id: t.id,
          competition_id: t.leagueId,
          name: t.name,
          color: t.color,
          overall: t.overall,
          attack: t.attack,
          midfield: t.midfield,
          defense: t.defense,
          budget: t.budget,
          points: t.points,
          played: t.played,
          won: t.won,
          drawn: t.drawn,
          lost: t.lost,
          gf: t.gf,
          ga: t.ga,
          gd: t.gd,
          form: t.form
        })));
      
      if (teamsError) throw teamsError;

      // 3. Sincronizar Jogadores (Opcional, pode ser pesado)
      const allPlayers = gameState.teams.flatMap(t => t.players.map(p => ({
        id: p.id,
        team_id: t.id,
        name: p.name,
        position: p.position,
        overall: p.overall,
        age: p.age,
        value: p.value,
        goals: p.goals,
        assists: p.assists
      })));

      const { error: playersError } = await supabase
        .from('players')
        .upsert(allPlayers);
      
      if (playersError) throw playersError;

      // 4. Sincronizar Partidas
      const { error: matchesError } = await supabase
        .from('matches')
        .upsert(gameState.matches.map(m => ({
          id: m.id,
          competition_id: m.competitionId,
          week: m.week,
          home_team_id: m.homeTeamId,
          away_team_id: m.awayTeamId,
          home_score: m.homeScore,
          away_score: m.awayScore,
          played: m.played,
          events: m.events
        })));
      
      if (matchesError) throw matchesError;

      setNews(prev => [...prev, "Dados sincronizados com sucesso no Supabase!"]);
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      setNews(prev => [...prev, "Erro ao sincronizar com o Supabase."]);
    } finally {
      setIsSyncing(false);
    }
  };

  const saveGame = async (state: GameState) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('saves')
        .upsert({ 
          user_id: user.id, 
          game_state: state,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (error) throw error;
    } catch (error) {
      console.error("Erro ao salvar jogo:", error);
    }
  };

  const handleAuth = async (type: 'login' | 'signup') => {
    console.log(`Iniciando ${type}...`, { email: authEmail });
    try {
      setAuthError(null);
      setIsAuthLoading(true);
      
      if (!isSupabaseConfigured) {
        throw new Error("CONFIGURAÇÃO AUSENTE: O Supabase não foi configurado corretamente. Adicione as chaves VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY nas configurações.");
      }
      
      if (!authEmail || !authPassword) {
        throw new Error("Preencha todos os campos.");
      }

      if (authPassword.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres.");
      }

      const { data, error } = type === 'login' 
        ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
        : await supabase.auth.signUp({ email: authEmail, password: authPassword });

      if (error) {
        console.error(`Erro no ${type}:`, error);
        const msg = error.message.toLowerCase();
        
        if (msg.includes('failed to fetch') || msg.includes('falha ao buscar') || msg.includes('network error')) {
          throw new Error("ERRO DE CONEXÃO: O servidor do Supabase não pôde ser alcançado. Verifique sua conexão com a internet ou se o banco de dados está ativo.");
        }
        if (msg.includes('invalid login credentials') || msg.includes('invalid credentials') || msg.includes('dados inválidos')) {
          throw new Error("DADOS INCORRETOS: O e-mail ou a senha digitados estão incorretos. Verifique se há erros de digitação e tente novamente.");
        }
        if (msg.includes('email not confirmed') || msg.includes('e-mail não confirmado')) {
          throw new Error("E-MAIL PENDENTE: Sua conta foi criada, mas você precisa confirmá-la no seu e-mail antes de entrar. Verifique sua caixa de entrada e a pasta de spam.");
        }
        if (msg.includes('user already registered') || msg.includes('usuário já cadastrado')) {
          throw new Error("CONTA JÁ EXISTE: Este e-mail já está cadastrado no sistema. Tente fazer login em vez de criar uma nova conta.");
        }
        if (msg.includes('rate limit') || msg.includes('limite de taxa')) {
          throw new Error("MUITAS TENTATIVAS: Você tentou muitas vezes em pouco tempo. Por segurança, aguarde alguns minutos antes de tentar novamente.");
        }
        
        throw error;
      }
      
      console.log(`${type} bem-sucedido:`, data);
      if (type === 'signup') {
        if (data.session) {
          setAuthError("Cadastro realizado com sucesso!");
        } else {
          setAuthError("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
        }
      }
    } catch (error: any) {
      console.error("Erro de autenticação detalhado:", error);
      setAuthError(error.message || "Erro ao processar solicitação.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
  };

  // Inicializa o jogo com o time escolhido
  const startGame = async (teamId: string) => {
    try {
      const teams = generateInitialTeams();
      const schedule = generateSchedule(teams, COMPETITIONS);
      const selectedTeam = teams.find(t => t.id === teamId)!;
      
      const newState: GameState = {
        userTeamId: teamId,
        teams,
        competitions: COMPETITIONS,
        currentWeek: 1,
        totalWeeks: Math.max(...schedule.map(m => m.week)),
        season: 1,
        matches: schedule,
        history: [],
        coins: 0
      };
      setGameState(newState);
      setActiveCompetitionId(selectedTeam.leagueId);
      setNews(prev => [...prev, `Você assumiu o comando do ${selectedTeam.name}!`]);
      
      if (user) {
        await saveGame(newState);
      }
    } catch (error) {
      console.error("Erro ao iniciar o jogo:", error);
      alert("Ocorreu um erro ao iniciar sua jornada. Tente novamente.");
    }
  };

  const userTeam = useMemo(() => {
    if (!gameState) return null;
    return gameState.teams.find(t => t.id === gameState.userTeamId);
  }, [gameState]);

  const currentWeekMatches = useMemo(() => {
    if (!gameState) return [];
    return gameState.matches.filter(m => m.week === gameState.currentWeek) || [];
  }, [gameState]);

  const upcomingMatches = useMemo(() => {
    if (!gameState) return [];
    return gameState.matches
      .filter(m => !m.played && (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId))
      .slice(0, 5);
  }, [gameState]);

  const allStandings = useMemo(() => {
    if (!gameState || !gameState.teams) return {};
    const result: Record<string, Team[]> = {};
    const competitions = gameState.competitions || COMPETITIONS || [];
    competitions.forEach(comp => {
      result[comp.id] = [...gameState.teams]
        .filter(t => t && t.leagueId === comp.id)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });
    });
    return result;
  }, [gameState]);

  const standings = useMemo(() => {
    if (!gameState) return [];
    return allStandings[activeCompetitionId] || [];
  }, [allStandings, activeCompetitionId, gameState]);

  const userLeagueStandings = useMemo(() => {
    if (!gameState || !userTeam || !gameState.teams) return [];
    return allStandings[userTeam.leagueId] || [];
  }, [allStandings, userTeam, gameState]);

  const marketPlayers = useMemo(() => {
    if (!gameState || !gameState.teams) return [];
    const allPlayers: { player: Player, team: Team }[] = [];
    gameState.teams.forEach(team => {
      if (team && team.id !== gameState.userTeamId) {
        team.players.forEach(player => {
          allPlayers.push({ player, team });
        });
      }
    });
    
    return allPlayers.filter(item => {
      const matchesSearch = item.player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           item.team.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = marketFilter === 'all' || item.player.position === marketFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => b.player.overall - a.player.overall);
  }, [gameState, searchTerm, marketFilter]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const handleNextSeason = () => {
    if (!gameState) return;

    // 1. Resetar estatísticas de jogadores e times
    let updatedTeams = resetTeamsForNewSeason(gameState.teams);

    // 2. Lógica de Promoção e Rebaixamento
    const competitions = gameState.competitions;
    const teamsByLeague: { [key: string]: Team[] } = {};

    // Agrupa times por liga e ordena por classificação
    competitions.forEach(comp => {
      teamsByLeague[comp.id] = updatedTeams
        .filter(t => t.leagueId === comp.id)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });
    });

    // Processa cada competição para trocas e qualificações
    competitions.forEach(comp => {
      if (comp.type !== 'LEAGUE') return;

      const standings = teamsByLeague[comp.id];

      // Rebaixamento (Tier N -> Tier N+1)
      if (comp.relegationCount && comp.relegationCount > 0) {
        const relegatedTeams = standings.slice(-comp.relegationCount);
        const nextTierComp = competitions.find(c => c.region === comp.region && c.tier === (comp.tier || 1) + 1);
        
        if (nextTierComp) {
          relegatedTeams.forEach(team => {
            const teamIdx = updatedTeams.findIndex(t => t.id === team.id);
            updatedTeams[teamIdx].leagueId = nextTierComp.id;
          });
        }
      }

      // Promoção (Tier N -> Tier N-1)
      if (comp.promotionCount && comp.promotionCount > 0) {
        const promotedTeams = standings.slice(0, comp.promotionCount);
        const prevTierComp = competitions.find(c => c.region === comp.region && c.tier === (comp.tier || 1) - 1);

        if (prevTierComp) {
          promotedTeams.forEach(team => {
            const teamIdx = updatedTeams.findIndex(t => t.id === team.id);
            updatedTeams[teamIdx].leagueId = prevTierComp.id;
          });
        }
      }

      // Qualificação Continental (ex: 4 primeiros vão para Libertadores)
      if (comp.qualificationSpots) {
        Object.entries(comp.qualificationSpots).forEach(([targetCompId, spots]) => {
          const qualifiedTeams = standings.slice(0, spots);
          qualifiedTeams.forEach(team => {
            const teamIdx = updatedTeams.findIndex(t => t.id === team.id);
            if (!updatedTeams[teamIdx].competitionIds) {
              updatedTeams[teamIdx].competitionIds = [updatedTeams[teamIdx].leagueId];
            }
            if (!updatedTeams[teamIdx].competitionIds?.includes(targetCompId)) {
              updatedTeams[teamIdx].competitionIds?.push(targetCompId);
            }
          });
        });
      }
    });

    // 3. Gerar novo calendário
    const newSchedule = generateSchedule(updatedTeams, gameState.competitions);
    
    // 4. Iniciar nova temporada
    nextSeason(updatedTeams, newSchedule);
    setNews(prev => [...prev, `Temporada ${gameState.season + 1} iniciada! Promoções e rebaixamentos processados.`]);
  };

  // Simula a próxima rodada do campeonato
  const simulateNextWeek = async () => {
    if (!gameState || isSimulating) return;
    setIsSimulating(true);

    try {
      // Simula todas as partidas da rodada atual
      const matchesToSimulate = gameState.matches?.filter(m => m.week === gameState.currentWeek) || [];
      let updatedTeams = [...gameState.teams];
      const simulatedMatches: Match[] = [];

      matchesToSimulate.forEach(match => {
        const home = updatedTeams.find(t => t.id === match.homeTeamId);
        const away = updatedTeams.find(t => t.id === match.awayTeamId);
        if (!home || !away) return;
        
        const result = simulateMatch(home, away, gameState.currentWeek, match.competitionId);
        simulatedMatches.push(result);
        updatedTeams = updateStandings(updatedTeams, result);
      });

      const userMatch = simulatedMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
      setLastMatchResult(userMatch || null);
      setShowMatchResult(true);

      // Atualiza o estado global
      let updatedMatches = (gameState.matches || []).map(m => {
        const sim = simulatedMatches.find(sm => sm.id === m.id);
        return sim ? { ...sim, played: true } : m;
      });

      // Verifica se há torneios que precisam de novas rodadas
      let finalTotalWeeks = gameState.totalWeeks;
      gameState.competitions.forEach(comp => {
        if (comp.type === 'TOURNAMENT') {
          const tournamentMatches = simulatedMatches.filter(m => m.competitionId === comp.id);
          // Se houve partidas deste torneio nesta semana
          if (tournamentMatches.length > 0) {
            // Se for a última rodada gerada para este torneio e ainda não é a final
            const compMatches = updatedMatches.filter(m => m.competitionId === comp.id);
            const maxWeekForComp = Math.max(...compMatches.map(m => m.week), 0);
            
            if (gameState.currentWeek === maxWeekForComp && tournamentMatches.length > 1) {
              const nextRoundMatches = generateNextTournamentRound(tournamentMatches, comp.id, gameState.currentWeek);
              if (nextRoundMatches.length > 0) {
                updatedMatches = [...updatedMatches, ...nextRoundMatches];
                finalTotalWeeks = Math.max(finalTotalWeeks, ...nextRoundMatches.map(m => m.week));
              }
            }
          }
        }
      });

      const updatedState: GameState = {
        ...gameState,
        teams: updatedTeams,
        currentWeek: gameState.currentWeek + 1,
        totalWeeks: finalTotalWeeks,
        matches: updatedMatches,
        history: [...simulatedMatches, ...gameState.history]
      };

      setGameState(updatedState);

      // Lógica de notícias baseada no resultado
      if (userMatch) {
        const isHome = userMatch.homeTeamId === gameState.userTeamId;
        const myScore = isHome ? userMatch.homeScore : userMatch.awayScore;
        const advScore = isHome ? userMatch.awayScore : userMatch.homeScore;
        
        if (myScore > advScore) {
          setNews(prev => [...prev, `Vitória épica! O ${userTeam?.name} dominou o gramado hoje.`]);
          adicionarMoedas(50); // Bônus por vitória
        } else if (myScore === advScore) {
          setNews(prev => [...prev, `Empate técnico. O ${userTeam?.name} lutou até o fim.`]);
          adicionarMoedas(20);
        } else {
          setNews(prev => [...prev, `Derrota amarga. A torcida do ${userTeam?.name} cobra mudanças.`]);
        }
      }
      
      if (user) {
        await saveGame(updatedState);
      }

    } catch (error) {
      console.error("Erro na simulação:", error);
      alert("O motor de simulação falhou. Tente avançar novamente.");
    } finally {
      setIsSimulating(false);
    }
  };

  // Tela Inicial de Seleção de Time
  if (!gameState) {
    if (!user && !isAuthLoading && !isLocalPlay) {
      return (
        <div className="min-h-screen bg-braskick-noite flex flex-col items-center justify-center p-6">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full"
          >
            <div className="text-center mb-12">
              <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-braskick-verde/10 border border-braskick-verde/20 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,156,59,0.3)]">
                <Trophy className="w-12 h-12 text-braskick-verde" />
              </div>
              <h1 className="text-5xl font-display mb-2 bg-gradient-to-b from-white to-braskick-muted bg-clip-text text-transparent">
                BRASKICK
              </h1>
              {!isSupabaseConfigured && (
                <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left">
                  <p className="text-[10px] text-amber-200 font-bold uppercase tracking-widest mb-1">
                    ⚠️ SUPABASE NÃO CONFIGURADO
                  </p>
                  <p className="text-[9px] text-amber-200/70 leading-relaxed">
                    1. Certifique-se de que as variáveis no Vercel começam com <strong>VITE_</strong> (ex: VITE_SUPABASE_URL).<br/>
                    2. Após adicionar as variáveis, você <strong>DEVE</strong> fazer um novo deploy no Vercel.<br/>
                    3. Se estiver no AI Studio, adicione em Settings → Environment Variables e reinicie o servidor.
                  </p>
                </div>
              )}
              <p className="text-braskick-muted text-sm font-body uppercase tracking-widest">
                FAÇA LOGIN PARA SALVAR SEU PROGRESSO
              </p>
            </div>

            <div className="braskick-card space-y-4">
              {authError && (
                <div className={`p-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center ${authError.includes('realizado') || authError.includes('sucesso') ? 'bg-braskick-verde/20 text-braskick-verde' : 'bg-red-500/20 text-red-400'}`}>
                  {authError}
                </div>
              )}
              <div>
                <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-2">E-mail</label>
                <input 
                  type="email" 
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  disabled={!isSupabaseConfigured}
                  className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-white focus:border-braskick-verde transition-colors outline-none disabled:opacity-50"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-2">Senha</label>
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  disabled={!isSupabaseConfigured}
                  className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-white focus:border-braskick-verde transition-colors outline-none disabled:opacity-50"
                  placeholder="••••••••"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4">
                <button 
                  onClick={() => handleAuth('login')}
                  disabled={isAuthLoading || !isSupabaseConfigured}
                  className="braskick-button-primary disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'ENTRAR'}
                </button>
                <button 
                  onClick={() => handleAuth('signup')}
                  disabled={isAuthLoading || !isSupabaseConfigured}
                  className="braskick-button-secondary disabled:opacity-50"
                >
                  CADASTRAR
                </button>
              </div>
              <div className="pt-4 text-center">
                <button 
                  onClick={() => setIsLocalPlay(true)}
                  className="text-xs text-braskick-muted hover:text-white transition-colors uppercase tracking-widest"
                >
                  JOGAR SEM SALVAR (LOCAL)
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    const teams = generateInitialTeams();
    return (
      <div className="min-h-screen bg-braskick-noite flex flex-col items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full text-center"
        >
          {user && (
            <div className="absolute top-6 right-6 flex items-center gap-4">
              <span className="text-xs text-braskick-muted font-bold uppercase tracking-widest">{user.email}</span>
              <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-widest transition-colors">
                <LogOut className="w-3 h-3" />
                Sair
              </button>
            </div>
          )}
          {isAdmin && (
            <div className="absolute top-6 left-6">
              <button 
                onClick={() => {
                  if (!gameState) {
                    const teams = generateInitialTeams();
                    const schedule = generateSchedule(teams, COMPETITIONS);
                    setGameState({
                      userTeamId: '',
                      teams,
                      competitions: COMPETITIONS,
                      currentWeek: 1,
                      totalWeeks: Math.max(...schedule.map(m => m.week)),
                      season: 1,
                      matches: schedule,
                      history: [],
                      coins: 0
                    });
                  }
                  setShowAdminPanel(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-braskick-ouro/10 border border-braskick-ouro/20 rounded-xl text-braskick-ouro hover:bg-braskick-ouro/20 transition-all font-display text-xs uppercase tracking-widest"
              >
                <Shield className="w-4 h-4" />
                Painel Admin
              </button>
            </div>
          )}
          <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-braskick-verde/10 border border-braskick-verde/20 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,156,59,0.3)]">
            <Trophy className="w-12 h-12 text-braskick-verde" />
          </div>
          <h1 className="text-6xl md:text-8xl font-display mb-2 bg-gradient-to-b from-white to-braskick-muted bg-clip-text text-transparent">
            BRASKICK
          </h1>
          <p className="text-braskick-muted text-xl mb-12 font-body uppercase tracking-widest">
            O SEU DESTINO NO FUTEBOL COMEÇA AQUI
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-4 scrollbar-hide bg-braskick-noite2/50 rounded-3xl border border-white/5">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => startGame(team.id)}
                className="braskick-card hover:border-braskick-verde/50 transition-all group text-left relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 -rotate-45 translate-x-8 -translate-y-8" />
                <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-xl font-display text-white shadow-lg" style={{ backgroundColor: team.color }}>
                  {team.name.substring(0, 1)}
                </div>
                <div className="font-display text-lg mb-1 truncate">{team.name}</div>
                <div className="ovr-badge inline-block text-sm">OVR {team.overall}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-braskick-noite text-braskick-texto font-body overflow-hidden">
      {/* Sidebar Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-braskick-noite2 border-r border-braskick-noite3 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full overflow-y-auto custom-scrollbar">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-braskick-verde rounded-xl flex items-center justify-center shadow-lg shadow-braskick-verde/20">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <span className="font-display text-2xl tracking-tighter italic">BRASKICK</span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto text-braskick-muted">
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            <SidebarItem active={activeTab === 'dashboard'} icon={<TrendingUp className="w-5 h-5" />} label="Dashboard" onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'squad'} icon={<Users className="w-5 h-5" />} label="Elenco" onClick={() => { setActiveTab('squad'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'league'} icon={<BarChart3 className="w-5 h-5" />} label="Tabela" onClick={() => { setActiveTab('league'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'fixtures'} icon={<Calendar className="w-5 h-5" />} label="Calendário" onClick={() => { setActiveTab('fixtures'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'market'} icon={<ShoppingCart className="w-5 h-5" />} label="Mercado" onClick={() => { setActiveTab('market'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'history'} icon={<HistoryIcon className="w-5 h-5" />} label="Histórico" onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} />
            {user && (
              <button 
                onClick={syncToSupabase}
                disabled={isSyncing}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-braskick-muted hover:bg-white/5 hover:text-white group"
              >
                <div className={`p-2 rounded-lg transition-colors ${isSyncing ? 'bg-braskick-ouro/20 text-braskick-ouro animate-spin' : 'bg-braskick-azul/20 text-braskick-azul group-hover:bg-braskick-azul group-hover:text-white'}`}>
                  <Settings className="w-5 h-5" />
                </div>
                <span className="font-display text-sm uppercase tracking-widest">{isSyncing ? 'Sincronizando...' : 'Sincronizar DB'}</span>
              </button>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-braskick-noite3">
            <button 
              onClick={() => adicionarMoedas(100)}
              className="w-full mb-4 py-3 bg-braskick-ouro/10 border border-braskick-ouro/20 rounded-xl text-braskick-ouro hover:bg-braskick-ouro/20 transition-all font-display text-xs uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Coins className="w-4 h-4" />
              Ganhar Moedas
            </button>
            <div className="bg-braskick-noite3 rounded-2xl p-4 border border-white/5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-braskick-muted">
                  <Coins className="w-4 h-4 text-braskick-ouro" />
                  <span className="text-xs font-bold uppercase tracking-widest">Moedas</span>
                </div>
                <span className="font-display text-xl text-braskick-ouro">{moedas}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-braskick-muted">
                  <DollarSign className="w-4 h-4 text-braskick-verde" />
                  <span className="text-xs font-bold uppercase tracking-widest">Orçamento</span>
                </div>
                <span className="font-display text-xl text-braskick-verde">R$ {(userTeam?.budget || 0).toLocaleString('pt-BR')}</span>
              </div>
            </div>
            {isAdmin && (
              <button 
                onClick={() => setShowAdminPanel(true)}
                className="w-full flex items-center justify-center gap-2 py-3 text-braskick-ouro hover:text-yellow-400 transition-colors font-display text-sm uppercase tracking-widest border border-braskick-ouro/20 rounded-xl mb-4"
              >
                <Shield className="w-4 h-4" />
                PAINEL ADMIN
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-red-400 hover:text-red-300 transition-colors font-display text-sm uppercase tracking-widest border border-red-500/10 rounded-xl mb-2 bg-red-500/5"
            >
              <LogOut className="w-4 h-4" />
              SAIR DA CONTA
            </button>
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-braskick-muted hover:text-red-400 transition-colors font-display text-sm uppercase tracking-widest"
            >
              <RotateCcw className="w-4 h-4" />
              REINICIAR CARREIRA
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-braskick-noite3 flex items-center justify-between px-6 bg-braskick-noite/80 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden text-braskick-texto">
              <Menu className="w-7 h-7" />
            </button>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-display text-white shadow-xl overflow-hidden" style={{ backgroundColor: userTeam?.color }}>
                {userTeam?.logo ? <img src={userTeam.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : userTeam?.name.substring(0, 1)}
              </div>
              <div>
                <h2 className="font-display text-2xl leading-none">{userTeam?.name}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-braskick-muted">
                    <Zap className="w-3 h-3 text-braskick-ouro" />
                    ATA {userTeam?.attack}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-braskick-muted">
                    <Target className="w-3 h-3 text-braskick-azul" />
                    MEI {userTeam?.midfield}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-braskick-muted">
                    <Shield className="w-3 h-3 text-braskick-verde" />
                    DEF {userTeam?.defense}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center bg-braskick-noite3/50 rounded-2xl p-1 border border-white/5 mx-auto">
            <div className="px-4 py-2 text-[10px] font-bold text-braskick-muted uppercase tracking-widest border-r border-white/5">Temporada</div>
            <select 
              value={gameState?.season || 1}
              className="bg-transparent px-4 py-2 font-display text-lg text-braskick-ouro outline-none cursor-pointer"
              onChange={() => {}} 
            >
              {Array.from({ length: gameState?.season || 1 }, (_, i) => i + 1).map(s => (
                <option key={s} value={s} className="bg-braskick-noite2">Temporada {s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {gameState && gameState.currentWeek > gameState.totalWeeks ? (
              <button 
                onClick={handleNextSeason}
                className="braskick-button-primary flex items-center gap-3 shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-500"
              >
                <TrendingUp className="w-5 h-5" />
                PRÓXIMA TEMPORADA
              </button>
            ) : (
              <button 
                onClick={simulateNextWeek}
                disabled={isSimulating}
                className="braskick-button-primary flex items-center gap-3 shadow-lg shadow-braskick-verde/20"
              >
                {isSimulating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                PRÓX. RODADA
              </button>
            )}
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-8"
              >
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-8">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <StatCard label="Posição" value={`${userLeagueStandings.findIndex(t => t.id === gameState.userTeamId) + 1}º`} icon={<Trophy className="w-6 h-6 text-braskick-ouro" />} />
                    <StatCard label="Pontos" value={userTeam?.points || 0} icon={<BarChart3 className="w-6 h-6 text-braskick-azul" />} />
                    <StatCard label="Vitórias" value={userTeam?.won || 0} icon={<ArrowUpRight className="w-6 h-6 text-braskick-verde" />} />
                    <StatCard label="Empates" value={userTeam?.drawn || 0} icon={<MinusCircle className="w-6 h-6 text-braskick-muted" />} />
                    <StatCard label="Derrotas" value={userTeam?.lost || 0} icon={<ArrowDownRight className="w-6 h-6 text-red-500" />} />
                  </div>

                  {/* Next Match */}
                  <div className="braskick-card relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Calendar className="w-32 h-32" />
                    </div>
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        PRÓXIMO CONFRONTO — RODADA {gameState.currentWeek}
                      </h3>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 bg-braskick-verde text-black text-[8px] font-black rounded uppercase animate-pulse">NOVO</span>
                          <span className="text-[9px] text-braskick-muted uppercase font-bold tracking-tighter">ELENCOS REAIS 2025/26</span>
                        </div>
                        <button 
                          onClick={() => setShowResetConfirm(true)}
                          className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all flex items-center gap-2"
                        >
                          <RotateCcw className="w-3 h-3" />
                          REINICIAR CARREIRA
                        </button>
                      </div>
                    </div>
                    {currentWeekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId) ? (
                      <div className="flex items-center justify-around py-6 relative z-10">
                        <TeamDisplay team={gameState.teams.find(t => t.id === currentWeekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId)?.homeTeamId)!} />
                        <div className="text-4xl font-display text-braskick-noite3 italic">VS</div>
                        <TeamDisplay team={gameState.teams.find(t => t.id === currentWeekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId)?.awayTeamId)!} />
                      </div>
                    ) : (
                      <div className="text-center py-12 text-braskick-muted font-display text-2xl uppercase tracking-widest">FIM DA TEMPORADA</div>
                    )}
                  </div>

                  {/* Monthly Calendar Sequence */}
                  <div className="braskick-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        CALENDÁRIO DE JOGOS
                      </h3>
                      <span className="text-braskick-ouro font-display text-lg uppercase tracking-widest">
                        {(() => {
                          const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];
                          const startDate = new Date(2025, 7, 1); // Aug 1, 2025
                          const currentDate = new Date(startDate.getTime() + (gameState.currentWeek - 1) * 7 * 24 * 60 * 60 * 1000);
                          return `${months[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
                        })()}
                      </span>
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                      {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                        <div key={d} className="text-center text-[10px] font-bold text-braskick-muted py-2">{d}</div>
                      ))}
                      {(() => {
                        const startDate = new Date(2025, 7, 1); // Aug 1, 2025
                        const currentDate = new Date(startDate.getTime() + (gameState.currentWeek - 1) * 7 * 24 * 60 * 60 * 1000);
                        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                        const startDay = monthStart.getDay();
                        const totalDays = monthEnd.getDate();
                        
                        const days = [];
                        // Padding for previous month
                        for (let i = 0; i < startDay; i++) {
                          days.push(<div key={`pad-${i}`} className="aspect-square opacity-0" />);
                        }
                        
                        for (let day = 1; day <= totalDays; day++) {
                          const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                          const diffTime = date.getTime() - startDate.getTime();
                          const weekOfGame = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;
                          
                          const match = gameState.matches.find(m => m.week === weekOfGame && (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId));
                          const isToday = day === currentDate.getDate();
                          const opponentId = match?.homeTeamId === gameState.userTeamId ? match?.awayTeamId : match?.homeTeamId;
                          const opponent = gameState.teams.find(t => t.id === opponentId);
                          
                          days.push(
                            <div 
                              key={day} 
                              onClick={() => match && setSelectedCalendarMatch(match)}
                              className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group relative ${
                                match ? 'bg-braskick-noite3 border-white/10 hover:border-braskick-ouro/50 hover:bg-braskick-noite2' : 'bg-braskick-noite/20 border-white/5 opacity-20'
                              } ${isToday ? 'ring-2 ring-braskick-ouro border-braskick-ouro bg-braskick-ouro/5' : ''}`}
                            >
                              <span className={`text-[10px] font-bold ${isToday ? 'text-braskick-ouro' : 'text-braskick-muted'}`}>{day}</span>
                              {match && opponent && (
                                <div 
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shadow-xl transition-transform group-hover:scale-110 overflow-hidden" 
                                  style={{ 
                                    backgroundColor: opponent.color,
                                    color: (opponent.color.toLowerCase() === '#ffffff' || opponent.color.toLowerCase() === 'white') ? '#000000' : '#ffffff'
                                  }}
                                >
                                  {opponent.logo ? <img src={opponent.logo} alt="" className="w-full h-full object-contain" /> : opponent.name.substring(0, 1)}
                                </div>
                              )}
                              {match && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-braskick-ouro rounded-full flex items-center justify-center text-[8px] font-bold text-braskick-noite shadow-lg">
                                  R{match.week}
                                </div>
                              )}
                            </div>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>
                </div>

                {/* Sidebar Dashboard */}
                <div className="space-y-8">
                  {/* Mini Standings */}
                  <div className="braskick-card">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted mb-6">CLASSIFICAÇÃO</h3>
                    <div className="space-y-3">
                      {standings.slice(0, 8).map((team, i) => (
                        <div key={team.id} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${team.id === gameState.userTeamId ? 'bg-braskick-verde/10 border border-braskick-verde/20' : 'hover:bg-white/5'}`}>
                          <span className="font-display text-lg text-braskick-muted w-5">{i + 1}</span>
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="font-display text-lg truncate flex-1">{team.name}</span>
                          <span className="font-display text-xl">{team.points}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab('league')} className="w-full mt-6 py-3 braskick-button-secondary text-sm">VER TABELA COMPLETA</button>
                  </div>

                  {/* News Feed */}
                  <div className="braskick-card">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted flex items-center gap-2 mb-6">
                      <Newspaper className="w-5 h-5" />
                      NOTÍCIAS
                    </h3>
                    <div className="space-y-4">
                      {news.slice(-4).reverse().map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-braskick-noite/50 border border-white/5">
                          <div className="w-1.5 h-full bg-braskick-verde rounded-full shrink-0" />
                          <p className="text-sm text-braskick-texto leading-snug">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'squad' && (
              <motion.div 
                key="squad"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="braskick-card overflow-hidden p-0"
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-braskick-noite3/50 border-b border-braskick-noite3">
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">#</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest">Jogador</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Nac</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Pos</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Idade</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">OVR</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Status</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Gols</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTeam?.players.map(player => (
                        <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="p-5 text-center">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display text-lg shadow-lg mx-auto" style={{ backgroundColor: userTeam?.color, color: (userTeam?.color.toLowerCase() === '#ffffff' || userTeam?.color.toLowerCase() === 'white') ? '#000000' : '#ffffff' }}>
                              {player.number || '-'}
                            </div>
                          </td>
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-braskick-noite3 border border-white/10 overflow-hidden flex-shrink-0">
                                {player.photo ? (
                                  <img src={player.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-braskick-muted">
                                    <Users className="w-5 h-5" />
                                  </div>
                                )}
                              </div>
                              <span className="font-display text-xl">{player.name}</span>
                            </div>
                          </td>
                          <td className="p-5 text-center">
                            <span className="font-display text-sm text-braskick-muted">{player.nationality}</span>
                          </td>
                          <td className="p-5 text-center">
                            <span className={`font-display text-sm px-3 py-1 rounded-full ${
                              player.position === 'GK' ? 'bg-braskick-ouro/10 text-braskick-ouro' :
                              player.position === 'DF' ? 'bg-braskick-verde/10 text-braskick-verde' :
                              player.position === 'MF' ? 'bg-braskick-azul/10 text-braskick-azul' :
                              'bg-red-500/10 text-red-500'
                            }`}>
                              {player.position}
                            </span>
                          </td>
                          <td className="p-5 text-center font-display text-lg text-braskick-muted">{player.age}</td>
                          <td className="p-5 text-center">
                            <span className="ovr-badge">{player.overall}</span>
                          </td>
                          <td className="p-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {player.isInjured && <AlertTriangle className="w-5 h-5 text-red-500" />}
                              {player.isSuspended && <XCircle className="w-5 h-5 text-red-600" />}
                              {!player.isInjured && !player.isSuspended && <CheckCircle2 className="w-5 h-5 text-braskick-verde opacity-30" />}
                            </div>
                          </td>
                          <td className="p-5 text-center font-display text-xl">{player.goals}</td>
                          <td className="p-5 text-right font-display text-xl text-braskick-verde">R$ {(player.value / 1000000).toFixed(1)}M</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'league' && (
              <motion.div 
                key="league"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 max-w-5xl mx-auto"
              >
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden text-slate-900">
                  {/* Header Section */}
                  <div className="p-8 border-b border-slate-100">
                    <h2 className="text-3xl font-semibold text-slate-800 mb-6">Classificação</h2>
                    
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-1 border border-slate-200 min-w-[200px]">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Competição</span>
                        <select 
                          value={activeCompetitionId}
                          onChange={(e) => setActiveCompetitionId(e.target.value)}
                          className="bg-transparent font-bold text-slate-800 outline-none cursor-pointer"
                        >
                          {COMPETITIONS.map(comp => (
                            <option key={comp.id} value={comp.id}>{comp.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 flex flex-col gap-1 border border-slate-200 min-w-[120px]">
                        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Temporada</span>
                        <div className="font-bold text-slate-800">2026</div>
                      </div>
                    </div>
                  </div>

                  {/* Table Section */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100">
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider w-16 text-center">Clube</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider"></th>
                          <th className="p-6 text-sm font-bold text-slate-800 uppercase tracking-wider text-center">Pts</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">PJ</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">VIT</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">E</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">DER</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">GM</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">GC</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">SG</th>
                          <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider text-center">Ultimas 5</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((team, i) => (
                          <tr 
                            key={team.id} 
                            className={`group border-b border-slate-50 hover:bg-slate-50 transition-all ${
                              team.id === gameState.userTeamId ? 'bg-emerald-50/50' : ''
                            }`}
                          >
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-400">{i + 1}</span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center gap-4">
                                <div 
                                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm border border-slate-100 overflow-hidden"
                                  style={{ backgroundColor: team.color }}
                                >
                                  {team.logo ? (
                                    <img src={team.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                                  ) : (
                                    team.name.substring(0, 1)
                                  )}
                                </div>
                                <span className={`text-lg font-medium ${
                                  team.id === gameState.userTeamId ? 'text-emerald-600' : 'text-slate-700'
                                }`}>
                                  {team.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-6 text-center bg-slate-50/50">
                              <span className="text-xl font-bold text-slate-900">{team.points}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.played}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.won}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.drawn}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.lost}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.gf}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.ga}</span>
                            </td>
                            <td className="p-6 text-center">
                              <span className="text-lg font-medium text-slate-600">{team.gd > 0 ? `+${team.gd}` : team.gd}</span>
                            </td>
                            <td className="p-6">
                              <div className="flex items-center justify-center gap-2">
                                {(team.form || []).map((res, idx) => (
                                  <div key={idx} className="flex items-center justify-center" title={res === 'W' ? 'Vitória' : res === 'D' ? 'Empate' : 'Derrota'}>
                                    {res === 'W' && (
                                      <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                                        <CheckCircle2 className="w-4 h-4" />
                                      </div>
                                    )}
                                    {res === 'L' && (
                                      <div className="w-7 h-7 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-sm">
                                        <XCircle className="w-4 h-4" />
                                      </div>
                                    )}
                                    {res === 'D' && (
                                      <div className="w-7 h-7 rounded-full bg-slate-400 flex items-center justify-center text-white shadow-sm">
                                        <MinusCircle className="w-4 h-4" />
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {(!team.form || team.form.length === 0) && (
                                  <div className="flex gap-2">
                                    {[1, 2, 3, 4, 5].map(n => (
                                      <div key={n} className="w-7 h-7 rounded-full border border-slate-200 bg-slate-50" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Legend Section */}
                  <div className="p-8 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                    <div className="flex gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span>Libertadores</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                        <span>Sul-Americana</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span>Rebaixamento</span>
                      </div>
                    </div>
                    <div>
                      Última atualização: {new Date().toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'fixtures' && (
              <motion.div 
                key="fixtures"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display text-3xl tracking-tighter uppercase italic">Calendário da Temporada</h2>
                  <div className="flex gap-2">
                    {COMPETITIONS.map(comp => (
                      <button
                        key={comp.id}
                        onClick={() => setActiveCompetitionId(comp.id)}
                        className={`px-4 py-2 rounded-xl font-display text-xs uppercase tracking-widest transition-all border ${
                          activeCompetitionId === comp.id
                            ? 'bg-braskick-verde text-braskick-noite border-braskick-verde shadow-lg shadow-braskick-verde/20'
                            : 'bg-braskick-noite3/30 text-braskick-muted border-white/5 hover:bg-white/5'
                        }`}
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* FIFA Style Calendar Grid */}
                <div className="grid grid-cols-7 gap-2">
                  {['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].map(day => (
                    <div key={day} className="text-center text-[10px] font-bold text-braskick-muted uppercase tracking-widest py-2">
                      {day}
                    </div>
                  ))}
                  
                  {Array.from({ length: 35 }, (_, i) => {
                    const dayNum = i + 1;
                    const weekNum = Math.ceil(dayNum / 7);
                    const weekMatches = (gameState.matches || []).filter(m => m.week === weekNum && m.competitionId === activeCompetitionId);
                    const isCurrentWeek = weekNum === gameState.currentWeek;
                    const isPastWeek = weekNum < gameState.currentWeek;
                    const userMatch = weekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
                    
                    // Só mostramos ícones nos dias de jogo (vamos assumir que jogos são no Sábado/Domingo para visual)
                    const isMatchDay = i % 7 === 5 || i % 7 === 6;
                    const match = isMatchDay ? userMatch || weekMatches[i % 7 === 5 ? 0 : 1] : null;

                    return (
                      <div 
                        key={i} 
                        className={`aspect-square braskick-card p-2 flex flex-col justify-between relative group transition-all ${
                          isCurrentWeek ? 'border-braskick-azul/50 bg-braskick-azul/5' : 'opacity-80'
                        } ${isPastWeek ? 'grayscale-[0.5]' : ''} ${userMatch ? 'ring-1 ring-braskick-verde/30' : ''}`}
                      >
                        <span className={`text-[10px] font-bold ${isCurrentWeek ? 'text-braskick-azul' : 'text-braskick-muted'}`}>{dayNum}</span>
                        
                        {match && (
                          <button 
                            onClick={() => setSelectedCalendarMatch(match)}
                            className="flex flex-col items-center gap-1 w-full hover:scale-110 transition-transform"
                          >
                            <div className="w-6 h-6 rounded-lg bg-braskick-noite flex items-center justify-center border border-white/5">
                              <Zap className={`w-3 h-3 ${match.homeTeamId === gameState.userTeamId || match.awayTeamId === gameState.userTeamId ? 'text-braskick-verde' : 'text-braskick-ouro'}`} />
                            </div>
                            <span className="text-[8px] font-bold uppercase tracking-tighter text-center leading-none truncate w-full">
                              {match.homeTeamId === gameState.userTeamId || match.awayTeamId === gameState.userTeamId ? 'MEU JOGO' : `RODADA ${weekNum}`}
                            </span>
                          </button>
                        )}

                        {isCurrentWeek && i % 7 === (new Date().getDay() || 7) - 1 && (
                          <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-braskick-azul animate-pulse" />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {Array.from({ length: gameState.totalWeeks || 0 }, (_, i) => i + 1).map(week => {
                    const weekMatches = (gameState.matches || []).filter(m => m.week === week && m.competitionId === activeCompetitionId);
                  const isCurrent = week === gameState.currentWeek;
                  const isPast = week < gameState.currentWeek;
                  
                  return (
                    <div key={week} className={`braskick-card overflow-hidden p-0 ${isCurrent ? 'border-braskick-azul/50 ring-1 ring-braskick-azul/20' : ''}`}>
                      <div className={`p-4 border-b border-braskick-noite3 flex items-center justify-between ${isCurrent ? 'bg-braskick-azul/10' : 'bg-braskick-noite3/30'}`}>
                        <h3 className="font-display text-xl tracking-wider">RODADA {week}</h3>
                        {isPast && <span className="text-[10px] font-bold text-braskick-verde uppercase tracking-widest bg-braskick-verde/10 px-2 py-0.5 rounded">Finalizada</span>}
                        {isCurrent && <span className="text-[10px] font-bold text-braskick-azul uppercase tracking-widest bg-braskick-azul/10 px-2 py-0.5 rounded">Atual</span>}
                      </div>
                      <div className="divide-y divide-white/5">
                        {weekMatches.map(match => {
                          const home = gameState.teams.find(t => t.id === match.homeTeamId);
                          const away = gameState.teams.find(t => t.id === match.awayTeamId);
                          if (!home || !away) return null;
                          
                          const isUserMatch = home.id === gameState.userTeamId || away.id === gameState.userTeamId;
                          return (
                            <div key={match.id} className={`p-4 flex items-center justify-between hover:bg-white/5 transition-colors ${isUserMatch ? 'bg-braskick-verde/5' : ''}`}>
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: home.color }} />
                                <span className={`font-display text-lg truncate ${home.id === gameState.userTeamId ? 'text-braskick-verde' : ''}`}>{home.name}</span>
                              </div>
                              <div className="flex items-center gap-4 px-6">
                                {match.played ? (
                                  <div className="font-display text-2xl italic flex items-center gap-3">
                                    <span className={match.homeScore > match.awayScore ? 'text-white' : 'text-braskick-muted'}>{match.homeScore}</span>
                                    <span className="text-braskick-noite3">-</span>
                                    <span className={match.awayScore > match.homeScore ? 'text-white' : 'text-braskick-muted'}>{match.awayScore}</span>
                                  </div>
                                ) : (
                                  <div className="font-display text-sm text-braskick-noite3 uppercase tracking-widest">VS</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-1 justify-end text-right">
                                <span className={`font-display text-lg truncate ${away.id === gameState.userTeamId ? 'text-braskick-verde' : ''}`}>{away.name}</span>
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: away.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                </div>
              </motion.div>
            )}

            {activeTab === 'market' && (
              <motion.div 
                key="market"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="font-display text-3xl tracking-tighter uppercase italic">Mercado de Transferências</h2>
                  <div className="flex items-center gap-4">
                    <div className="bg-braskick-noite/50 border border-white/5 rounded-2xl px-4 py-2 flex items-center gap-3">
                      <DollarSign className="w-5 h-5 text-braskick-verde" />
                      <span className="font-display text-xl text-braskick-verde">{formatMoney(userTeam?.budget || 0)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="md:col-span-3 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-braskick-muted" />
                    <input 
                      type="text" 
                      placeholder="Buscar jogador ou time..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full bg-braskick-noite3/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 font-display text-lg focus:outline-none focus:border-braskick-verde/50 transition-all"
                    />
                  </div>
                  <select 
                    value={marketFilter}
                    onChange={(e) => setMarketFilter(e.target.value as any)}
                    className="bg-braskick-noite3/30 border border-white/5 rounded-2xl py-4 px-4 font-display text-lg focus:outline-none focus:border-braskick-verde/50 transition-all appearance-none"
                  >
                    <option value="all">Todas Posições</option>
                    <option value="GK">Goleiros (GK)</option>
                    <option value="DF">Defensores (DF)</option>
                    <option value="MF">Meias (MF)</option>
                    <option value="FW">Atacantes (FW)</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketPlayers.map(({ player, team }) => (
                    <div key={player.id} className="braskick-card group hover:border-braskick-verde/30 transition-all overflow-hidden p-0">
                      <div className="p-5 flex items-center justify-between border-b border-white/5 bg-white/5">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-display text-2xl shadow-lg" 
                            style={{ 
                              backgroundColor: team.color,
                              color: (team.color.toLowerCase() === '#ffffff' || team.color.toLowerCase() === 'white') ? '#000000' : '#ffffff'
                            }}
                          >
                            {player.overall}
                          </div>
                          <div>
                            <h3 className="font-display text-xl leading-none mb-1">{player.name}</h3>
                            <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">
                              #{player.number} • {player.position} • {player.age} ANOS • {player.nationality}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-1">{team.name}</div>
                          <div className="w-2 h-2 rounded-full ml-auto" style={{ backgroundColor: team.color }} />
                        </div>
                      </div>
                      <div className="p-5 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-1">Valor de Mercado</div>
                          <div className="font-display text-xl text-braskick-ouro">{formatMoney(player.value)}</div>
                        </div>
                        <button 
                          onClick={() => {
                            if (userTeam && userTeam.budget >= player.value) {
                              const success = useGameStore.getState().buyPlayer(player, team.id, userTeam.id, player.value);
                              if (success) {
                                setNews(prev => [`CONTRATAÇÃO: ${player.name} assinou com o ${userTeam.name}!`, ...prev]);
                              }
                            }
                          }}
                          disabled={!userTeam || userTeam.budget < player.value}
                          className={`px-6 py-3 rounded-xl font-display text-sm uppercase tracking-widest transition-all ${
                            !userTeam || userTeam.budget < player.value
                              ? 'bg-white/5 text-braskick-muted cursor-not-allowed'
                              : 'bg-braskick-verde text-white hover:bg-emerald-500 shadow-lg shadow-braskick-verde/20 active:scale-95'
                          }`}
                        >
                          Contratar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl tracking-tighter uppercase italic">Histórico de Partidas</h2>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setHistorySort('round')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${historySort === 'round' ? 'bg-braskick-verde text-braskick-noite' : 'bg-white/5 text-braskick-muted hover:bg-white/10'}`}
                    >
                      Por Rodada
                    </button>
                    <button 
                      onClick={() => setHistorySort('date')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${historySort === 'date' ? 'bg-braskick-verde text-braskick-noite' : 'bg-white/5 text-braskick-muted hover:bg-white/10'}`}
                    >
                      Por Data
                    </button>
                  </div>
                </div>

                {(sortedHistory || []).length === 0 ? (
                  <div className="braskick-card p-20 text-center">
                    <HistoryIcon className="w-16 h-16 text-braskick-noite3 mx-auto mb-6" />
                    <p className="text-braskick-muted font-display text-2xl uppercase tracking-widest">NENHUMA PARTIDA DISPUTADA</p>
                  </div>
                ) : (
                  (sortedHistory || []).map(match => {
                    const home = gameState.teams.find(t => t.id === match.homeTeamId);
                    const away = gameState.teams.find(t => t.id === match.awayTeamId);
                    if (!home || !away) return null;
                    
                    const isUserMatch = home.id === gameState.userTeamId || away.id === gameState.userTeamId;
                    const userWon = (home.id === gameState.userTeamId && match.homeScore > match.awayScore) || 
                                    (away.id === gameState.userTeamId && match.awayScore > match.homeScore);
                    const userLost = (home.id === gameState.userTeamId && match.homeScore < match.awayScore) || 
                                     (away.id === gameState.userTeamId && match.awayScore < match.homeScore);
                    
                    return (
                      <div key={match.id} className={`braskick-card p-5 flex items-center justify-between relative overflow-hidden ${isUserMatch ? 'border-l-4 border-l-braskick-verde' : ''}`}>
                        {isUserMatch && (
                          <div className={`absolute top-0 right-0 px-3 py-1 font-display text-xs uppercase tracking-widest ${userWon ? 'bg-braskick-verde text-white' : userLost ? 'bg-red-600 text-white' : 'bg-braskick-ouro text-braskick-noite'}`}>
                            {userWon ? 'VITÓRIA' : userLost ? 'DERROTA' : 'EMPATE'}
                          </div>
                        )}
                        <div className="flex flex-col gap-1 w-40">
                          <span className="font-display text-lg text-braskick-muted uppercase">RODADA {match.week}</span>
                          {match.date && (
                            <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">
                              {new Date(match.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 w-32">
                          <span className="text-[10px] font-bold text-braskick-azul uppercase tracking-widest">
                            {COMPETITIONS.find(c => c.id === match.competitionId)?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-6 flex-1 justify-center">
                          <div className="flex items-center gap-4 flex-1 justify-end text-right">
                            <span className="font-display text-xl truncate">{home.name}</span>
                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: home.color }} />
                          </div>
                          <div className="font-display text-4xl italic flex items-center gap-4 bg-braskick-noite px-6 py-2 rounded-2xl border border-white/5">
                            <span>{match.homeScore}</span>
                            <span className="text-braskick-noite3">-</span>
                            <span>{match.awayScore}</span>
                          </div>
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: away.color }} />
                            <span className="font-display text-xl truncate">{away.name}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Match Result Modal */}
      <AnimatePresence>
        {selectedCalendarMatch && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-braskick-noite/95 backdrop-blur-md"
            onClick={() => setSelectedCalendarMatch(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-braskick-noite2 border border-braskick-noite3 rounded-[2.5rem] p-10 max-w-xl w-full shadow-2xl relative overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-braskick-azul" />
              <div className="text-center mb-8">
                <div className="font-display text-xl text-braskick-muted mb-2 tracking-widest uppercase">Detalhes da Partida</div>
                <div className="text-[10px] font-bold text-braskick-azul uppercase tracking-[0.3em]">RODADA {selectedCalendarMatch.week} • {COMPETITIONS.find(c => c.id === selectedCalendarMatch.competitionId)?.name}</div>
              </div>

              <div className="flex items-center justify-around py-8 bg-braskick-noite/50 rounded-[2rem] border border-white/5 mb-8">
                <TeamDisplay team={gameState?.teams.find(t => t.id === selectedCalendarMatch.homeTeamId)} />
                <div className="font-display text-5xl italic">
                  {selectedCalendarMatch.played ? (
                    <div className="flex items-center gap-4">
                      <span>{selectedCalendarMatch.homeScore}</span>
                      <span className="text-braskick-noite3">-</span>
                      <span>{selectedCalendarMatch.awayScore}</span>
                    </div>
                  ) : (
                    <span className="text-braskick-noite3">VS</span>
                  )}
                </div>
                <TeamDisplay team={gameState?.teams.find(t => t.id === selectedCalendarMatch.awayTeamId)} />
              </div>

              {selectedCalendarMatch.played && (
                <div className="space-y-3 max-h-40 overflow-y-auto pr-2 custom-scrollbar mb-8">
                  {selectedCalendarMatch.events.map((event, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <Zap className="w-4 h-4 text-braskick-ouro" />
                      <span className="font-display text-lg flex-1">{event.playerName}</span>
                      <span className="text-braskick-muted font-display text-lg">{event.minute}'</span>
                    </div>
                  ))}
                </div>
              )}

              <button 
                onClick={() => setSelectedCalendarMatch(null)}
                className="w-full py-4 bg-braskick-noite3 hover:bg-white/10 text-white font-display text-xl uppercase tracking-widest rounded-2xl transition-all"
              >
                FECHAR
              </button>
            </motion.div>
          </motion.div>
        )}

        {showMatchResult && lastMatchResult && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-braskick-noite/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-braskick-noite2 border border-braskick-noite3 rounded-[2.5rem] p-10 max-w-xl w-full shadow-[0_0_100px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-braskick-verde via-braskick-ouro to-braskick-azul" />
              
              <div className="text-center mb-10">
                <div className="font-display text-xl text-braskick-muted mb-6 tracking-[0.3em]">RESULTADO DA RODADA {gameState.currentWeek - 1}</div>
                <div className="flex items-center justify-around py-8 bg-braskick-noite/50 rounded-[2rem] border border-white/5">
                  <div className="text-center w-32">
                    <div className="w-20 h-20 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center text-4xl font-display text-white shadow-2xl" style={{ backgroundColor: gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.color || '#333' }}>
                      {gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name?.substring(0, 1) || '?'}
                    </div>
                    <div className="font-display text-xl uppercase tracking-wider truncate">{gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name || 'Time Excluído'}</div>
                  </div>
                  <div className="font-display text-7xl italic flex items-center gap-6">
                    <span className={lastMatchResult.homeScore > lastMatchResult.awayScore ? 'text-white' : 'text-braskick-muted'}>{lastMatchResult.homeScore}</span>
                    <span className="text-braskick-noite3">-</span>
                    <span className={lastMatchResult.awayScore > lastMatchResult.homeScore ? 'text-white' : 'text-braskick-muted'}>{lastMatchResult.awayScore}</span>
                  </div>
                  <div className="text-center w-32">
                    <div className="w-20 h-20 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center text-4xl font-display text-white shadow-2xl" style={{ backgroundColor: gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.color || '#333' }}>
                      {gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name?.substring(0, 1) || '?'}
                    </div>
                    <div className="font-display text-xl uppercase tracking-wider truncate">{gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name || 'Time Excluído'}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-10 max-h-48 overflow-y-auto pr-4 custom-scrollbar">
                {lastMatchResult.events.map((event, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5">
                    <span className="font-display text-xl text-braskick-muted w-10">{event.minute}'</span>
                    <Zap className="w-5 h-5 text-braskick-ouro" />
                    <div className="flex-1">
                      <span className="font-display text-xl block leading-none">{event.playerName}</span>
                      <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">GOL PARA O {gameState.teams.find(t => t.id === event.teamId)?.name}</span>
                    </div>
                  </div>
                ))}
                {lastMatchResult.events.length === 0 && (
                  <div className="text-center py-8 text-braskick-muted font-display text-xl uppercase tracking-widest opacity-50">SEM GOLS NA PARTIDA</div>
                )}
              </div>

              <button 
                onClick={() => setShowMatchResult(false)}
                className="w-full py-5 bg-braskick-verde hover:bg-emerald-500 text-white font-display text-2xl uppercase tracking-widest rounded-2xl shadow-xl shadow-braskick-verde/20 transition-all active:scale-95"
              >
                CONTINUAR
              </button>
            </motion.div>
          </motion.div>
        )}

        {showResetConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-braskick-noite/95 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-braskick-noite2 border border-red-500/20 rounded-[2.5rem] p-10 max-w-md w-full shadow-[0_0_100px_-20px_rgba(239,68,68,0.2)] relative overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-red-500" />
              
              <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-3xl">
                <AlertTriangle className="w-10 h-10 text-red-500" />
              </div>

              <h2 className="font-display text-3xl mb-4 uppercase tracking-widest">REINICIAR CARREIRA?</h2>
              <p className="text-braskick-muted text-sm font-body uppercase tracking-widest leading-relaxed mb-10">
                VOCÊ PERDERÁ TODO O SEU PROGRESSO ATUAL, INCLUINDO TÍTULOS, MOEDAS E SEU ELENCO. ESTA AÇÃO NÃO PODE SER DESFEITA.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowResetConfirm(false)}
                  className="py-4 bg-white/5 hover:bg-white/10 text-white font-display text-xl uppercase tracking-widest rounded-2xl transition-all"
                >
                  CANCELAR
                </button>
                <button 
                  onClick={async () => {
                    if (user) {
                      try {
                        await supabase.from('saves').delete().eq('user_id', user.id);
                      } catch (e) {
                        console.error("Erro ao deletar save no Supabase:", e);
                      }
                    }
                    resetGame();
                    setShowResetConfirm(false);
                    setActiveTab('dashboard');
                  }}
                  className="py-4 bg-red-600 hover:bg-red-500 text-white font-display text-xl uppercase tracking-widest rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95"
                >
                  REINICIAR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
      </AnimatePresence>
    </div>
  );
}

function SidebarItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group relative overflow-hidden ${
        active 
          ? 'bg-braskick-verde/10 text-braskick-verde border border-braskick-verde/20' 
          : 'text-braskick-muted hover:bg-white/5 hover:text-braskick-texto'
      }`}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-braskick-verde" />}
      <span className={`${active ? 'text-braskick-verde' : 'text-braskick-muted group-hover:text-braskick-texto'}`}>
        {icon}
      </span>
      <span className="font-display text-xl tracking-wider">{label}</span>
      {active && <ChevronRight className="ml-auto w-4 h-4" />}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="braskick-card group hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-[0.2em]">{label}</span>
        <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
          {icon}
        </div>
      </div>
      <div className="text-4xl font-display italic leading-none">{value}</div>
    </div>
  );
}

function TeamDisplay({ team }: { team: Team | undefined }) {
  if (!team) return null;
  const isWhite = team.color.toLowerCase() === '#ffffff' || team.color.toLowerCase() === 'white';
  return (
    <div className="text-center group">
      <div className="w-20 h-20 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center text-4xl font-display shadow-2xl transition-transform group-hover:scale-110 overflow-hidden border border-white/10" style={{ backgroundColor: team.color, color: isWhite ? '#000000' : '#ffffff' }}>
        {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : team.name.substring(0, 1)}
      </div>
      <div className="font-display text-xl uppercase tracking-wider">{team.name}</div>
    </div>
  );
}
