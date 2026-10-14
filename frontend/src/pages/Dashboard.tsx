import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  UploadCloud, 
  Cpu, 
  Clock, 
  ArrowRight,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { API_V1 } from '../config';

interface SystemStats {
  total_processed: number;
  high_confidence_count: number;
  high_confidence_rate: number;
  whitelisted_matches: number;
  watchlist_alerts: number;
  total_vehicles: number;
  tesseract_version: string;
  yolo_model_loaded: boolean;
}

interface RecognitionRecord {
  id: number;
  plate_text: string;
  confidence: number;
  timestamp: string;
  status: string;
  crop_image_url?: string;
  annotated_image_url?: string;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentHistory, setRecentHistory] = useState<RecognitionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, historyRes] = await Promise.all([
        fetch(`${API_V1}/stats`),
        fetch(`${API_V1}/history?limit=5`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setRecentHistory(historyData);
      }
    } catch {
      setError('Unable to communicate with Python backend server (http://localhost:8000). Ensure the FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'whitelisted':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Whitelisted</span>;
      case 'watchlist_alert':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Watchlist Alert</span>;
      case 'review_required':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Review Required</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200">Valid</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Overview</h2>
          <p className="text-slate-500 text-sm mt-1">Real-time OpenCV license plate recognition and vehicle access stats.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchData}
            className="p-2.5 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={() => navigate('/recognize')}
            className="inline-flex items-center px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4 mr-2" />
            Analyze Plate Image
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-3 shrink-0" />
          <div>
            <h4 className="text-sm font-bold text-rose-800">Connection Failure</h4>
            <p className="text-sm text-rose-700 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-indigo-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Recognized</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl"><FileText className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats?.total_processed ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Processed image records</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">High Confidence Rate</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats?.high_confidence_rate ?? 0}%</div>
            <p className="text-xs text-slate-500 mt-1">{stats?.high_confidence_count ?? 0} records &ge; 50% score</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Whitelisted Passes</span>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><ShieldCheck className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats?.whitelisted_matches ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Matched allowed vehicles</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between hover:border-rose-200 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Watchlist Alerts</span>
            <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl"><AlertTriangle className="w-5 h-5" /></div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900">{stats?.watchlist_alerts ?? 0}</div>
            <p className="text-xs text-slate-500 mt-1">Flagged vehicle alerts</p>
          </div>
        </div>
      </div>

      {/* Diagnostics & Info Widget */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="p-3.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
            <Cpu className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold">OpenCV & Tesseract OCR Pipeline</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Engine Version: <span className="text-indigo-300 font-mono">{stats?.tesseract_version || 'Tesseract 5.5.3'}</span> | 
              YOLO Detector: <span className={stats?.yolo_model_loaded ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                {stats?.yolo_model_loaded ? 'Active (yolov8n.pt)' : 'Haar Cascade Fallback'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/settings')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
          >
            System Diagnostics
          </button>
        </div>
      </div>

      {/* Recent Recognitions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Recognitions</h3>
            <p className="text-xs text-slate-500 mt-0.5">Latest license plates detected by backend pipeline</p>
          </div>
          <button 
            onClick={() => navigate('/history')}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            View All Logs <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {recentHistory.map((record) => (
            <div key={record.id} className="p-5 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
              <div className="flex items-center space-x-4">
                <span className="px-3.5 py-1.5 inline-flex text-base font-mono font-bold rounded-lg bg-slate-900 text-amber-400 border border-slate-800 shadow-xs">
                  {record.plate_text}
                </span>
                <div>
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(record.status)}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center mt-1">
                    <Clock className="w-3.5 h-3.5 mr-1 text-slate-400" />
                    {new Date(record.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-medium text-slate-500 mb-1">Confidence Score</div>
                <div className={`text-base font-bold ${record.confidence >= 0.6 ? 'text-emerald-600' : 'text-amber-500'}`}>
                  {(record.confidence * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}

          {recentHistory.length === 0 && !loading && (
            <div className="p-12 text-center text-slate-500">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-medium">No recognition logs available yet.</p>
              <p className="text-xs text-slate-400 mt-1">Go to the Recognition tab to upload a vehicle image.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
