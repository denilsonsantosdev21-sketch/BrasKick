export type Position = 'GK' | 'DF' | 'MF' | 'FW';

export interface Player {
  id: string;
  name: string;
  age: number;
  position: Position;
  overall: number;
  nationality: string;
  teamId: string;
  goals: number;
  assists: number;
  value: number;
}

export interface Team {
  id: string;
  name: string;
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  budget: number;
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  players: Player[];
  color: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
  week: number;
  events: MatchEvent[];
}

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'YELLOW' | 'RED' | 'SUB';
  teamId: string;
  playerName: string;
}

export interface GameState {
  userTeamId: string;
  teams: Team[];
  currentWeek: number;
  totalWeeks: number;
  matches: Match[];
  history: Match[];
}
