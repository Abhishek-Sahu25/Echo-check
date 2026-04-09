import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, Eye, Loader, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function History({ token }) {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch('http://localhost:8000/history?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalyses(data);
      }
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!confirm(`Delete analysis for "${fileName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        toast.success('Analysis deleted');
        setAnalyses(analyses.filter(a => a.id !== id));
      } else {
        toast.error('Failed to delete analysis');
      }
    } catch (error) {
      toast.error('Network error');
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

  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.file_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || analysis.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

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
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Analysis History</h1>
        <p className="text-gray-600">View and manage your past analyses</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="processing">Processing</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-600">
          Showing <span className="font-semibold">{filteredAnalyses.length}</span> of{' '}
          <span className="font-semibold">{analyses.length}</span> analyses
        </p>
      </div>

      {/* History List */}
      {filteredAnalyses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 text-lg mb-4">
            {searchTerm || filterStatus !== 'all' ? 'No analyses match your filters' : 'No analyses yet'}
          </p>
          {!searchTerm && filterStatus === 'all' && (
            <button
              onClick={() => navigate('/upload')}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
            >
              Upload Your First File
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((analysis) => (
            <div
              key={analysis.id}
              className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  {/* Left: File Info */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1">
                      {analysis.file_name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span>
                        {new Date(analysis.created_at).toLocaleDateString()} at{' '}
                        {new Date(analysis.created_at).toLocaleTimeString()}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {analysis.file_type}
                      </span>
                    </div>
                  </div>

                  {/* Center: Truth Score */}
                  {analysis.truth_score !== null && (
                    <div className={`px-6 py-3 rounded-lg ${getScoreBg(analysis.truth_score)} mx-6`}>
                      <p className="text-xs text-gray-600 mb-1">Truth Score</p>
                      <p className={`text-2xl font-bold ${getScoreColor(analysis.truth_score)}`}>
                        {analysis.truth_score.toFixed(1)}%
                      </p>
                    </div>
                  )}

                  {/* Right: Status & Actions */}
                  <div className="flex items-center space-x-4">
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      analysis.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : analysis.status === 'processing'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {analysis.status}
                    </span>

                    <button
                      onClick={() => navigate(`/results/${analysis.id}`)}
                      className="p-3 bg-blue-100 text-blue-600 rounded-xl hover:bg-blue-200 transition"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>

                    <button
                      onClick={() => handleDelete(analysis.id, analysis.file_name)}
                      className="p-3 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination hint (can be expanded) */}
      {filteredAnalyses.length > 0 && (
        <div className="mt-6 text-center">
          <p className="text-gray-650 text-sm">
            {filteredAnalyses.length === 50 ? 'Showing first 50 results' : 'All results displayed'}
          </p>
        </div>
      )}
    </div>
  );
}