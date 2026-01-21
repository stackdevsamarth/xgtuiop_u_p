import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, LogOut, Users, MessageSquare, Save } from 'lucide-react';

interface Team {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  max_score: number;
}

interface Score {
  category_id: string;
  score: number;
}

interface Comment {
  id: string;
  comment: string;
}

export default function JudgeDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');
  const [existingComment, setExistingComment] = useState<Comment | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'judge') {
      navigate('/login');
      return;
    }
    fetchTeams();
    fetchCategories();
  }, [user, navigate]);

  useEffect(() => {
    if (selectedTeam) {
      fetchScoresForTeam(selectedTeam.id);
      fetchCommentForTeam(selectedTeam.id);
    }
  }, [selectedTeam]);

  const fetchTeams = async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('*')
      .order('name');

    if (!error && data) {
      setTeams(data);
      if (data.length > 0 && !selectedTeam) {
        setSelectedTeam(data[0]);
      }
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('score_categories')
      .select('*')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const fetchScoresForTeam = async (teamId: string) => {
    const { data, error } = await supabase
      .from('scores')
      .select('*')
      .eq('team_id', teamId)
      .eq('judge_id', user?.id);

    if (!error && data) {
      const scoresMap: Record<string, number> = {};
      data.forEach((score) => {
        scoresMap[score.category_id] = score.score;
      });
      setScores(scoresMap);
    } else {
      setScores({});
    }
  };

  const fetchCommentForTeam = async (teamId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('team_id', teamId)
      .eq('judge_id', user?.id)
      .maybeSingle();

    if (!error && data) {
      setExistingComment(data);
      setComment(data.comment);
    } else {
      setExistingComment(null);
      setComment('');
    }
  };

  const saveScores = async () => {
    if (!selectedTeam || !user) return;
    setLoading(true);

    try {
      for (const category of categories) {
        const score = scores[category.id];
        if (score !== undefined) {
          const { error } = await supabase
            .from('scores')
            .upsert({
              team_id: selectedTeam.id,
              judge_id: user.id,
              category_id: category.id,
              score: score,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'team_id,judge_id,category_id'
            });

          if (error) throw error;
        }
      }

      if (comment.trim()) {
        if (existingComment) {
          const { error } = await supabase
            .from('comments')
            .update({
              comment: comment.trim(),
              updated_at: new Date().toISOString()
            })
            .eq('id', existingComment.id);

          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('comments')
            .insert({
              team_id: selectedTeam.id,
              judge_id: user.id,
              comment: comment.trim()
            });

          if (error) throw error;
        }
      }

      alert('Scores and comment saved successfully!');
      fetchScoresForTeam(selectedTeam.id);
      fetchCommentForTeam(selectedTeam.id);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save scores');
    } finally {
      setLoading(false);
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
                <h1 className="text-xl font-bold text-white">Judge Dashboard</h1>
                <p className="text-sm text-slate-400">{user?.name}</p>
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
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                Teams
              </h2>
              <div className="space-y-2">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    onClick={() => setSelectedTeam(team)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedTeam?.id === team.id
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {team.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
            {selectedTeam ? (
              <div className="space-y-6">
                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                  <h2 className="text-2xl font-bold text-white mb-6">
                    Score {selectedTeam.name}
                  </h2>

                  <div className="space-y-4">
                    {categories.map((category) => (
                      <div key={category.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-white font-medium">
                            {category.name}
                          </label>
                          <span className="text-slate-400 text-sm">
                            Max: {category.max_score}
                          </span>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max={category.max_score}
                          value={scores[category.id] || ''}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const clampedValue = Math.min(Math.max(0, value), category.max_score);
                            setScores({ ...scores, [category.id]: clampedValue });
                          }}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comment
                  </h3>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your feedback for this team..."
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <button
                  onClick={saveScores}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-lg"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : 'Save Scores & Comment'}
                </button>
              </div>
            ) : (
              <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-12 text-center">
                <p className="text-slate-400">Select a team to start scoring</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
