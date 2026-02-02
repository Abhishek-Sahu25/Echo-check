import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Download, AlertCircle, CheckCircle, XCircle, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Results({ token }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, [id]);

  const fetchAnalysis = async () => {
    try {
      const response = await fetch(`http://localhost:8000/history/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      } else {
        toast.error('Failed to load analysis');
        navigate('/history');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      const response = await fetch(`http://localhost:8000/report/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `echo_check_report_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.success('Report downloaded');
      } else {
        toast.error('Failed to download report');
      }
    } catch (error) {
      toast.error('Download failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const truthScore = analysis.truth_score || 50;
  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 70) return 'from-green-400 to-green-600';
    if (score >= 50) return 'from-yellow-400 to-yellow-600';
    return 'from-red-400 to-red-600';
  };

  const getVerdict = (score) => {
    if (score >= 70) return { text: 'Likely Authentic', icon: CheckCircle, color: 'green' };
    if (score >= 50) return { text: 'Uncertain', icon: AlertCircle, color: 'yellow' };
    return { text: 'Likely Manipulated', icon: XCircle, color: 'red' };
  };

  const verdict = getVerdict(truthScore);
  const VerdictIcon = verdict.icon;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Analysis Results</h1>
            <p className="text-gray-600 mt-1">{analysis.file_name}</p>
          </div>
          <button
            onClick={downloadReport}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            <Download className="w-5 h-5" />
            <span>Download Report</span>
          </button>
        </div>

        {/* Truth Score Circle */}
        <div className="flex flex-col items-center py-8">
          <div className="relative w-64 h-64">
            <svg className="transform -rotate-90 w-64 h-64">
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="#e5e7eb"
                strokeWidth="16"
                fill="none"
              />
              <circle
                cx="128"
                cy="128"
                r="112"
                stroke="url(#gradient)"
                strokeWidth="16"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 112}`}
                strokeDashoffset={`${2 * Math.PI * 112 * (1 - truthScore / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" className={`${getScoreBgColor(truthScore).split(' ')[0].replace('from-', 'stop-')}`} />
                  <stop offset="100%" className={`${getScoreBgColor(truthScore).split(' ')[1].replace('to-', 'stop-')}`} />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-6xl font-bold ${getScoreColor(truthScore)}`}>
                {truthScore.toFixed(1)}%
              </span>
              <span className="text-gray-600 text-lg mt-2">Truth Score</span>
            </div>
          </div>

          <div className={`flex items-center space-x-2 mt-6 px-6 py-3 rounded-full bg-${verdict.color}-100`}>
            <VerdictIcon className={`w-6 h-6 text-${verdict.color}-600`} />
            <span className={`text-xl font-semibold text-${verdict.color}-800`}>
              {verdict.text}
            </span>
          </div>
        </div>

        {/* Detailed Scores */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {analysis.audio_score !== null && (
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Audio Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Authenticity Score</span>
                  <span className={`font-bold ${getScoreColor(analysis.audio_score)}`}>
                    {analysis.audio_score.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getScoreBgColor(analysis.audio_score)}`}
                    style={{ width: `${analysis.audio_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {analysis.video_score !== null && (
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Video Analysis</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Authenticity Score</span>
                  <span className={`font-bold ${getScoreColor(analysis.video_score)}`}>
                    {analysis.video_score.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${getScoreBgColor(analysis.video_score)}`}
                    style={{ width: `${analysis.video_score}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Anomalies */}
        {analysis.anomalies_detected && analysis.anomalies_detected.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Detected Anomalies</h3>
            <div className="space-y-3">
              {analysis.anomalies_detected.map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    anomaly.severity === 'high'
                      ? 'bg-red-50 border-red-500'
                      : 'bg-yellow-50 border-yellow-500'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-gray-800 capitalize">
                        {anomaly.type.replace('_', ' ')}
                      </p>
                      <p className="text-gray-600 text-sm mt-1">{anomaly.description}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      anomaly.severity === 'high'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-yellow-200 text-yellow-800'
                    }`}>
                      {anomaly.severity.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Spectrogram */}
        {analysis.spectrogram_url && (
          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">Frequency Spectrogram</h3>
            <div className="bg-gray-100 rounded-xl p-4">
              <img
                src={`http://localhost:8000${analysis.spectrogram_url}`}
                alt="Spectrogram"
                className="w-full rounded-lg"
              />
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-gray-600 text-sm">File Type</p>
              <p className="font-semibold text-gray-800">{analysis.file_type}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Analysis Duration</p>
              <p className="font-semibold text-gray-800">
                {analysis.analysis_duration?.toFixed(2)}s
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Status</p>
              <p className="font-semibold text-green-600 capitalize">{analysis.status}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Analyzed</p>
              <p className="font-semibold text-gray-800">
                {new Date(analysis.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}