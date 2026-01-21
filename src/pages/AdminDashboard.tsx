import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Users, UserCheck, Trophy, LogOut, Plus, Trash2, Edit2 } from 'lucide-react';

interface Judge {
  id: string;
  name: string;
  created_at: string;
}

interface Team {
  id: string;
  name: string;
  created_at: string;
}

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'judges' | 'teams' | 'scores'>('judges');
  const [judges, setJudges] = useState<Judge[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newJudgeName, setNewJudgeName] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login');
      return;
    }
    fetchJudges();
    fetchTeams();
  }, [user, navigate]);

  const fetchJudges = async () => {
    const { data, error } = await supabase
      .from('judges')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setJudges(data);
    }
  };

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTeams(data);
    }
  };

  const addJudge = async () => {
    if (!newJudgeName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('judges')
        .insert([{ name: newJudgeName.trim() }]);

      if (error) throw error;
      setNewJudgeName('');
      fetchJudges();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add judge');
    } finally {
      setLoading(false);
    }
  };

  const deleteJudge = async (id: string) => {
    if (!confirm('Are you sure you want to delete this judge?')) return;
    const { error } = await supabase
      .from('judges')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchJudges();
    }
  };

  const addTeam = async () => {
    if (!newTeamName.trim()) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('teams')
        .insert([{ name: newTeamName.trim() }]);

      if (error) throw error;
      setNewTeamName('');
      fetchTeams();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to add team');
    } finally {
      setLoading(false);
    }
  };

  const deleteTeam = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;
    const { error } = await supabase
      .from('teams')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchTeams();
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-2 rounded-lg">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="text-slate-300 hover:text-white px-4 py-2 rounded-lg transition-colors"
              >
                View Leaderboard
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg transition-colors border border-red-500/20"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('judges')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'judges'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <UserCheck className="w-5 h-5" />
            Judges ({judges.length})
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === 'teams'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Users className="w-5 h-5" />
            Teams ({teams.length})
          </button>
        </div>

        {activeTab === 'judges' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Add New Judge</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newJudgeName}
                  onChange={(e) => setNewJudgeName(e.target.value)}
                  placeholder="Enter judge name"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addJudge()}
                />
                <button
                  onClick={addJudge}
                  disabled={loading || !newJudgeName.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  Add Judge
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">All Judges</h2>
              </div>
              <div className="divide-y divide-white/5">
                {judges.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No judges added yet
                  </div>
                ) : (
                  judges.map((judge) => (
                    <div
                      key={judge.id}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg">
                          <UserCheck className="w-5 h-5 text-blue-400" />
                        </div>
                        <span className="text-white font-medium">{judge.name}</span>
                      </div>
                      <button
                        onClick={() => deleteJudge(judge.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="space-y-6">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h2 className="text-xl font-bold text-white mb-4">Add New Team</h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Enter team name"
                  className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => e.key === 'Enter' && addTeam()}
                />
                <button
                  onClick={addTeam}
                  disabled={loading || !newTeamName.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Plus className="w-5 h-5" />
                  Add Team
                </button>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white">All Teams</h2>
              </div>
              <div className="divide-y divide-white/5">
                {teams.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    No teams added yet
                  </div>
                ) : (
                  teams.map((team) => (
                    <div
                      key={team.id}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg">
                          <Users className="w-5 h-5 text-green-400" />
                        </div>
                        <span className="text-white font-medium">{team.name}</span>
                      </div>
                      <button
                        onClick={() => deleteTeam(team.id)}
                        className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
