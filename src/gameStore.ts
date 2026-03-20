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
