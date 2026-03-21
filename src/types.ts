export type CompetitionType = 'LEAGUE' | 'TOURNAMENT';

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  region: 'BRAZIL' | 'EUROPE' | 'SOUTH_AMERICA' | 'WORLD';
  tier?: number;
  logo?: string;
  countryFlag?: string;
  countryName?: string;
  teamsCount?: number;
  promotionCount?: number;
  relegationCount?: number;
  qualificationSpots?: number;
  playersPerTeam?: number;
  hasPlayoffs?: boolean;
  playoffTeamsCount?: number;
}

export interface Player {
  id: string;
  name: string;
  position: 'GK' | 'DF' | 'MF' | 'FW';
  overall: number;
  age: number;
  value: number;
  goals: number;
  assists: number;
  photo?: string;
}

export interface Team {
  id: string;
  name: string;
  leagueId: string;
  competitionIds?: string[];
  overall: number;
  attack: number;
  midfield: number;
  defense: number;
  players: Player[];
  points: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  budget: number;
  color: string;
  logo?: string;
  form: ('W' | 'D' | 'L')[];
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'injury';
  playerName: string;
  teamId: string;
}

export interface Match {
  id: string;
  week: number;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
  events: MatchEvent[];
}

export interface GameState {
  userTeamId: string;
  teams: Team[];
  competitions: Competition[];
  currentWeek: number;
  totalWeeks: number;
  season: number;
  matches: Match[];
  history: Match[];
}
