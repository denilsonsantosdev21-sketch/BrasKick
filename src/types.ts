export type CompetitionType = 'LEAGUE' | 'TOURNAMENT';

export interface CompetitionRule {
  id: string;
  minPosition: number;
  maxPosition: number;
  targetCompetitionId: string;
  type: 'QUALIFICATION' | 'RELEGATION' | 'PROMOTION';
  description: string;
}

export interface Competition {
  id: string;
  name: string;
  type: CompetitionType;
  format?: 'LEAGUE' | 'GROUPS' | 'KNOCKOUT' | 'GROUPS_KNOCKOUT';
  rules?: string;
  detailedRules?: CompetitionRule[];
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
  groupsCount?: number;
  teamsPerGroup?: number;
  participatingCountries?: string[];
  prizeMoney?: {
    participation: number;
    win: number;
    draw: number;
    position: { [pos: number]: number };
  };
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
  number?: number;
  photo?: string;
  nationality?: string;
  preferredFoot?: 'R' | 'L' | 'B';
  isInjured?: boolean;
  isSuspended?: boolean;
  isCalledUp?: boolean;
  nationalTeamId?: string;
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
  revenue?: number;
  color: string;
  logo?: string;
  form: ('W' | 'D' | 'L')[];
  groupId?: string;
  isNationalTeam?: boolean;
  stadiumCapacity?: number;
  ticketPrice?: number;
  fansCount?: number;
  formation?: Formation;
}

export interface MatchEvent {
  minute: number;
  type: 'goal' | 'yellow_card' | 'red_card' | 'injury' | 'substitution' | 'foul' | 'corner' | 'offside' | 'throw_in';
  playerName: string;
  teamId: string;
  playerNameIn?: string; // For substitutions
}

export interface Match {
  id: string;
  week: number;
  date?: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  played: boolean;
  events: MatchEvent[];
  attendance?: number;
  revenue?: number;
}

export interface JobOffer {
  id: string;
  teamId: string;
  salary: number;
  contractLength: number; // in seasons
  message: string;
  type: 'CLUB' | 'NATIONAL_TEAM';
}

export type Formation = '4-4-2' | '4-3-3' | '3-5-2' | '4-2-3-1' | '5-3-2' | '4-5-1';

export interface GameState {
  userTeamId: string;
  gameMode?: 'MANAGER' | 'PLAYER';
  userPlayerId?: string;
  managerName?: string;
  managerNationality?: string;
  managerAge?: number;
  userNationalTeamId?: string;
  lastTrainedWeek?: number;
  currentDate?: string;
  teams: Team[];
  competitions: Competition[];
  currentWeek: number;
  totalWeeks: number;
  season: number;
  matches: Match[];
  history: Match[];
  coins: number;
  jobOffers?: JobOffer[];
}
