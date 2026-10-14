import { useState, useEffect } from 'react';
import { 
  Cpu, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  Server
} from 'lucide-react';
import { API_V1 } from '../config';

interface HealthInfo {
  status: string;
  message: string;
  version: string;
  tesseract_path: string;
}

interface SystemStats {
  tesseract_version: string;
  yolo_model_loaded: boolean;
  total_processed: number;
  total_vehicles: number;
}

export default function Settings() {
  const [health, setHealth] = useState<HealthInfo | null>(null);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const [hRes, sRes] = await Promise.all([
        fetch(`${API_V1}/health`),
        fetch(`${API_V1}/stats`)
      ]);
      if (hRes.ok) setHealth(await hRes.json());
      if (sRes.ok) setStats(await sRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Settings & Diagnostics</h2>
          <p className="text-sm text-slate-500 mt-1">System status, Tesseract configuration, and Python environment health.</p>
        </div>
        <button 
          onClick={fetchDiagnostics}
          className="p-2.5 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 shadow-xs"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-6">
        {/* API & Backend Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">FastAPI Backend Status</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">API Health</span>
              <div className="flex items-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                <span className="text-sm font-bold text-slate-900">{health?.status === 'online' ? 'Online & Healthy' : 'Checking...'}</span>
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">API Version</span>
              <span className="text-sm font-mono font-bold text-slate-800">{health?.version || 'v1.0.0'}</span>
            </div>
          </div>
        </div>

        {/* OCR Engine Diagnostics */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center space-x-3 mb-4">
            <Cpu className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">Tesseract OCR & Detector Diagnostics</h3>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Configured Tesseract Path</span>
              <code className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 block text-slate-800 break-all">
                {health?.tesseract_path || 'C:\\Program Files\\Tesseract-OCR\\tesseract.exe'}
              </code>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Tesseract Version</span>
                <span className="text-sm font-bold text-emerald-600 font-mono">{stats?.tesseract_version || '5.5.3'}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">YOLO Model Detector</span>
                <div className="flex items-center">
                  {stats?.yolo_model_loaded ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 mr-2" />
                      <span className="text-sm font-bold text-emerald-600">yolov8n.pt Loaded</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-500 mr-2" />
                      <span className="text-sm font-bold text-amber-600">OpenCV Cascade Fallback Active</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Database Status Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center space-x-3 mb-4">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">SQLite Database Diagnostics</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Database File</span>
              <code className="text-xs font-mono text-slate-800">backend/lpr.db (SQLite3)</code>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Total Logged Records</span>
              <span className="text-sm font-bold text-slate-900">{stats?.total_processed || 0} recognition entries</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
