import { Team, Match, Player, MatchEvent, Competition } from './types';

export const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Gera nomes aleatórios para jogadores
const firstNames = ["Gabriel", "Lucas", "Mateus", "Pedro", "Enzo", "Rafael", "Thiago", "Bruno", "Diego", "Felipe", "Marcos", "Rodrigo", "Vitor", "André", "Daniel", "Kevin", "Harry", "Jack", "Leo", "Cristiano", "Kylian", "Erling", "Mohamed", "Bernardo", "Ruben", "Luka", "Toni", "Vinicius", "Rodrygo", "Alisson", "Ederson", "Robert", "Thomas", "Manuel", "Joshua", "Lautaro", "Nicolo", "Rafael", "Theo", "Mike", "Dusan", "Federico"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "De Bruyne", "Kane", "Grealish", "Messi", "Ronaldo", "Mbappé", "Haaland", "Salah", "Fernandes", "Dias", "Modric", "Kroos", "Junior", "Goes", "Becker", "Moraes", "Lewandowski", "Müller", "Neuer", "Kimmich", "Martinez", "Barella", "Leão", "Hernandez", "Maignan", "Vlahovic", "Chiesa"];

const countries = [
  { name: "Brasil", flag: "https://flagcdn.com/br.svg" },
  { name: "Argentina", flag: "https://flagcdn.com/ar.svg" },
  { name: "França", flag: "https://flagcdn.com/fr.svg" },
  { name: "Inglaterra", flag: "https://flagcdn.com/gb-eng.svg" },
  { name: "Espanha", flag: "https://flagcdn.com/es.svg" },
  { name: "Alemanha", flag: "https://flagcdn.com/de.svg" },
  { name: "Portugal", flag: "https://flagcdn.com/pt.svg" },
  { name: "Itália", flag: "https://flagcdn.com/it.svg" },
  { name: "Holanda", flag: "https://flagcdn.com/nl.svg" },
  { name: "Bélgica", flag: "https://flagcdn.com/be.svg" },
  { name: "Uruguai", flag: "https://flagcdn.com/uy.svg" },
  { name: "Colômbia", flag: "https://flagcdn.com/co.svg" },
  { name: "Chile", flag: "https://flagcdn.com/cl.svg" },
  { name: "Equador", flag: "https://flagcdn.com/ec.svg" },
  { name: "Paraguai", flag: "https://flagcdn.com/py.svg" },
  { name: "Peru", flag: "https://flagcdn.com/pe.svg" }
];

const generatePlayerName = () => {
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
};

// Calcula valor do jogador baseado no overall e idade (estilo FIFA)
const calculatePlayerValue = (overall: number, age: number): number => {
  // Valores FIFA-like (aproximados)
  let baseValue = 0;
  if (overall < 60) baseValue = Math.max(0, (overall - 40)) * 25000;
  else if (overall < 70) baseValue = 500000 + (overall - 60) * 250000;
  else if (overall < 80) baseValue = 3000000 + (overall - 70) * 3500000;
  else if (overall < 90) baseValue = 38000000 + (overall - 80) * 12000000;
  else baseValue = 150000000 + (overall - 90) * 35000000;

  // Fator idade: Jovens (17-23) valem mais, Velhos (32+) valem menos
  let ageFactor = 1.0;
  if (age <= 21) ageFactor = 1.6;
  else if (age <= 25) ageFactor = 1.3;
  else if (age <= 29) ageFactor = 1.0;
  else if (age <= 33) ageFactor = 0.5;
  else ageFactor = 0.2;

  return Math.round(baseValue * ageFactor);
};

// Gera um elenco inicial para um time
const generateSquad = (teamOverall: number, playerCount: number = 11): Player[] => {
  const squad: Player[] = [];
  const basePositions: ('GK' | 'DF' | 'MF' | 'FW')[] = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'];
  
  for (let i = 0; i < playerCount; i++) {
    const pos = basePositions[i % basePositions.length];
    const playerOverall = teamOverall + Math.floor(Math.random() * 11) - 5;
    const age = 17 + Math.floor(Math.random() * 18);
    const country = countries[Math.floor(Math.random() * countries.length)];
    
    squad.push({
      id: generateUUID(),
      name: generatePlayerName(),
      position: pos,
      overall: playerOverall,
      age: age,
      value: calculatePlayerValue(playerOverall, age),
      goals: 0,
      assists: 0,
      nationality: country.name,
      isInjured: false,
      isSuspended: false
    });
  }
  
  return squad;
};

export const COMPETITIONS: Competition[] = [
  { 
    id: 'f9e8d7c6-b5a4-4321-8765-432109876543', name: 'Brasileirão Série A', type: 'LEAGUE', region: 'BRAZIL', tier: 1,
    teamsCount: 20, relegationCount: 4, promotionCount: 0, qualificationSpots: 6, playersPerTeam: 22,
    countryName: 'Brasil', countryFlag: 'https://flagcdn.com/br.svg'
  },
  { 
    id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', name: 'Premier League', type: 'LEAGUE', region: 'EUROPE', tier: 1,
    teamsCount: 20, relegationCount: 3, promotionCount: 0, qualificationSpots: 4, playersPerTeam: 25,
    countryName: 'Inglaterra', countryFlag: 'https://flagcdn.com/gb-eng.svg'
  },
  { 
    id: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', name: 'La Liga', type: 'LEAGUE', region: 'EUROPE', tier: 1,
    teamsCount: 20, relegationCount: 3, promotionCount: 0, qualificationSpots: 4, playersPerTeam: 25,
    countryName: 'Espanha', countryFlag: 'https://flagcdn.com/es.svg'
  },
  { 
    id: 'bundesliga-id', name: 'Bundesliga', type: 'LEAGUE', region: 'EUROPE', tier: 1,
    teamsCount: 18, relegationCount: 2, promotionCount: 0, qualificationSpots: 4, playersPerTeam: 25,
    countryName: 'Alemanha', countryFlag: 'https://flagcdn.com/de.svg'
  },
  { 
    id: 'serie-a-italy-id', name: 'Serie A', type: 'LEAGUE', region: 'EUROPE', tier: 1,
    teamsCount: 20, relegationCount: 3, promotionCount: 0, qualificationSpots: 4, playersPerTeam: 25,
    countryName: 'Itália', countryFlag: 'https://flagcdn.com/it.svg'
  },
  { 
    id: 'liga-argentina-id', name: 'Liga Profesional', type: 'LEAGUE', region: 'SOUTH_AMERICA', tier: 1,
    teamsCount: 28, relegationCount: 2, promotionCount: 0, qualificationSpots: 4, playersPerTeam: 25,
    countryName: 'Argentina', countryFlag: 'https://flagcdn.com/ar.svg'
  },
  { id: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', name: 'Champions League', type: 'LEAGUE', region: 'EUROPE', tier: 0 },
  { id: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', name: 'Libertadores', type: 'LEAGUE', region: 'SOUTH_AMERICA', tier: 0 },
  { id: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', name: 'Sul-Americana', type: 'LEAGUE', region: 'SOUTH_AMERICA', tier: 0 }
];

const TEAM_DATA = [
  // Brasileirão Série A (20 times)
  { name: "Flamengo", color: "#E30613", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 82 },
  { name: "Palmeiras", color: "#006437", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 81 },
  { name: "São Paulo", color: "#FE0000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 78 },
  { name: "Corinthians", color: "#000000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 77 },
  { name: "Grêmio", color: "#00ADEF", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 76 },
  { name: "Internacional", color: "#E30613", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 76 },
  { name: "Atlético-MG", color: "#000000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 79 },
  { name: "Cruzeiro", color: "#005BAA", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 75 },
  { name: "Vasco", color: "#000000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 74 },
  { name: "Fluminense", color: "#800000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 77 },
  { name: "Botafogo", color: "#000000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 78 },
  { name: "Santos", color: "#000000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 75 },
  { name: "Bahia", color: "#0000FF", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 74 },
  { name: "Fortaleza", color: "#0000FF", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 76 },
  { name: "Athletico Paranaense", color: "#FF0000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 77 },
  { name: "Cuiabá", color: "#006437", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 72 },
  { name: "Coritiba", color: "#006437", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 71 },
  { name: "Goiás", color: "#006437", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 71 },
  { name: "Bragantino", color: "#FFFFFF", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 77 },
  { name: "Vitória", color: "#FF0000", leagueId: 'f9e8d7c6-b5a4-4321-8765-432109876543', overall: 72 },

  // Premier League (20 times)
  { name: "Man City", color: "#6CABDD", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 88 },
  { name: "Arsenal", color: "#EF0107", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 85 },
  { name: "Liverpool", color: "#C8102E", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 86 },
  { name: "Man United", color: "#DA291C", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 82 },
  { name: "Chelsea", color: "#034694", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 81 },
  { name: "Tottenham", color: "#132257", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 80 },
  { name: "Newcastle", color: "#241F20", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 80 },
  { name: "Aston Villa", color: "#95BFE5", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 79 },
  { name: "Brighton", color: "#0057B8", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 78 },
  { name: "West Ham", color: "#7A263A", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 78 },
  { name: "Brentford", color: "#E30613", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 76 },
  { name: "Wolves", color: "#FDB913", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 76 },
  { name: "Fulham", color: "#FFFFFF", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 75 },
  { name: "Crystal Palace", color: "#1B458F", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 75 },
  { name: "Everton", color: "#003399", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 74 },
  { name: "Nott'm Forest", color: "#DD0000", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 73 },
  { name: "Bournemouth", color: "#DA291C", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 73 },
  { name: "Burnley", color: "#6C1D45", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 72 },
  { name: "Sheffield Utd", color: "#EE2737", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 71 },
  { name: "Luton Town", color: "#F78F1E", leagueId: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', overall: 70 },

  // La Liga (20 times)
  { name: "Real Madrid", color: "#FFFFFF", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 89 },
  { name: "Barcelona", color: "#A50044", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 86 },
  { name: "Atlético Madrid", color: "#CB3524", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 83 },
  { name: "Real Sociedad", color: "#0067B1", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 80 },
  { name: "Sevilla", color: "#F43333", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 79 },
  { name: "Villarreal", color: "#FFE600", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 78 },
  { name: "Betis", color: "#009146", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 78 },
  { name: "Athletic Bilbao", color: "#EE2737", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 79 },
  { name: "Valencia", color: "#FFFFFF", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 76 },
  { name: "Girona", color: "#E30613", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 77 },
  { name: "Osasuna", color: "#E30613", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 75 },
  { name: "Getafe", color: "#0000FF", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 74 },
  { name: "Celta Vigo", color: "#87CEEB", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 74 },
  { name: "Rayo Vallecano", color: "#FFFFFF", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 73 },
  { name: "Mallorca", color: "#FF0000", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 73 },
  { name: "Alavés", color: "#0000FF", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 72 },
  { name: "Granada", color: "#FF0000", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 72 },
  { name: "Cádiz", color: "#FFFF00", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 71 },
  { name: "Almería", color: "#FF0000", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 71 },
  { name: "Las Palmas", color: "#FFFF00", leagueId: 'b2c3d4e5-f6a7-4b6c-9d0e-1f2a3b4c5d6e', overall: 72 },

  // Bundesliga (18 times)
  { name: "Bayern Munich", color: "#DC052D", leagueId: 'bundesliga-id', overall: 87 },
  { name: "Dortmund", color: "#FDE100", leagueId: 'bundesliga-id', overall: 83 },
  { name: "RB Leipzig", color: "#001F46", leagueId: 'bundesliga-id', overall: 82 },
  { name: "Leverkusen", color: "#E32221", leagueId: 'bundesliga-id', overall: 84 },
  { name: "Frankfurt", color: "#E1000F", leagueId: 'bundesliga-id', overall: 79 },
  { name: "Wolfsburg", color: "#65B32E", leagueId: 'bundesliga-id', overall: 78 },
  { name: "Freiburg", color: "#D30213", leagueId: 'bundesliga-id', overall: 78 },
  { name: "Union Berlin", color: "#E30613", leagueId: 'bundesliga-id', overall: 77 },
  { name: "M'gladbach", color: "#FFFFFF", leagueId: 'bundesliga-id', overall: 77 },
  { name: "Hoffenheim", color: "#1C63B7", leagueId: 'bundesliga-id', overall: 76 },
  { name: "Werder Bremen", color: "#1D9053", leagueId: 'bundesliga-id', overall: 75 },
  { name: "Mainz 05", color: "#C31216", leagueId: 'bundesliga-id', overall: 75 },
  { name: "Augsburg", color: "#BA3733", leagueId: 'bundesliga-id', overall: 74 },
  { name: "Stuttgart", color: "#FFFFFF", leagueId: 'bundesliga-id', overall: 78 },
  { name: "Heidenheim", color: "#E30613", leagueId: 'bundesliga-id', overall: 72 },
  { name: "Darmstadt", color: "#004D9D", leagueId: 'bundesliga-id', overall: 71 },
  { name: "Bochum", color: "#005CA9", leagueId: 'bundesliga-id', overall: 73 },
  { name: "Köln", color: "#FFFFFF", leagueId: 'bundesliga-id', overall: 74 },

  // Serie A Italy (20 times)
  { name: "Inter Milan", color: "#0066B2", leagueId: 'serie-a-italy-id', overall: 86 },
  { name: "Juventus", color: "#000000", leagueId: 'serie-a-italy-id', overall: 83 },
  { name: "AC Milan", color: "#FB090B", leagueId: 'serie-a-italy-id', overall: 84 },
  { name: "Napoli", color: "#003E7E", leagueId: 'serie-a-italy-id', overall: 82 },
  { name: "Lazio", color: "#87D3F8", leagueId: 'serie-a-italy-id', overall: 80 },
  { name: "Roma", color: "#8E1F2F", leagueId: 'serie-a-italy-id', overall: 81 },
  { name: "Atalanta", color: "#1E71B8", leagueId: 'serie-a-italy-id', overall: 80 },
  { name: "Fiorentina", color: "#4B2E83", leagueId: 'serie-a-italy-id', overall: 79 },
  { name: "Bologna", color: "#1A2F48", leagueId: 'serie-a-italy-id', overall: 78 },
  { name: "Torino", color: "#8B0000", leagueId: 'serie-a-italy-id', overall: 77 },
  { name: "Monza", color: "#E30613", leagueId: 'serie-a-italy-id', overall: 76 },
  { name: "Genoa", color: "#002D5D", leagueId: 'serie-a-italy-id', overall: 75 },
  { name: "Sassuolo", color: "#00A650", leagueId: 'serie-a-italy-id', overall: 75 },
  { name: "Udinese", color: "#000000", leagueId: 'serie-a-italy-id', overall: 74 },
  { name: "Lecce", color: "#FFD700", leagueId: 'serie-a-italy-id', overall: 73 },
  { name: "Empoli", color: "#005CAA", leagueId: 'serie-a-italy-id', overall: 73 },
  { name: "Frosinone", color: "#FFFF00", leagueId: 'serie-a-italy-id', overall: 72 },
  { name: "Verona", color: "#0053A0", leagueId: 'serie-a-italy-id', overall: 73 },
  { name: "Cagliari", color: "#1B2F48", leagueId: 'serie-a-italy-id', overall: 72 },
  { name: "Salernitana", color: "#8B0000", leagueId: 'serie-a-italy-id', overall: 71 },

  // Liga Argentina (Mixed Top)
  { name: "River Plate", color: "#FFFFFF", leagueId: 'liga-argentina-id', overall: 80 },
  { name: "Boca Juniors", color: "#0033A0", leagueId: 'liga-argentina-id', overall: 78 },
  { name: "Racing", color: "#87CEEB", leagueId: 'liga-argentina-id', overall: 77 },
  { name: "Independiente", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 75 },
  { name: "San Lorenzo", color: "#000080", leagueId: 'liga-argentina-id', overall: 75 },
  { name: "Estudiantes", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 76 },
  { name: "Talleres", color: "#000080", leagueId: 'liga-argentina-id', overall: 76 },
  { name: "Defensa y Justicia", color: "#008000", leagueId: 'liga-argentina-id', overall: 74 },
  { name: "Lanús", color: "#800000", leagueId: 'liga-argentina-id', overall: 74 },
  { name: "Vélez Sarsfield", color: "#FFFFFF", leagueId: 'liga-argentina-id', overall: 73 },
  { name: "Rosario Central", color: "#FFFF00", leagueId: 'liga-argentina-id', overall: 74 },
  { name: "Newell's", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 73 },
  { name: "Argentinos Jrs", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 73 },
  { name: "Huracán", color: "#FFFFFF", leagueId: 'liga-argentina-id', overall: 72 },
  { name: "Godoy Cruz", color: "#0000FF", leagueId: 'liga-argentina-id', overall: 73 },
  { name: "Gimnasia LP", color: "#FFFFFF", leagueId: 'liga-argentina-id', overall: 71 },
  { name: "Belgrano", color: "#87CEEB", leagueId: 'liga-argentina-id', overall: 72 },
  { name: "Unión", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 71 },
  { name: "Colón", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 71 },
  { name: "Banfield", color: "#008000", leagueId: 'liga-argentina-id', overall: 71 },
  { name: "Platense", color: "#FFFFFF", leagueId: 'liga-argentina-id', overall: 70 },
  { name: "Tigre", color: "#0000FF", leagueId: 'liga-argentina-id', overall: 71 },
  { name: "Barracas Central", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 69 },
  { name: "Central Córdoba", color: "#000000", leagueId: 'liga-argentina-id', overall: 69 },
  { name: "Sarmiento", color: "#008000", leagueId: 'liga-argentina-id', overall: 69 },
  { name: "Instituto", color: "#FF0000", leagueId: 'liga-argentina-id', overall: 70 },
  { name: "Atlético Tucumán", color: "#87CEEB", leagueId: 'liga-argentina-id', overall: 71 },
  { name: "Riestra", color: "#000000", leagueId: 'liga-argentina-id', overall: 67 },
  
  // Champions League (Mixed Top Teams)
  { name: "Bayern Munich", color: "#DC052D", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 87 },
  { name: "PSG", color: "#004170", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 85 },
  { name: "Inter Milan", color: "#0066B2", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 84 },
  { name: "AC Milan", color: "#FB090B", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 82 },
  { name: "Dortmund", color: "#FDE100", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 81 },
  { name: "Benfica", color: "#E83030", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 80 },
  { name: "Napoli", color: "#003E7E", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 82 },
  { name: "Lazio", color: "#87D3F8", leagueId: 'c3d4e5f6-a7b8-4c7d-0e1f-2a3b4c5d6e7f', overall: 79 },
  
  // Libertadores (Mixed Top SA Teams)
  { name: "River Plate", color: "#FFFFFF", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 80 },
  { name: "Boca Juniors", color: "#0033A0", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 78 },
  { name: "Ind. del Valle", color: "#000000", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 77 },
  { name: "LDU Quito", color: "#FFFFFF", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 76 },
  { name: "Peñarol", color: "#FFD700", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 75 },
  { name: "Colo-Colo", color: "#FFFFFF", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 74 },
  { name: "Nacional", color: "#FFFFFF", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 75 },
  { name: "Olimpia", color: "#000000", leagueId: 'd4e5f6a7-b8c9-4d8e-1f2a-3b4c5d6e7f8a', overall: 74 },
  
  // Sul-Americana (Mixed SA Teams)
  { name: "Estudiantes", color: "#FF0000", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 76 },
  { name: "Racing", color: "#87CEEB", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 77 },
  { name: "Lanús", color: "#800000", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 74 },
  { name: "Cerro Porteño", color: "#0000FF", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 73 },
  { name: "Barcelona SC", color: "#FFFF00", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 72 },
  { name: "Millonarios", color: "#0000FF", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 71 },
  { name: "Atlético Nacional", color: "#008000", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 73 },
  { name: "Bolívar", color: "#87CEEB", leagueId: 'e5f6a7b8-c9d0-4e9f-2a3b-4c5d6e7f8a9b', overall: 70 }
];

// Gera os times iniciais
export const generateInitialTeams = (competitions: Competition[] = COMPETITIONS): Team[] => {
  return TEAM_DATA.map((t) => {
    const comp = competitions.find(c => c.id === t.leagueId);
    const overall = t.overall + Math.floor(Math.random() * 5) - 2;
    return {
      id: generateUUID(),
      name: t.name,
      leagueId: t.leagueId,
      overall,
      attack: overall + Math.floor(Math.random() * 5),
      midfield: overall + Math.floor(Math.random() * 5),
      defense: overall + Math.floor(Math.random() * 5),
      players: generateSquad(overall, comp?.playersPerTeam || 11),
      points: 0,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      form: [],
      budget: 50000000 + Math.floor(Math.random() * 50000000),
      color: t.color
    };
  });
};

// Gera o calendário do campeonato (Round Robin) para cada liga
export const generateSchedule = (teams: Team[], competitions: Competition[]): Match[] => {
  const allMatches: Match[] = [];

  competitions.forEach(comp => {
    const leagueId = comp.id;
    const leagueTeams = [...teams.filter(t => 
      t.leagueId === leagueId || (t.competitionIds && t.competitionIds.includes(leagueId))
    )];

    if (leagueTeams.length < 2) return;

    if (comp.type === 'LEAGUE') {
      // Round Robin (Pontos Corridos)
      if (leagueTeams.length % 2 !== 0) {
        leagueTeams.push({
          id: 'bye',
          name: 'Folga',
          leagueId: leagueId,
          overall: 0,
          attack: 0,
          midfield: 0,
          defense: 0,
          players: [],
          points: 0,
          played: 0,
          won: 0,
          drawn: 0,
          lost: 0,
          gf: 0,
          ga: 0,
          gd: 0,
          form: [],
          budget: 0,
          color: '#000000'
        });
      }

      const numTeams = leagueTeams.length;
      const numRounds = (numTeams - 1) * 2;
      const matchesPerRound = numTeams / 2;
      const teamIds = leagueTeams.map(t => t.id);

      for (let round = 0; round < numRounds; round++) {
        for (let i = 0; i < matchesPerRound; i++) {
          const homeIdx = (round + i) % (numTeams - 1);
          let awayIdx = (numTeams - 1 - i + round) % (numTeams - 1);

          if (i === 0) awayIdx = numTeams - 1;

          const homeTeamId = round % 2 === 0 ? teamIds[homeIdx] : teamIds[awayIdx];
          const awayTeamId = round % 2 === 0 ? teamIds[awayIdx] : teamIds[homeIdx];

          if (homeTeamId !== 'bye' && awayTeamId !== 'bye') {
            allMatches.push({
              id: generateUUID(),
              week: round + 1,
              competitionId: leagueId,
              homeTeamId,
              awayTeamId,
              homeScore: 0,
              awayScore: 0,
              played: false,
              events: []
            });
          }
        }
      }
    } else if (comp.type === 'TOURNAMENT') {
      // Knockout (Mata-Mata) - Simplificado
      const numTeams = leagueTeams.length;
      const powerOfTwo = Math.pow(2, Math.floor(Math.log2(numTeams)));
      const teamsToSchedule = leagueTeams.slice(0, powerOfTwo);
      
      // Gera apenas a primeira rodada
      for (let i = 0; i < teamsToSchedule.length; i += 2) {
        allMatches.push({
          id: generateUUID(),
          week: 1,
          competitionId: leagueId,
          homeTeamId: teamsToSchedule[i].id,
          awayTeamId: teamsToSchedule[i+1].id,
          homeScore: 0,
          awayScore: 0,
          played: false,
          events: []
        });
      }
    }
  });

  return allMatches;
};

export const generateNextTournamentRound = (finishedMatches: Match[], competitionId: string, currentWeek: number): Match[] => {
  const winners: string[] = finishedMatches.map(m => {
    if (m.homeScore > m.awayScore) return m.homeTeamId;
    if (m.awayScore > m.homeScore) return m.awayTeamId;
    // Em caso de empate, decide aleatoriamente (ou pênaltis)
    return Math.random() > 0.5 ? m.homeTeamId : m.awayTeamId;
  });

  const nextMatches: Match[] = [];
  for (let i = 0; i < winners.length; i += 2) {
    if (winners[i+1]) {
      nextMatches.push({
        id: generateUUID(),
        week: currentWeek + 1,
        competitionId: competitionId,
        homeTeamId: winners[i],
        awayTeamId: winners[i+1],
        homeScore: 0,
        awayScore: 0,
        played: false,
        events: []
      });
    }
  }
  return nextMatches;
};

// Simula uma partida entre dois times
export const simulateMatch = (home: Team, away: Team, week: number, competitionId: string): Match => {
  const homeAdvantage = 5;
  const homeStrength = home.overall + homeAdvantage;
  const awayStrength = away.overall;

  const totalStrength = homeStrength + awayStrength;
  
  // Determina número de gols (Poisson-ish)
  const generateGols = (strength: number, opponentStrength: number) => {
    const lambda = (strength / opponentStrength) * 1.5;
    let L = Math.exp(-lambda);
    let p = 1.0;
    let k = 0;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  };

  const homeScore = generateGols(homeStrength, awayStrength);
  const awayScore = generateGols(awayStrength, homeStrength);

  const events: MatchEvent[] = [];

  // Gera eventos de gols
  const addGoalEvents = (score: number, team: Team) => {
    for (let i = 0; i < score; i++) {
      const scorers = team.players.filter(p => p.position !== 'GK' && !p.isInjured && !p.isSuspended);
      const scorer = scorers.length > 0 ? scorers[Math.floor(Math.random() * scorers.length)] : team.players[0];
      scorer.goals += 1;
      
      events.push({
        minute: Math.floor(Math.random() * 90) + 1,
        type: 'goal',
        playerName: scorer.name,
        teamId: team.id
      });
    }
  };

  // Gera eventos de cartões e lesões
  const addRandomEvents = (team: Team) => {
    const players = team.players.filter(p => !p.isInjured && !p.isSuspended);
    if (players.length === 0) return;

    // Cartão Amarelo (15% chance)
    if (Math.random() < 0.15) {
      const player = players[Math.floor(Math.random() * players.length)];
      events.push({
        minute: Math.floor(Math.random() * 90) + 1,
        type: 'yellow_card',
        playerName: player.name,
        teamId: team.id
      });
    }

    // Cartão Vermelho (2% chance)
    if (Math.random() < 0.02) {
      const player = players[Math.floor(Math.random() * players.length)];
      player.isSuspended = true;
      events.push({
        minute: Math.floor(Math.random() * 90) + 1,
        type: 'red_card',
        playerName: player.name,
        teamId: team.id
      });
    }

    // Lesão (3% chance)
    if (Math.random() < 0.03) {
      const player = players[Math.floor(Math.random() * players.length)];
      player.isInjured = true;
      events.push({
        minute: Math.floor(Math.random() * 90) + 1,
        type: 'injury',
        playerName: player.name,
        teamId: team.id
      });
    }
  };

  addGoalEvents(homeScore, home);
  addGoalEvents(awayScore, away);
  addRandomEvents(home);
  addRandomEvents(away);

  return {
    id: generateUUID(),
    week,
    competitionId,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore,
    awayScore,
    played: true,
    events: events.sort((a, b) => a.minute - b.minute)
  };
};

// Atualiza a tabela de classificação
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
        points: team.points + (won ? 3 : drawn ? 1 : 0),
        form: [...(team.form || []), (won ? 'W' : drawn ? 'D' : 'L') as 'W' | 'D' | 'L'].slice(-5)
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
        points: team.points + (won ? 3 : drawn ? 1 : 0),
        form: [...(team.form || []), (won ? 'W' : drawn ? 'D' : 'L') as 'W' | 'D' | 'L'].slice(-5)
      };
    }

    return team;
  });
};

// Reseta os times para uma nova temporada
export const resetTeamsForNewSeason = (teams: Team[]): Team[] => {
  return teams.map(team => ({
    ...team,
    points: 0,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    form: [],
    players: team.players.map(player => {
      // Jogadores envelhecem e podem melhorar ou piorar levemente
      const age = player.age + 1;
      const performanceFactor = Math.floor(Math.random() * 5) - 2; // -2 a +2
      const overall = Math.max(40, Math.min(99, player.overall + performanceFactor));
      
      return {
        ...player,
        age,
        overall,
        goals: 0,
        assists: 0,
        isInjured: false,
        isSuspended: false,
        value: calculatePlayerValue(overall, age)
      };
    })
  }));
};
