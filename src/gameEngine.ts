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

// Gera nomes aleatórios para jogadores (nomes mais genéricos para evitar "Kylian Grealish")
const firstNames = ["Gabriel", "Lucas", "Mateus", "Pedro", "Enzo", "Rafael", "Thiago", "Bruno", "Diego", "Felipe", "Marcos", "Rodrigo", "Vitor", "André", "Daniel", "Kevin", "Jack", "Leo", "Bernardo", "Ruben", "Luka", "Toni", "Vinicius", "Rodrygo", "Robert", "Thomas", "Manuel", "Joshua", "Lautaro", "Nicolo", "Theo", "Mike", "Dusan", "Federico", "Samuel", "João", "Paulo", "Ricardo", "Hugo", "Carlos", "Luis", "Fernando", "Alejandro", "Javier", "David", "Oliver", "Harry", "George", "William", "Arthur"];
const lastNames = ["Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes", "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Fernandes", "Dias", "Becker", "Moraes", "Lewandowski", "Müller", "Neuer", "Kimmich", "Martinez", "Barella", "Hernandez", "Maignan", "Vlahovic", "Chiesa", "Pinto", "Mendes", "Castro", "Vieira", "Soares", "Rocha", "Machado", "Freitas", "Barbosa", "Cardoso", "Teixeira", "Moreira", "Cavalcanti", "Melo", "Nunes", "Borges", "Garcia", "Lopez", "Gonzalez", "Rodriguez", "Sanchez"];

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

const positionMap: Record<string, 'GK' | 'DF' | 'MF' | 'FW'> = {
  'GOL': 'GK',
  'ZAG': 'DF',
  'LD': 'DF',
  'LE': 'DF',
  'VOL': 'MF',
  'MC': 'MF',
  'MEI': 'MF',
  'MD': 'MF',
  'ME': 'MF',
  'ATA': 'FW',
  'PD': 'FW',
  'PE': 'FW'
};

const REAL_PLAYERS_DATA: Record<string, any[]> = {
  "Liverpool": [
    { name: "Mohamed Salah", nationality: "Egito", position: "MF", overall: 91 },
    { name: "Virgil van Dijk", nationality: "Holanda", position: "DF", overall: 90 },
    { name: "Alisson", nationality: "Brasil", position: "GK", overall: 89 },
    { name: "Florian Wirtz", nationality: "Alemanha", position: "MF", overall: 89 },
    { name: "Alexander Isak", nationality: "Suécia", position: "FW", overall: 88 },
    { name: "Alexis Mac Allister", nationality: "Argentina", position: "MF", overall: 87 },
    { name: "Ibrahima Konaté", nationality: "França", position: "DF", overall: 86 },
    { name: "Trent Alexander-Arnold", nationality: "Inglaterra", position: "DF", overall: 86 },
    { name: "Ryan Gravenberch", nationality: "Holanda", position: "MF", overall: 85 },
    { name: "Luis Díaz", nationality: "Colômbia", position: "MF", overall: 85 },
    { name: "Giorgi Mamardashvili", nationality: "Geórgia", position: "GK", overall: 84 },
    { name: "Cody Gakpo", nationality: "Holanda", position: "MF", overall: 84 },
    { name: "Andrew Robertson", nationality: "Escócia", position: "DF", overall: 84 },
    { name: "Darwin Núñez", nationality: "Uruguai", position: "FW", overall: 83 },
    { name: "Diogo Jota", nationality: "Portugal", position: "FW", overall: 83 },
    { name: "Harvey Elliott", nationality: "Inglaterra", position: "MF", overall: 79 },
    { name: "Conor Bradley", nationality: "Irlanda do Norte", position: "DF", overall: 80 },
    { name: "Dominik Szoboszlai", nationality: "Hungria", position: "MF", overall: 85 },
    { name: "Federico Chiesa", nationality: "Itália", position: "FW", overall: 84 },
    { name: "Curtis Jones", nationality: "Inglaterra", position: "MF", overall: 79 }
  ],
  "Man City": [
    { name: "Rodri", nationality: "Espanha", position: "MF", overall: 90 },
    { name: "Erling Haaland", nationality: "Noruega", position: "FW", overall: 90 },
    { name: "Gianluigi Donnarumma", nationality: "Itália", position: "GK", overall: 89 },
    { name: "Rúben Dias", nationality: "Portugal", position: "DF", overall: 86 },
    { name: "Tijjani Reijnders", nationality: "Holanda", position: "MF", overall: 86 },
    { name: "Phil Foden", nationality: "Inglaterra", position: "FW", overall: 85 },
    { name: "Joško Gvardiol", nationality: "Croácia", position: "DF", overall: 84 },
    { name: "Bernardo Silva", nationality: "Portugal", position: "MF", overall: 84 },
    { name: "Omar Marmoush", nationality: "Egito", position: "FW", overall: 84 },
    { name: "Mateo Kovačić", nationality: "Croácia", position: "MF", overall: 83 },
    { name: "Manuel Akanji", nationality: "Suíça", position: "DF", overall: 83 },
    { name: "Kevin De Bruyne", nationality: "Bélgica", position: "MF", overall: 83 },
    { name: "Ilkay Gündogan", nationality: "Alemanha", position: "MF", overall: 83 },
    { name: "Rico Lewis", nationality: "Inglaterra", position: "DF", overall: 81 },
    { name: "Ederson", nationality: "Brasil", position: "GK", overall: 80 },
    { name: "Jeremy Doku", nationality: "Bélgica", position: "FW", overall: 80 },
    { name: "Savinho", nationality: "Brasil", position: "MF", overall: 79 },
    { name: "John Stones", nationality: "Inglaterra", position: "DF", overall: 85 },
    { name: "Kyle Walker", nationality: "Inglaterra", position: "DF", overall: 84 },
    { name: "Nathan Aké", nationality: "Holanda", position: "DF", overall: 84 }
  ],
  "Arsenal": [
    { name: "Gabriel", nationality: "Brasil", position: "DF", overall: 88 },
    { name: "Bukayo Saka", nationality: "Inglaterra", position: "FW", overall: 88 },
    { name: "Declan Rice", nationality: "Inglaterra", position: "MF", overall: 87 },
    { name: "William Saliba", nationality: "França", position: "DF", overall: 87 },
    { name: "Martin Ødegaard", nationality: "Noruega", position: "MF", overall: 87 },
    { name: "David Raya", nationality: "Espanha", position: "GK", overall: 87 },
    { name: "Viktor Gyökeres", nationality: "Suécia", position: "FW", overall: 87 },
    { name: "Mikel Merino", nationality: "Espanha", position: "MF", overall: 83 },
    { name: "Zubimendi", nationality: "Espanha", position: "MF", overall: 83 },
    { name: "Eberechi Eze", nationality: "Inglaterra", position: "MF", overall: 83 },
    { name: "Piero Hincapié", nationality: "Equador", position: "DF", overall: 83 },
    { name: "Ben White", nationality: "Inglaterra", position: "DF", overall: 82 },
    { name: "Thomas Partey", nationality: "Gana", position: "MF", overall: 81 },
    { name: "Leandro Trossard", nationality: "Bélgica", position: "MF", overall: 81 },
    { name: "Gabriel Martinelli", nationality: "Brasil", position: "FW", overall: 80 },
    { name: "Jakub Kiwior", nationality: "Polônia", position: "DF", overall: 79 },
    { name: "Riccardo Calafiori", nationality: "Itália", position: "DF", overall: 79 },
    { name: "Myles Lewis-Skelly", nationality: "Inglaterra", position: "DF", overall: 77 },
    { name: "Kai Havertz", nationality: "Alemanha", position: "FW", overall: 84 },
    { name: "Jurrien Timber", nationality: "Holanda", position: "DF", overall: 81 }
  ],
  "Chelsea": [
    { name: "Cole Palmer", nationality: "Inglaterra", position: "MF", overall: 87 },
    { name: "Moisés Caicedo", nationality: "Equador", position: "MF", overall: 87 },
    { name: "Marc Cucurella", nationality: "Espanha", position: "DF", overall: 84 },
    { name: "Enzo Fernández", nationality: "Argentina", position: "MF", overall: 84 },
    { name: "Reece James", nationality: "Inglaterra", position: "DF", overall: 81 },
    { name: "Andrey Santos", nationality: "Brasil", position: "MF", overall: 80 },
    { name: "Pedro Neto", nationality: "Portugal", position: "MF", overall: 80 },
    { name: "Levi Colwill", nationality: "Inglaterra", position: "DF", overall: 80 },
    { name: "Nicolas Jackson", nationality: "Senegal", position: "FW", overall: 80 },
    { name: "Malo Gusto", nationality: "França", position: "DF", overall: 79 },
    { name: "Trevoh Chalobah", nationality: "Inglaterra", position: "DF", overall: 79 },
    { name: "Noni Madueke", nationality: "Inglaterra", position: "MF", overall: 79 },
    { name: "Mykhailo Mudryk", nationality: "Ucrânia", position: "MF", overall: 79 },
    { name: "Benoît Badiashile", nationality: "França", position: "DF", overall: 79 },
    { name: "Roméo Lavia", nationality: "Bélgica", position: "MF", overall: 79 },
    { name: "Tosin Adarabioyo", nationality: "Inglaterra", position: "DF", overall: 78 },
    { name: "Robert Sánchez", nationality: "Espanha", position: "GK", overall: 80 },
    { name: "Christopher Nkunku", nationality: "França", position: "MF", overall: 83 },
    { name: "Jadon Sancho", nationality: "Inglaterra", position: "FW", overall: 81 }
  ],
  "Napoli": [
    { name: "Kevin De Bruyne", nationality: "Bélgica", position: "MF", overall: 87 },
    { name: "Khvicha Kvaratskhelia", nationality: "Geórgia", position: "FW", overall: 87 },
    { name: "Scott McTominay", nationality: "Escócia", position: "MF", overall: 85 },
    { name: "Romelu Lukaku", nationality: "Bélgica", position: "FW", overall: 84 },
    { name: "Giovanni Di Lorenzo", nationality: "Itália", position: "DF", overall: 83 },
    { name: "Stanislav Lobotka", nationality: "Eslováquia", position: "MF", overall: 83 },
    { name: "Amir Rrahmani", nationality: "Kosovo", position: "DF", overall: 83 },
    { name: "André Zambo Anguissa", nationality: "Camarões", position: "MF", overall: 82 },
    { name: "Alex Meret", nationality: "Itália", position: "GK", overall: 82 },
    { name: "Alessandro Buongiorno", nationality: "Itália", position: "DF", overall: 82 },
    { name: "David Neres", nationality: "Brasil", position: "MF", overall: 82 },
    { name: "Miguel Gutiérrez", nationality: "Espanha", position: "DF", overall: 81 },
    { name: "Matteo Politano", nationality: "Itália", position: "MF", overall: 80 },
    { name: "Leonardo Spinazzola", nationality: "Itália", position: "DF", overall: 79 },
    { name: "Billy Gilmour", nationality: "Escócia", position: "MF", overall: 78 },
    { name: "Mathías Olivera", nationality: "Uruguai", position: "DF", overall: 78 },
    { name: "Giacomo Raspadori", nationality: "Itália", position: "FW", overall: 79 }
  ],
  "Roma": [
    { name: "Paulo Dybala", nationality: "Argentina", position: "MF", overall: 86 },
    { name: "Artem Dovbyk", nationality: "Ucrânia", position: "FW", overall: 83 },
    { name: "Gianluca Mancini", nationality: "Itália", position: "DF", overall: 83 },
    { name: "Mile Svilar", nationality: "Sérvia", position: "GK", overall: 82 },
    { name: "Evan Ndicka", nationality: "Costa do Marfim", position: "DF", overall: 81 },
    { name: "Lorenzo Pellegrini", nationality: "Itália", position: "MF", overall: 80 },
    { name: "Bryan Cristante", nationality: "Itália", position: "MF", overall: 80 },
    { name: "Mario Hermoso", nationality: "Espanha", position: "DF", overall: 80 },
    { name: "Kouadio Koné", nationality: "França", position: "MF", overall: 79 },
    { name: "Angeliño", nationality: "Espanha", position: "DF", overall: 79 },
    { name: "Stephan El Shaarawy", nationality: "Itália", position: "MF", overall: 79 },
    { name: "Leon Bailey", nationality: "Jamaica", position: "MF", overall: 79 },
    { name: "Leandro Paredes", nationality: "Argentina", position: "MF", overall: 79 },
    { name: "Matías Soulé", nationality: "Argentina", position: "MF", overall: 78 },
    { name: "Devyne Rensch", nationality: "Holanda", position: "DF", overall: 77 },
    { name: "Zeki Çelik", nationality: "Turquia", position: "DF", overall: 76 },
    { name: "Nicola Zalewski", nationality: "Polônia", position: "MF", overall: 76 }
  ],
  "Real Madrid": [
    { name: "Kylian Mbappé", nationality: "França", position: "FW", overall: 91 },
    { name: "Vinícius Jr", nationality: "Brasil", position: "FW", overall: 91 },
    { name: "Jude Bellingham", nationality: "Inglaterra", position: "MF", overall: 90 },
    { name: "Thibaut Courtois", nationality: "Bélgica", position: "GK", overall: 89 },
    { name: "Federico Valverde", nationality: "Uruguai", position: "MF", overall: 88 },
    { name: "Antonio Rüdiger", nationality: "Alemanha", position: "DF", overall: 88 },
    { name: "Rodrygo", nationality: "Brasil", position: "FW", overall: 86 },
    { name: "Luka Modric", nationality: "Croácia", position: "MF", overall: 86 },
    { name: "Dani Carvajal", nationality: "Espanha", position: "DF", overall: 86 },
    { name: "Éder Militão", nationality: "Brasil", position: "DF", overall: 85 },
    { name: "Aurélien Tchouaméni", nationality: "França", position: "MF", overall: 85 },
    { name: "Eduardo Camavinga", nationality: "França", position: "MF", overall: 83 },
    { name: "Ferland Mendy", nationality: "França", position: "DF", overall: 82 },
    { name: "Arda Güler", nationality: "Turquia", position: "MF", overall: 78 },
    { name: "Endrick", nationality: "Brasil", position: "FW", overall: 77 },
    { name: "Brahim Díaz", nationality: "Marrocos", position: "MF", overall: 82 },
    { name: "David Alaba", nationality: "Áustria", position: "DF", overall: 85 },
    { name: "Fran García", nationality: "Espanha", position: "DF", overall: 79 },
    { name: "Lucas Vázquez", nationality: "Espanha", position: "DF", overall: 80 },
    { name: "Andriy Lunin", nationality: "Ucrânia", position: "GK", overall: 81 }
  ],
  "Al-Hilal": [
    { name: "Neymar Jr", nationality: "Brasil", position: "FW", overall: 89 },
    { name: "João Cancelo", nationality: "Portugal", position: "DF", overall: 86 },
    { name: "Sergej Milinković-Savić", nationality: "Sérvia", position: "MF", overall: 85 },
    { name: "Rúben Neves", nationality: "Portugal", position: "MF", overall: 84 },
    { name: "Aleksandar Mitrović", nationality: "Sérvia", position: "FW", overall: 83 },
    { name: "Kalidou Koulibaly", nationality: "Senegal", position: "DF", overall: 83 },
    { name: "Yassine Bounou", nationality: "Marrocos", position: "GK", overall: 84 },
    { name: "Malcom", nationality: "Brasil", position: "FW", overall: 81 },
    { name: "Renan Lodi", nationality: "Brasil", position: "DF", overall: 80 },
    { name: "Marcos Leonardo", nationality: "Brasil", position: "FW", overall: 78 }
  ],
  "Inter Miami": [
    { name: "Lionel Messi", nationality: "Argentina", position: "FW", overall: 88 },
    { name: "Luis Suárez", nationality: "Uruguai", position: "FW", overall: 82 },
    { name: "Sergio Busquets", nationality: "Espanha", position: "MF", overall: 81 },
    { name: "Jordi Alba", nationality: "Espanha", position: "DF", overall: 80 },
    { name: "Federico Redondo", nationality: "Argentina", position: "MF", overall: 74 },
    { name: "Drake Callender", nationality: "EUA", position: "GK", overall: 75 },
    { name: "Diego Gómez", nationality: "Paraguai", position: "MF", overall: 73 }
  ],
  "Al-Nassr": [
    { name: "Cristiano Ronaldo", nationality: "Portugal", position: "FW", overall: 86 },
    { name: "Sadio Mané", nationality: "Senegal", position: "FW", overall: 84 },
    { name: "Aymeric Laporte", nationality: "Espanha", position: "DF", overall: 83 },
    { name: "Marcelo Brozović", nationality: "Croácia", position: "MF", overall: 82 },
    { name: "Otávio", nationality: "Portugal", position: "MF", overall: 81 },
    { name: "Alex Telles", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Bento", nationality: "Brasil", position: "GK", overall: 80 },
    { name: "Anderson Talisca", nationality: "Brasil", position: "MF", overall: 81 }
  ],
  "Flamengo": [
    { name: "Pedro", nationality: "Brasil", position: "FW", overall: 80 },
    { name: "Giorgian de Arrascaeta", nationality: "Uruguai", position: "MF", overall: 80 },
    { name: "Nicolás de la Cruz", nationality: "Uruguai", position: "MF", overall: 79 },
    { name: "Gerson", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Gabriel Barbosa", nationality: "Brasil", position: "FW", overall: 78 },
    { name: "Agustín Rossi", nationality: "Argentina", position: "GK", overall: 78 },
    { name: "Fabrício Bruno", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Léo Pereira", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Erick Pulgar", nationality: "Chile", position: "MF", overall: 77 },
    { name: "Ayrton Lucas", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Luiz Araújo", nationality: "Brasil", position: "FW", overall: 76 },
    { name: "Guillermo Varela", nationality: "Uruguai", position: "DF", overall: 75 },
    { name: "Everton Cebolinha", nationality: "Brasil", position: "FW", overall: 78 },
    { name: "Léo Ortiz", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Matías Viña", nationality: "Uruguai", position: "DF", overall: 76 },
    { name: "Michael", nationality: "Brasil", position: "FW", overall: 77 },
    { name: "Alcaraz", nationality: "Argentina", position: "MF", overall: 76 },
    { name: "Gonzalo Plata", nationality: "Equador", position: "FW", overall: 75 }
  ],
  "Atlético-MG": [
    { name: "Hulk", nationality: "Brasil", position: "FW", overall: 81 },
    { name: "Paulinho", nationality: "Brasil", position: "FW", overall: 80 },
    { name: "Gustavo Scarpa", nationality: "Brasil", position: "MF", overall: 79 },
    { name: "Guilherme Arana", nationality: "Brasil", position: "DF", overall: 79 },
    { name: "Everson", nationality: "Brasil", position: "GK", overall: 78 },
    { name: "Zaracho", nationality: "Argentina", position: "MF", overall: 78 },
    { name: "Battaglia", nationality: "Argentina", position: "MF", overall: 77 },
    { name: "Junior Alonso", nationality: "Paraguai", position: "DF", overall: 77 },
    { name: "Otávio", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Lyanco", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Deyverson", nationality: "Brasil", position: "FW", overall: 76 }
  ],
  "Cruzeiro": [
    { name: "Matheus Pereira", nationality: "Brasil", position: "MF", overall: 80 },
    { name: "Cássio", nationality: "Brasil", position: "GK", overall: 78 },
    { name: "Kaio Jorge", nationality: "Brasil", position: "FW", overall: 76 },
    { name: "Lautaro Díaz", nationality: "Argentina", position: "FW", overall: 75 },
    { name: "Walace", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Lucas Romero", nationality: "Argentina", position: "MF", overall: 76 },
    { name: "William", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "João Marcelo", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Marlon", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Álvaro Barreal", nationality: "Argentina", position: "MF", overall: 75 },
    { name: "Gabriel Veron", nationality: "Brasil", position: "FW", overall: 74 }
  ],
  "Vasco": [
    { name: "Dimitri Payet", nationality: "França", position: "MF", overall: 80 },
    { name: "Pablo Vegetti", nationality: "Argentina", position: "FW", overall: 79 },
    { name: "Philippe Coutinho", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Léo Jardim", nationality: "Brasil", position: "GK", overall: 79 },
    { name: "Lucas Piton", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "João Victor", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Hugo Moura", nationality: "Brasil", position: "MF", overall: 75 },
    { name: "Mateus Carvalho", nationality: "Brasil", position: "MF", overall: 74 },
    { name: "Adson", nationality: "Brasil", position: "FW", overall: 75 },
    { name: "David", nationality: "Brasil", position: "FW", overall: 74 },
    { name: "Maicon", nationality: "Brasil", position: "DF", overall: 74 }
  ],
  "Grêmio": [
    { name: "Martin Braithwaite", nationality: "Dinamarca", position: "FW", overall: 78 },
    { name: "Franco Cristaldo", nationality: "Argentina", position: "MF", overall: 78 },
    { name: "Mathías Villasanti", nationality: "Paraguai", position: "MF", overall: 78 },
    { name: "Yeferson Soteldo", nationality: "Venezuela", position: "FW", overall: 77 },
    { name: "Diego Costa", nationality: "Espanha", position: "FW", overall: 77 },
    { name: "Agustín Marchesín", nationality: "Argentina", position: "GK", overall: 76 },
    { name: "Rodrigo Ely", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Jemerson", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Reinaldo", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Dodi", nationality: "Brasil", position: "MF", overall: 74 },
    { name: "Edenilson", nationality: "Brasil", position: "MF", overall: 75 }
  ],
  "Internacional": [
    { name: "Enner Valencia", nationality: "Equador", position: "FW", overall: 79 },
    { name: "Alan Patrick", nationality: "Brasil", position: "MF", overall: 80 },
    { name: "Rafael Borré", nationality: "Colômbia", position: "FW", overall: 78 },
    { name: "Sergio Rochet", nationality: "Uruguai", position: "GK", overall: 80 },
    { name: "Vitão", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Gabriel Mercado", nationality: "Argentina", position: "DF", overall: 75 },
    { name: "Bernabei", nationality: "Argentina", position: "DF", overall: 75 },
    { name: "Thiago Maia", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "Fernando", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Wesley", nationality: "Brasil", position: "FW", overall: 76 },
    { name: "Bruno Tabata", nationality: "Brasil", position: "MF", overall: 75 }
  ],
  "Fluminense": [
    { name: "Thiago Silva", nationality: "Brasil", position: "DF", overall: 81 },
    { name: "Jhon Arias", nationality: "Colômbia", position: "MF", overall: 80 },
    { name: "Ganso", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Germán Cano", nationality: "Argentina", position: "FW", overall: 79 },
    { name: "Fábio", nationality: "Brasil", position: "GK", overall: 78 },
    { name: "Samuel Xavier", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Ignácio", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Facundo Bernal", nationality: "Uruguai", position: "MF", overall: 74 },
    { name: "Martinelli", nationality: "Brasil", position: "MF", overall: 75 },
    { name: "Kevin Serna", nationality: "Colômbia", position: "FW", overall: 75 },
    { name: "Kauã Elias", nationality: "Brasil", position: "FW", overall: 72 }
  ],
  "Botafogo": [
    { name: "Thiago Almada", nationality: "Argentina", position: "MF", overall: 78 },
    { name: "Luiz Henrique", nationality: "Brasil", position: "FW", overall: 78 },
    { name: "Alex Telles", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Savarino", nationality: "Venezuela", position: "FW", overall: 76 },
    { name: "Marlon Freitas", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "John", nationality: "Brasil", position: "GK", overall: 75 },
    { name: "Bastos", nationality: "Angola", position: "DF", overall: 75 },
    { name: "Alexander Barboza", nationality: "Argentina", position: "DF", overall: 75 },
    { name: "Gregore", nationality: "Brasil", position: "MF", overall: 75 },
    { name: "Igor Jesus", nationality: "Brasil", position: "FW", overall: 74 },
    { name: "Vitinho", nationality: "Brasil", position: "DF", overall: 73 },
    { name: "Adryelson", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Allan", nationality: "Brasil", position: "MF", overall: 75 }
  ],
  "Barcelona": [
    { name: "Marc-André ter Stegen", nationality: "Alemanha", position: "GK", overall: 89 },
    { name: "Robert Lewandowski", nationality: "Polônia", position: "FW", overall: 88 },
    { name: "Frenkie de Jong", nationality: "Holanda", position: "MF", overall: 87 },
    { name: "Ronald Araújo", nationality: "Uruguai", position: "DF", overall: 86 },
    { name: "Pedri", nationality: "Espanha", position: "MF", overall: 86 },
    { name: "Jules Koundé", nationality: "França", position: "DF", overall: 85 },
    { name: "Raphinha", nationality: "Brasil", position: "FW", overall: 84 },
    { name: "Dani Olmo", nationality: "Espanha", position: "MF", overall: 84 },
    { name: "Gavi", nationality: "Espanha", position: "MF", overall: 83 },
    { name: "Alejandro Balde", nationality: "Espanha", position: "DF", overall: 81 },
    { name: "Lamine Yamal", nationality: "Espanha", position: "FW", overall: 81 },
    { name: "Andreas Christensen", nationality: "Dinamarca", position: "DF", overall: 83 },
    { name: "Ferran Torres", nationality: "Espanha", position: "FW", overall: 80 },
    { name: "Pau Cubarsí", nationality: "Espanha", position: "DF", overall: 72 },
    { name: "Fermín López", nationality: "Espanha", position: "MF", overall: 76 }
  ],
  "Bayern Munich": [
    { name: "Harry Kane", nationality: "Inglaterra", position: "FW", overall: 90 },
    { name: "Jamal Musiala", nationality: "Alemanha", position: "MF", overall: 87 },
    { name: "Manuel Neuer", nationality: "Alemanha", position: "GK", overall: 86 },
    { name: "Joshua Kimmich", nationality: "Alemanha", position: "DF", overall: 86 },
    { name: "Leroy Sané", nationality: "Alemanha", position: "MF", overall: 85 },
    { name: "João Palhinha", nationality: "Portugal", position: "MF", overall: 85 },
    { name: "Kingsley Coman", nationality: "França", position: "MF", overall: 85 },
    { name: "Dayot Upamecano", nationality: "França", position: "DF", overall: 82 },
    { name: "Kim Min-jae", nationality: "Coreia do Sul", position: "DF", overall: 83 },
    { name: "Alphonso Davies", nationality: "Canadá", position: "DF", overall: 82 },
    { name: "Michael Olise", nationality: "França", position: "MF", overall: 82 },
    { name: "Serge Gnabry", nationality: "Alemanha", position: "MF", overall: 83 },
    { name: "Leon Goretzka", nationality: "Alemanha", position: "MF", overall: 83 },
    { name: "Konrad Laimer", nationality: "Áustria", position: "MF", overall: 83 },
    { name: "Thomas Müller", nationality: "Alemanha", position: "FW", overall: 84 }
  ],
  "PSG": [
    { name: "Gianluigi Donnarumma", nationality: "Itália", position: "GK", overall: 89 },
    { name: "Marquinhos", nationality: "Brasil", position: "DF", overall: 87 },
    { name: "Ousmane Dembélé", nationality: "França", position: "FW", overall: 86 },
    { name: "Vitinha", nationality: "Portugal", position: "MF", overall: 85 },
    { name: "Achraf Hakimi", nationality: "Marrocos", position: "DF", overall: 84 },
    { name: "Nuno Mendes", nationality: "Portugal", position: "DF", overall: 83 },
    { name: "Gonçalo Ramos", nationality: "Portugal", position: "FW", overall: 81 },
    { name: "Warren Zaïre-Emery", nationality: "França", position: "MF", overall: 80 },
    { name: "Bradley Barcola", nationality: "França", position: "FW", overall: 80 },
    { name: "João Neves", nationality: "Portugal", position: "MF", overall: 79 },
    { name: "Willian Pacho", nationality: "Equador", position: "DF", overall: 78 },
    { name: "Fabián Ruiz", nationality: "Espanha", position: "MF", overall: 81 },
    { name: "Lucas Hernández", nationality: "França", position: "DF", overall: 83 },
    { name: "Milan Škriniar", nationality: "Eslováquia", position: "DF", overall: 84 },
    { name: "Marco Asensio", nationality: "Espanha", position: "MF", overall: 81 }
  ],
  "Inter Milan": [
    { name: "Lautaro Martínez", nationality: "Argentina", position: "FW", overall: 89 },
    { name: "Nicolò Barella", nationality: "Itália", position: "MF", overall: 87 },
    { name: "Alessandro Bastoni", nationality: "Itália", position: "DF", overall: 87 },
    { name: "Yann Sommer", nationality: "Suíça", position: "GK", overall: 87 },
    { name: "Hakan Çalhanoglu", nationality: "Turquia", position: "MF", overall: 86 },
    { name: "Benjamin Pavard", nationality: "França", position: "DF", overall: 84 },
    { name: "Francesco Acerbi", nationality: "Itália", position: "DF", overall: 84 },
    { name: "Federico Dimarco", nationality: "DF", overall: 84 },
    { name: "Marcus Thuram", nationality: "França", position: "FW", overall: 83 },
    { name: "Henrikh Mkhitaryan", nationality: "Armênia", position: "MF", overall: 83 },
    { name: "Denzel Dumfries", nationality: "Holanda", position: "DF", overall: 82 },
    { name: "Piotr Zielinski", nationality: "Polônia", position: "MF", overall: 83 },
    { name: "Davide Frattesi", nationality: "Itália", position: "MF", overall: 81 },
    { name: "Stefan de Vrij", nationality: "Holanda", position: "DF", overall: 81 },
    { name: "Matteo Darmian", nationality: "Itália", position: "DF", overall: 80 }
  ],
  "São Paulo": [
    { name: "Lucas Moura", nationality: "Brasil", position: "FW", overall: 80 },
    { name: "Jonathan Calleri", nationality: "Argentina", position: "FW", overall: 79 },
    { name: "Luciano", nationality: "Brasil", position: "FW", overall: 78 },
    { name: "Rafinha", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Robert Arboleda", nationality: "Equador", position: "DF", overall: 79 },
    { name: "Alan Franco", nationality: "Argentina", position: "DF", overall: 77 },
    { name: "Welington", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Luiz Gustavo", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Alisson", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Pablo Maia", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Rafael", nationality: "Brasil", position: "GK", overall: 79 },
    { name: "Ferreira", nationality: "Brasil", position: "FW", overall: 76 },
    { name: "Bobadilla", nationality: "Paraguai", position: "MF", overall: 74 }
  ],
  "Corinthians": [
    { name: "Memphis Depay", nationality: "Holanda", position: "FW", overall: 82 },
    { name: "Rodrigo Garro", nationality: "Argentina", position: "MF", overall: 80 },
    { name: "Yuri Alberto", nationality: "Brasil", position: "FW", overall: 78 },
    { name: "Hugo Souza", nationality: "Brasil", position: "GK", overall: 77 },
    { name: "Fagner", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "André Ramalho", nationality: "Brasil", position: "DF", overall: 78 },
    { name: "Félix Torres", nationality: "Equador", position: "DF", overall: 77 },
    { name: "José Martínez", nationality: "Venezuela", position: "MF", overall: 76 },
    { name: "Charles", nationality: "Brasil", position: "MF", overall: 75 },
    { name: "Breno Bidon", nationality: "Brasil", position: "MF", overall: 73 },
    { name: "Talles Magno", nationality: "Brasil", position: "FW", overall: 76 },
    { name: "Igor Coronado", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Carrillo", nationality: "Peru", position: "MF", overall: 76 }
  ],
  "Bahia": [
    { name: "Everton Ribeiro", nationality: "Brasil", position: "MF", overall: 79 },
    { name: "Cauly", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Jean Lucas", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Caio Alexandre", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Luciano Juba", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Santiago Arias", nationality: "Colômbia", position: "DF", overall: 76 },
    { name: "Gabriel Xavier", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Kanu", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Marcos Felipe", nationality: "Brasil", position: "GK", overall: 77 },
    { name: "Thaciano", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "Everaldo", nationality: "Brasil", position: "FW", overall: 75 },
    { name: "Lucho Rodríguez", nationality: "Uruguai", position: "FW", overall: 74 }
  ],
  "Fortaleza": [
    { name: "Juan Martín Lucero", nationality: "Argentina", position: "FW", overall: 79 },
    { name: "Yago Pikachu", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Pochettino", nationality: "Argentina", position: "MF", overall: 78 },
    { name: "Hércules", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "Tinga", nationality: "Brasil", position: "DF", overall: 76 },
    { name: "Brítez", nationality: "Argentina", position: "DF", overall: 76 },
    { name: "Kuscevic", nationality: "Chile", position: "DF", overall: 75 },
    { name: "Bruno Pacheco", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "João Ricardo", nationality: "Brasil", position: "GK", overall: 78 },
    { name: "Breno Lopes", nationality: "Brasil", position: "FW", overall: 75 },
    { name: "Moisés", nationality: "Brasil", position: "FW", overall: 76 },
    { name: "Marinho", nationality: "Brasil", position: "FW", overall: 75 }
  ],
  "Athletico Paranaense": [
    { name: "Fernandinho", nationality: "Brasil", position: "MF", overall: 80 },
    { name: "Nikão", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Canobbio", nationality: "Uruguai", position: "FW", overall: 77 },
    { name: "Mastriani", nationality: "Uruguai", position: "FW", overall: 77 },
    { name: "Cuello", nationality: "Argentina", position: "FW", overall: 75 },
    { name: "Zapelli", nationality: "Argentina", position: "MF", overall: 76 },
    { name: "Erick", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "Gabriel", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "Thiago Heleno", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Kaique Rocha", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Esquivel", nationality: "Argentina", position: "DF", overall: 76 },
    { name: "Mycael", nationality: "Brasil", position: "GK", overall: 74 },
    { name: "Pablo", nationality: "Brasil", position: "FW", overall: 75 }
  ],
  "Palmeiras": [
    { name: "Raphael Veiga", nationality: "Brasil", position: "MF", overall: 79 },
    { name: "Gustavo Gómez", nationality: "Paraguai", position: "DF", overall: 79 },
    { name: "Weverton", nationality: "Brasil", position: "GK", overall: 79 },
    { name: "Felipe Anderson", nationality: "Brasil", position: "MF", overall: 78 },
    { name: "Zé Rafael", nationality: "Brasil", position: "MF", overall: 77 },
    { name: "Murilo", nationality: "Brasil", position: "DF", overall: 77 },
    { name: "Joaquín Piquerez", nationality: "Uruguai", position: "DF", overall: 77 },
    { name: "Aníbal Moreno", nationality: "Argentina", position: "MF", overall: 76 },
    { name: "Flaco López", nationality: "Argentina", position: "FW", overall: 75 },
    { name: "Marcos Rocha", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Estêvão", nationality: "Brasil", position: "FW", overall: 73 },
    { name: "Mayke", nationality: "Brasil", position: "DF", overall: 75 },
    { name: "Richard Ríos", nationality: "Colômbia", position: "MF", overall: 75 },
    { name: "Maurício", nationality: "Brasil", position: "MF", overall: 76 },
    { name: "Vitor Reis", nationality: "Brasil", position: "DF", overall: 70 }
  ],
  "Atlético Madrid": [
    { name: "Antoine Griezmann", nationality: "França", position: "FW", overall: 88 },
    { name: "Jan Oblak", nationality: "Eslovênia", position: "GK", overall: 86 },
    { name: "Rodrigo De Paul", nationality: "Argentina", position: "MF", overall: 84 },
    { name: "Julián Álvarez", nationality: "Argentina", position: "FW", overall: 84 },
    { name: "Marcos Llorente", nationality: "Espanha", position: "DF", overall: 83 },
    { name: "Robin Le Normand", nationality: "Espanha", position: "DF", overall: 83 },
    { name: "José María Giménez", nationality: "Uruguai", position: "DF", overall: 83 },
    { name: "Alexander Sørloth", nationality: "Noruega", position: "FW", overall: 82 },
    { name: "Koke", nationality: "Espanha", position: "MF", overall: 82 },
    { name: "Conor Gallagher", nationality: "Inglaterra", position: "MF", overall: 80 },
    { name: "Reinildo Mandava", nationality: "Moçambique", position: "DF", overall: 80 },
    { name: "Samuel Lino", nationality: "Brasil", position: "MF", overall: 81 },
    { name: "Nahuel Molina", nationality: "Argentina", position: "DF", overall: 80 },
    { name: "Ángel Correa", nationality: "Argentina", position: "FW", overall: 81 }
  ],
  "Leverkusen": [
    { name: "Florian Wirtz", nationality: "Alemanha", position: "MF", overall: 89 },
    { name: "Granit Xhaka", nationality: "Suíça", position: "MF", overall: 86 },
    { name: "Álex Grimaldo", nationality: "Espanha", position: "DF", overall: 86 },
    { name: "Jeremie Frimpong", nationality: "Holanda", position: "DF", overall: 84 },
    { name: "Jonathan Tah", nationality: "Alemanha", position: "DF", overall: 84 },
    { name: "Lukáš Hrádecký", nationality: "Finlândia", position: "GK", overall: 84 },
    { name: "Edmond Tapsoba", nationality: "Burkina Faso", position: "DF", overall: 83 },
    { name: "Jonas Hofmann", nationality: "Alemanha", position: "MF", overall: 83 },
    { name: "Victor Boniface", nationality: "Nigéria", position: "FW", overall: 82 },
    { name: "Robert Andrich", nationality: "Alemanha", position: "MF", overall: 82 },
    { name: "Patrik Schick", nationality: "República Tcheca", position: "FW", overall: 81 },
    { name: "Exequiel Palacios", nationality: "Argentina", position: "MF", overall: 81 },
    { name: "Piero Hincapié", nationality: "Equador", position: "DF", overall: 81 }
  ],
  "Dortmund": [
    { name: "Gregor Kobel", nationality: "Suíça", position: "GK", overall: 88 },
    { name: "Julian Brandt", nationality: "Alemanha", position: "MF", overall: 85 },
    { name: "Nico Schlotterbeck", nationality: "Alemanha", position: "DF", overall: 85 },
    { name: "Marcel Sabitzer", nationality: "Áustria", position: "MF", overall: 84 },
    { name: "Serhou Guirassy", nationality: "Guiné", position: "FW", overall: 83 },
    { name: "Waldemar Anton", nationality: "Alemanha", position: "DF", overall: 82 },
    { name: "Emre Can", nationality: "Alemanha", position: "MF", overall: 82 },
    { name: "Donyell Malen", nationality: "Holanda", position: "FW", overall: 81 },
    { name: "Julian Ryerson", nationality: "Noruega", position: "DF", overall: 80 },
    { name: "Karim Adeyemi", nationality: "Alemanha", position: "FW", overall: 79 },
    { name: "Yan Couto", nationality: "Brasil", position: "DF", overall: 78 },
    { name: "Pascal Groß", nationality: "Alemanha", position: "MF", overall: 82 },
    { name: "Felix Nmecha", nationality: "Alemanha", position: "MF", overall: 77 },
    { name: "Jamie Gittens", nationality: "Inglaterra", position: "FW", overall: 75 }
  ],
  "AC Milan": [
    { name: "Mike Maignan", nationality: "França", position: "GK", overall: 87 },
    { name: "Theo Hernández", nationality: "França", position: "DF", overall: 87 },
    { name: "Rafael Leão", nationality: "Portugal", position: "FW", overall: 86 },
    { name: "Álvaro Morata", nationality: "Espanha", position: "FW", overall: 83 },
    { name: "Fikayo Tomori", nationality: "Inglaterra", position: "DF", overall: 83 },
    { name: "Tijjani Reijnders", nationality: "Holanda", position: "MF", overall: 82 },
    { name: "Christian Pulisic", nationality: "EUA", position: "MF", overall: 82 },
    { name: "Ruben Loftus-Cheek", nationality: "Inglaterra", position: "MF", overall: 81 },
    { name: "Youssouf Fofana", nationality: "França", position: "MF", overall: 81 },
    { name: "Strahinja Pavlović", nationality: "Sérvia", position: "DF", overall: 78 },
    { name: "Emerson Royal", nationality: "Brasil", position: "DF", overall: 78 },
    { name: "Ismaël Bennacer", nationality: "Argélia", position: "MF", overall: 81 },
    { name: "Samuel Chukwueze", nationality: "Nigéria", position: "FW", overall: 79 },
    { name: "Malick Thiaw", nationality: "Alemanha", position: "DF", overall: 77 }
  ],
  "Juventus": [
    { name: "Gleison Bremer", nationality: "Brasil", position: "DF", overall: 86 },
    { name: "Dušan Vlahović", nationality: "Sérvia", position: "FW", overall: 84 },
    { name: "Teun Koopmeiners", nationality: "Holanda", position: "MF", overall: 84 },
    { name: "Michele Di Gregorio", nationality: "Itália", position: "GK", overall: 83 },
    { name: "Manuel Locatelli", nationality: "Itália", position: "MF", overall: 81 },
    { name: "Nico González", nationality: "Argentina", position: "FW", overall: 81 },
    { name: "Andrea Cambiaso", nationality: "Itália", position: "DF", overall: 79 },
    { name: "Khéphren Thuram", nationality: "França", position: "MF", overall: 79 },
    { name: "Federico Gatti", nationality: "Itália", position: "DF", overall: 78 },
    { name: "Kenan Yıldız", nationality: "Turquia", position: "FW", overall: 70 },
    { name: "Nicolò Fagioli", nationality: "Itália", position: "MF", overall: 78 },
    { name: "Weston McKennie", nationality: "EUA", position: "MF", overall: 79 },
    { name: "Douglas Luiz", nationality: "Brasil", position: "MF", overall: 82 },
    { name: "Pierre Kalulu", nationality: "França", position: "DF", overall: 78 }
  ],
  "Tottenham": [
    { name: "Son Heung-min", nationality: "Coreia do Sul", position: "FW", overall: 87 },
    { name: "Cristian Romero", nationality: "Argentina", position: "DF", overall: 86 },
    { name: "James Maddison", nationality: "Inglaterra", position: "MF", overall: 85 },
    { name: "Guglielmo Vicario", nationality: "Itália", position: "GK", overall: 84 },
    { name: "Pedro Porro", nationality: "Espanha", position: "DF", overall: 83 },
    { name: "Micky van de Ven", nationality: "Holanda", position: "DF", overall: 82 },
    { name: "Destiny Udogie", nationality: "Itália", position: "DF", overall: 82 },
    { name: "Dejan Kulusevski", nationality: "Suécia", position: "MF", overall: 81 },
    { name: "Dominic Solanke", nationality: "Inglaterra", position: "FW", overall: 81 },
    { name: "Yves Bissouma", nationality: "Mali", position: "MF", overall: 81 },
    { name: "Brennan Johnson", nationality: "Gales", position: "FW", overall: 78 },
    { name: "Rodrigo Bentancur", nationality: "Uruguai", position: "MF", overall: 81 },
    { name: "Pape Matar Sarr", nationality: "Senegal", position: "MF", overall: 79 },
    { name: "Radu Drăgușin", nationality: "Romênia", position: "DF", overall: 75 }
  ]
};

// Gera um elenco inicial para um time
const generateSquad = (teamOverall: number, playerCount: number = 11, teamName?: string): Player[] => {
  const squad: Player[] = [];

  // Se houver jogadores reais para este time, usa eles primeiro
  if (teamName && REAL_PLAYERS_DATA[teamName]) {
    const realPlayers = REAL_PLAYERS_DATA[teamName];
    for (const p of realPlayers) {
      if (squad.length >= playerCount) break;
      const age = 18 + Math.floor(Math.random() * 15);
      squad.push({
        id: generateUUID(),
        name: p.name,
        position: p.position as any,
        overall: p.overall,
        age: age,
        value: calculatePlayerValue(p.overall, age),
        goals: 0,
        assists: 0,
        number: squad.length + 1,
        nationality: p.nationality,
        isInjured: false,
        isSuspended: false
      });
    }
  }

  const remainingCount = playerCount - squad.length;
  if (remainingCount > 0) {
    const basePositions: ('GK' | 'DF' | 'MF' | 'FW')[] = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW'];
    
    for (let i = 0; i < remainingCount; i++) {
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
        number: squad.length + 1,
        nationality: country.name,
        isInjured: false,
        isSuspended: false
      });
    }
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
      players: generateSquad(overall, comp?.playersPerTeam || 11, t.name),
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
        const isSecondHalf = round >= matchesPerRound;
        const actualWeek = isSecondHalf ? round + 5 : round + 1; // 4 weeks interval for mid-season transfers
        
        for (let i = 0; i < matchesPerRound; i++) {
          const homeIdx = (round + i) % (numTeams - 1);
          let awayIdx = (numTeams - 1 - i + round) % (numTeams - 1);

          if (i === 0) awayIdx = numTeams - 1;

          const homeTeamId = round % 2 === 0 ? teamIds[homeIdx] : teamIds[awayIdx];
          const awayTeamId = round % 2 === 0 ? teamIds[awayIdx] : teamIds[homeIdx];

          if (homeTeamId !== 'bye' && awayTeamId !== 'bye') {
            allMatches.push({
              id: generateUUID(),
              week: actualWeek,
              date: new Date(2025, 7, 1 + actualWeek * 7).toISOString(),
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
        date: new Date(2025, 7, 15 + currentWeek * 7).toISOString(),
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

  // Gera eventos de cartões, lesões e outros eventos de jogo
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

    // Faltas, Escanteios, Impedimentos (Eventos visuais)
    if (Math.random() < 0.3) {
      const types: ('foul' | 'corner' | 'offside' | 'throw_in')[] = ['foul', 'corner', 'offside', 'throw_in'];
      const type = types[Math.floor(Math.random() * types.length)];
      const player = players[Math.floor(Math.random() * players.length)];
      events.push({
        minute: Math.floor(Math.random() * 90) + 1,
        type,
        playerName: player.name,
        teamId: team.id
      });
    }
  };

  addGoalEvents(homeScore, home);
  addGoalEvents(awayScore, away);
  addRandomEvents(home);
  addRandomEvents(away);

  // Cálculo de Público e Renda
  const stadiumCapacity = home.stadiumCapacity || 30000;
  const baseAttendance = stadiumCapacity * (0.6 + Math.random() * 0.4);
  const performanceFactor = (home.overall / 100) * (away.overall / 100);
  const attendance = Math.round(baseAttendance * (0.8 + performanceFactor * 0.4));
  const ticketPrice = home.ticketPrice || 50;
  const revenue = attendance * ticketPrice;

  return {
    id: generateUUID(),
    week,
    competitionId,
    homeTeamId: home.id,
    awayTeamId: away.id,
    homeScore,
    awayScore,
    played: true,
    events: events.sort((a, b) => a.minute - b.minute),
    attendance,
    revenue
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

export const generateJobOffers = (teams: Team[], currentTeamId: string, managerOverall: number): any[] => {
  const offers: any[] = [];
  const availableTeams = teams.filter(t => t.id !== currentTeamId && !t.isNationalTeam);
  
  // 10% chance of receiving a club offer each week
  if (Math.random() < 0.1) {
    const targetTeam = availableTeams[Math.floor(Math.random() * availableTeams.length)];
    // Only offer if manager overall is somewhat close to team overall
    if (managerOverall >= targetTeam.overall - 10) {
      offers.push({
        id: generateUUID(),
        teamId: targetTeam.id,
        salary: Math.round(targetTeam.budget * 0.001),
        contractLength: 2 + Math.floor(Math.random() * 3),
        message: `O ${targetTeam.name} está impressionado com seu trabalho e gostaria de contar com você para as próximas temporadas.`,
        type: 'CLUB'
      });
    }
  }

  // 5% chance of receiving a national team offer
  if (Math.random() < 0.05) {
    const nationalTeams = teams.filter(t => t.isNationalTeam);
    if (nationalTeams.length > 0) {
      const targetNT = nationalTeams[Math.floor(Math.random() * nationalTeams.length)];
      if (managerOverall >= 75) {
        offers.push({
          id: generateUUID(),
          teamId: targetNT.id,
          salary: 0, // National teams usually don't pay "salary" in this game's context or it's symbolic
          contractLength: 4,
          message: `A Federação de Futebol do ${targetNT.name} convida você para assumir o comando técnico da seleção nacional.`,
          type: 'NATIONAL_TEAM'
        });
      }
    }
  }

  return offers;
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
