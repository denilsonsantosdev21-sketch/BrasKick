import React, { useState, useMemo, useEffect } from 'react';
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
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Match, Player, GameState } from './types';
import { simulateMatch, updateStandings, generateInitialTeams, generateSchedule, COMPETITIONS, resetTeamsForNewSeason } from './gameEngine';
import { useGameStore } from './gameStore';
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';

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
  const [activeCompetitionId, setActiveCompetitionId] = useState<string>('br_a');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<Match | null>(null);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [news, setNews] = useState<string[]>(["Bem-vindo ao BrasKick! O seu destino no futebol começa aqui."]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLocalPlay, setIsLocalPlay] = useState(false);

  const isSupabaseConfigured = useMemo(() => {
    const url = (import.meta as any).env.VITE_SUPABASE_URL;
    const key = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;
    return !!url && !!key && url !== '' && key !== '';
  }, []);

  // Monitora o estado de autenticação
  useEffect(() => {
    const initAuth = async () => {
      if (!isSupabaseConfigured) {
        setIsAuthLoading(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
      } catch (err) {
        console.error("Erro ao obter sessão:", err);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();

    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) setAuthError(null);
      });

      return () => subscription.unsubscribe();
    }
  }, [isSupabaseConfigured]);

  // Carrega o save do Supabase quando o usuário loga
  useEffect(() => {
    if (user && !gameState) {
      loadGame(user.id);
    }
  }, [user]);

  const loadGame = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('saves')
        .select('game_state')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setGameState(data.game_state);
        setNews(prev => [...prev, "Seu progresso foi carregado com sucesso!"]);
      }
    } catch (error) {
      console.error("Erro ao carregar save:", error);
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
      
      if (!authEmail || !authPassword) {
        throw new Error("Preencha todos os campos.");
      }

      const { data, error } = type === 'login' 
        ? await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword })
        : await supabase.auth.signUp({ email: authEmail, password: authPassword });

      if (error) {
        console.error(`Erro no ${type}:`, error);
        throw error;
      }
      
      console.log(`${type} bem-sucedido:`, data);
      if (type === 'signup') {
        setAuthError("Cadastro realizado! Verifique seu e-mail.");
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
      const schedule = generateSchedule(teams);
      const selectedTeam = teams.find(t => t.id === teamId)!;
      
      const newState: GameState = {
        userTeamId: teamId,
        teams,
        competitions: COMPETITIONS,
        currentWeek: 1,
        totalWeeks: Math.max(...schedule.map(m => m.week)),
        season: 1,
        matches: schedule,
        history: []
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
    return gameState?.teams.find(t => t.id === gameState.userTeamId);
  }, [gameState]);

  const currentWeekMatches = useMemo(() => {
    return gameState?.matches.filter(m => m.week === gameState.currentWeek) || [];
  }, [gameState]);

  const upcomingMatches = useMemo(() => {
    if (!gameState) return [];
    return gameState.matches
      .filter(m => !m.played && (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId))
      .slice(0, 5);
  }, [gameState]);

  const allStandings = useMemo(() => {
    if (!gameState) return {};
    const result: Record<string, Team[]> = {};
    const competitions = gameState.competitions || COMPETITIONS || [];
    competitions.forEach(comp => {
      if (!gameState.teams) return;
      result[comp.id] = [...gameState.teams]
        .filter(t => t.leagueId === comp.id)
        .sort((a, b) => {
          if (b.points !== a.points) return b.points - a.points;
          if (b.gd !== a.gd) return b.gd - a.gd;
          return b.gf - a.gf;
        });
    });
    return result;
  }, [gameState]);

  const standings = useMemo(() => {
    return allStandings[activeCompetitionId] || [];
  }, [allStandings, activeCompetitionId]);

  const userLeagueStandings = useMemo(() => {
    if (!gameState || !userTeam || !gameState.teams) return [];
    return [...gameState.teams]
      .filter(t => t.leagueId === userTeam.leagueId)
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        return b.gf - a.gf;
      });
  }, [gameState, userTeam]);

  const handleNextSeason = () => {
    if (!gameState) return;
    const newTeams = resetTeamsForNewSeason(gameState.teams);
    const newSchedule = generateSchedule(newTeams);
    nextSeason(newTeams, newSchedule);
    setNews(prev => [...prev, `Temporada ${gameState.season + 1} iniciada! Boa sorte!`]);
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
        const home = updatedTeams.find(t => t.id === match.homeTeamId)!;
        const away = updatedTeams.find(t => t.id === match.awayTeamId)!;
        const result = simulateMatch(home, away, gameState.currentWeek, match.competitionId);
        simulatedMatches.push(result);
        updatedTeams = updateStandings(updatedTeams, result);
      });

      const userMatch = simulatedMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
      setLastMatchResult(userMatch || null);
      setShowMatchResult(true);

      // Atualiza o estado global
      const updatedMatches = (gameState.matches || []).map(m => {
        const sim = simulatedMatches.find(sm => sm.id === m.id);
        return sim ? { ...sim, played: true } : m;
      });

      const updatedState: GameState = {
        ...gameState,
        teams: updatedTeams,
        currentWeek: gameState.currentWeek + 1,
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
                    1. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY em Settings > Environment Variables.<br/>
                    2. Reinicie o servidor de desenvolvimento.<br/>
                    3. Ou jogue no modo local abaixo.
                  </p>
                </div>
              )}
              <p className="text-braskick-muted text-sm font-body uppercase tracking-widest">
                FAÇA LOGIN PARA SALVAR SEU PROGRESSO
              </p>
            </div>

            <div className="braskick-card space-y-4">
              {authError && (
                <div className={`p-3 rounded-xl text-xs font-bold uppercase tracking-widest text-center ${authError.includes('realizado') ? 'bg-braskick-verde/20 text-braskick-verde' : 'bg-red-500/20 text-red-400'}`}>
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
              <button onClick={handleLogout} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-widest">Sair</button>
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
        <div className="p-6 flex flex-col h-full">
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
          </nav>

          <div className="mt-auto pt-6 border-t border-braskick-noite3">
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
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 text-braskick-muted hover:text-red-400 transition-colors font-display text-sm uppercase tracking-widest"
            >
              <Settings className="w-4 h-4" />
              SAIR DA CONTA
            </button>
            <button 
              onClick={resetGame}
              className="w-full flex items-center justify-center gap-2 py-3 text-braskick-muted hover:text-red-400 transition-colors font-display text-sm uppercase tracking-widest"
            >
              <Settings className="w-4 h-4" />
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
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-display text-white shadow-xl" style={{ backgroundColor: userTeam?.color }}>
                {userTeam?.name.substring(0, 1)}
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
                    <StatCard label="Temporada" value={gameState?.season || 1} icon={<Calendar className="w-6 h-6 text-braskick-verde" />} />
                    <StatCard label="Posição" value={`${userLeagueStandings.findIndex(t => t.id === gameState.userTeamId) + 1}º`} icon={<Trophy className="w-6 h-6 text-braskick-ouro" />} />
                    <StatCard label="Pontos" value={userTeam?.points || 0} icon={<BarChart3 className="w-6 h-6 text-braskick-azul" />} />
                    <StatCard label="Vitórias" value={userTeam?.won || 0} icon={<ArrowUpRight className="w-6 h-6 text-braskick-verde" />} />
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

                  {/* Upcoming Schedule */}
                  <div className="braskick-card">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted flex items-center gap-2 mb-6">
                      <HistoryIcon className="w-5 h-5" />
                      SEQUÊNCIA DE JOGOS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {upcomingMatches.slice(1).map((match, i) => {
                        const isHome = match.homeTeamId === gameState.userTeamId;
                        const opponent = gameState.teams.find(t => t.id === (isHome ? match.awayTeamId : match.homeTeamId))!;
                        return (
                          <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-braskick-noite/50 border border-white/5 hover:border-white/10 transition-all">
                            <div className="flex items-center gap-4">
                              <span className="font-display text-lg text-braskick-muted w-8">R{match.week}</span>
                              <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: opponent.color }} />
                              <span className="font-display text-xl">{opponent.name}</span>
                            </div>
                            <span className="text-xs font-bold text-braskick-muted uppercase tracking-widest">{isHome ? 'Casa' : 'Fora'}</span>
                          </div>
                        );
                      })}
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
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest">Jogador</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Pos</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Idade</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">OVR</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-center">Gols</th>
                        <th className="p-5 font-display text-lg text-braskick-muted uppercase tracking-widest text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userTeam?.players.map(player => (
                        <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                          <td className="p-5 font-display text-xl">{player.name}</td>
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
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-12"
              >
                {COMPETITIONS.map(comp => {
                  const compStandings = allStandings[comp.id] || [];
                  if (compStandings.length === 0) return null;

                  return (
                    <div key={comp.id} className="space-y-4">
                      <div className="flex items-center gap-4 px-2">
                        <div className="w-1.5 h-8 bg-braskick-verde rounded-full" />
                        <h2 className="font-display text-3xl uppercase tracking-widest text-white">{comp.name}</h2>
                      </div>
                      
                      <div className="braskick-card overflow-hidden p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-braskick-noite3/50 border-b border-braskick-noite3">
                                <th className="p-4 font-display text-base text-braskick-muted w-12 text-center">#</th>
                                <th className="p-4 font-display text-base text-braskick-muted">Equipe</th>
                                <th className="p-4 font-display text-base text-braskick-muted text-center">P</th>
                                <th className="p-4 font-display text-base text-braskick-muted text-center">J</th>
                                <th className="p-4 font-display text-base text-braskick-muted text-center">V</th>
                                <th className="p-4 font-display text-base text-braskick-muted text-center">E</th>
                                <th className="p-4 font-display text-base text-braskick-muted text-center">D</th>
                                <th className="p-4 font-display text-base text-braskick-muted text-center">SG</th>
                              </tr>
                            </thead>
                            <tbody>
                              {compStandings.map((team, i) => (
                                <tr key={team.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${team.id === gameState.userTeamId ? 'bg-braskick-verde/5' : ''}`}>
                                  <td className="p-4 text-center font-display text-base text-braskick-muted">{i + 1}</td>
                                  <td className="p-4 flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: team.color }} />
                                    <span className={`font-display text-lg ${team.id === gameState.userTeamId ? 'text-braskick-verde' : ''}`}>{team.name}</span>
                                  </td>
                                  <td className="p-4 text-center font-display text-xl text-braskick-ouro">{team.points}</td>
                                  <td className="p-4 text-center font-display text-base text-braskick-muted">{team.played}</td>
                                  <td className="p-4 text-center font-display text-base">{team.won}</td>
                                  <td className="p-4 text-center font-display text-base">{team.drawn}</td>
                                  <td className="p-4 text-center font-display text-base">{team.lost}</td>
                                  <td className="p-4 text-center font-display text-base">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'fixtures' && (
              <motion.div 
                key="fixtures"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-wrap gap-2 pb-2 no-scrollbar overflow-x-auto">
                  {COMPETITIONS.map(comp => (
                    <button
                      key={comp.id}
                      onClick={() => setActiveCompetitionId(comp.id)}
                      className={`px-4 py-2 rounded-xl font-display text-sm uppercase tracking-widest transition-all border ${
                        activeCompetitionId === comp.id
                          ? 'bg-braskick-verde text-braskick-noite border-braskick-verde shadow-lg shadow-braskick-verde/20'
                          : 'bg-braskick-noite3/30 text-braskick-muted border-white/5 hover:bg-white/5'
                      }`}
                    >
                      {comp.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          const home = gameState.teams.find(t => t.id === match.homeTeamId)!;
                          const away = gameState.teams.find(t => t.id === match.awayTeamId)!;
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

            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {(gameState.history || []).length === 0 ? (
                  <div className="braskick-card p-20 text-center">
                    <HistoryIcon className="w-16 h-16 text-braskick-noite3 mx-auto mb-6" />
                    <p className="text-braskick-muted font-display text-2xl uppercase tracking-widest">NENHUMA PARTIDA DISPUTADA</p>
                  </div>
                ) : (
                  (gameState.history || []).map(match => {
                    const home = gameState.teams.find(t => t.id === match.homeTeamId)!;
                    const away = gameState.teams.find(t => t.id === match.awayTeamId)!;
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
                        <div className="flex flex-col gap-1 w-32">
                          <span className="font-display text-lg text-braskick-muted uppercase">RODADA {match.week}</span>
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
                    <div className="w-20 h-20 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center text-4xl font-display text-white shadow-2xl" style={{ backgroundColor: gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.color }}>
                      {gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name.substring(0, 1)}
                    </div>
                    <div className="font-display text-xl uppercase tracking-wider truncate">{gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name}</div>
                  </div>
                  <div className="font-display text-7xl italic flex items-center gap-6">
                    <span className={lastMatchResult.homeScore > lastMatchResult.awayScore ? 'text-white' : 'text-braskick-muted'}>{lastMatchResult.homeScore}</span>
                    <span className="text-braskick-noite3">-</span>
                    <span className={lastMatchResult.awayScore > lastMatchResult.homeScore ? 'text-white' : 'text-braskick-muted'}>{lastMatchResult.awayScore}</span>
                  </div>
                  <div className="text-center w-32">
                    <div className="w-20 h-20 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center text-4xl font-display text-white shadow-2xl" style={{ backgroundColor: gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.color }}>
                      {gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name.substring(0, 1)}
                    </div>
                    <div className="font-display text-xl uppercase tracking-wider truncate">{gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name}</div>
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
  return (
    <div className="text-center group">
      <div className="w-20 h-20 rounded-[1.5rem] mx-auto mb-4 flex items-center justify-center text-4xl font-display text-white shadow-2xl transition-transform group-hover:scale-110" style={{ backgroundColor: team.color }}>
        {team.name.substring(0, 1)}
      </div>
      <div className="font-display text-xl uppercase tracking-wider">{team.name}</div>
    </div>
  );
}
