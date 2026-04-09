import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, History, TrendingUp, FileCheck, Loader } from 'lucide-react';

export default function Dashboard({ token }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalAnalyses: 0,
    recentAnalyses: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('http://localhost:8000/history?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats({
          totalAnalyses: data.length,
          recentAnalyses: data
        });
      }
    } catch (error) {
      console.error('Error in fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 70) return 'bg-green-100';
    if (score >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to Echo-Check deepfake detection</p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => navigate('/upload')}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl font-bold mb-2">Upload New File</h2>
              <p className="text-blue-100">Analyze audio or video for deepfakes</p>
            </div>
            <Upload className="w-16 h-16 opacity-80" />
          </div>
        </button>

        <button
          onClick={() => navigate('/history')}
          className="bg-white border-2 border-gray-200 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
        >
          <div className="flex items-center justify-between">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">View History</h2>
              <p className="text-gray-600">Browse past analyses</p>
            </div>
            <History className="w-16 h-16 text-gray-400" />
          </div>
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalAnalyses}</p>
            </div>
            <FileCheck className="w-12 h-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">Average Score</p>
              <p className="text-3xl font-bold text-gray-800">
                {stats.recentAnalyses.length > 0
                  ? (stats.recentAnalyses.reduce((sum, a) => sum + (a.truth_score || 0), 0) / stats.recentAnalyses.length).toFixed(1)
                  : '0.0'}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm mb-1">This Week</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalAnalyses}</p>
            </div>
            <History className="w-12 h-12 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Recent Analyses */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Analyses</h2>

        {stats.recentAnalyses.length === 0 ? (
          <div className="text-center py-12">
            <Upload className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-600 text-lg mb-4">No analyses yet</p>
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Upload Your First File
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.recentAnalyses.map((analysis) => (
              <div
                key={analysis.id}
                onClick={() => navigate(`/results/${analysis.id}`)}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:shadow-md transition cursor-pointer"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{analysis.file_name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                    {new Date(analysis.created_at).toLocaleTimeString()}
                  </p>
                </div>

                <div className="flex items-center space-x-4">
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {analysis.file_type}
                  </span>

                  {analysis.truth_score !== null && (
                    <div className={`px-4 py-2 rounded-lg ${getScoreBg(analysis.truth_score)}`}>
                      <p className={`text-lg font-bold ${getScoreColor(analysis.truth_score)}`}>
                        {analysis.truth_score.toFixed(1)}%
                      </p>
                    </div>
                  )}

                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    analysis.status === 'completed' 
                      ? 'bg-green-100 text-green-800'
                      : analysis.status === 'processing'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {analysis.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}