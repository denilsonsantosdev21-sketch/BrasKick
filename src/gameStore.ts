import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Team, Match, Player, Competition, Formation } from './types';

interface GameStore {
  gameState: GameState | null;
  dinheiroJogo: number;
  
  // Actions
  setGameState: (state: GameState | null) => void;
  updateTeams: (teams: Team[]) => void;
  addHistory: (matches: Match[]) => void;
  nextWeek: () => void;
  nextSeason: (newTeams: Team[], newSchedule: Match[]) => void;
  buyPlayer: (player: Player, fromTeamId: string, toTeamId: string, price: number) => boolean;
  sellPlayer: (player: Player, fromTeamId: string, price: number) => void;
  baseTeams: Team[];
  baseCompetitions: Competition[];
  setBaseTeams: (teams: Team[]) => void;
  setBaseCompetitions: (competitions: Competition[]) => void;
  resetGame: () => void;
  restartSeason: () => void;
  startPlayerCareer: (player: Player, teamId: string) => void;
  
  // Admin Actions
  updateCompetition: (competition: Competition) => void;
  addCompetition: (competition: Competition) => void;
  deleteCompetition: (id: string) => void;
  addTeam: (team: Team) => void;
  updateTeam: (team: Team) => void;
  deleteTeam: (id: string) => void;
  updatePlayer: (teamId: string, player: Player) => void;
  acceptJobOffer: (offerId: string) => void;
  declineJobOffer: (offerId: string) => void;
  updateFormation: (teamId: string, formation: Formation) => void;
  addRevenue: (teamId: string, amount: number) => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      dinheiroJogo: 0,

      setGameState: (state) => set({ gameState: state }),
      
      updateTeams: (teams) => set((state) => ({
        gameState: state.gameState ? { ...state.gameState, teams } : null
      })),

      addHistory: (matches) => set((state) => ({
        gameState: state.gameState ? { 
          ...state.gameState, 
          history: [...matches, ...state.gameState.history] 
        } : null
      })),

      nextWeek: () => set((state) => ({
        gameState: state.gameState ? { 
          ...state.gameState, 
          currentWeek: state.gameState.currentWeek + 1 
        } : null
      })),

      nextSeason: (newTeams, newSchedule) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: newTeams,
          matches: newSchedule,
          currentWeek: 1,
          totalWeeks: Math.max(...newSchedule.map(m => m.week)),
          season: state.gameState.season + 1,
          history: [] 
        } : null
      })),

      buyPlayer: (player, fromTeamId, toTeamId, price) => {
        const { gameState } = get();
        if (!gameState) return false;

        const buyerTeam = gameState.teams.find(t => t.id === toTeamId);
        if (!buyerTeam || buyerTeam.budget < price) return false;

        const updatedTeams = gameState.teams.map(team => {
          if (team.id === fromTeamId) {
            return {
              ...team,
              players: team.players.filter(p => p.id !== player.id),
              budget: team.budget + price
            };
          }
          if (team.id === toTeamId) {
            const newPlayers = [...team.players, player];
            const avgOverall = Math.round(newPlayers.reduce((acc, p) => acc + p.overall, 0) / newPlayers.length);
            const attack = Math.round(newPlayers.filter(p => p.position === 'FW' || p.position === 'MF').reduce((acc, p) => acc + p.overall, 0) / Math.max(1, newPlayers.filter(p => p.position === 'FW' || p.position === 'MF').length));
            const defense = Math.round(newPlayers.filter(p => p.position === 'DF' || p.position === 'GK').reduce((acc, p) => acc + p.overall, 0) / Math.max(1, newPlayers.filter(p => p.position === 'DF' || p.position === 'GK').length));
            
            return {
              ...team,
              players: newPlayers,
              budget: team.budget - price,
              overall: avgOverall,
              attack: attack || avgOverall,
              defense: defense || avgOverall
            };
          }
          return team;
        });

        set({ gameState: { ...gameState, teams: updatedTeams } });
        return true;
      },

      sellPlayer: (player, fromTeamId, price) => {
        const { gameState } = get();
        if (!gameState) return;

        const updatedTeams = gameState.teams.map(team => {
          if (team.id === fromTeamId) {
            const newPlayers = team.players.filter(p => p.id !== player.id);
            const avgOverall = newPlayers.length > 0 ? Math.round(newPlayers.reduce((acc, p) => acc + p.overall, 0) / newPlayers.length) : 0;
            
            return {
              ...team,
              players: newPlayers,
              budget: team.budget + price,
              overall: avgOverall || team.overall
            };
          }
          return team;
        });

        set({ gameState: { ...gameState, teams: updatedTeams } });
      },

      baseTeams: [],
      baseCompetitions: [],
      setBaseTeams: (teams) => set({ baseTeams: teams }),
      setBaseCompetitions: (competitions) => set({ baseCompetitions: competitions }),
      resetGame: () => set({ gameState: null, dinheiroJogo: 0 }),
      restartSeason: () => set((state) => {
        if (!state.gameState) return state;
        const resetTeams = state.gameState.teams.map(t => ({
          ...t,
          points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, form: []
        }));
        return {
          gameState: {
            ...state.gameState,
            currentWeek: 1,
            teams: resetTeams,
            matches: [] // Should be regenerated
          }
        };
      }),

      startPlayerCareer: (player, teamId) => set((state) => {
        if (!state.gameState) return state;
        const newTeams = state.gameState.teams.map(t => {
           if (t.id === teamId) {
              return { ...t, players: [...t.players, player] };
           }
           return t;
        });
        return {
          gameState: {
            ...state.gameState,
            gameMode: 'PLAYER',
            userPlayerId: player.id,
            userTeamId: teamId,
            teams: newTeams
          }
        };
      }),

      updateCompetition: (competition) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          competitions: state.gameState.competitions.map(c => c.id === competition.id ? competition : c)
        } : null
      })),

      addCompetition: (competition) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          competitions: [...state.gameState.competitions, competition]
        } : null
      })),
      
      deleteCompetition: (id) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          competitions: state.gameState.competitions.filter(c => c.id !== id),
          teams: state.gameState.teams.filter(t => t.leagueId !== id),
          matches: state.gameState.matches.filter(m => m.competitionId !== id)
        } : null
      })),

      addTeam: (team) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: [...state.gameState.teams, team]
        } : null
      })),

      updateTeam: (team) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: state.gameState.teams.map(t => t.id === team.id ? team : t)
        } : null
      })),

      deleteTeam: (id) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: state.gameState.teams.filter(t => t.id !== id),
          matches: state.gameState.matches.filter(m => m.homeTeamId !== id && m.awayTeamId !== id)
        } : null
      })),

      updatePlayer: (teamId: string, player: Player) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: state.gameState.teams.map(team => {
            if (team.id === teamId) {
              return {
                ...team,
                players: team.players.map(p => p.id === player.id ? player : p)
              };
            }
            return team;
          })
        } : null
      })),

      acceptJobOffer: (offerId) => set((state) => {
        if (!state.gameState) return state;
        const offer = state.gameState.jobOffers?.find(o => o.id === offerId);
        if (!offer) return state;

        const newTeamId = offer.teamId;
        const updatedJobOffers = state.gameState.jobOffers?.filter(o => o.id !== offerId);

        return {
          gameState: {
            ...state.gameState,
            userTeamId: offer.type === 'CLUB' ? newTeamId : state.gameState.userTeamId,
            userNationalTeamId: offer.type === 'NATIONAL_TEAM' ? newTeamId : state.gameState.userNationalTeamId,
            jobOffers: updatedJobOffers
          }
        };
      }),

      declineJobOffer: (offerId) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          jobOffers: state.gameState.jobOffers?.filter(o => o.id !== offerId)
        } : null
      })),

      updateFormation: (teamId, formation) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: state.gameState.teams.map(t => t.id === teamId ? { ...t, formation } : t)
        } : null
      })),

      addRevenue: (teamId, amount) => set((state) => ({
        gameState: state.gameState ? {
          ...state.gameState,
          teams: state.gameState.teams.map(t => t.id === teamId ? { ...t, budget: t.budget + amount } : t)
        } : null
      })),
    }),
    {
      name: 'braskick-storage',
    }
  )
);
