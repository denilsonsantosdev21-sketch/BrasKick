import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  TrendingUp, 
  ShoppingCart, 
  Play, 
  ChevronRight, 
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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Team, Match, Player, GameState } from './types';
import { simulateMatch, updateStandings, generateInitialTeams, generateSchedule } from './gameEngine';

export default function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'squad' | 'league' | 'market' | 'history' | 'fixtures'>('dashboard');
  const [isSimulating, setIsSimulating] = useState(false);
  const [lastMatchResult, setLastMatchResult] = useState<Match | null>(null);
  const [showMatchResult, setShowMatchResult] = useState(false);
  const [news, setNews] = useState<string[]>(["Bem-vindo ao Kickoff Manager! Escolha seu time para começar."]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Initialize game
  const startGame = (teamId: string) => {
    const teams = generateInitialTeams();
    const schedule = generateSchedule(teams);
    setGameState({
      userTeamId: teamId,
      teams,
      currentWeek: 1,
      totalWeeks: (teams.length - 1) * 2,
      matches: schedule,
      history: []
    });
    setNews(prev => [...prev, `Você assumiu o comando do ${teams.find(t => t.id === teamId)?.name}!`]);
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

  const standings = useMemo(() => {
    if (!gameState) return [];
    return [...gameState.teams].sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      return b.gf - a.gf;
    });
  }, [gameState]);

  const simulateNextWeek = async () => {
    if (!gameState || isSimulating) return;
    setIsSimulating(true);

    // Simulate all matches for the current week
    const matchesToSimulate = gameState.matches.filter(m => m.week === gameState.currentWeek);
    let updatedTeams = [...gameState.teams];
    const simulatedMatches: Match[] = [];

    matchesToSimulate.forEach(match => {
      const home = updatedTeams.find(t => t.id === match.homeTeamId)!;
      const away = updatedTeams.find(t => t.id === match.awayTeamId)!;
      const result = simulateMatch(home, away, gameState.currentWeek);
      simulatedMatches.push(result);
      updatedTeams = updateStandings(updatedTeams, result);
    });

    const userMatch = simulatedMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId);
    setLastMatchResult(userMatch || null);
    setShowMatchResult(true);

    setGameState(prev => {
      if (!prev) return null;
      const updatedMatches = prev.matches.map(m => {
        const sim = simulatedMatches.find(sm => sm.id === m.id);
        return sim ? { ...sim, played: true } : m;
      });
      return {
        ...prev,
        teams: updatedTeams,
        currentWeek: prev.currentWeek + 1,
        matches: updatedMatches,
        history: [...simulatedMatches, ...prev.history]
      };
    });

    // Add some random news
    if (userMatch) {
      const won = (userMatch.homeTeamId === gameState.userTeamId && userMatch.homeScore > userMatch.awayScore) || 
                  (userMatch.awayTeamId === gameState.userTeamId && userMatch.awayScore > userMatch.homeScore);
      const drawn = userMatch.homeScore === userMatch.awayScore;
      
      if (won) setNews(prev => [...prev, `Grande vitória do ${userTeam?.name}! A torcida está em festa.`]);
      else if (drawn) setNews(prev => [...prev, `Empate suado para o ${userTeam?.name}.`]);
      else setNews(prev => [...prev, `Derrota amarga do ${userTeam?.name}. O técnico precisa rever a tática.`]);
    }

    setIsSimulating(false);
  };

  if (!gameState) {
    const teams = generateInitialTeams();
    return (
      <div className="min-h-screen bg-neutral-950 text-white p-6 flex flex-col items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl w-full text-center"
        >
          <div className="mb-8 inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <Trophy className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase italic">KICKOFF MANAGER</h1>
          <p className="text-neutral-400 mb-12">Escolha seu clube e comece sua jornada rumo ao topo.</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-4 scrollbar-hide">
            {teams.map(team => (
              <button
                key={team.id}
                onClick={() => startGame(team.id)}
                className="p-4 bg-neutral-900 border border-neutral-800 rounded-xl hover:border-emerald-500/50 transition-all group text-left"
              >
                <div className="w-8 h-8 rounded-full mb-3" style={{ backgroundColor: team.color }} />
                <div className="font-bold text-sm mb-1 truncate">{team.name}</div>
                <div className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">OVR {team.overall}</div>
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-neutral-950 text-neutral-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-neutral-950 border-r border-neutral-900 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-neutral-950" />
            </div>
            <span className="font-black text-lg tracking-tighter uppercase italic">KICKOFF</span>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden ml-auto">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="space-y-1 flex-1">
            <SidebarItem active={activeTab === 'dashboard'} icon={<TrendingUp className="w-4 h-4" />} label="Dashboard" onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'squad'} icon={<Users className="w-4 h-4" />} label="Elenco" onClick={() => { setActiveTab('squad'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'league'} icon={<BarChart3 className="w-4 h-4" />} label="Tabela" onClick={() => { setActiveTab('league'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'fixtures'} icon={<Calendar className="w-4 h-4" />} label="Calendário" onClick={() => { setActiveTab('fixtures'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'market'} icon={<ShoppingCart className="w-4 h-4" />} label="Mercado" onClick={() => { setActiveTab('market'); setIsSidebarOpen(false); }} />
            <SidebarItem active={activeTab === 'history'} icon={<HistoryIcon className="w-4 h-4" />} label="Histórico" onClick={() => { setActiveTab('history'); setIsSidebarOpen(false); }} />
          </nav>

          <div className="mt-auto pt-6 border-t border-neutral-900">
            <div className="bg-neutral-900/50 rounded-xl p-4 border border-neutral-800/50">
              <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Orçamento</div>
              <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold">
                <DollarSign className="w-4 h-4" />
                {(userTeam?.budget || 0).toLocaleString('pt-BR')}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 border-b border-neutral-900 flex items-center justify-between px-6 bg-neutral-950/50 backdrop-blur-xl z-20">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: userTeam?.color }} />
              <h2 className="font-bold text-sm uppercase tracking-wider">{userTeam?.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">
              <div className="flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-500" />
                ATA {userTeam?.attack}
              </div>
              <div className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-blue-500" />
                MEI {userTeam?.midfield}
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                DEF {userTeam?.defense}
              </div>
            </div>

            <button 
              onClick={simulateNextWeek}
              disabled={isSimulating}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              PRÓX. RODADA
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' && (
              <motion.div 
                key="dashboard"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
              >
                {/* Main Stats */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="Posição" value={`${standings.findIndex(t => t.id === gameState.userTeamId) + 1}º`} icon={<Trophy className="w-4 h-4 text-emerald-500" />} />
                    <StatCard label="Pontos" value={userTeam?.points || 0} icon={<BarChart3 className="w-4 h-4 text-blue-500" />} />
                    <StatCard label="Vitórias" value={userTeam?.won || 0} icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />} />
                    <StatCard label="Derrotas" value={userTeam?.lost || 0} icon={<ArrowDownRight className="w-4 h-4 text-red-500" />} />
                  </div>

                  {/* Next Match */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Próximo Confronto — Rodada {gameState.currentWeek}
                      </h3>
                    </div>
                    {currentWeekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId) ? (
                      <div className="flex items-center justify-around py-4">
                        <TeamDisplay team={gameState.teams.find(t => t.id === currentWeekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId)?.homeTeamId)!} />
                        <div className="text-2xl font-black text-neutral-700 italic">VS</div>
                        <TeamDisplay team={gameState.teams.find(t => t.id === currentWeekMatches.find(m => m.homeTeamId === gameState.userTeamId || m.awayTeamId === gameState.userTeamId)?.awayTeamId)!} />
                      </div>
                    ) : (
                      <div className="text-center py-8 text-neutral-500 font-bold uppercase tracking-widest text-xs">Fim da Temporada</div>
                    )}
                  </div>

                  {/* Upcoming Schedule */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-6">
                      <HistoryIcon className="w-4 h-4" />
                      Sequência de Jogos
                    </h3>
                    <div className="space-y-3">
                      {upcomingMatches.slice(1).map((match, i) => {
                        const isHome = match.homeTeamId === gameState.userTeamId;
                        const opponent = gameState.teams.find(t => t.id === (isHome ? match.awayTeamId : match.homeTeamId))!;
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/50">
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-neutral-600">R{match.week}</span>
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: opponent.color }} />
                              <span className="text-xs font-bold">{opponent.name}</span>
                            </div>
                            <span className="text-[10px] font-bold text-neutral-500 uppercase">{isHome ? 'Casa' : 'Fora'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* News Feed */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 flex items-center gap-2 mb-6">
                      <Newspaper className="w-4 h-4" />
                      Notícias do Clube
                    </h3>
                    <div className="space-y-4">
                      {news.slice(-5).reverse().map((item, i) => (
                        <div key={i} className="flex gap-4 p-3 rounded-xl bg-neutral-950/50 border border-neutral-800/50">
                          <div className="w-1 h-full bg-emerald-500 rounded-full" />
                          <p className="text-sm text-neutral-300">{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mini Standings */}
                <div className="space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500 mb-6">Classificação</h3>
                    <div className="space-y-2">
                      {standings.slice(0, 10).map((team, i) => (
                        <div key={team.id} className={`flex items-center gap-3 p-2 rounded-lg ${team.id === gameState.userTeamId ? 'bg-emerald-500/10 border border-emerald-500/20' : ''}`}>
                          <span className="text-[10px] font-bold text-neutral-500 w-4">{i + 1}</span>
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="text-xs font-bold truncate flex-1">{team.name}</span>
                          <span className="text-xs font-mono font-bold">{team.points}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab('league')} className="w-full mt-6 py-2 text-[10px] font-bold uppercase tracking-widest text-neutral-500 hover:text-emerald-400 transition-colors">Ver Tabela Completa</button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'squad' && (
              <motion.div 
                key="squad"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-950/50 border-b border-neutral-800">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Jogador</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">Pos</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">Idade</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">OVR</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">Gols</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userTeam?.players.map(player => (
                      <tr key={player.id} className="border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors">
                        <td className="p-4 font-bold text-sm">{player.name}</td>
                        <td className="p-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            player.position === 'GK' ? 'bg-yellow-500/10 text-yellow-500' :
                            player.position === 'DF' ? 'bg-emerald-500/10 text-emerald-500' :
                            player.position === 'MF' ? 'bg-blue-500/10 text-blue-500' :
                            'bg-red-500/10 text-red-500'
                          }`}>
                            {player.position}
                          </span>
                        </td>
                        <td className="p-4 text-center text-sm text-neutral-400">{player.age}</td>
                        <td className="p-4 text-center font-mono font-bold text-emerald-400">{player.overall}</td>
                        <td className="p-4 text-center text-sm">{player.goals}</td>
                        <td className="p-4 text-right font-mono text-xs text-neutral-400">R$ {(player.value / 1000000).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'league' && (
              <motion.div 
                key="league"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-950/50 border-b border-neutral-800">
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 w-12">#</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500">Equipe</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">P</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">J</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">V</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">E</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">D</th>
                      <th className="p-4 text-[10px] font-bold uppercase tracking-widest text-neutral-500 text-center">SG</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((team, i) => (
                      <tr key={team.id} className={`border-b border-neutral-800/50 hover:bg-neutral-800/30 transition-colors ${team.id === gameState.userTeamId ? 'bg-emerald-500/5' : ''}`}>
                        <td className="p-4 text-xs font-bold text-neutral-500">{i + 1}</td>
                        <td className="p-4 flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                          <span className="font-bold text-sm">{team.name}</span>
                        </td>
                        <td className="p-4 text-center font-bold text-emerald-400">{team.points}</td>
                        <td className="p-4 text-center text-sm text-neutral-400">{team.played}</td>
                        <td className="p-4 text-center text-sm">{team.won}</td>
                        <td className="p-4 text-center text-sm">{team.drawn}</td>
                        <td className="p-4 text-center text-sm">{team.lost}</td>
                        <td className="p-4 text-center text-sm font-mono">{team.gd > 0 ? `+${team.gd}` : team.gd}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'fixtures' && (
              <motion.div 
                key="fixtures"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {Array.from({ length: gameState.totalWeeks }, (_, i) => i + 1).map(week => {
                  const weekMatches = gameState.matches.filter(m => m.week === week);
                  return (
                    <div key={week} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                      <div className="bg-neutral-950/50 p-4 border-b border-neutral-800 flex items-center justify-between">
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-neutral-500">Rodada {week}</h3>
                        {week < gameState.currentWeek && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Finalizada</span>}
                        {week === gameState.currentWeek && <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Atual</span>}
                      </div>
                      <div className="divide-y divide-neutral-800/50">
                        {weekMatches.map(match => {
                          const home = gameState.teams.find(t => t.id === match.homeTeamId)!;
                          const away = gameState.teams.find(t => t.id === match.awayTeamId)!;
                          const isUserMatch = home.id === gameState.userTeamId || away.id === gameState.userTeamId;
                          return (
                            <div key={match.id} className={`p-4 flex items-center justify-between hover:bg-neutral-800/30 transition-colors ${isUserMatch ? 'bg-emerald-500/5' : ''}`}>
                              <div className="flex items-center gap-3 flex-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: home.color }} />
                                <span className={`text-xs font-bold ${home.id === gameState.userTeamId ? 'text-emerald-400' : ''}`}>{home.name}</span>
                              </div>
                              <div className="flex items-center gap-4 px-4">
                                {match.played ? (
                                  <div className="text-sm font-black italic flex items-center gap-2">
                                    <span className={match.homeScore > match.awayScore ? 'text-white' : 'text-neutral-500'}>{match.homeScore}</span>
                                    <span className="text-neutral-700">-</span>
                                    <span className={match.awayScore > match.homeScore ? 'text-white' : 'text-neutral-500'}>{match.awayScore}</span>
                                  </div>
                                ) : (
                                  <div className="text-[10px] font-bold text-neutral-700 uppercase tracking-widest">VS</div>
                                )}
                              </div>
                              <div className="flex items-center gap-3 flex-1 justify-end">
                                <span className={`text-xs font-bold ${away.id === gameState.userTeamId ? 'text-emerald-400' : ''}`}>{away.name}</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: away.color }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
            {activeTab === 'history' && (
              <motion.div 
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                {gameState.history.length === 0 ? (
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-12 text-center">
                    <HistoryIcon className="w-12 h-12 text-neutral-800 mx-auto mb-4" />
                    <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Nenhuma partida disputada ainda</p>
                  </div>
                ) : (
                  gameState.history.map(match => {
                    const home = gameState.teams.find(t => t.id === match.homeTeamId)!;
                    const away = gameState.teams.find(t => t.id === match.awayTeamId)!;
                    const isUserMatch = home.id === gameState.userTeamId || away.id === gameState.userTeamId;
                    const userWon = (home.id === gameState.userTeamId && match.homeScore > match.awayScore) || 
                                    (away.id === gameState.userTeamId && match.awayScore > match.homeScore);
                    const userLost = (home.id === gameState.userTeamId && match.homeScore < match.awayScore) || 
                                     (away.id === gameState.userTeamId && match.awayScore < match.homeScore);
                    
                    return (
                      <div key={match.id} className={`bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex items-center justify-between ${isUserMatch ? 'border-l-4 border-l-emerald-500' : ''}`}>
                        <div className="flex flex-col gap-1 w-16">
                          <span className="text-[10px] font-bold text-neutral-500 uppercase">Rodada {match.week}</span>
                          {isUserMatch && (
                            <span className={`text-[10px] font-bold uppercase ${userWon ? 'text-emerald-500' : userLost ? 'text-red-500' : 'text-yellow-500'}`}>
                              {userWon ? 'Vitória' : userLost ? 'Derrota' : 'Empate'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 flex-1 justify-center">
                          <div className="flex items-center gap-3 flex-1 justify-end">
                            <span className="text-xs font-bold truncate">{home.name}</span>
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: home.color }} />
                          </div>
                          <div className="text-xl font-black italic flex items-center gap-3 bg-neutral-950 px-4 py-1 rounded-lg">
                            <span>{match.homeScore}</span>
                            <span className="text-neutral-800">-</span>
                            <span>{match.awayScore}</span>
                          </div>
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: away.color }} />
                            <span className="text-xs font-bold truncate">{away.name}</span>
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
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-neutral-500 mb-2">Resultado da Rodada {gameState.currentWeek - 1}</div>
                <div className="flex items-center justify-around py-6">
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white" style={{ backgroundColor: gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.color }}>
                      {gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name.substring(0, 1)}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider">{gameState.teams.find(t => t.id === lastMatchResult.homeTeamId)?.name}</div>
                  </div>
                  <div className="text-5xl font-black italic flex items-center gap-4">
                    <span>{lastMatchResult.homeScore}</span>
                    <span className="text-neutral-700">-</span>
                    <span>{lastMatchResult.awayScore}</span>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center text-2xl font-black text-white" style={{ backgroundColor: gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.color }}>
                      {gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name.substring(0, 1)}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-wider">{gameState.teams.find(t => t.id === lastMatchResult.awayTeamId)?.name}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-8 max-h-40 overflow-y-auto pr-2">
                {lastMatchResult.events.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="font-mono text-neutral-500 w-6">{event.minute}'</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="font-bold">{event.playerName}</span>
                    <span className="text-neutral-500">marcou para o {gameState.teams.find(t => t.id === event.teamId)?.name}</span>
                  </div>
                ))}
                {lastMatchResult.events.length === 0 && (
                  <div className="text-center py-4 text-neutral-500 text-xs font-bold uppercase tracking-widest">Sem gols na partida</div>
                )}
              </div>

              <button 
                onClick={() => setShowMatchResult(false)}
                className="w-full py-4 bg-white text-neutral-950 font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-neutral-200 transition-colors"
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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
        active 
          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
          : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300'
      }`}
    >
      <span className={`${active ? 'text-emerald-400' : 'text-neutral-600 group-hover:text-neutral-400'}`}>
        {icon}
      </span>
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,1)]" />}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">{label}</span>
        {icon}
      </div>
      <div className="text-2xl font-black italic">{value}</div>
    </div>
  );
}

function TeamDisplay({ team }: { team: Team | undefined }) {
  if (!team) return null;
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center text-xl font-black text-white" style={{ backgroundColor: team.color }}>
        {team.name.substring(0, 1)}
      </div>
      <div className="text-[10px] font-bold uppercase tracking-widest">{team.name}</div>
    </div>
  );
}
