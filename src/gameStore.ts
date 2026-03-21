import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GameState, Team, Match, Player } from './types';

interface GameStore {
  gameState: GameState | null;
  moedas: number;
  dinheiroJogo: number;
  
  // Actions
  setGameState: (state: GameState | null) => void;
  updateTeams: (teams: Team[]) => void;
  addHistory: (matches: Match[]) => void;
  nextWeek: () => void;
  nextSeason: (newTeams: Team[], newSchedule: Match[]) => void;
  adicionarMoedas: (n: number) => void;
  gastarMoedas: (n: number) => boolean;
  buyPlayer: (player: Player, fromTeamId: string, toTeamId: string, price: number) => boolean;
  sellPlayer: (player: Player, fromTeamId: string, price: number) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      gameState: null,
      moedas: 500,
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
          history: [] // Limpa o histórico da temporada anterior para performance ou mantém? Vamos limpar por enquanto.
        } : null
      })),

      adicionarMoedas: (n) => set((state) => ({ moedas: state.moedas + n })),

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
            // Recalcular stats do time
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
            // Recalcular stats do time
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

      gastarMoedas: (n) => {
        const { moedas } = get();
        if (moedas < n) return false;
        set({ moedas: moedas - n });
        return true;
      },

      resetGame: () => set({ gameState: null, moedas: 500, dinheiroJogo: 0 }),
    }),
    {
      name: 'braskick-storage',
    }
  )
);
