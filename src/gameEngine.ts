import { Team, Match, MatchEvent, Player } from './types';

export const simulateMatch = (home: Team, away: Team, week: number): Match => {
  const homeAdvantage = 5;
  const homeStrength = (home.attack + home.midfield + home.defense) / 3 + homeAdvantage;
  const awayStrength = (away.attack + away.midfield + away.defense) / 3;

  const totalStrength = homeStrength + awayStrength;
  const homeWinProb = homeStrength / totalStrength;

  // Simple goal simulation
  const simulateGoals = (strength: number, opponentStrength: number) => {
    const baseChance = 0.05; // Base chance per "opportunity"
    const opportunities = 10; // Number of "chances" in a match
    let goals = 0;
    for (let i = 0; i < opportunities; i++) {
      const chance = baseChance * (strength / opponentStrength);
      if (Math.random() < chance) {
        goals++;
      }
    }
    return goals;
  };

  const homeScore = simulateGoals(homeStrength, awayStrength);
  const awayScore = simulateGoals(awayStrength, homeStrength);

  const events: MatchEvent[] = [];
  // Generate some random goal events
  for (let i = 0; i < homeScore; i++) {
    const player = home.players[Math.floor(Math.random() * home.players.length)];
    events.push({
      minute: Math.floor(Math.random() * 90) + 1,
      type: 'GOAL',
      teamId: home.id,
      playerName: player.name
    });
  }
  for (let i = 0; i < awayScore; i++) {
    const player = away.players[Math.floor(Math.random() * away.players.length)];
    events.push({
      minute: Math.floor(Math.random() * 90) + 1,
      type: 'GOAL',
      teamId: away.id,
      playerName: player.name
    });
  }

  events.sort((a, b) => a.minute - b.minute);

  return {
    id: `${home.id}-${away.id}-${week}`,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore,
    awayScore,
    played: true,
    week,
    events
  };
};

export const updateStandings = (teams: Team[], match: Match): Team[] => {
  return teams.map(team => {
    if (team.id === match.homeTeamId) {
      const won = match.homeScore > match.awayScore;
      const drawn = match.homeScore === match.awayScore;
      const lost = match.homeScore < match.awayScore;
      return {
        ...team,
        played: team.played + 1,
        won: team.won + (won ? 1 : 0),
        drawn: team.drawn + (drawn ? 1 : 0),
        lost: team.lost + (lost ? 1 : 0),
        gf: team.gf + match.homeScore,
        ga: team.ga + match.awayScore,
        gd: team.gd + (match.homeScore - match.awayScore),
        points: team.points + (won ? 3 : drawn ? 1 : 0)
      };
    }
    if (team.id === match.awayTeamId) {
      const won = match.awayScore > match.homeScore;
      const drawn = match.awayScore === match.homeScore;
      const lost = match.awayScore < match.homeScore;
      return {
        ...team,
        played: team.played + 1,
        won: team.won + (won ? 1 : 0),
        drawn: team.drawn + (drawn ? 1 : 0),
        lost: team.lost + (lost ? 1 : 0),
        gf: team.gf + match.awayScore,
        ga: team.ga + match.homeScore,
        gd: team.gd + (match.awayScore - match.homeScore),
        points: team.points + (won ? 3 : drawn ? 1 : 0)
      };
    }
    return team;
  });
};

export const generateInitialTeams = (): Team[] => {
  const teamNames = [
    "Flamengo", "Palmeiras", "Atlético-MG", "São Paulo", "Fluminense",
    "Grêmio", "Internacional", "Corinthians", "Fortaleza", "Athletico-PR",
    "Bahia", "Cruzeiro", "Botafogo", "Vasco", "Bragantino",
    "Cuiabá", "Vitória", "Criciúma", "Juventude", "Atlético-GO"
  ];

  const colors = [
    "#E30613", "#006437", "#000000", "#FE0000", "#831D1C",
    "#00AEEF", "#E30613", "#000000", "#004B93", "#E30613",
    "#004B93", "#004B93", "#000000", "#000000", "#E30613",
    "#006437", "#E30613", "#FFD700", "#006437", "#E30613"
  ];

  return teamNames.map((name, i) => {
    const baseOvr = 70 + Math.floor(Math.random() * 15);
    const players: Player[] = [];
    const positions: ('GK' | 'DF' | 'MF' | 'FW')[] = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW'];
    
    positions.forEach((pos, j) => {
      players.push({
        id: `p-${i}-${j}`,
        name: `Jogador ${i}-${j}`,
        age: 18 + Math.floor(Math.random() * 15),
        position: pos,
        overall: baseOvr + Math.floor(Math.random() * 5) - 2,
        nationality: "Brasil",
        teamId: `t-${i}`,
        goals: 0,
        assists: 0,
        value: (baseOvr * baseOvr) * 1000
      });
    });

    return {
      id: `t-${i}`,
      name,
      overall: baseOvr,
      attack: baseOvr + 2,
      midfield: baseOvr,
      defense: baseOvr - 2,
      budget: 10000000,
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      players,
      color: colors[i]
    };
  });
};

export const generateSchedule = (teams: Team[]): Match[] => {
  const schedule: Match[] = [];
  const numTeams = teams.length;
  const numWeeks = (numTeams - 1) * 2;
  
  // Simple round-robin (simplified for now)
  for (let week = 1; week <= numWeeks; week++) {
    const weekTeams = [...teams];
    while (weekTeams.length > 1) {
      const home = weekTeams.shift()!;
      const away = weekTeams.pop()!;
      schedule.push({
        id: `${home.id}-${away.id}-${week}`,
        homeTeamId: home.id,
        awayTeamId: away.id,
        homeScore: 0,
        awayScore: 0,
        played: false,
        week,
        events: []
      });
    }
  }
  return schedule;
};
