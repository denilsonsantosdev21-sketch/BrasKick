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
  LogOut,
  Globe,
  User as UserIcon,
  Lock,
  Bell,
  Lightbulb,
  Info,
  Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Match, Player, GameState, MatchEvent, Formation } from './types';
import { simulateMatch, updateStandings, generateInitialTeams, generateSchedule, COMPETITIONS, resetTeamsForNewSeason, generateNextTournamentRound, generateJobOffers } from './gameEngine';
import { useGameStore } from './gameStore';
import { supabase } from './services/supabase';
import { User } from '@supabase/supabase-js';
import AdminPanel from './components/AdminPanel';

const StandingsHeader = () => (
  <thead>
    <tr className="border-b border-slate-100">
      <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider w-16 text-center">Pos</th>
      <th className="p-6 text-sm font-medium text-slate-400 uppercase tracking-wider">Clube</th>
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
);

const StandingsRow = ({ team, index, userTeamId }: { team: Team, index: number, userTeamId: string }) => (
  <tr
    className={`group border-b border-slate-50 hover:bg-slate-50 transition-all ${team.id === userTeamId ? 'bg-emerald-50/50' : ''}`}
  >
    <td className="p-6 text-center">
      <span className="text-lg font-medium text-slate-400">{index + 1}</span>
    </td>
    <td className="p-6">
      <div className="flex items-center gap-4">
        <div
          className={`w-10 h-10 ${team.logo ? 'rounded-lg' : 'rounded-full'} flex items-center justify-center text-white font-bold shadow-sm border border-slate-100 overflow-hidden`}
          style={{ backgroundColor: team.color }}
        >
          {team.logo ? (
            <img src={team.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
          ) : (
            team.name.substring(0, 1)
          )}
        </div>
        <span className={`text-lg font-medium ${team.id === userTeamId ? 'text-emerald-600' : 'text-slate-700'}`}>
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
);

export default function App() {
  const {
    gameState,
    setGameState,
    resetGame,
    nextWeek,
    nextSeason,
    updateTeams,
    addHistory,
    acceptJobOffer,
    declineJobOffer,
    updateFormation,
    addRevenue,
    baseTeams,
    setBaseTeams
  } = useGameStore();

  const evolutionTips = [
    "Treine seus jogadores regularmente para aumentar o overall.",
    "Mantenha o orçamento equilibrado para contratar reforços.",
    "Ajuste a tática conforme o adversário.",
    "Foque em jogadores jovens com alto potencial.",
    "Melhore a capacidade do estádio para aumentar a receita."
  ];

  const [activeTab, setActiveTab] = useState<'dashboard' | 'squad' | 'league' | 'market' | 'history' | 'fixtures' | 'national_team' | 'account'>('dashboard');
  const [activeCompetitionId, setActiveCompetitionId] = useState<string>('f9e8d7c6-b5a4-4321-8765-432109876543');
  const [historyFilter, setHistoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState<'all' | 'GK' | 'DF' | 'MF' | 'FW'>('all');
  const [historySort, setHistorySort] = useState<'round' | 'date'>('round');

  const sortedHistory = useMemo(() => {
    let history = [...(gameState?.history || [])];
    if (historyFilter !== 'all') {
      history = history.filter(m => m.competitionId === historyFilter);
    }
    if (historySort === 'round') {
      return history.sort((a, b) => b.week - a.week);
    } else {
      return history.sort((a, b) => {
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA;
      });
    }
  }, [gameState?.history, historySort, historyFilter]);
  const [calendarDate, setCalendarDate] = useState(new Date(2025, 7, 1));
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<Match | null>(null);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [selectedCalendarMatch, setSelectedCalendarMatch] = useState<Match | null>(null);
  const [news, setNews] = useState<string[]>(["Bem-vindo ao BrasKick! O seu destino no futebol começa aqui."]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [accountMessage, setAccountMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showMatchChoice, setShowMatchChoice] = useState(false);
  const [isWatchingMatch, setIsWatchingMatch] = useState(false);
  const [showSubstitutions, setShowSubstitutions] = useState(false);
  const [matchSimulationData, setMatchSimulationData] = useState<{
    match: Match;
    homeTeam: Team;
    awayTeam: Team;
    time: number;
    homeScore: number;
    awayScore: number;
    isPaused: boolean;
    events: MatchEvent[];
    substitutions: { out: string, in: string, minute: number, teamId: string }[];
    tactics: {
      mentality: 'defensive' | 'balanced' | 'offensive';
      focus: 'center' | 'sides';
      intensity: 'light' | 'heavy';
    };
    playerPositions: {
      id: string;
      name: string;
      teamId: string;
      x: number;
      y: number;
      baseX: number;
      baseY: number;
      color: string;
    }[];
    ball: { x: number; y: number };
  } | null>(null);

  const initialSetupTeams = useMemo(() => {
    if (baseTeams && baseTeams.length > 0) return baseTeams;
    const generated = generateInitialTeams();
    setBaseTeams(generated);
    return generated;
  }, [baseTeams, setBaseTeams]);

  const [user, setUser] = useState<User | null>(null);
  const isAdmin = user?.email === 'denilson.santos.dev21@gmail.com' || user?.email?.toLowerCase().includes('denilson') || user?.email?.toLowerCase().includes('admin');
  const [authUsername, setAuthUsername] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLocalPlay, setIsLocalPlay] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [notifications, setNotifications] = useState<{ id: string; type: 'offer' | 'news'; message: string }[]>([]);
  const [setupMode, setSetupMode] = useState<'TEAM_SELECT' | 'CAREER_TYPE' | 'PLAYER_CREATE' | 'MANAGER_CREATE'>('TEAM_SELECT');
  const [selectedSetupTeam, setSelectedSetupTeam] = useState<Team | null>(null);
  const [playerCreateData, setPlayerCreateData] = useState({
    name: '',
    position: 'FW' as 'GK' | 'DF' | 'MF' | 'FW',
    age: 18,
    nationality: 'Brasil',
    preferredFoot: 'R' as 'R' | 'L' | 'B'
  });
  const [managerCreateData, setManagerCreateData] = useState({
    name: '',
    nationality: 'Brasil',
    age: 45
  });

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

  // Auto-save no Supabase quando o gameState muda
  useEffect(() => {
    if (user && gameState) {
      const timer = setTimeout(() => {
        saveGame(gameState);
      }, 5000); // Debounce de 5 segundos
      return () => clearTimeout(timer);
    }
  }, [gameState, user]);

  const syncToSupabase = async () => {
    if (!user || !gameState) return;
    setIsSyncing(true);
    try {
      // 1. Sincronizar Competições
      const { data: compsData, error: compsError } = await supabase
        .from('competitions')
        .upsert(gameState.competitions.map(c => ({
          id: c.id,
          name: c.name,
          type: c.type,
          region: c.region,
          tier: c.tier,
          logo_url: c.logo || null
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
          form: t.form,
          logo_url: t.logo || null
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
          events: m.events,
          attendance: m.attendance || 0,
          revenue: m.revenue || 0
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
    console.log(`Iniciando ${type}...`, { username: authUsername });
    try {
      setAuthError(null);
      setIsAuthLoading(true);

      if (!isSupabaseConfigured) {
        throw new Error("CONFIGURAÇÃO AUSENTE: O Supabase não foi configurado corretamente.");
      }

      if (type === 'signup') {
        if (!authUsername || !authPassword || !authConfirmPassword) {
          throw new Error("Preencha todos os campos.");
        }
        if (authPassword !== authConfirmPassword) {
          throw new Error("As senhas não coincidem.");
        }
        if (authPassword.length < 6) {
          throw new Error("A senha deve ter pelo menos 6 caracteres.");
        }
        if (authUsername.length < 3) {
          throw new Error("O nome de usuário deve ter pelo menos 3 caracteres.");
        }

        // Usamos o username como e-mail internamente para facilitar
        const safeUsername = authUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        const internalEmail = `${safeUsername}@braskick.com`;

        const { data, error } = await supabase.auth.signUp({
          email: internalEmail,
          password: authPassword,
          options: {
            data: {
              username: authUsername
            }
          }
        });

        if (error) {
          console.error("Erro no signup:", error);
          if (error.message.toLowerCase().includes('already registered')) {
            throw new Error("USUÁRIO JÁ EXISTE: Este nome de usuário já está sendo usado. Escolha outro.");
          }
          throw error;
        }

        if (data.session) {
          setAuthError("Cadastro realizado com sucesso!");
          setAuthMode('login');
        } else {
          setAuthError("Cadastro realizado! Você já pode entrar.");
          setAuthMode('login');
        }
      } else {
        if (!authUsername || !authPassword) {
          throw new Error("Preencha todos os campos.");
        }
        const safeUsername = authUsername.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
        const internalEmail = `${safeUsername}@braskick.com`;
        const { error } = await supabase.auth.signInWithPassword({
          email: internalEmail,
          password: authPassword
        });

        if (error) {
          console.error("Erro no login:", error);
          if (error.message.toLowerCase().includes('invalid login credentials') || error.message.toLowerCase().includes('invalid credentials')) {
            throw new Error("DADOS INCORRETOS: Usuário ou senha inválidos.");
          }
          throw error;
        }
      }
    } catch (error: any) {
      console.error("Erro de autenticação:", error);
      setAuthError(error.message || "Erro ao processar solicitação.");
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetGame();
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmNewPassword) {
      setAccountMessage({ type: 'error', text: 'As senhas não coincidem ou estão vazias.' });
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setAccountMessage({ type: 'success', text: 'Senha atualizada com sucesso!' });
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      setAccountMessage({ type: 'error', text: error.message || 'Erro ao atualizar senha.' });
    }
  };

  // Inicializa o jogo com o time escolhido
  const startGame = async (teamId: string, mode: 'MANAGER' | 'PLAYER' = 'MANAGER') => {
    try {
      const teams = JSON.parse(JSON.stringify(initialSetupTeams)); // Deep copy to avoid modifying baseTeams
      const schedule = generateSchedule(teams, COMPETITIONS);
      let selectedTeam = teams.find((t: any) => t.id === teamId)!;
      let newPlayer: Player | undefined;

      if (mode === 'PLAYER') {
        newPlayer = {
          id: 'player-avatar',
          name: playerCreateData.name || 'Jogador Craque',
          position: playerCreateData.position,
          age: playerCreateData.age || 18,
          nationality: playerCreateData.nationality || 'Brasil',
          preferredFoot: playerCreateData.preferredFoot,
          overall: 65,
          value: 1000000,
          goals: 0,
          assists: 0
        };
        selectedTeam.players.push(newPlayer);
      }

      const newState: GameState = {
        userTeamId: teamId,
        gameMode: mode,
        userPlayerId: newPlayer?.id,
        managerName: mode === 'MANAGER' ? managerCreateData.name : undefined,
        managerNationality: mode === 'MANAGER' ? managerCreateData.nationality : undefined,
        managerAge: mode === 'MANAGER' ? managerCreateData.age : undefined,
        currentDate: new Date(2025, 7, 1).toISOString(), // Começa em 1 Ago 2025
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

      if (mode === 'MANAGER') {
        setNews(prev => [...prev, `Você assumiu o comando do ${selectedTeam.name}!`]);
      } else {
        setNews(prev => [...prev, `Você iniciou sua carreira no ${selectedTeam.name}! Foque nos treinos.`]);
      }

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
    try {
      const allPlayers: { player: Player, team: Team }[] = [];
      gameState.teams.forEach(team => {
        if (team && team.id !== gameState.userTeamId && team.players) {
          team.players.forEach(player => {
            if (player) {
              allPlayers.push({ player, team });
            }
          });
        }
      });

      return allPlayers.filter(item => {
        if (!item || !item.player || !item.team) return false;
        const playerName = item.player.name || '';
        const teamName = item.team.name || '';
        const matchesSearch = playerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teamName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = marketFilter === 'all' || item.player.position === marketFilter;
        return matchesSearch && matchesFilter;
      }).sort((a, b) => (b.player?.overall || 0) - (a.player?.overall || 0));
    } catch (err) {
      console.error("Erro ao processar mercado:", err);
      return [];
    }
  }, [gameState, searchTerm, marketFilter]);

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value);
  };

  const getAbbreviation = (name: string) => {
    if (!name) return '???';
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[1][0] + (words[1][1] || words[0][1])).toUpperCase();
    }
    return name.substring(0, 3).toUpperCase();
  };

  const handleTrainPlayer = (type: 'ATTACK' | 'PASS' | 'PHYSICAL') => {
    if (!gameState || !userTeam || !gameState.userPlayerId) return;

    const updatedTeams = gameState.teams.map(t => {
      if (t.id === userTeam.id) {
        return {
          ...t,
          players: t.players.map(p => {
            if (p.id === gameState.userPlayerId) {
              let overall = p.overall;
              if (Math.random() > 0.5 && overall < 99) overall += 1;
              return { ...p, overall };
            }
            return p;
          })
        };
      }
      return t;
    });

    setGameState({
      ...gameState,
      teams: updatedTeams,
      lastTrainedWeek: gameState.currentWeek
    });

    const messages = {
      'ATTACK': 'Treino de finalização concluído! Você está com o pé calibrado.',
      'PASS': 'Treino de passes concluído! Sua visão de jogo foi aprimorada.',
      'PHYSICAL': 'Treino físico pesado! Melhorando seu condicionamento para os jogos.'
    };
    setNews(prev => [...prev, messages[type]]);
    
    // Clear national team training notification if it exists
    setNotifications(prev => prev.filter(n => n.id !== 'nt_training'));
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
      if (comp.qualificationSpots || (comp.region === 'BRAZIL' && comp.tier === 1)) {
        const spots = comp.qualificationSpots || 4; // Default 4 for Brazil Tier 1
        const targetCompId = competitions.find(c => c.region === 'SOUTH_AMERICA' && c.type === 'TOURNAMENT')?.id;
        
        if (targetCompId) {
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
        }
      }
    });

    // 3. Gerar novo calendário
    const newSchedule = generateSchedule(updatedTeams, gameState.competitions);

    // 4. Iniciar nova temporada
    nextSeason(updatedTeams, newSchedule);
    setNews(prev => [...prev, `Temporada ${gameState.season + 1} iniciada! Promoções e rebaixamentos processados.`]);
  };

  const startWatchingMatch = () => {
    if (!gameState) return;
    const isInternationalBreak = gameState.currentWeek % 10 === 0;
    const matchesToSimulate = gameState.matches?.filter(m => {
      if (m.week !== gameState.currentWeek) return false;
      const comp = gameState.competitions.find(c => c.id === m.competitionId);
      const isNationalMatch = comp?.region === 'WORLD' || comp?.name.toLowerCase().includes('seleção');
      if (isInternationalBreak) return isNationalMatch;
      return !isNationalMatch;
    }) || [];

    const userMatch = matchesToSimulate.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
    if (!userMatch) return;

    const home = gameState.teams.find(t => t.id === userMatch.homeTeamId);
    const away = gameState.teams.find(t => t.id === userMatch.awayTeamId);
    if (!home || !away) return;

    // Gerar posições iniciais baseadas em 4-4-2 simplificado
    const generatePositions = (team: Team, isHome: boolean) => {
      const positions = [];
      const players = team.players.slice(0, 11);
      const side = isHome ? 1 : -1;
      const startX = isHome ? 25 : 75;

      players.forEach((p, i) => {
        let bx, by;
        if (i === 0) { bx = isHome ? 5 : 95; by = 50; } // GK
        else if (i < 5) { bx = isHome ? 20 : 80; by = 20 * i; } // DF
        else if (i < 9) { bx = 50 - (side * 10); by = 20 * (i - 4); } // MF
        else { bx = isHome ? 40 : 60; by = 33 * (i - 8); } // FW

        positions.push({
          id: p.id,
          name: p.name,
          teamId: team.id,
          x: bx,
          y: by,
          baseX: bx,
          baseY: by,
          color: team.color
        });
      });
      return positions;
    };

    const playerPositions = [
      ...generatePositions(home, true),
      ...generatePositions(away, false)
    ];

    setMatchSimulationData({
      match: { ...userMatch, events: [], homeScore: 0, awayScore: 0, played: true },
      homeTeam: home,
      awayTeam: away,
      time: 0,
      homeScore: 0,
      awayScore: 0,
      isPaused: false,
      events: [],
      substitutions: [],
      tactics: {
        mentality: 'balanced',
        focus: 'center',
        intensity: 'light'
      },
      playerPositions,
      ball: { x: 50, y: 50 }
    });
    setIsWatchingMatch(true);
    setShowMatchChoice(false);
  };

  useEffect(() => {
    let interval: any;
    if (isWatchingMatch && matchSimulationData) {
      interval = setInterval(() => {
        setMatchSimulationData(prev => {
          if (!prev || prev.isPaused) return prev;
          if (prev.time >= 90) {
            clearInterval(interval);
            setTimeout(() => simulateNextWeek(true), 2000);
            return prev;
          }

          const newTime = prev.time + 1;
          let newHomeScore = prev.homeScore;
          let newAwayScore = prev.awayScore;
          const newEvents = [...prev.events];

          // Movimentação dos jogadores (mais realista)
          const newPlayerPositions = prev.playerPositions.map(p => {
            const targetX = prev.ball.x;
            const targetY = prev.ball.y;
            
            // Fator de atração da bola (mais refinado por posição)
            const isNearBall = Math.sqrt(Math.pow(targetX - p.x, 2) + Math.pow(targetY - p.y, 2)) < 15;
            const attraction = isNearBall ? 0.08 : 0.03;
            const returnToBase = isNearBall ? 0.01 : 0.04;
            
            let dx = (targetX - p.x) * attraction + (p.baseX - p.x) * returnToBase;
            let dy = (targetY - p.y) * attraction + (p.baseY - p.y) * returnToBase;
            
            // Adicionar um pouco de aleatoriedade
            dx += (Math.random() - 0.5) * 1.5;
            dy += (Math.random() - 0.5) * 1.5;

            return {
              ...p,
              x: Math.max(5, Math.min(95, p.x + dx)),
              y: Math.max(5, Math.min(95, p.y + dy))
            };
          });

          // Movimentação da bola (mais dinâmica)
          const homeStrength = prev.homeTeam.overall + (prev.tactics.mentality === 'offensive' ? 5 : prev.tactics.mentality === 'defensive' ? -5 : 0);
          const awayStrength = prev.awayTeam.overall;
          const totalStrength = homeStrength + awayStrength;
          
          const homePossession = homeStrength / totalStrength;
          const attackingTeam = Math.random() < homePossession ? 'home' : 'away';
          
          // A bola se move em direção ao gol adversário
          const targetBallX = attackingTeam === 'home' ? 90 : 10;
          const targetBallY = 50 + (Math.random() - 0.5) * 60;
          
          const ballSpeed = 0.15;
          const newBall = {
            x: Math.max(5, Math.min(95, prev.ball.x + (targetBallX - prev.ball.x) * ballSpeed + (Math.random() - 0.5) * 5)),
            y: Math.max(5, Math.min(95, prev.ball.y + (targetBallY - prev.ball.y) * ballSpeed + (Math.random() - 0.5) * 5))
          };

          // Lógica de gol simplificada baseada em força e tática
          const chance = Math.random() * 1000;
          
          // Gols
          if (chance < homeStrength / 30) {
            newHomeScore++;
            const scorer = prev.homeTeam.players[Math.floor(Math.random() * prev.homeTeam.players.length)];
            newEvents.push({
              minute: newTime,
              type: 'goal',
              playerName: scorer.name,
              teamId: prev.homeTeam.id
            });
          } else if (chance > 1000 - (awayStrength / 30)) {
            newAwayScore++;
            const scorer = prev.awayTeam.players[Math.floor(Math.random() * prev.awayTeam.players.length)];
            newEvents.push({
              minute: newTime,
              type: 'goal',
              playerName: scorer.name,
              teamId: prev.awayTeam.id
            });
          }

          // Cartões (Simulados)
          if (Math.random() < 0.015) {
            const team = Math.random() > 0.5 ? prev.homeTeam : prev.awayTeam;
            const player = team.players[Math.floor(Math.random() * team.players.length)];
            const isRed = Math.random() < 0.05;
            newEvents.push({
              minute: newTime,
              type: isRed ? 'red_card' : 'yellow_card',
              playerName: player.name,
              teamId: team.id
            });
          }

          return {
            ...prev,
            time: newTime,
            homeScore: newHomeScore,
            awayScore: newAwayScore,
            events: newEvents,
            playerPositions: newPlayerPositions,
            ball: newBall,
            match: {
              ...prev.match,
              homeScore: newHomeScore,
              awayScore: newAwayScore,
              events: newEvents
            }
          };
        });
      }, 1333); // 120 segundos para 90 minutos -> ~1.33s por minuto
    }
    return () => clearInterval(interval);
  }, [isWatchingMatch, matchSimulationData?.isPaused]);

  // Simula a próxima rodada do campeonato
  const simulateNextWeek = async (forceQuickSim = false) => {
    if (!gameState || isSimulating) return;
    
    // Verificar se é pausa internacional
    const isInternationalBreak = gameState.currentWeek % 10 === 0;
    
    const matchesToSimulate = gameState.matches?.filter(m => {
      if (m.week !== gameState.currentWeek) return false;
      const comp = gameState.competitions.find(c => c.id === m.competitionId);
      const isNationalMatch = comp?.region === 'WORLD' || comp?.name.toLowerCase().includes('seleção');
      if (isInternationalBreak) return isNationalMatch;
      return !isNationalMatch;
    }) || [];

    const userMatch = matchesToSimulate.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);

    if (userMatch && !forceQuickSim && !isWatchingMatch) {
      setShowMatchChoice(true);
      return;
    }

    setIsSimulating(true);
    setShowMatchChoice(false);

    try {
      let updatedTeams = [...gameState.teams];
      const simulatedMatches: Match[] = [];

      // Se estivermos assistindo a partida, ela já foi simulada ou será finalizada agora
      const currentMatchesToSimulate = isWatchingMatch && matchSimulationData 
        ? matchesToSimulate.filter(m => m.id !== matchSimulationData.match.id)
        : matchesToSimulate;

      currentMatchesToSimulate.forEach(match => {
        const home = updatedTeams.find(t => t.id === match.homeTeamId);
        const away = updatedTeams.find(t => t.id === match.awayTeamId);
        if (!home || !away) return;

        const result = simulateMatch(home, away, gameState.currentWeek, match.competitionId);
        simulatedMatches.push(result);
        updatedTeams = updateStandings(updatedTeams, result);
      });

      if (isWatchingMatch && matchSimulationData) {
        simulatedMatches.push(matchSimulationData.match);
        updatedTeams = updateStandings(updatedTeams, matchSimulationData.match);
        setIsWatchingMatch(false);
        setMatchSimulationData(null);
      }

      const userMatchResult = simulatedMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
      setLastMatchResult(userMatchResult || null);
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

      // Generate Job Offers
      const managerOverall = gameState.gameMode === 'PLAYER' ? (gameState.teams.find(t => t.id === gameState.userTeamId)?.players.find(p => p.id === gameState.userPlayerId)?.overall || 65) : 75;
      const newOffers = generateJobOffers(updatedTeams, gameState.userTeamId, managerOverall);

      const updatedState: GameState = {
        ...gameState,
        teams: updatedTeams,
        currentWeek: gameState.currentWeek + 1,
        totalWeeks: finalTotalWeeks,
        matches: updatedMatches,
        jobOffers: [...(gameState.jobOffers || []), ...newOffers],
        history: [...simulatedMatches, ...gameState.history]
      };

      setGameState(updatedState);

      // Simular propostas de transferência (ex: 15% de chance por semana)
      if (Math.random() < 0.15) {
        const newOffer = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'offer' as const,
          message: gameState.gameMode === 'PLAYER' 
            ? `Você recebeu uma proposta de um novo clube!` 
            : `O clube recebeu uma proposta por um de seus jogadores!`
        };
        setNotifications(prev => [...prev, newOffer]);
        setNews(prev => [...prev, newOffer.message]);
      }

      // Lógica de notícias baseada no resultado
      if (userMatch) {
        const isHome = userMatch.homeTeamId === gameState.userTeamId;
        const myScore = isHome ? userMatch.homeScore : userMatch.awayScore;
        const advScore = isHome ? userMatch.awayScore : userMatch.homeScore;

        if (myScore > advScore) {
          setNews(prev => [...prev, `Vitória épica! O ${userTeam?.name} dominou o gramado hoje.`]);
          addRevenue(gameState.userTeamId, 1000000); // Bônus por vitória: 1M
        } else if (myScore === advScore) {
          setNews(prev => [...prev, `Empate técnico. O ${userTeam?.name} lutou até o fim.`]);
          addRevenue(gameState.userTeamId, 400000); // Bônus por empate: 400k
        } else {
          setNews(prev => [...prev, `Derrota amarga. A torcida do ${userTeam?.name} cobra mudanças.`]);
        }
        
        // Renda de Ingressos (Simulada baseada no overall do time)
        const ticketRevenue = ((userTeam?.overall || 70) * 15000) + (Math.random() * 50000);
        addRevenue(gameState.userTeamId, Math.round(ticketRevenue));
        setNews(prev => [`BILHETERIA: R$ ${Math.round(ticketRevenue).toLocaleString()} arrecadados em ingressos.`, ...prev]);
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
                    1. Certifique-se de que as variáveis no Vercel começam com <strong>VITE_</strong> (ex: VITE_SUPABASE_URL).<br />
                    2. Após adicionar as variáveis, você <strong>DEVE</strong> fazer um novo deploy no Vercel.<br />
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

              <div className="flex bg-braskick-noite rounded-xl p-1 mb-4">
                <button
                  onClick={() => { setAuthMode('login'); setAuthError(null); }}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${authMode === 'login' ? 'bg-braskick-verde text-braskick-noite' : 'text-braskick-muted hover:text-white'}`}
                >
                  Entrar
                </button>
                <button
                  onClick={() => { setAuthMode('signup'); setAuthError(null); }}
                  className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${authMode === 'signup' ? 'bg-braskick-verde text-braskick-noite' : 'text-braskick-muted hover:text-white'}`}
                >
                  Cadastrar
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-2">Nome de Usuário</label>
                <input
                  type="text"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  disabled={!isSupabaseConfigured}
                  className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-white focus:border-braskick-verde transition-colors outline-none disabled:opacity-50"
                  placeholder="Ex: craque10"
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

              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-2">Confirmar Senha</label>
                  <input
                    type="password"
                    value={authConfirmPassword}
                    onChange={(e) => setAuthConfirmPassword(e.target.value)}
                    disabled={!isSupabaseConfigured}
                    className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-white focus:border-braskick-verde transition-colors outline-none disabled:opacity-50"
                    placeholder="••••••••"
                  />
                </div>
              )}

              <div className="pt-4">
                <button
                  onClick={() => handleAuth(authMode)}
                  disabled={isAuthLoading || !isSupabaseConfigured}
                  className="w-full braskick-button-primary disabled:opacity-50"
                >
                  {isAuthLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : (authMode === 'login' ? 'ENTRAR NO JOGO' : 'CRIAR MINHA CARREIRA')}
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

    const teams = initialSetupTeams;
    return (
      <div className="min-h-screen bg-braskick-noite flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl w-full text-center"
        >
          {user && (
            <div className="absolute top-6 right-6 flex items-center gap-6">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="flex items-center gap-2 text-[10px] text-braskick-muted hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reiniciar Carreira
              </button>
              <div className="flex items-center gap-4">
                <span className="text-xs text-braskick-muted font-bold uppercase tracking-widest">
                  {user.user_metadata?.username || user.email?.split('@')[0]}
                </span>
                <button onClick={handleLogout} className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-widest transition-colors">
                  <LogOut className="w-3 h-3" />
                  Sair
                </button>
              </div>
            </div>
          )}
          {isAdmin && (
            <div className="absolute top-6 left-6">
              <button
                onClick={() => {
                  if (!gameState) {
                    const teams = initialSetupTeams;
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
          {setupMode === 'TEAM_SELECT' && (
            <>
              <p className="text-braskick-muted text-xl mb-12 font-body uppercase tracking-widest">
                O SEU DESTINO NO FUTEBOL COMEÇA AQUI. Escolha um time e crie sua história.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto p-4 scrollbar-hide bg-braskick-noite2/50 rounded-3xl border border-white/5">
                {teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => { setSelectedSetupTeam(team); setSetupMode('CAREER_TYPE'); }}
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
            </>
          )}

          {setupMode === 'CAREER_TYPE' && selectedSetupTeam && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-display mb-8 uppercase tracking-widest">COMO VOCÊ DESEJA JOGAR NO {selectedSetupTeam.name}?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <button onClick={() => setSetupMode('MANAGER_CREATE')} className="braskick-card hover:border-braskick-verde/50 transition-all text-left group">
                  <div className="w-16 h-16 bg-braskick-verde/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-8 h-8 text-braskick-verde" />
                  </div>
                  <h3 className="font-display text-2xl mb-2">GERENTE (MANAGER)</h3>
                  <p className="text-sm text-braskick-muted">Controle total do time. Contrate, escale e tome todas as decisões da diretoria. O destino do clube está nas suas mãos.</p>
                </button>
                <button onClick={() => setSetupMode('PLAYER_CREATE')} className="braskick-card hover:border-braskick-ouro/50 transition-all text-left group">
                  <div className="w-16 h-16 bg-braskick-ouro/20 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Target className="w-8 h-8 text-braskick-ouro" />
                  </div>
                  <h3 className="font-display text-2xl mb-2 text-braskick-ouro">JOGADOR (CARREIRA)</h3>
                  <p className="text-sm text-braskick-muted">Crie seu jogador. Faça treinos antes dos jogos, cresça seu overall, mude de time e seja o maior do mundo!</p>
                </button>
              </div>
              <button onClick={() => setSetupMode('TEAM_SELECT')} className="mt-8 text-braskick-muted hover:text-white text-sm font-bold uppercase tracking-widest">
                ← Voltar aos Times
              </button>
            </motion.div>
          )}

          {setupMode === 'MANAGER_CREATE' && selectedSetupTeam && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto braskick-card text-left">
              <h2 className="text-2xl font-display mb-6 text-braskick-verde text-center uppercase tracking-widest">CADASTRAR TREINADOR</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Nome do Treinador</label>
                  <input type="text" value={managerCreateData.name} onChange={e => setManagerCreateData({ ...managerCreateData, name: e.target.value })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-verde outline-none" placeholder="Nome" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Nacionalidade</label>
                  <select value={managerCreateData.nationality} onChange={e => setManagerCreateData({ ...managerCreateData, nationality: e.target.value })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-verde outline-none">
                    {['Brasil', 'Argentina', 'Uruguai', 'Portugal', 'Espanha', 'França', 'Alemanha', 'Itália', 'Inglaterra'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Idade</label>
                  <input type="number" min="25" max="80" value={managerCreateData.age} onChange={e => setManagerCreateData({ ...managerCreateData, age: parseInt(e.target.value) })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-verde outline-none" />
                </div>
                <button
                  onClick={() => startGame(selectedSetupTeam.id, 'MANAGER')}
                  disabled={!managerCreateData.name}
                  className="w-full mt-4 py-4 bg-braskick-verde text-braskick-noite font-display text-lg rounded-xl hover:bg-emerald-500 disabled:opacity-50 transition-all font-bold tracking-widest uppercase"
                >
                  INICIAR CARREIRA
                </button>
                <div className="text-center pt-2">
                  <button onClick={() => setSetupMode('CAREER_TYPE')} className="text-braskick-muted hover:text-white text-[10px] font-bold uppercase tracking-widest">
                    ← Voltar
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {setupMode === 'PLAYER_CREATE' && selectedSetupTeam && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md mx-auto braskick-card text-left">
              <h2 className="text-2xl font-display mb-6 text-braskick-ouro text-center uppercase tracking-widest">CADASTRAR JOGADOR</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Nome na Camisa</label>
                  <input type="text" value={playerCreateData.name} onChange={e => setPlayerCreateData({ ...playerCreateData, name: e.target.value })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-ouro outline-none" placeholder="Nome" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Posição</label>
                    <select value={playerCreateData.position} onChange={e => setPlayerCreateData({ ...playerCreateData, position: e.target.value as any })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-ouro outline-none">
                      <option value="GK">Goleiro (GOL)</option>
                      <option value="DF">Defensor (ZAG/LAT)</option>
                      <option value="MF">Meio-Campo (VOL/MEI)</option>
                      <option value="FW">Atacante (ATA/PON)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Perna Boa</label>
                    <select value={playerCreateData.preferredFoot} onChange={e => setPlayerCreateData({ ...playerCreateData, preferredFoot: e.target.value as any })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-ouro outline-none">
                      <option value="R">Destro (D)</option>
                      <option value="L">Canhoto (C)</option>
                      <option value="B">Ambidestro (A)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Nacionalidade</label>
                  <select value={playerCreateData.nationality} onChange={e => setPlayerCreateData({ ...playerCreateData, nationality: e.target.value })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-ouro outline-none">
                    {['Brasil', 'Argentina', 'Uruguai', 'Portugal', 'Espanha', 'França', 'Alemanha', 'Itália', 'Inglaterra'].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Idade</label>
                    <input type="number" min="16" max="35" value={playerCreateData.age} onChange={e => setPlayerCreateData({ ...playerCreateData, age: parseInt(e.target.value) })} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white focus:border-braskick-ouro outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-braskick-muted uppercase mb-2">Overall Inicial</label>
                    <input type="text" value="65" disabled className="w-full bg-braskick-noite/50 border border-white/5 rounded-xl p-3 text-braskick-ouro font-bold text-center outline-none opacity-80" />
                  </div>
                </div>
                <button
                  onClick={() => startGame(selectedSetupTeam.id, 'PLAYER')}
                  disabled={!playerCreateData.name}
                  className="w-full mt-4 py-4 bg-braskick-ouro text-braskick-noite font-display text-lg rounded-xl hover:bg-yellow-400 disabled:opacity-50 transition-all font-bold tracking-widest uppercase"
                >
                  INICIAR CARREIRA
                </button>
                <div className="text-center pt-2">
                  <button onClick={() => setSetupMode('CAREER_TYPE')} className="text-braskick-muted hover:text-white text-[10px] font-bold uppercase tracking-widest">
                    ← Voltar
                  </button>
                </div>
              </div>
            </motion.div>
          )}
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
            {gameState?.userNationalTeamId && (
              <SidebarItem active={activeTab === 'national_team'} icon={<Globe className="w-5 h-5" />} label="Convocação" onClick={() => { setActiveTab('national_team'); setIsSidebarOpen(false); }} />
            )}
            {user && (
              <SidebarItem active={activeTab === 'account'} icon={<Settings className="w-5 h-5" />} label="Minha Conta" onClick={() => { setActiveTab('account'); setIsSidebarOpen(false); }} />
            )}
            {user && (
              <button
                onClick={syncToSupabase}
                disabled={isSyncing}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-braskick-muted hover:bg-white/5 hover:text-white group"
              >
                <div className={`p-2 rounded-lg transition-colors ${isSyncing ? 'bg-braskick-ouro/20 text-braskick-ouro animate-spin' : 'bg-braskick-azul/20 text-braskick-azul group-hover:bg-braskick-azul group-hover:text-white'}`}>
                  <RotateCcw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
                </div>
                <div className="flex flex-col items-start">
                  <span className="font-display text-xl tracking-wider">Salvar Progresso</span>
                  <span className="text-[9px] font-bold uppercase tracking-widest opacity-50">Sincronizar com Nuvem</span>
                </div>
              </button>
            )}
          </nav>

          <div className="mt-auto pt-6 border-t border-braskick-noite3">
            <div className="bg-braskick-noite3 rounded-2xl p-4 border border-white/5 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-braskick-muted">
                  <DollarSign className="w-4 h-4 text-braskick-verde" />
                  <span className="text-xs font-bold uppercase tracking-widest">Orçamento</span>
                </div>
                <span className="font-display text-xl text-braskick-verde">R$ {(userTeam?.budget || 0).toLocaleString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-braskick-muted">
                  <TrendingUp className="w-4 h-4 text-braskick-ouro" />
                  <span className="text-xs font-bold uppercase tracking-widest">Receita</span>
                </div>
                <span className="font-display text-lg text-braskick-ouro">R$ {(userTeam?.revenue || 0).toLocaleString('pt-BR')}</span>
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
              onChange={() => { }}
            >
              {Array.from({ length: gameState?.season || 1 }, (_, i) => i + 1).map(s => (
                <option key={s} value={s} className="bg-braskick-noite2">Temporada {s}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            {notifications.length > 0 && (
              <button 
                onClick={() => {
                  setNotifications([]);
                  setNews(prev => [...prev, "Notificações limpas."]);
                }}
                className="relative p-2 text-braskick-muted hover:text-white transition-colors group"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-braskick-noite">
                  {notifications.length}
                </span>
                <div className="absolute top-full right-0 mt-2 w-64 bg-braskick-noite2 border border-white/10 rounded-xl p-4 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                  <h4 className="text-xs font-bold text-braskick-ouro uppercase tracking-widest mb-3">Notificações</h4>
                  <div className="space-y-2">
                    {notifications.map(n => (
                      <div key={n.id} className="text-[10px] text-white bg-white/5 p-2 rounded-lg border border-white/5">
                        {n.message}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            )}
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
                onClick={() => simulateNextWeek()}
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
                    <div className="flex items-center justify-between mb-8 relative z-10 w-full flex-wrap gap-4">
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
                      <div className="text-center py-12 font-display text-2xl uppercase tracking-widest text-braskick-ouro">
                        {gameState.currentWeek > gameState.totalWeeks ? 'FIM DA TEMPORADA' : 'SEMANA LIVRE: DESCANSO / TREINOS'}
                      </div>
                    )}
                  </div>

                  {gameState.gameMode === 'PLAYER' && (
                    <div className="braskick-card relative overflow-hidden ring-1 ring-braskick-ouro/20">
                      <div className="absolute top-0 right-0 p-4 opacity-5">
                        <Target className="w-32 h-32 text-braskick-ouro" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-ouro flex items-center gap-2 mb-4">
                        <Target className="w-5 h-5" />
                        TREINOS DA SEMANA
                      </h3>
                      {gameState.lastTrainedWeek === gameState.currentWeek ? (
                        <div className="text-center p-6 bg-braskick-noite3 rounded-2xl border border-white/5">
                          <CheckCircle2 className="w-12 h-12 text-braskick-verde mx-auto mb-3" />
                          <p className="text-braskick-verde font-bold uppercase tracking-widest text-sm">Treino Concluído</p>
                          <p className="text-braskick-muted text-xs mt-1">Descanse e prepare-se para a partida!</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <button onClick={() => handleTrainPlayer('ATTACK')} className="border border-white/5 bg-braskick-noite3 hover:border-braskick-ouro hover:bg-braskick-ouro/5 rounded-xl p-4 transition-all text-left group">
                            <Zap className="w-6 h-6 text-braskick-ouro mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-bold text-xs uppercase tracking-widest text-white">Finalização</div>
                            <div className="text-[10px] text-braskick-muted mt-1">+Chances de Gol / OVR</div>
                          </button>
                          <button onClick={() => handleTrainPlayer('PASS')} className="border border-white/5 bg-braskick-noite3 hover:border-braskick-azul hover:bg-braskick-azul/5 rounded-xl p-4 transition-all text-left group">
                            <Target className="w-6 h-6 text-braskick-azul mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-bold text-xs uppercase tracking-widest text-white">Passes</div>
                            <div className="text-[10px] text-braskick-muted mt-1">+Assistências / OVR</div>
                          </button>
                          <button onClick={() => handleTrainPlayer('PHYSICAL')} className="border border-white/5 bg-braskick-noite3 hover:border-braskick-verde hover:bg-braskick-verde/5 rounded-xl p-4 transition-all text-left group">
                            <Shield className="w-6 h-6 text-braskick-verde mb-2 group-hover:scale-110 transition-transform" />
                            <div className="font-bold text-xs uppercase tracking-widest text-white">Físico</div>
                            <div className="text-[10px] text-braskick-muted mt-1">+Resistência / OVR</div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Matches List */}
                  <div className="braskick-card">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        PRÓXIMOS 5 JOGOS
                      </h3>
                    </div>
                    <div className="space-y-3">
                      {(() => {
                        const nextMatches = (gameState.matches || [])
                          .filter(m => !m.played && (m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId))
                          .sort((a, b) => a.week - b.week)
                          .slice(0, 5);

                        if (nextMatches.length === 0) {
                          return (
                            <div className="text-center py-8 text-braskick-muted font-display text-xs uppercase tracking-widest opacity-50">
                              Nenhum jogo agendado
                            </div>
                          );
                        }

                        return nextMatches.map(match => {
                          const isHome = match.homeTeamId === gameState.userTeamId;
                          const opponentId = isHome ? match.awayTeamId : match.homeTeamId;
                          const opponent = gameState.teams.find(t => t.id === opponentId);
                          const competition = gameState.competitions.find(c => c.id === match.competitionId);
                          
                          if (!opponent) return null;

                          return (
                            <div key={match.id} className="flex items-center justify-between p-4 bg-braskick-noite/50 border border-white/5 rounded-2xl hover:bg-white/5 transition-all group">
                              <div className="flex items-center gap-4">
                                <div className="relative">
                                  <TeamDisplay team={opponent} size="small" />
                                  <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-widest ${isHome ? 'bg-braskick-verde text-braskick-noite' : 'bg-braskick-ouro text-braskick-noite'}`}>
                                    {isHome ? 'CASA' : 'FORA'}
                                  </div>
                                </div>
                                <div>
                                  <div className="font-display text-lg leading-none group-hover:text-braskick-ouro transition-colors">{opponent.name}</div>
                                  <div className="text-[9px] font-bold text-braskick-muted uppercase tracking-widest mt-1">{competition?.name || 'Competição'} • RODADA {match.week}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">OVR {opponent.overall}</div>
                                <div className="w-12 h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                                  <div className="h-full bg-braskick-ouro" style={{ width: `${opponent.overall}%` }} />
                                </div>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    <button onClick={() => setActiveTab('fixtures')} className="w-full mt-6 py-3 braskick-button-secondary text-sm">VER CALENDÁRIO COMPLETO</button>
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
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted flex items-center gap-2">
                        <Newspaper className="w-5 h-5" />
                        NOTÍCIAS
                      </h3>
                      <button 
                        onClick={() => setShowTips(true)}
                        className="p-2 bg-braskick-ouro/10 hover:bg-braskick-ouro/20 text-braskick-ouro rounded-lg border border-braskick-ouro/20 transition-all"
                        title="Dicas de Evolução"
                      >
                        <Lightbulb className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-4">
                      {/* Dica de Evolução em destaque */}
                      <div className="p-4 bg-braskick-ouro/5 border border-braskick-ouro/20 rounded-xl">
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-3 h-3 text-braskick-ouro" />
                          <span className="text-[10px] font-bold text-braskick-ouro uppercase tracking-widest">Dica de Evolução</span>
                        </div>
                        <p className="text-xs text-white/80 leading-relaxed italic">
                          "{evolutionTips[gameState.currentWeek % evolutionTips.length]}"
                        </p>
                      </div>
                      {news.slice(-3).reverse().map((item, i) => (
                        <div key={i} className="flex gap-4 p-4 rounded-xl bg-braskick-noite/50 border border-white/5">
                          <div className="w-1.5 h-full bg-braskick-verde rounded-full shrink-0" />
                          <p className="text-sm text-braskick-texto leading-snug">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Offers Section */}
                  <div className="braskick-card ring-1 ring-braskick-ouro/30">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-ouro flex items-center gap-2 mb-6">
                      <TrendingUp className="w-5 h-5" />
                      PROPOSTAS DE CARREIRA
                    </h3>
                    <div className="space-y-4">
                      {gameState.jobOffers && gameState.jobOffers.length > 0 ? (
                        gameState.jobOffers.map(offer => {
                          const offerTeam = gameState.teams.find(t => t.id === offer.teamId);
                          return (
                            <div key={offer.id} className="p-4 rounded-xl bg-braskick-ouro/10 border border-braskick-ouro/20 space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-braskick-ouro/20 rounded-lg flex items-center justify-center">
                                  {offer.type === 'NATIONAL_TEAM' ? <Globe className="w-6 h-6 text-braskick-ouro" /> : <TeamDisplay team={offerTeam} size="small" />}
                                </div>
                                <div>
                                  <div className="font-display text-lg leading-none uppercase">{offerTeam?.name}</div>
                                  <div className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mt-1">
                                    {offer.type === 'NATIONAL_TEAM' ? 'Cargo: Seleção' : `Salário: R$ ${offer.salary.toLocaleString()}`}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button 
                                  onClick={() => acceptJobOffer(offer.id)}
                                  className="flex-1 py-2 bg-braskick-ouro text-braskick-noite font-display text-[10px] uppercase tracking-widest rounded-lg hover:bg-yellow-400 transition-all font-bold"
                                >
                                  ACEITAR
                                </button>
                                <button 
                                  onClick={() => declineJobOffer(offer.id)}
                                  className="flex-1 py-2 bg-white/5 text-white font-display text-[10px] uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all font-bold"
                                >
                                  RECUSAR
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8 text-braskick-muted font-display text-xs uppercase tracking-widest opacity-50">
                          Nenhuma proposta no momento
                        </div>
                      )}
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
                            <span className={`font-display text-sm px-3 py-1 rounded-full ${player.position === 'GK' ? 'bg-braskick-ouro/10 text-braskick-ouro' :
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
                          {gameState.competitions.map(comp => (
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
                    {(() => {
                      const activeComp = gameState.competitions.find(c => c.id === activeCompetitionId);
                      const isGroups = activeComp?.format === 'GROUPS' || activeComp?.format === 'GROUPS_KNOCKOUT';

                      if (isGroups) {
                        // Group teams by groupId
                        const groups: Record<string, Team[]> = {};
                        standings.forEach(team => {
                          const gid = team.groupId || 'A';
                          if (!groups[gid]) groups[gid] = [];
                          groups[gid].push(team);
                        });

                        return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)).map(([groupId, groupTeams]) => (
                          <div key={groupId} className="mb-10">
                            <div className="bg-slate-100 px-6 py-3 font-display text-sm uppercase tracking-widest text-slate-600 font-bold flex items-center justify-between">
                              <span>Grupo {groupId}</span>
                              <span className="text-[10px] text-slate-400">Temporada {gameState.season}</span>
                            </div>
                            <div className="overflow-x-auto">
                              <table className="w-full text-left border-collapse min-w-[800px]">
                                <StandingsHeader />
                                <tbody>
                                  {groupTeams.sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf).map((team, i) => (
                                    <StandingsRow key={team.id} team={team} index={i} userTeamId={gameState.userTeamId} />
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ));
                      }

                      return (
                        <table className="w-full text-left border-collapse">
                          <StandingsHeader />
                          <tbody>
                            {standings.map((team, i) => (
                              <StandingsRow key={team.id} team={team} index={i} userTeamId={gameState.userTeamId} />
                            ))}
                          </tbody>
                        </table>
                      );
                    })()}
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
                className="space-y-8"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-4xl tracking-tighter uppercase italic bg-gradient-to-r from-white to-braskick-muted bg-clip-text text-transparent">Calendário da Temporada</h2>
                    <p className="text-braskick-muted text-xs font-bold uppercase tracking-widest mt-1">Acompanhe todas as rodadas e resultados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowTips(true)}
                      className="p-3 bg-braskick-ouro/10 hover:bg-braskick-ouro/20 text-braskick-ouro rounded-xl border border-braskick-ouro/20 transition-all flex items-center gap-2 font-display text-[10px] uppercase tracking-widest"
                    >
                      <Lightbulb className="w-4 h-4" />
                      Dicas de Evolução
                    </button>
                    <div className="relative">
                      <button className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all">
                        <Zap className="w-5 h-5" />
                      </button>
                      {notifications.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-braskick-noite flex items-center justify-center text-[8px] font-bold text-white">
                          {notifications.length}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {COMPETITIONS.map(comp => (
                      <button
                        key={comp.id}
                        onClick={() => setActiveCompetitionId(comp.id)}
                        className={`px-4 py-2 rounded-xl font-display text-[10px] uppercase tracking-widest transition-all border ${activeCompetitionId === comp.id
                          ? 'bg-braskick-verde text-braskick-noite border-braskick-verde shadow-lg shadow-braskick-verde/20'
                          : 'bg-braskick-noite3/30 text-braskick-muted border-white/5 hover:bg-white/5'
                          }`}
                      >
                        {comp.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monthly Calendar View */}
                <div className="braskick-card">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-braskick-azul/10 rounded-xl flex items-center justify-center border border-braskick-azul/20">
                        <Calendar className="w-5 h-5 text-braskick-azul" />
                      </div>
                      <h3 className="text-sm font-bold uppercase tracking-widest text-braskick-muted">Visão Mensal</h3>
                    </div>
                    <span className="text-braskick-ouro font-display text-xl uppercase tracking-widest">
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
                      <div key={d} className="text-center text-[10px] font-bold text-braskick-muted py-2 uppercase tracking-widest">{d}</div>
                    ))}
                    {(() => {
                      const startDate = new Date(2025, 7, 1); // Aug 1, 2025
                      const currentDate = new Date(startDate.getTime() + (gameState.currentWeek - 1) * 7 * 24 * 60 * 60 * 1000);
                      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
                      const startDay = monthStart.getDay();
                      const totalDays = monthEnd.getDate();

                      const days = [];
                      for (let i = 0; i < startDay; i++) {
                        days.push(<div key={`pad-${i}`} className="aspect-square opacity-0" />);
                      }

                      for (let day = 1; day <= totalDays; day++) {
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const diffTime = date.getTime() - startDate.getTime();
                        const weekOfGame = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000)) + 1;

                        const weekMatches = (gameState.matches || []).filter(m => m.week === weekOfGame && m.competitionId === activeCompetitionId);
                        const userMatch = weekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
                        const isToday = day === currentDate.getDate();
                        const match = date.getDay() === 0 ? (userMatch || weekMatches[0]) : undefined;

                        days.push(
                          <div
                            key={day}
                            onClick={() => match && setSelectedCalendarMatch(match)}
                            className={`aspect-square rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all cursor-pointer group relative ${match ? 'bg-braskick-noite3 border-white/10 hover:border-braskick-ouro/50 hover:bg-braskick-noite2' : 'bg-braskick-noite/20 border-white/5 opacity-20'
                              } ${isToday ? 'ring-2 ring-braskick-ouro border-braskick-ouro bg-braskick-ouro/5' : ''}`}
                          >
                            <span className={`text-[10px] font-bold ${isToday ? 'text-braskick-ouro' : 'text-braskick-muted'}`}>{day}</span>
                            {match && (
                              <div className="flex flex-col items-center gap-1">
                                <Zap className={`w-3 h-3 ${match.homeTeamId === gameState.userTeamId || match.awayTeamId === gameState.userTeamId ? 'text-braskick-verde' : 'text-braskick-ouro'}`} />
                                <span className="text-[8px] font-bold uppercase tracking-tighter text-center leading-none truncate w-full px-1">
                                  {match.homeTeamId === gameState.userTeamId || match.awayTeamId === gameState.userTeamId ? 'MEU JOGO' : `R${weekOfGame}`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                                  <TeamDisplay team={home} size="small" />
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
                                  <TeamDisplay team={away} size="small" />
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
                  {marketPlayers.slice(0, 60).map(({ player, team }) => (
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
                        <div className="flex items-center gap-2">
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
                            className={`flex-1 px-4 py-3 rounded-xl font-display text-[10px] uppercase tracking-widest transition-all ${!userTeam || userTeam.budget < player.value
                              ? 'bg-white/5 text-braskick-muted cursor-not-allowed'
                              : 'bg-braskick-verde text-white hover:bg-emerald-500 shadow-lg shadow-braskick-verde/20 active:scale-95'
                              }`}
                          >
                            Contratar
                          </button>
                          <button
                            onClick={() => {
                              // Abrir modal de proposta (Simulado por enquanto)
                              const offer = Math.round(player.value * (0.8 + Math.random() * 0.4));
                              const accepted = Math.random() > 0.5;
                              if (accepted) {
                                alert(`Proposta de R$ ${(offer / 1000000).toFixed(1)}M aceita pelo ${team.name}!`);
                                useGameStore.getState().buyPlayer(player, team.id, userTeam!.id, offer);
                                setNews(prev => [`NEGOCIAÇÃO: ${player.name} contratado por R$ ${(offer / 1000000).toFixed(1)}M!`, ...prev]);
                              } else {
                                alert(`O ${team.name} recusou sua proposta de R$ ${(offer / 1000000).toFixed(1)}M.`);
                              }
                            }}
                            className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-display text-[10px] uppercase tracking-widest transition-all border border-white/5"
                          >
                            Proposta
                          </button>
                        </div>
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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <h2 className="font-display text-3xl tracking-tighter uppercase italic">Histórico de Partidas</h2>
                  <div className="flex flex-wrap gap-2">
                    <select
                      value={historyFilter}
                      onChange={(e) => setHistoryFilter(e.target.value)}
                      className="bg-braskick-noite3/30 border border-white/5 rounded-xl py-2 px-4 font-display text-xs uppercase tracking-widest focus:outline-none focus:border-braskick-verde/50 transition-all appearance-none text-braskick-muted"
                    >
                      <option value="all">Todas as Ligas</option>
                      {gameState.competitions.map(comp => (
                        <option key={comp.id} value={comp.id}>{comp.name}</option>
                      ))}
                    </select>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sortedHistory.map(match => {
                      const home = gameState.teams.find(t => t.id === match.homeTeamId);
                      const away = gameState.teams.find(t => t.id === match.awayTeamId);
                      if (!home || !away) return null;

                      const isWin = (home.id === gameState.userTeamId && match.homeScore > match.awayScore) ||
                        (away.id === gameState.userTeamId && match.awayScore > match.homeScore);
                      const isLoss = (home.id === gameState.userTeamId && match.homeScore < match.awayScore) ||
                        (away.id === gameState.userTeamId && match.awayScore < match.homeScore);
                      const isDraw = match.homeScore === match.awayScore;

                      return (
                        <div key={match.id} className={`braskick-card overflow-hidden p-0 border-l-4 ${isWin ? 'border-l-braskick-verde' : isLoss ? 'border-l-red-500' : 'border-l-braskick-ouro'}`}>
                          <div className="p-4 bg-white/5 flex items-center justify-between border-b border-white/5">
                            <div className="flex flex-col">
                              <span className="font-display text-lg tracking-wider">RODADA {match.week}</span>
                              <span className="text-[8px] font-bold text-braskick-muted uppercase tracking-widest">{COMPETITIONS.find(c => c.id === match.competitionId)?.name}</span>
                            </div>
                            <div className={`px-3 py-1 rounded-lg font-display text-xs uppercase tracking-widest ${isWin ? 'bg-braskick-verde/10 text-braskick-verde' : isLoss ? 'bg-red-500/10 text-red-500' : 'bg-braskick-ouro/10 text-braskick-ouro'}`}>
                              {isWin ? 'VITÓRIA' : isLoss ? 'DERROTA' : 'EMPATE'}
                            </div>
                          </div>
                          <div className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <TeamDisplay team={home} size="small" />
                              <span className="font-display text-xl uppercase tracking-widest">{getAbbreviation(home.name)}</span>
                            </div>
                            <div className="flex items-center gap-4 px-4">
                              <div className="bg-braskick-noite rounded-xl px-4 py-2 border border-white/10 font-display text-3xl italic flex items-center gap-3">
                                <span className={match.homeScore > match.awayScore ? 'text-white' : 'text-braskick-muted'}>{match.homeScore}</span>
                                <span className="text-white/20">-</span>
                                <span className={match.awayScore > match.homeScore ? 'text-white' : 'text-braskick-muted'}>{match.awayScore}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 flex-1 justify-end">
                              <span className="font-display text-xl uppercase tracking-widest">{getAbbreviation(away.name)}</span>
                              <TeamDisplay team={away} size="small" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'national_team' && (
              <motion.div
                key="national_team"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-widest">Convocação da Seleção</h2>
                    <p className="text-braskick-muted text-xs font-bold uppercase tracking-widest mt-1">
                      Selecione os melhores jogadores do país para representar a nação.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {gameState.teams.flatMap(t => t.players)
                    .filter(p => p.nationality === 'Brasil')
                    .sort((a, b) => b.overall - a.overall)
                    .slice(0, 50)
                    .map(player => (
                      <div key={player.id} className={`braskick-card group relative overflow-hidden flex flex-col p-0 border ${player.isCalledUp ? 'border-braskick-verde ring-1 ring-braskick-verde/50' : 'border-white/10'} hover:border-braskick-verde transition-all`}>
                        <div className="flex-1 p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-16 h-16 bg-braskick-noite3 rounded-2xl overflow-hidden flex-shrink-0 border border-white/5 relative z-10 shadow-lg">
                              {player.photo ? (
                                <img src={player.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-8 h-8 text-braskick-muted opacity-50" />
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="font-display text-2xl text-braskick-ouro">{player.overall}</span>
                              <div className="text-[10px] font-bold uppercase tracking-widest text-braskick-muted">{player.position}</div>
                            </div>
                          </div>
                          
                          <div className="space-y-1 relative z-10">
                            <div className="font-display text-xl truncate leading-none">{player.name}</div>
                            <div className="flex items-center justify-between text-[10px] font-bold text-braskick-muted uppercase tracking-widest">
                              <span>{player.nationality}</span>
                              <span>{player.age} ANOS</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-white/5 px-5 py-4 flex items-center justify-between border-t border-white/10 relative z-10">
                          <button 
                            onClick={() => {
                              const updatedTeams = gameState.teams.map(t => ({
                                ...t,
                                players: t.players.map(p => p.id === player.id ? { ...p, isCalledUp: !p.isCalledUp } : p)
                              }));
                              setGameState({ ...gameState, teams: updatedTeams });
                            }}
                            className={`w-full py-2 rounded-lg font-display text-xs uppercase tracking-widest transition-all ${player.isCalledUp ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-braskick-verde text-braskick-noite hover:bg-emerald-500'}`}
                          >
                            {player.isCalledUp ? 'DISPENSAR' : 'CONVOCAR'}
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </motion.div>
            )}
            {activeTab === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl mx-auto"
              >
                <div className="braskick-card p-8">
                  <div className="flex items-center gap-6 mb-10">
                    <div className="w-20 h-20 bg-braskick-verde/20 rounded-3xl flex items-center justify-center">
                      <Users className="w-10 h-10 text-braskick-verde" />
                    </div>
                    <div>
                      <h2 className="font-display text-3xl uppercase tracking-widest">Minha Conta</h2>
                      <p className="text-braskick-muted text-xs font-bold uppercase tracking-widest mt-1">Gerencie seu perfil e segurança</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-3">Nome de Usuário</label>
                      <div className="w-full bg-braskick-noite/50 border border-white/5 rounded-2xl p-4 text-white font-display text-xl opacity-70">
                        {user?.user_metadata?.username || user?.email?.split('@')[0]}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-white/5">
                      <h3 className="font-display text-xl uppercase tracking-widest mb-6 text-braskick-ouro">Alterar Senha</h3>
                      
                      {accountMessage && (
                        <div className={`mb-6 p-4 rounded-xl text-xs font-bold uppercase tracking-widest text-center ${accountMessage.type === 'success' ? 'bg-braskick-verde/20 text-braskick-verde' : 'bg-red-500/20 text-red-400'}`}>
                          {accountMessage.text}
                        </div>
                      )}

                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-2">Nova Senha</label>
                          <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-white focus:border-braskick-ouro transition-colors outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-braskick-muted uppercase tracking-widest mb-2">Confirmar Nova Senha</label>
                          <input
                            type="password"
                            value={confirmNewPassword}
                            onChange={(e) => setConfirmNewPassword(e.target.value)}
                            className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-white focus:border-braskick-ouro transition-colors outline-none"
                            placeholder="••••••••"
                          />
                        </div>
                        <button
                          onClick={handleUpdatePassword}
                          className="w-full py-4 bg-braskick-ouro text-braskick-noite font-display text-xl uppercase tracking-widest rounded-2xl hover:bg-yellow-400 transition-all font-bold mt-4"
                        >
                          SALVAR ALTERAÇÕES
                        </button>
                      </div>
                    </div>

                    <div className="pt-10 border-t border-white/5">
                      <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-display text-xl uppercase tracking-widest rounded-2xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-3"
                      >
                        <LogOut className="w-5 h-5" />
                        SAIR DA CONTA
                      </button>
                    </div>
                  </div>
                </div>
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

        {showMatchChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-braskick-noite/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-braskick-noite2 border border-braskick-noite3 rounded-[2rem] p-8 max-w-md w-full shadow-2xl text-center"
            >
              <Trophy className="w-16 h-16 text-braskick-ouro mx-auto mb-6" />
              <h2 className="font-display text-3xl uppercase tracking-widest mb-2">DIA DE JOGO!</h2>
              <p className="text-braskick-muted text-sm uppercase tracking-widest mb-8">Como você deseja proceder para a partida de hoje?</p>
              
              <div className="space-y-4">
                <button
                  onClick={() => simulateNextWeek(true)}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-display text-xl uppercase tracking-widest rounded-2xl transition-all border border-white/5"
                >
                  Simulação Rápida
                </button>
                <button
                  onClick={startWatchingMatch}
                  className="w-full py-4 bg-braskick-verde hover:bg-emerald-500 text-braskick-noite font-display text-xl uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-braskick-verde/20"
                >
                  Assistir e Comandar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {isWatchingMatch && matchSimulationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[110] bg-braskick-noite flex flex-col"
          >
            {/* Placar Superior */}
            <div className="bg-braskick-noite2 border-b border-white/5 p-4 sm:p-6">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  <TeamDisplay team={matchSimulationData.homeTeam} size="small" />
                  <div className="hidden sm:block font-display text-xl uppercase tracking-wider truncate">{matchSimulationData.homeTeam.name}</div>
                </div>
                
                <div className="flex flex-col items-center px-4 sm:px-8">
                  <div className="text-braskick-ouro font-display text-xl sm:text-2xl mb-1">{matchSimulationData.time}'</div>
                  <div className="bg-braskick-noite rounded-xl px-4 sm:px-6 py-2 border border-white/10 font-display text-3xl sm:text-5xl italic flex items-center gap-2 sm:gap-4">
                    <span>{matchSimulationData.homeScore}</span>
                    <span className="text-white/20">-</span>
                    <span>{matchSimulationData.awayScore}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-1 justify-end">
                  <div className="hidden sm:block font-display text-xl uppercase tracking-wider truncate text-right">{matchSimulationData.awayTeam.name}</div>
                  <TeamDisplay team={matchSimulationData.awayTeam} size="small" />
                </div>
              </div>
            </div>

            {/* Campo de Jogo (Visualização) */}
            <div className="flex-1 relative overflow-hidden p-4 flex items-center justify-center bg-braskick-noite">
              <div className="w-full max-w-4xl aspect-[3/2] bg-[#2d5a27] rounded-lg border-4 border-white/20 relative shadow-2xl overflow-hidden">
                {/* Grama (Padrão de Listras) */}
                <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 10%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.1) 20%)' }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 10%, rgba(0,0,0,0.1) 10%, rgba(0,0,0,0.1) 20%)' }} />
                
                {/* Linhas do Campo */}
                <div className="absolute inset-0 border-2 border-white/40" />
                <div className="absolute inset-y-0 left-1/2 w-0.5 bg-white/40" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 border-2 border-white/40 rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/60 rounded-full" />
                
                {/* Áreas */}
                <div className="absolute inset-y-1/4 left-0 w-20 border-2 border-l-0 border-white/40" />
                <div className="absolute inset-y-1/4 right-0 w-20 border-2 border-r-0 border-white/40" />
                <div className="absolute inset-y-[35%] left-0 w-8 border-2 border-l-0 border-white/40" />
                <div className="absolute inset-y-[35%] right-0 w-8 border-2 border-r-0 border-white/40" />
                
                {/* Gols */}
                <div className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-16 bg-white/20 border border-white/40 rounded-r-lg" />
                <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-16 bg-white/20 border border-white/40 rounded-l-lg" />

                {/* Efeito de Apito (Visual) */}
                <AnimatePresence>
                  {matchSimulationData.events.length > 0 && matchSimulationData.events[matchSimulationData.events.length - 1].minute === matchSimulationData.time && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0, 1, 0] }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none"
                    >
                      <div className="bg-braskick-ouro text-braskick-noite px-6 py-2 rounded-full font-display text-2xl uppercase tracking-widest shadow-2xl">
                        PIIIIII!
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Jogadores */}
                {matchSimulationData.playerPositions.map((p) => (
                  <motion.div
                    key={p.id}
                    animate={{ x: `${p.x}%`, y: `${p.y}%` }}
                    transition={{ type: 'spring', stiffness: 50, damping: 20 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10"
                    style={{ left: 0, top: 0 }}
                  >
                    <div 
                      className="w-3 h-3 sm:w-4 sm:h-4 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                      style={{ backgroundColor: p.color }}
                    >
                      <div className="w-1 h-1 bg-white/50 rounded-full" />
                    </div>
                    <span className="text-[6px] sm:text-[8px] font-bold text-white bg-black/50 px-1 rounded mt-0.5 whitespace-nowrap uppercase tracking-tighter">
                      {p.name.split(' ').pop()}
                    </span>
                  </motion.div>
                ))}

                {/* Bola */}
                <motion.div
                  animate={{ x: `${matchSimulationData.ball.x}%`, y: `${matchSimulationData.ball.y}%` }}
                  transition={{ type: 'spring', stiffness: 100, damping: 10 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                  style={{ left: 0, top: 0 }}
                >
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full shadow-2xl border border-black/20 flex items-center justify-center">
                    <div className="w-full h-full rounded-full border border-black/10" style={{ backgroundImage: 'radial-gradient(circle, #fff 0%, #ddd 100%)' }} />
                  </div>
                </motion.div>
                
                {/* Legenda de Eventos */}
                <div className="absolute top-4 right-4 z-30 flex flex-col gap-1">
                   <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[8px] text-white/70 uppercase font-bold tracking-widest">
                     <Zap className="w-2 h-2 text-braskick-ouro" /> Gol
                   </div>
                   <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[8px] text-white/70 uppercase font-bold tracking-widest">
                     <div className="w-1.5 h-2 bg-yellow-500 rounded-sm" /> Amarelo
                   </div>
                   <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm px-2 py-1 rounded text-[8px] text-white/70 uppercase font-bold tracking-widest">
                     <div className="w-1.5 h-2 bg-red-500 rounded-sm" /> Vermelho
                   </div>
                </div>

                {/* Eventos Recentes */}
                <div className="absolute bottom-4 left-4 right-4 z-30">
                  <AnimatePresence mode="popLayout">
                    {matchSimulationData.events.slice(-3).reverse().map((event, i) => (
                      <motion.div
                        key={event.minute + i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="bg-braskick-noite2/90 backdrop-blur-sm border border-braskick-ouro/30 p-2 rounded-lg mb-1 flex items-center gap-2 max-w-xs"
                      >
                        {event.type === 'goal' ? <Zap className="w-3 h-3 text-braskick-ouro" /> : 
                         event.type === 'substitution' ? <RotateCcw className="w-3 h-3 text-braskick-verde" /> :
                         event.type === 'red_card' ? <div className="w-3 h-4 bg-red-500 rounded-sm" /> :
                         event.type === 'yellow_card' ? <div className="w-3 h-4 bg-yellow-500 rounded-sm" /> :
                         <AlertTriangle className="w-3 h-3 text-braskick-muted" />}
                        <span className="font-display text-[10px] uppercase tracking-wider text-white">
                          {event.minute}' {
                            event.type === 'goal' ? 'GOL!' : 
                            event.type === 'substitution' ? 'SUBSTITUIÇÃO' :
                            event.type === 'red_card' ? 'VERMELHO!' : 
                            event.type === 'yellow_card' ? 'AMARELO!' :
                            event.type === 'foul' ? 'FALTA' :
                            event.type === 'corner' ? 'ESCANTEIO' :
                            event.type === 'offside' ? 'IMPEDIMENTO' :
                            event.type.toUpperCase()
                          } {event.playerName}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* Painel Tático Inferior */}
            <div className="bg-braskick-noite2 border-t border-white/5 p-4 sm:p-6 overflow-x-auto">
              <div className="max-w-4xl mx-auto flex items-center gap-4 sm:gap-8 min-w-max">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Formação</span>
                  <select 
                    value={matchSimulationData.homeTeam.formation || '4-4-2'}
                    onChange={(e) => {
                      const newFormation = e.target.value as Formation;
                      if (gameState) {
                        setGameState({
                          ...gameState,
                          teams: gameState.teams.map(t => t.id === gameState.userTeamId ? { ...t, formation: newFormation } : t)
                        });
                      }
                      setMatchSimulationData(prev => prev ? { ...prev, homeTeam: { ...prev.homeTeam, formation: newFormation } } : null);
                    }}
                    className="bg-braskick-noite border border-white/10 rounded-lg p-1.5 text-[10px] font-bold uppercase tracking-wider text-white outline-none focus:border-braskick-ouro transition-colors"
                  >
                    <option value="4-4-2">4-4-2</option>
                    <option value="4-3-3">4-3-3</option>
                    <option value="3-5-2">3-5-2</option>
                    <option value="4-5-1">4-5-1</option>
                    <option value="5-3-2">5-3-2</option>
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Mentalidade</span>
                  <div className="flex bg-braskick-noite rounded-lg p-1 border border-white/5">
                    {(['defensive', 'balanced', 'offensive'] as const).map(m => (
                      <button
                        key={m}
                        onClick={() => setMatchSimulationData(prev => prev ? { ...prev, tactics: { ...prev.tactics, mentality: m } } : null)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${matchSimulationData.tactics.mentality === m ? 'bg-braskick-ouro text-braskick-noite' : 'text-braskick-muted hover:text-white'}`}
                      >
                        {m === 'defensive' ? 'Defensivo' : m === 'balanced' ? 'Equilibrado' : 'Ofensivo'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Foco de Jogo</span>
                  <div className="flex bg-braskick-noite rounded-lg p-1 border border-white/5">
                    {(['center', 'sides'] as const).map(f => (
                      <button
                        key={f}
                        onClick={() => setMatchSimulationData(prev => prev ? { ...prev, tactics: { ...prev.tactics, focus: f } } : null)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${matchSimulationData.tactics.focus === f ? 'bg-braskick-ouro text-braskick-noite' : 'text-braskick-muted hover:text-white'}`}
                      >
                        {f === 'center' ? 'Centro' : 'Laterais'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Marcação</span>
                  <div className="flex bg-braskick-noite rounded-lg p-1 border border-white/5">
                    {(['light', 'heavy'] as const).map(i => (
                      <button
                        key={i}
                        onClick={() => setMatchSimulationData(prev => prev ? { ...prev, tactics: { ...prev.tactics, intensity: i } } : null)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${matchSimulationData.tactics.intensity === i ? 'bg-braskick-ouro text-braskick-noite' : 'text-braskick-muted hover:text-white'}`}
                      >
                        {i === 'light' ? 'Leve' : 'Pesada'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => setMatchSimulationData(prev => prev ? { ...prev, isPaused: !prev.isPaused } : null)}
                    className={`p-3 rounded-xl border transition-all flex items-center gap-2 font-display text-[10px] uppercase tracking-widest ${matchSimulationData.isPaused ? 'bg-braskick-ouro text-braskick-noite border-braskick-ouro' : 'bg-white/5 text-white border-white/10 hover:bg-white/10'}`}
                  >
                    {matchSimulationData.isPaused ? <Zap className="w-4 h-4" /> : <Zap className="w-4 h-4 opacity-50" />}
                    {matchSimulationData.isPaused ? 'Continuar' : 'Pausar'}
                  </button>

                  <button
                    onClick={() => {
                      setMatchSimulationData(prev => prev ? { ...prev, isPaused: true } : null);
                      setShowSubstitutions(true);
                    }}
                    className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all flex items-center gap-2 font-display text-[10px] uppercase tracking-widest"
                  >
                    <Users className="w-4 h-4" />
                    Substituir
                  </button>

                  <button
                    onClick={() => simulateNextWeek(true)}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-3 rounded-xl border border-red-500/20 font-display text-[10px] uppercase tracking-widest transition-all"
                  >
                    Pular Jogo
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {showSubstitutions && matchSimulationData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-braskick-noite/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-braskick-noite2 border border-white/10 rounded-[2rem] p-6 sm:p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-2xl uppercase tracking-widest">Substituições</h2>
                <button 
                  onClick={() => {
                    setShowSubstitutions(false);
                    setMatchSimulationData(prev => prev ? { ...prev, isPaused: false } : null);
                  }}
                  className="p-2 hover:bg-white/5 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-4">Titulares em Campo</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {matchSimulationData.homeTeam.players.slice(0, 11).map(player => {
                      const isSubbedOut = matchSimulationData.substitutions.some(s => s.out === player.id);
                      if (isSubbedOut) return null;
                      return (
                        <button
                          key={player.id}
                          onClick={() => {
                            // Lógica de substituição simplificada
                            const bench = matchSimulationData.homeTeam.players.slice(11);
                            const availableSub = bench.find(b => !matchSimulationData.substitutions.some(s => s.in === b.id));
                            if (availableSub) {
                              setMatchSimulationData(prev => {
                                if (!prev) return null;
                                const newSubs = [...prev.substitutions, { out: player.id, in: availableSub.id, minute: prev.time, teamId: prev.homeTeam.id }];
                                const newEvents: MatchEvent[] = [...prev.events, {
                                  minute: prev.time,
                                  type: 'substitution',
                                  playerName: `${player.name} -> ${availableSub.name}`,
                                  teamId: prev.homeTeam.id
                                }];
                                return { ...prev, substitutions: newSubs, events: newEvents };
                              });
                            }
                          }}
                          className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-braskick-noite flex items-center justify-center text-[10px] font-bold border border-white/10">
                              {player.overall}
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase">{player.name}</div>
                              <div className="text-[10px] text-braskick-muted">{player.position}</div>
                            </div>
                          </div>
                          <RotateCcw className="w-4 h-4 text-braskick-ouro opacity-50" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-4">Banco de Reservas</h3>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {matchSimulationData.homeTeam.players.slice(11).map(player => {
                      const isSubbedIn = matchSimulationData.substitutions.some(s => s.in === player.id);
                      return (
                        <div
                          key={player.id}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isSubbedIn ? 'bg-braskick-verde/10 border-braskick-verde/20 opacity-50' : 'bg-white/5 border-white/5'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-braskick-noite flex items-center justify-center text-[10px] font-bold border border-white/10">
                              {player.overall}
                            </div>
                            <div>
                              <div className="text-xs font-bold uppercase">{player.name}</div>
                              <div className="text-[10px] text-braskick-muted">{player.position}</div>
                            </div>
                          </div>
                          {isSubbedIn && <span className="text-[8px] font-bold text-braskick-verde uppercase tracking-widest">Em Campo</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setShowSubstitutions(false);
                  setMatchSimulationData(prev => prev ? { ...prev, isPaused: false } : null);
                }}
                className="w-full mt-8 py-4 bg-braskick-ouro text-braskick-noite font-display text-lg uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-braskick-ouro/20"
              >
                Confirmar e Voltar ao Jogo
              </button>
            </motion.div>
          </motion.div>
        )}

        {showTips && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-braskick-noite/95 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-braskick-noite2 border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Lightbulb className="w-8 h-8 text-braskick-ouro" />
                  <h2 className="font-display text-2xl uppercase tracking-widest">Dicas de Evolução</h2>
                </div>
                <button 
                  onClick={() => setShowTips(false)}
                  className="p-2 hover:bg-white/5 rounded-full transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <h3 className="text-braskick-ouro text-xs font-bold uppercase tracking-widest mb-2">Treinamento Focado</h3>
                  <p className="text-braskick-muted text-[10px] leading-relaxed">
                    Realize treinamentos diários para aumentar os atributos específicos da sua posição. Atacantes devem focar em finalização, enquanto defensores em marcação.
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <h3 className="text-braskick-ouro text-xs font-bold uppercase tracking-widest mb-2">Descanso é Fundamental</h3>
                  <p className="text-braskick-muted text-[10px] leading-relaxed">
                    Não exagere nos treinos antes de jogos importantes. Jogadores cansados rendem menos e têm mais chances de lesão.
                  </p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <h3 className="text-braskick-ouro text-xs font-bold uppercase tracking-widest mb-2">Desempenho em Campo</h3>
                  <p className="text-braskick-muted text-[10px] leading-relaxed">
                    Boas notas nos jogos aceleram sua evolução. Tente manter uma média alta para atrair olhares de clubes maiores.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowTips(false)}
                className="w-full mt-8 py-4 bg-braskick-ouro text-braskick-noite font-display text-lg uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-braskick-ouro/20"
              >
                Entendido
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
              className="bg-braskick-noite2 border border-braskick-noite3 rounded-[1.5rem] sm:rounded-[2.5rem] p-6 sm:p-10 max-w-2xl w-full shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-braskick-verde via-braskick-ouro to-braskick-azul" />

              <div className="text-center mb-6 sm:mb-10">
                <div className="font-display text-xs sm:text-xl text-braskick-muted mb-4 sm:mb-6 tracking-[0.2em] sm:tracking-[0.3em] uppercase">RELATÓRIO DA PARTIDA • RODADA {gameState.currentWeek - 1}</div>
                <div className="flex items-center justify-between sm:justify-around py-4 sm:py-8 bg-braskick-noite/50 rounded-2xl sm:rounded-[2rem] border border-white/5 px-2">
                  <div className="flex flex-col items-center gap-2">
                    <TeamDisplay team={gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)} size="large" />
                    <span className="font-display text-xs text-braskick-muted uppercase tracking-widest">{gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name}</span>
                  </div>
                  <div className="font-display text-4xl sm:text-7xl italic flex items-center gap-2 sm:gap-6">
                    <span className={lastMatchResult.homeScore > lastMatchResult.awayScore ? 'text-white' : 'text-braskick-muted'}>{lastMatchResult.homeScore}</span>
                    <span className="text-braskick-noite3">-</span>
                    <span className={lastMatchResult.awayScore > lastMatchResult.homeScore ? 'text-white' : 'text-braskick-muted'}>{lastMatchResult.awayScore}</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <TeamDisplay team={gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)} size="large" />
                    <span className="font-display text-xs text-braskick-muted uppercase tracking-widest">{gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 sm:mb-10">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Gols e Eventos</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {lastMatchResult.events.map((event, i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/5 border border-white/5">
                        <span className="font-display text-sm text-braskick-muted">{event.minute}'</span>
                        {event.type === 'goal' ? <Zap className="w-3 h-3 text-braskick-ouro" /> : <AlertTriangle className={`w-3 h-3 ${event.type === 'red_card' ? 'text-red-500' : 'text-yellow-500'}`} />}
                        <div className="flex-1">
                          <span className="font-display text-sm block leading-none">{event.playerName}</span>
                          <span className="text-[8px] font-bold text-braskick-muted uppercase tracking-widest">
                            {event.type === 'goal' ? 'GOL' : event.type === 'red_card' ? 'EXPULSÃO' : 'CARTÃO AMARELO'} • {gameState.teams.find(t => t.id === event.teamId)?.name}
                          </span>
                        </div>
                      </div>
                    ))}
                    {lastMatchResult.events.length === 0 && (
                      <div className="text-center py-4 text-braskick-muted font-display text-xs uppercase tracking-widest opacity-50">SEM EVENTOS REGISTRADOS</div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Estatísticas</h4>
                  <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold">
                      <span>{gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.overall}</span>
                      <span className="text-braskick-muted">FORÇA EQUIPE</span>
                      <span>{gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.overall}</span>
                    </div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden flex">
                      <div 
                        className="h-full bg-braskick-verde" 
                        style={{ width: `${(gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.overall || 50) / ((gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.overall || 50) + (gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.overall || 50)) * 100}%` }} 
                      />
                      <div 
                        className="h-full bg-braskick-ouro" 
                        style={{ width: `${(gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.overall || 50) / ((gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.overall || 50) + (gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.overall || 50)) * 100}%` }} 
                      />
                    </div>
                    <div className="text-center mt-4">
                      <span className="text-[10px] font-bold text-braskick-verde uppercase tracking-widest">PARTIDA FINALIZADA</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowMatchResult(false)}
                className="w-full py-4 sm:py-5 bg-braskick-verde hover:bg-emerald-500 text-white font-display text-lg sm:text-2xl uppercase tracking-widest rounded-xl sm:rounded-2xl shadow-xl shadow-braskick-verde/20 transition-all active:scale-95"
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

        {showTips && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-braskick-noite/90 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="max-w-md w-full bg-braskick-noite2 border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-braskick-ouro/5 -rotate-45 translate-x-16 -translate-y-16" />
              <div className="relative">
                <div className="w-16 h-16 bg-braskick-ouro/20 rounded-2xl flex items-center justify-center mb-6">
                  <Lightbulb className="w-8 h-8 text-braskick-ouro" />
                </div>
                <h2 className="text-2xl font-display mb-2 uppercase tracking-widest">Dicas de Evolução</h2>
                <p className="text-braskick-muted text-sm mb-8">Confira algumas dicas para melhorar seu desempenho e subir seu overall.</p>
                
                <div className="space-y-4 mb-8">
                  {[
                    "Treine finalização para aumentar seu faro de gol.",
                    "Mantenha uma boa forma física para evitar lesões.",
                    "Melhore seu passe para criar mais assistências.",
                    "Foque em defesa se quiser ser um pilar no time.",
                    "O overall sobe mais rápido com treinos regulares.",
                    "Propostas de clubes maiores virão com boas atuações."
                  ].map((tip, i) => (
                    <div key={i} className="flex gap-4 items-start p-4 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-braskick-ouro/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-braskick-ouro">{i + 1}</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setShowTips(false)}
                  className="w-full py-4 bg-braskick-ouro text-braskick-noite font-display text-lg rounded-xl hover:bg-yellow-400 transition-all font-bold tracking-widest uppercase"
                >
                  ENTENDI
                </button>
              </div>
            </motion.div>
          </div>
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
      className={`w-full flex items-center gap-3 lg:gap-4 px-4 lg:px-5 py-3 lg:py-4 rounded-xl lg:rounded-2xl transition-all group relative overflow-hidden ${active
        ? 'bg-braskick-verde/10 text-braskick-verde border border-braskick-verde/20'
        : 'text-braskick-muted hover:bg-white/5 hover:text-braskick-texto'
        }`}
    >
      {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-braskick-verde" />}
      <span className={`${active ? 'text-braskick-verde' : 'text-braskick-muted group-hover:text-braskick-texto'}`}>
        {icon}
      </span>
      <span className="font-display text-lg lg:text-xl tracking-wider">{label}</span>
      {active && <ChevronRight className="ml-auto w-4 h-4" />}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="braskick-card group hover:border-white/10 transition-all flex flex-col items-center text-center p-4 lg:p-6 min-h-[120px] lg:min-h-[160px] justify-center relative overflow-hidden">
      <div className="absolute top-0 right-0 w-12 lg:w-16 h-12 lg:h-16 bg-white/5 -rotate-45 translate-x-6 lg:translate-x-8 -translate-y-6 lg:-translate-y-8" />
      <div className="p-2 lg:p-3 rounded-xl lg:rounded-2xl bg-white/5 group-hover:bg-white/10 transition-colors mb-2 lg:mb-4 relative z-10">
        {icon}
      </div>
      <div className="text-2xl lg:text-4xl font-display italic leading-none mb-1 lg:mb-2 relative z-10">{value}</div>
      <span className="text-[8px] lg:text-[10px] font-bold text-braskick-muted uppercase tracking-[0.2em] relative z-10">{label}</span>
    </div>
  );
}

function TeamDisplay({ team, size = 'large' }: { team: Team | undefined, size?: 'small' | 'large' }) {
  if (!team) return null;
  const isWhite = team.color.toLowerCase() === '#ffffff' || team.color.toLowerCase() === 'white';
  const logoSize = size === 'large' ? 'w-12 h-12 sm:w-20 sm:h-20' : 'w-8 h-8 sm:w-12 sm:h-12';
  const textSize = size === 'large' ? 'text-sm sm:text-xl' : 'text-[10px] sm:text-sm';
  const borderRadius = team.logo ? 'rounded-lg sm:rounded-2xl' : 'rounded-full';
  
  return (
    <div className="text-center group flex flex-col items-center">
      <div className={`${logoSize} ${borderRadius} mb-2 sm:mb-4 flex items-center justify-center text-xl sm:text-4xl font-display shadow-2xl transition-transform group-hover:scale-110 overflow-hidden border border-white/10`} style={{ backgroundColor: team.color, color: isWhite ? '#000000' : '#ffffff' }}>
        {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : team.name.substring(0, 1)}
      </div>
      <div className={`font-display ${textSize} uppercase tracking-wider truncate max-w-[80px] sm:max-w-[120px]`}>{team.name}</div>
    </div>
  );
}
