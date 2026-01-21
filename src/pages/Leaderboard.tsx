import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Trophy, Medal, Award, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  team_id: string;
  team_name: string;
  total_score: number;
  rank: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data: scores, error } = await supabase
        .from('scores')
        .select('team_id, score');

      if (error) throw error;

      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name');

      if (teamsError) throw teamsError;

      const teamScores = teams.map(team => {
        const teamScoreData = scores?.filter(s => s.team_id === team.id) || [];
        const totalScore = teamScoreData.reduce((sum, s) => sum + s.score, 0);
        return {
          team_id: team.id,
          team_name: team.name,
          total_score: totalScore
        };
      });

      teamScores.sort((a, b) => b.total_score - a.total_score);

      const rankedData = teamScores.map((entry, index) => ({
        ...entry,
        rank: index + 1
      }));

      setLeaderboard(rankedData);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-slate-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return null;
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900';
    if (rank === 2) return 'bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900';
    if (rank === 3) return 'bg-gradient-to-r from-amber-500 to-amber-600 text-amber-900';
    return 'bg-slate-200 text-slate-700';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading leaderboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-4 rounded-2xl shadow-xl">
              <Trophy className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">Leaderboard</h1>
              <p className="text-slate-400 mt-1">Competition Rankings</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-medium transition-all backdrop-blur-sm border border-white/20"
          >
            <LogIn className="w-5 h-5" />
            Sign In
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-300 uppercase tracking-wider">
                    Total Score
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {leaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400">
                      No teams have been scored yet
                    </td>
                  </tr>
                ) : (
                  leaderboard.map((entry) => (
                    <tr
                      key={entry.team_id}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {getRankIcon(entry.rank)}
                          <span
                            className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-bold text-sm ${getRankBadge(
                              entry.rank
                            )}`}
                          >
                            {entry.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-white font-medium text-lg">
                          {entry.team_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="text-2xl font-bold text-blue-400">
                          {entry.total_score}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
