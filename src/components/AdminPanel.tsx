import React, { useState, useRef } from 'react';
import { 
  Trophy, 
  Users, 
  Shield, 
  Plus, 
  Save, 
  Trash2, 
  Image as ImageIcon,
  Flag,
  ChevronRight,
  ChevronLeft,
  X,
  Edit2,
  Globe,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Competition, Team, Player } from '../types';
import { useGameStore } from '../gameStore';
import { generateUUID } from '../gameEngine';
import * as XLSX from 'xlsx';


interface AdminPanelProps {
  onClose: () => void;
  onSync?: () => Promise<void>;
}

export default function AdminPanel({ onClose, onSync }: AdminPanelProps) {
  const { gameState, updateCompetition, addCompetition, deleteCompetition, addTeam, updateTeam, deleteTeam, updatePlayer } = useGameStore();
  const [activeTab, setActiveTab] = useState<'competitions' | 'teams' | 'players' | 'countries' | 'assets'>('competitions');
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Selection states
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [editingCountry, setEditingCountry] = useState<any>(null);
  const [showCountrySelector, setShowCountrySelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const southAmericanCountries = [
    'Argentina', 'Bolívia', 'Brasil', 'Chile', 'Colômbia', 
    'Equador', 'Paraguai', 'Peru', 'Uruguai', 'Venezuela'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (!gameState) return;
        
        const teamsMap = new Map<string, Team>();
        
        gameState.teams.forEach(t => teamsMap.set(t.name, { ...t, players: [...t.players] }));
        
        let importedCount = 0;

        data.forEach((row: any) => {
          const playerName = row['Nome do Jogador'] || row['Nome'];
          const nationality = row['Nacionalidade'];
          const ageStr = row['Idade'];
          const age = ageStr ? parseInt(ageStr) : 20;
          const teamName = row['Time'] || row['Equipe'];
          let position = row['Posição'] || row['Posicao'] || 'MF';
          const overallStr = row['Overall'] || row['OVR'];
          const overall = overallStr ? parseInt(overallStr) : 70;

          if (!playerName || !teamName) return;

          if (['GK','DF','MF','FW'].indexOf(position) === -1) {
             const posMap: any = { 'GOL': 'GK', 'ZAG':'DF', 'LD':'DF','LE':'DF','VOL':'MF','MEI':'MF','MC':'MF','ATA':'FW','PE':'FW','PD':'FW' };
             position = posMap[position.toString().toUpperCase()] || 'MF';
          }
          
          if (!teamsMap.has(teamName)) {
            teamsMap.set(teamName, {
              id: generateUUID(),
              name: teamName,
              leagueId: selectedCompId || gameState.competitions[0]?.id || '',
              overall: 70, 
              attack: 70, midfield: 70, defense: 70,
              players: [],
              budget: 50000000,
              color: '#000000',
              points: 0, played: 0, won: 0, drawn: 0, lost: 0, gd: 0, gf: 0, ga: 0, form: []
            });
          }

          const team = teamsMap.get(teamName)!;
          
          team.players.push({
            id: generateUUID(),
            name: String(playerName),
            position: position as any,
            overall: isNaN(overall) ? 70 : overall,
            age: isNaN(age) ? 20 : age,
            nationality: nationality || 'Desconhecido',
            value: 1000000,
            goals: 0,
            assists: 0
          });
          importedCount++;
        });

        Array.from(teamsMap.values()).forEach(t => {
          if (t.players.length > 0) {
            t.overall = Math.round(t.players.reduce((sum, p) => sum + p.overall, 0) / t.players.length);
            t.attack = t.overall; t.midfield = t.overall; t.defense = t.overall;
          }
          if (gameState.teams.find(xt => xt.id === t.id)) {
            updateTeam(t);
          } else {
            addTeam(t);
          }
        });

        alert(`Planilha importada! ${importedCount} jogadores importados/atualizados.`);
      } catch (err) {
        console.error("Erro importando excel: ", err);
        alert("Erro ao ler o Excel. Certifique-se de que a planilha tem as colunas corretas.");
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (!gameState) return null;

  const competitions = gameState.competitions;
  const teams = (gameState.teams || []).filter(t => t && (!selectedCompId || t.leagueId === selectedCompId));
  const selectedTeam = gameState.teams.find(t => t.id === selectedTeamId);
  const players = selectedTeam?.players || [];

  const handleSaveCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
      updateCompetition(editingItem);
    } else {
      addCompetition({ ...editingItem, id: generateUUID() });
    }
    setEditingItem(null);
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
      updateTeam(editingItem);
    } else {
      addTeam({ 
        ...editingItem, 
        id: generateUUID(),
        points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, form: []
      });
    }
    setEditingItem(null);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamId) {
      if (editingItem.id) {
        updatePlayer(selectedTeamId, editingItem);
      } else {
        // Adicionar novo jogador
        const newPlayer = { ...editingItem, id: generateUUID() };
        const team = teams.find(t => t.id === selectedTeamId);
        if (team) {
          const updatedTeam = {
            ...team,
            players: [...team.players, newPlayer]
          };
          updateTeam(updatedTeam);
        }
      }
    }
    setEditingItem(null);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-braskick-noite flex flex-col overflow-hidden">
      {/* Header */}
      <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-braskick-noite2">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-braskick-verde/20 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-braskick-verde" />
          </div>
          <h1 className="font-display text-2xl uppercase tracking-widest">Painel Administrativo</h1>
        </div>
        <div className="flex items-center gap-4">
          {onSync && (
            <button 
              onClick={async () => {
                setIsSyncing(true);
                await onSync();
                setIsSyncing(false);
              }}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                isSyncing ? 'bg-white/5 text-white/30' : 'bg-braskick-ouro/20 text-braskick-ouro hover:bg-braskick-ouro/30 border border-braskick-ouro/20'
              }`}
            >
              <Save className={`w-4 h-4 ${isSyncing ? 'animate-pulse' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar Supabase'}
            </button>
          )}
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r border-white/10 bg-braskick-noite2/50 p-6 space-y-2">
          <AdminNavButton 
            active={activeTab === 'competitions'} 
            onClick={() => { setActiveTab('competitions'); setSelectedCompId(null); setSelectedTeamId(null); }}
            icon={<Trophy className="w-5 h-5" />}
            label="Competições"
          />
          <AdminNavButton 
            active={activeTab === 'teams'} 
            onClick={() => { setActiveTab('teams'); setSelectedTeamId(null); }}
            icon={<Shield className="w-5 h-5" />}
            label="Times"
          />
          <AdminNavButton 
            active={activeTab === 'countries'} 
            onClick={() => setActiveTab('countries')}
            icon={<Globe className="w-5 h-5" />}
            label="Países"
          />
          <AdminNavButton 
            active={activeTab === 'players'} 
            onClick={() => setActiveTab('players')}
            icon={<Users className="w-5 h-5" />}
            label="Jogadores"
          />
          <AdminNavButton 
            active={activeTab === 'assets'} 
            onClick={() => setActiveTab('assets')}
            icon={<ImageIcon className="w-5 h-5" />}
            label="Imagens"
          />
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-10 bg-braskick-noite">
          <AnimatePresence mode="wait">
            {activeTab === 'assets' && (
              <motion.div 
                key="assets"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl uppercase tracking-widest">Gerenciar Imagens (Assets)</h2>
                  <div className="text-braskick-muted text-xs font-bold uppercase tracking-widest">
                    Central de URLs para logos, escudos e fotos
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {/* Competições */}
                  {gameState?.competitions.filter(c => c.logo).map(comp => (
                    <div key={comp.id} className="braskick-card p-4 border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                          <img src={comp.logo} alt={comp.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{comp.name}</h3>
                          <span className="text-[10px] text-braskick-muted uppercase tracking-widest">Liga</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-braskick-muted uppercase tracking-widest font-bold">URL da Logo</label>
                        <input 
                          type="text" 
                          value={comp.logo || ''} 
                          onChange={(e) => updateCompetition(comp.id, { logo: e.target.value })}
                          className="bg-braskick-noite2 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-braskick-verde transition-colors"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Times */}
                  {gameState?.teams.filter(t => t.logo).map(team => (
                    <div key={team.id} className="braskick-card p-4 border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                          <img src={team.logo} alt={team.name} className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm truncate">{team.name}</h3>
                          <span className="text-[10px] text-braskick-muted uppercase tracking-widest">Time</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] text-braskick-muted uppercase tracking-widest font-bold">URL do Escudo</label>
                        <input 
                          type="text" 
                          value={team.logo || ''} 
                          onChange={(e) => updateTeam({ ...team, logo: e.target.value })}
                          className="bg-braskick-noite2 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-braskick-verde transition-colors"
                        />
                      </div>
                    </div>
                  ))}

                  {/* Jogadores */}
                  {gameState?.teams.flatMap(t => t.players).filter(p => p.photo).slice(0, 50).map(player => {
                    const team = gameState.teams.find(t => t.players.some(pl => pl.id === player.id));
                    return (
                      <div key={player.id} className="braskick-card p-4 border border-white/5 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center overflow-hidden">
                            <img src={player.photo} alt={player.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-sm truncate">{player.name}</h3>
                            <span className="text-[10px] text-braskick-muted uppercase tracking-widest">{team?.name || 'Jogador'}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-[10px] text-braskick-muted uppercase tracking-widest font-bold">URL da Foto</label>
                          <input 
                            type="text" 
                            value={player.photo || ''} 
                            onChange={(e) => {
                              if (team) updatePlayer(team.id, { ...player, photo: e.target.value });
                            }}
                            className="bg-braskick-noite2 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-braskick-verde transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {activeTab === 'competitions' && (
              <motion.div 
                key="comps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-3xl uppercase tracking-widest">Gerenciar Ligas</h2>
                  <button 
                    onClick={() => setEditingItem({ name: '', type: 'LEAGUE', region: 'BRAZIL', tier: 1 })}
                    className="braskick-button-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> NOVA LIGA
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {competitions.map(comp => (
                    <div key={comp.id} className="braskick-card group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {comp.logo ? (
                            <img src={comp.logo} alt="" className="w-10 h-10 object-contain rounded-lg" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center">
                              <Trophy className="w-5 h-5 text-braskick-muted" />
                            </div>
                          )}
                          <div>
                            <div className="font-display text-lg leading-none">{comp.name}</div>
                            <div className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mt-1">{comp.region}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setEditingItem(comp)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-braskick-muted hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => { setSelectedCompId(comp.id); setActiveTab('teams'); }}
                          className="text-[10px] font-bold uppercase tracking-widest py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          Ver Times
                        </button>
                        <button 
                          onClick={() => deleteCompetition(comp.id)}
                          className="text-[10px] font-bold uppercase tracking-widest py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'teams' && (
              <motion.div 
                key="teams"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-widest">Gerenciar Times</h2>
                    {selectedCompId && (
                      <div className="text-braskick-verde text-xs font-bold uppercase tracking-widest mt-1">
                        Filtrando por: {competitions.find(c => c.id === selectedCompId)?.name}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div>
                      <input 
                        type="file" 
                        accept=".xlsx, .xls, .csv" 
                        className="hidden" 
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/10 hover:bg-white/20 text-white flex items-center gap-2 px-4 py-2 rounded-xl transition-all font-display text-sm uppercase tracking-widest h-full"
                      >
                        <Save className="w-5 h-5" /> Importar Excel
                      </button>
                    </div>
                    <button 
                      onClick={() => setEditingItem({ name: '', leagueId: selectedCompId || competitions[0].id, overall: 70, attack: 70, midfield: 70, defense: 70, color: '#009c3b', budget: 50000000, players: [] })}
                      className="braskick-button-primary flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" /> NOVO TIME
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {teams.map(team => (
                    <div key={team.id} className="braskick-card group">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div 
                            className={`w-10 h-10 ${team.logo ? 'rounded-lg' : 'rounded-full'} flex items-center justify-center text-white font-display text-xl shadow-lg`}
                            style={{ backgroundColor: team.color }}
                          >
                            {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-contain" referrerPolicy="no-referrer" /> : team.name.substring(0, 1)}
                          </div>
                          <div>
                            <div className="font-display text-lg leading-none">{team.name}</div>
                            <div className="ovr-badge mt-1">OVR {team.overall}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setEditingItem(team)}
                          className="p-2 hover:bg-white/5 rounded-lg transition-colors text-braskick-muted hover:text-white"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => { setSelectedTeamId(team.id); setActiveTab('players'); }}
                          className="text-[10px] font-bold uppercase tracking-widest py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                        >
                          Elenco
                        </button>
                        <button 
                          onClick={() => deleteTeam(team.id)}
                          className="text-[10px] font-bold uppercase tracking-widest py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'countries' && (
              <motion.div 
                key="countries"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-display text-3xl uppercase tracking-widest">Países e Bandeiras</h2>
                    <p className="text-braskick-muted text-xs uppercase tracking-widest">Gerencie as bandeiras dos países e os jogadores das seleções nacionais.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {gameState?.teams.filter(t => t.isNationalTeam).map(country => (
                    <div key={country.id} className="braskick-card group flex flex-col items-center text-center">
                      <div className={`w-24 h-16 bg-white/5 ${country.logo ? 'rounded-lg' : 'rounded-full'} mb-4 overflow-hidden border border-white/10 relative shadow-xl`}>
                        {country.logo ? (
                          <img src={country.logo} alt={country.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <Flag className="w-8 h-8 text-white/20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        )}
                      </div>
                      <h3 className="font-display text-lg uppercase tracking-wider mb-1">{country.name}</h3>
                      <p className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-4">{country.players.length} Jogadores Convocados</p>
                      
                      <div className="flex items-center gap-2 w-full">
                        <button
                          onClick={() => setEditingCountry(country)}
                          className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-white/5"
                        >
                          Alterar Bandeira
                        </button>
                        <button
                          onClick={() => { setSelectedTeamId(country.id); setActiveTab('players'); }}
                          className="flex-1 py-2 bg-braskick-verde/10 hover:bg-braskick-verde/20 text-braskick-verde rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-braskick-verde/20"
                        >
                          Ver Jogadores
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {editingCountry && (
                  <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="bg-braskick-noite2 border border-white/10 rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="font-display text-2xl uppercase tracking-widest">Editar Bandeira</h2>
                        <button onClick={() => setEditingCountry(null)} className="p-2 hover:bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex justify-center mb-4">
                           <div className={`w-32 h-20 bg-white/5 ${editingCountry.logo ? 'rounded-xl' : 'rounded-full'} overflow-hidden border border-white/10 shadow-2xl relative`}>
                             {editingCountry.logo ? (
                               <img src={editingCountry.logo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                             ) : (
                               <Flag className="w-10 h-10 text-white/10 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                             )}
                           </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">URL da Bandeira (SVG/PNG)</label>
                          <input
                            type="text"
                            value={editingCountry.logo || ''}
                            onChange={(e) => setEditingCountry({ ...editingCountry, logo: e.target.value })}
                            placeholder="https://flagcdn.com/br.svg"
                            className="w-full bg-braskick-noite border border-white/10 rounded-xl p-4 text-sm focus:border-braskick-verde outline-none transition-all"
                          />
                          <p className="text-[9px] text-braskick-muted italic">Dica: Use sites como flagcdn.com para obter URLs de bandeiras.</p>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                          <button
                            onClick={() => setEditingCountry(null)}
                            className="flex-1 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={() => {
                              updateTeam(editingCountry);
                              setEditingCountry(null);
                            }}
                            className="flex-1 py-4 bg-braskick-verde text-braskick-noite rounded-2xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-braskick-verde/20"
                          >
                            Salvar Bandeira
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'players' && (
              <motion.div 
                key="players"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {!selectedTeam ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="font-display text-3xl uppercase tracking-widest">Selecione um Time</h2>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-braskick-muted" />
                        <input 
                          type="text" 
                          placeholder="Buscar time..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-braskick-verde transition-all"
                          onChange={(e) => {
                            const term = e.target.value.toLowerCase();
                            const cards = document.querySelectorAll('.team-select-card');
                            cards.forEach((card: any) => {
                              const name = card.getAttribute('data-name').toLowerCase();
                              if (name.includes(term)) {
                                card.style.display = 'block';
                              } else {
                                card.style.display = 'none';
                              }
                            });
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {gameState.teams.map(team => {
                        if (!team) return null;
                        return (
                          <button 
                            key={team.id} 
                            onClick={() => setSelectedTeamId(team.id)}
                            data-name={team.name}
                            className="team-select-card braskick-card group text-left hover:border-braskick-verde/50 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-xl shadow-lg"
                                style={{ backgroundColor: team.color }}
                              >
                                {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" /> : team.name.substring(0, 1)}
                              </div>
                              <div className="font-display text-lg leading-none">{team.name}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setSelectedTeamId(null)}
                          className="p-2 hover:bg-white/5 rounded-xl transition-colors"
                        >
                          <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                          <h2 className="font-display text-3xl uppercase tracking-widest">Elenco: {selectedTeam.name}</h2>
                          <div className="text-braskick-muted text-xs font-bold uppercase tracking-widest mt-1">
                            {players.length} Jogadores no elenco
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => setEditingItem({ name: '', position: 'FW', overall: 70, age: 20, value: 1000000, goals: 0, assists: 0 })}
                        className="braskick-button-primary flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> NOVO JOGADOR
                      </button>
                    </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {players.map(player => {
                        const ptPos = player.position === 'GK' ? 'GOL' : player.position === 'DF' ? 'ZAG/LAT' : player.position === 'MF' ? 'MEI/VOL' : 'ATA/PON';
                        const posColor = player.position === 'GK' ? 'text-braskick-ouro' : player.position === 'DF' ? 'text-braskick-verde' : player.position === 'MF' ? 'text-braskick-azul' : 'text-red-500';

                        return (
                        <div key={player.id} className="braskick-card group relative overflow-hidden flex flex-col p-0 border border-white/10 hover:border-braskick-verde transition-all">
                          <div className="flex-1 p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className={`w-16 h-16 bg-braskick-noite3 ${player.photo ? 'rounded-2xl' : 'rounded-full'} overflow-hidden flex-shrink-0 border border-white/5 relative z-10 shadow-lg`}>
                                {player.photo ? (
                                  <img src={player.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Users className="w-8 h-8 text-braskick-muted opacity-50" />
                                  </div>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={`font-display text-2xl ${posColor}`}>{player.overall}</span>
                                <div className={`text-[10px] font-bold uppercase tracking-widest ${posColor}`}>{ptPos}</div>
                              </div>
                            </div>
                            
                            <div className="space-y-1 relative z-10">
                              <div className="font-display text-xl truncate leading-none">{player.name}</div>
                              <div className="flex items-center justify-between text-[10px] font-bold text-braskick-muted uppercase tracking-widest">
                                <span>{player.nationality || 'Desconhecido'}</span>
                                <span>{player.age} ANOS</span>
                              </div>
                            </div>
                          </div>

                          <div className="bg-white/5 px-5 py-4 flex items-center justify-between border-t border-white/10 relative z-10">
                            <div className="text-braskick-verde font-display text-lg">
                              R$ {(player.value / 1000000).toFixed(1)}M
                            </div>
                            <button 
                              onClick={() => setEditingItem(player)}
                              className="p-2 bg-braskick-noite3 hover:bg-braskick-verde rounded-lg transition-colors text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {/* Background Effect */}
                          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-50 pointer-events-none group-hover:bg-braskick-verde/20 transition-all" />
                        </div>
                      )})}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Edit Modals */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-braskick-noite2 border border-white/10 rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8 sticky top-0 bg-braskick-noite2 z-20 pb-4 border-b border-white/5">
                <h3 className="font-display text-2xl uppercase tracking-widest">
                  {editingItem.id ? 'Editar' : 'Adicionar'} {activeTab === 'competitions' ? 'Liga' : activeTab === 'teams' ? 'Time' : activeTab === 'countries' ? 'País' : 'Jogador'}
                </h3>
                <button onClick={() => setEditingItem(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={activeTab === 'competitions' ? handleSaveCompetition : activeTab === 'teams' ? handleSaveTeam : handleSavePlayer} className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="col-span-2">
                    <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Nome</label>
                    <input 
                      type="text" 
                      value={editingItem.name}
                      onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                      className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                      required
                    />
                  </div>

                  {activeTab === 'competitions' && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Região</label>
                          <select 
                            value={editingItem.region}
                            onChange={(e) => setEditingItem({ ...editingItem, region: e.target.value })}
                            className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          >
                            <option value="BRAZIL">Brasil</option>
                            <option value="EUROPE">Europa</option>
                            <option value="SOUTH_AMERICA">América do Sul</option>
                            <option value="WORLD">Mundo</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Formato</label>
                          <select 
                            value={editingItem.format || 'LEAGUE'}
                            onChange={(e) => setEditingItem({ ...editingItem, format: e.target.value })}
                            className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          >
                            <option value="LEAGUE">Pontos Corridos</option>
                            <option value="GROUPS">Grupos</option>
                            <option value="KNOCKOUT">Mata-Mata</option>
                            <option value="GROUPS_KNOCKOUT">Grupos + Mata-Mata</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">País (Opcional)</label>
                        <input 
                          type="text" 
                          value={editingItem.countryName || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, countryName: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          placeholder="Ex: Brasil"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">URL do Logo</label>
                        <input 
                          type="text" 
                          value={editingItem.logo || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Regras / Oberservações</label>
                        <textarea 
                          value={editingItem.rules || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, rules: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde min-h-[80px]"
                          placeholder="Descreva aqui se o campeonato possui alguma regra especial..."
                        />
                      </div>

                      {(editingItem.format === 'GROUPS' || editingItem.format === 'GROUPS_KNOCKOUT') && (
                        <div className="col-span-2 grid grid-cols-2 gap-4 p-4 bg-braskick-noite rounded-2xl border border-white/5">
                          <div>
                            <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Número de Grupos</label>
                            <input 
                              type="number" 
                              value={editingItem.groupsCount || 8} 
                              onChange={e => setEditingItem({...editingItem, groupsCount: parseInt(e.target.value)})}
                              className="w-full bg-braskick-noite2 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Times por Grupo</label>
                            <input 
                              type="number" 
                              value={editingItem.teamsPerGroup || 4} 
                              onChange={e => setEditingItem({...editingItem, teamsPerGroup: parseInt(e.target.value)})}
                              className="w-full bg-braskick-noite2 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                            />
                          </div>
                        </div>
                      )}

                      {editingItem.region === 'SOUTH_AMERICA' && (
                        <div className="col-span-2 p-4 bg-braskick-noite rounded-2xl border border-white/5">
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-4">Países Participantes (América do Sul)</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {southAmericanCountries.map(country => (
                              <label key={country} className="flex items-center gap-2 cursor-pointer group">
                                <input 
                                  type="checkbox"
                                  checked={(editingItem.participatingCountries || []).includes(country)}
                                  onChange={(e) => {
                                    const current = editingItem.participatingCountries || [];
                                    if (e.target.checked) {
                                      setEditingItem({ ...editingItem, participatingCountries: [...current, country] });
                                    } else {
                                      setEditingItem({ ...editingItem, participatingCountries: current.filter((c: string) => c !== country) });
                                    }
                                  }}
                                  className="w-4 h-4 accent-braskick-verde"
                                />
                                <span className="text-xs font-bold uppercase tracking-widest text-braskick-muted group-hover:text-white transition-colors">{country}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">URL da Bandeira</label>
                        <input 
                          type="text" 
                          value={editingItem.countryFlag || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, countryFlag: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          placeholder="https://..."
                        />
                      </div>
                      <div className="col-span-2 space-y-4 border-t border-white/5 pt-6 mt-6">
                        <div className="flex items-center justify-between">
                          <h3 className="font-display text-sm uppercase tracking-widest text-braskick-ouro">Regras de Acesso e Rebaixamento</h3>
                          <button
                            type="button"
                            onClick={() => {
                              const rules = editingItem.detailedRules || [];
                              setEditingItem({
                                ...editingItem,
                                detailedRules: [...rules, {
                                  id: Math.random().toString(36).substr(2, 9),
                                  minPosition: 1,
                                  maxPosition: 1,
                                  targetCompetitionId: '',
                                  type: 'QUALIFICATION',
                                  description: ''
                                }]
                              });
                            }}
                            className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1 rounded-md uppercase font-bold tracking-wider transition-all border border-white/5"
                          >
                            + Adicionar Regra (Acesso/Qualificação/Rebaixamento)
                          </button>
                        </div>

                        {editingItem.detailedRules?.map((rule: any, idx: number) => (
                          <div key={rule.id} className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-braskick-noite rounded-xl border border-white/5 relative group/rule">
                            <button
                              type="button"
                              onClick={() => {
                                const rules = [...(editingItem.detailedRules || [])];
                                rules.splice(idx, 1);
                                setEditingItem({ ...editingItem, detailedRules: rules });
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover/rule:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Tipo de Regra</label>
                              <select
                                value={rule.type}
                                onChange={(e) => {
                                  const rules = [...(editingItem.detailedRules || [])];
                                  rules[idx].type = e.target.value as any;
                                  setEditingItem({ ...editingItem, detailedRules: rules });
                                }}
                                className="w-full bg-braskick-noite2 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-braskick-verde"
                              >
                                <option value="QUALIFICATION">Qualificação (Ex: Libertadores)</option>
                                <option value="PROMOTION">Acesso (Ex: Série A)</option>
                                <option value="RELEGATION">Rebaixamento (Ex: Série B)</option>
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Posições (De - Até)</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={rule.minPosition}
                                  onChange={(e) => {
                                    const rules = [...(editingItem.detailedRules || [])];
                                    rules[idx].minPosition = parseInt(e.target.value);
                                    setEditingItem({ ...editingItem, detailedRules: rules });
                                  }}
                                  className="w-full bg-braskick-noite2 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-braskick-verde"
                                />
                                <span className="text-white/20">/</span>
                                <input
                                  type="number"
                                  value={rule.maxPosition}
                                  onChange={(e) => {
                                    const rules = [...(editingItem.detailedRules || [])];
                                    rules[idx].maxPosition = parseInt(e.target.value);
                                    setEditingItem({ ...editingItem, detailedRules: rules });
                                  }}
                                  className="w-full bg-braskick-noite2 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-braskick-verde"
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Competicão Alvo</label>
                              <select
                                value={rule.targetCompetitionId}
                                onChange={(e) => {
                                  const rules = [...(editingItem.detailedRules || [])];
                                  rules[idx].targetCompetitionId = e.target.value;
                                  setEditingItem({ ...editingItem, detailedRules: rules });
                                }}
                                className="w-full bg-braskick-noite2 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-braskick-verde"
                              >
                                <option value="">Nenhuma</option>
                                {gameState?.competitions.map(c => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">Nome da Vaga</label>
                              <input
                                type="text"
                                value={rule.description}
                                onChange={(e) => {
                                  const rules = [...(editingItem.detailedRules || [])];
                                  rules[idx].description = e.target.value;
                                  setEditingItem({ ...editingItem, detailedRules: rules });
                                }}
                                placeholder="Ex: Libertadores"
                                className="w-full bg-braskick-noite2 border border-white/10 rounded-lg p-2 text-xs outline-none focus:border-braskick-verde"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="col-span-2 grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Times</label>
                          <input type="number" value={editingItem.teamsCount || 20} onChange={(e) => setEditingItem({...editingItem, teamsCount: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Vagas Continentais</label>
                          <input type="number" value={editingItem.qualificationSpots || 0} onChange={(e) => setEditingItem({...editingItem, qualificationSpots: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Jogadores/Time</label>
                          <input type="number" value={editingItem.playersPerTeam || 11} onChange={(e) => setEditingItem({...editingItem, playersPerTeam: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
                        </div>
                      </div>
                      <div className="col-span-2 flex items-center gap-4 p-4 bg-braskick-noite rounded-2xl border border-white/5">
                        <input 
                          type="checkbox" 
                          id="hasPlayoffs"
                          checked={editingItem.hasPlayoffs || false}
                          onChange={e => setEditingItem({...editingItem, hasPlayoffs: e.target.checked})}
                          className="w-5 h-5 accent-braskick-verde"
                        />
                        <label htmlFor="hasPlayoffs" className="font-display text-sm uppercase tracking-widest cursor-pointer">Possui Mata-Mata (Playoffs)</label>
                      </div>
                      {editingItem.hasPlayoffs && (
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Times no Mata-Mata</label>
                          <input 
                            type="number" 
                            value={editingItem.playoffTeamsCount || 4} 
                            onChange={e => setEditingItem({...editingItem, playoffTeamsCount: parseInt(e.target.value)})}
                            className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'teams' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Cor Principal</label>
                        <input 
                          type="color" 
                          value={editingItem.color}
                          onChange={(e) => setEditingItem({ ...editingItem, color: e.target.value })}
                          className="w-full h-12 bg-braskick-noite border border-white/10 rounded-xl p-1 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Orçamento (R$)</label>
                        <input 
                          type="number" 
                          value={editingItem.budget}
                          onChange={(e) => setEditingItem({ ...editingItem, budget: parseInt(e.target.value) })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">URL do Escudo</label>
                        <input 
                          type="text" 
                          value={editingItem.logo || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, logo: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  )}

                  {activeTab === 'players' && (
                    <>
                      <div>
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Posição</label>
                        <select 
                          value={editingItem.position}
                          onChange={(e) => setEditingItem({ ...editingItem, position: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                        >
                          <option value="GK">Goleiro</option>
                          <option value="DF">Defensor</option>
                          <option value="MF">Meio-Campo</option>
                          <option value="FW">Atacante</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Overall</label>
                        <input 
                          type="number" 
                          value={editingItem.overall}
                          onChange={(e) => setEditingItem({ ...editingItem, overall: parseInt(e.target.value) })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          min="1" max="99"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">URL da Foto</label>
                        <input 
                          type="text" 
                          value={editingItem.photo || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, photo: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="pt-6 grid grid-cols-2 gap-4">
                  <button 
                    type="button"
                    onClick={() => setEditingItem(null)}
                    className="w-full py-4 text-white hover:text-red-400 font-display text-lg uppercase tracking-widest rounded-xl transition-all border border-transparent hover:border-red-500/30"
                  >
                    CANCELAR
                  </button>
                  <button 
                    type="submit"
                    className="w-full braskick-button-primary flex items-center justify-center gap-2 py-4"
                  >
                    <Save className="w-5 h-5" /> SALVAR
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AdminNavButton({ active, onClick, icon, label, disabled = false }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-display text-sm uppercase tracking-widest ${
        active 
          ? 'bg-braskick-verde text-white shadow-lg shadow-braskick-verde/20' 
          : 'text-braskick-muted hover:bg-white/5 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
