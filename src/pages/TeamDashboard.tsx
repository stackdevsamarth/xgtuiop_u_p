import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Trophy, LogOut, Star, MessageSquare, BarChart3 } from 'lucide-react';

interface Judge {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  max_score: number;
}

interface ScoreBreakdown {
  judge_name: string;
  category_name: string;
  score: number;
  max_score: number;
}

interface CommentData {
  judge_name: string;
  comment: string;
  created_at: string;
}

export default function TeamDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [totalScore, setTotalScore] = useState(0);
  const [scoreBreakdown, setScoreBreakdown] = useState<ScoreBreakdown[]>([]);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [judges, setJudges] = useState<Judge[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'team') {
      navigate('/login');
      return;
    }
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    if (!user) return;

    const { data: categoriesData } = await supabase
      .from('score_categories')
      .select('*')
      .order('name');

    const { data: judgesData } = await supabase
      .from('judges')
      .select('*');

    const { data: scoresData } = await supabase
      .from('scores')
      .select(`
        score,
        category_id,
        judge_id,
        score_categories (name, max_score),
        judges (name)
      `)
      .eq('team_id', user.id);

    const { data: commentsData } = await supabase
      .from('comments')
      .select(`
        comment,
        created_at,
        judges (name)
      `)
      .eq('team_id', user.id)
      .order('created_at', { ascending: false });

    if (categoriesData) setCategories(categoriesData);
    if (judgesData) setJudges(judgesData);

    if (scoresData) {
      const breakdown: ScoreBreakdown[] = scoresData.map((score: any) => ({
        judge_name: score.judges.name,
        category_name: score.score_categories.name,
        score: score.score,
        max_score: score.score_categories.max_score
      }));
      setScoreBreakdown(breakdown);

      const total = scoresData.reduce((sum: number, score: any) => sum + score.score, 0);
      setTotalScore(total);
    }

    if (commentsData) {
      const formattedComments: CommentData[] = commentsData.map((comment: any) => ({
        judge_name: comment.judges.name,
        comment: comment.comment,
        created_at: comment.created_at
      }));
      setComments(formattedComments);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const getScoresByJudge = () => {
    const judgeScores: Record<string, { total: number; categories: Record<string, number> }> = {};

    scoreBreakdown.forEach((score) => {
      if (!judgeScores[score.judge_name]) {
        judgeScores[score.judge_name] = { total: 0, categories: {} };
      }
      judgeScores[score.judge_name].total += score.score;
      judgeScores[score.judge_name].categories[score.category_name] = score.score;
    });

    return judgeScores;
  };

  const judgeScores = getScoresByJudge();

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
                <h1 className="text-xl font-bold text-white">Team Dashboard</h1>
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
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-center shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Star className="w-8 h-8 text-yellow-300" />
              <h2 className="text-3xl font-bold text-white">Your Total Score</h2>
              <Star className="w-8 h-8 text-yellow-300" />
            </div>
            <p className="text-6xl font-bold text-white mt-4">{totalScore}</p>
            <p className="text-blue-200 mt-2">
              Out of {categories.length * judges.length * 10} possible points
            </p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Scores by Judge
            </h3>
            <div className="space-y-4">
              {Object.entries(judgeScores).length === 0 ? (
                <p className="text-slate-400 text-center py-8">No scores yet</p>
              ) : (
                Object.entries(judgeScores).map(([judgeName, data]) => (
                  <div key={judgeName} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{judgeName}</h4>
                      <span className="text-2xl font-bold text-blue-400">{data.total}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {categories.map((category) => (
                        <div key={category.id} className="bg-white/5 rounded-lg p-2">
                          <p className="text-xs text-slate-400">{category.name}</p>
                          <p className="text-lg font-bold text-white">
                            {data.categories[category.name] || 0}/{category.max_score}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              Judge Comments
            </h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-slate-400 text-center py-8">No comments yet</p>
              ) : (
                comments.map((comment, index) => (
                  <div key={index} className="bg-white/5 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-blue-400">{comment.judge_name}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-6">
          <h3 className="text-xl font-bold text-white mb-6">Score Breakdown by Category</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map((category) => {
              const categoryScores = scoreBreakdown.filter(
                (score) => score.category_name === category.name
              );
              const categoryTotal = categoryScores.reduce((sum, score) => sum + score.score, 0);
              const maxPossible = judges.length * category.max_score;

              return (
                <div key={category.id} className="bg-white/5 rounded-xl p-4 text-center">
                  <h4 className="font-semibold text-white mb-2">{category.name}</h4>
                  <p className="text-3xl font-bold text-blue-400">{categoryTotal}</p>
                  <p className="text-sm text-slate-400 mt-1">out of {maxPossible}</p>
                  <div className="mt-3 bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all"
                      style={{ width: `${(categoryTotal / maxPossible) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
