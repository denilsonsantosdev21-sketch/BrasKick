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
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { gameState, updateCompetition, addCompetition, deleteCompetition, addTeam, updateTeam, deleteTeam, updatePlayer } = useGameStore();
  const [activeTab, setActiveTab] = useState<'competitions' | 'teams' | 'players' | 'countries'>('competitions');
  
  // Selection states
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
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
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-10 bg-braskick-noite">
          <AnimatePresence mode="wait">
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
                            <img src={comp.logo} alt="" className="w-10 h-10 object-contain" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center">
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
                            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-display text-xl shadow-lg"
                            style={{ backgroundColor: team.color }}
                          >
                            {team.logo ? <img src={team.logo} alt="" className="w-full h-full object-contain rounded-lg" referrerPolicy="no-referrer" /> : team.name.substring(0, 1)}
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
                  <h2 className="font-display text-3xl uppercase tracking-widest">Gerenciar Países</h2>
                  <button 
                    onClick={() => setEditingItem({ name: '', type: 'LEAGUE', region: 'BRAZIL', tier: 1, countryName: '', countryFlag: '' })}
                    className="braskick-button-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> NOVO PAÍS
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {Array.from(new Set(competitions.map(c => c.countryName))).filter(Boolean).map(countryName => {
                    const comp = competitions.find(c => c.countryName === countryName);
                    return (
                      <div key={countryName} className="braskick-card group">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <img src={comp?.countryFlag} alt="" className="w-10 h-6 object-cover rounded shadow-sm" />
                            <div className="font-display text-lg leading-none">{countryName}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => setEditingItem(comp)}
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-braskick-muted hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                if (window.confirm(`Excluir todas as ligas de ${countryName}?`)) {
                                  competitions.filter(c => c.countryName === countryName).forEach(c => deleteCompetition(c.id));
                                }
                              }}
                              className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-braskick-muted hover:text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <button 
                          onClick={() => { 
                            setEditingItem({ 
                              name: '', 
                              type: 'LEAGUE', 
                              region: comp?.region || 'BRAZIL', 
                              tier: 1, 
                              countryName: countryName, 
                              countryFlag: comp?.countryFlag 
                            });
                          }}
                          className="w-full text-[10px] font-bold uppercase tracking-widest py-2 bg-braskick-verde/10 text-braskick-verde hover:bg-braskick-verde/20 rounded-lg transition-colors"
                        >
                          Adicionar Liga
                        </button>
                      </div>
                    );
                  })}
                </div>
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
                      {players.map(player => (
                        <div key={player.id} className="braskick-card group">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-white/5 rounded-2xl overflow-hidden flex-shrink-0">
                              {player.photo ? (
                                <img src={player.photo} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Users className="w-8 h-8 text-braskick-muted" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-display text-lg truncate leading-none mb-1">{player.name}</div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold text-braskick-verde uppercase tracking-widest">{player.position}</span>
                                <span className="text-[10px] font-bold text-braskick-muted uppercase tracking-widest">OVR {player.overall}</span>
                              </div>
                            </div>
                            <button 
                              onClick={() => setEditingItem(player)}
                              className="p-2 hover:bg-white/5 rounded-lg transition-colors text-braskick-muted hover:text-white"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
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
              className="bg-braskick-noite2 border border-white/10 rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <h3 className="font-display text-2xl uppercase tracking-widest">
                  {editingItem.id ? 'Editar' : 'Adicionar'} {activeTab === 'competitions' ? 'Liga' : activeTab === 'teams' ? 'Time' : 'Jogador'}
                </h3>
                <button onClick={() => setEditingItem(null)}><X className="w-6 h-6" /></button>
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
                        <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">País (Nome)</label>
                        <input 
                          type="text" 
                          value={editingItem.countryName || ''}
                          onChange={(e) => setEditingItem({ ...editingItem, countryName: e.target.value })}
                          className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none focus:border-braskick-verde"
                          placeholder="Ex: Brasil"
                        />
                      </div>
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
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Rebaixados</label>
                          <input type="number" value={editingItem.relegationCount || 0} onChange={(e) => setEditingItem({...editingItem, relegationCount: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Sobem</label>
                          <input type="number" value={editingItem.promotionCount || 0} onChange={(e) => setEditingItem({...editingItem, promotionCount: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
                        </div>
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

                <div className="pt-6">
                  <button 
                    type="submit"
                    className="w-full braskick-button-primary flex items-center justify-center gap-2 py-4"
                  >
                    <Save className="w-5 h-5" /> SALVAR ALTERAÇÕES
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
