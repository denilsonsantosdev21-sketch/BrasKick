import React, { useState } from 'react';
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
  Edit2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Competition, Team, Player } from '../types';
import { useGameStore } from '../gameStore';

interface AdminPanelProps {
  onClose: () => void;
}

export default function AdminPanel({ onClose }: AdminPanelProps) {
  const { gameState, updateCompetition, addCompetition, addTeam, updateTeam, updatePlayer } = useGameStore();
  const [activeTab, setActiveTab] = useState<'competitions' | 'teams' | 'players'>('competitions');
  
  // Selection states
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  if (!gameState) return null;

  const competitions = gameState.competitions;
  const teams = gameState.teams.filter(t => !selectedCompId || t.leagueId === selectedCompId);
  const selectedTeam = gameState.teams.find(t => t.id === selectedTeamId);
  const players = selectedTeam?.players || [];

  const handleSaveCompetition = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingItem.id) {
      updateCompetition(editingItem);
    } else {
      addCompetition({ ...editingItem, id: `comp-${Date.now()}` });
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
        id: `team-${Date.now()}`,
        points: 0, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, form: []
      });
    }
    setEditingItem(null);
  };

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTeamId) {
      updatePlayer(selectedTeamId, editingItem);
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
            active={activeTab === 'players'} 
            onClick={() => setActiveTab('players')}
            icon={<Users className="w-5 h-5" />}
            label="Jogadores"
            disabled={!selectedTeamId}
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
                  <button 
                    onClick={() => setEditingItem({ name: '', leagueId: selectedCompId || competitions[0].id, overall: 70, attack: 70, midfield: 70, defense: 70, color: '#009c3b', budget: 50000000, players: [] })}
                    className="braskick-button-primary flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" /> NOVO TIME
                  </button>
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
                      <button 
                        onClick={() => { setSelectedTeamId(team.id); setActiveTab('players'); }}
                        className="w-full text-[10px] font-bold uppercase tracking-widest py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        Gerenciar Elenco
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'players' && selectedTeam && (
              <motion.div 
                key="players"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { setActiveTab('teams'); setSelectedTeamId(null); }}
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
                      <div className="col-span-2 grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Times</label>
                          <input type="number" value={editingItem.teamsCount || 20} onChange={(e) => setEditingItem({...editingItem, teamsCount: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-braskick-muted uppercase tracking-widest mb-2">Vagas Continentais</label>
                          <input type="number" value={editingItem.qualificationSpots || 0} onChange={(e) => setEditingItem({...editingItem, qualificationSpots: parseInt(e.target.value)})} className="w-full bg-braskick-noite border border-white/10 rounded-xl p-3 text-white outline-none" />
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
