import { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Clock, 
  Download, 
  Trash2, 
  Edit3, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  X
} from 'lucide-react';
import { API_V1, API_BASE_URL } from '../config';

interface RecognitionRecord {
  id: number;
  plate_text: string;
  confidence: number;
  timestamp: string;
  original_image_url?: string;
  crop_image_url?: string;
  annotated_image_url?: string;
  is_corrected: boolean;
  corrected_text?: string;
  status: string;
  vehicle?: {
    owner_name?: string;
    vehicle_model?: string;
    is_whitelist: boolean;
    is_watchlist: boolean;
  };
}

export default function History() {
  const [history, setHistory] = useState<RecognitionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected Record Modal State
  const [selectedRecord, setSelectedRecord] = useState<RecognitionRecord | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPlateInput, setEditPlateInput] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_V1}/history?limit=100`;
      if (searchQuery.trim()) {
        url += `&query=${encodeURIComponent(searchQuery.trim())}`;
      }
      if (statusFilter !== 'all') {
        url += `&status=${statusFilter}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      } else {
        setError('Failed to load recognition logs from server');
      }
    } catch {
      setError('Backend API is unavailable. Ensure the Python FastAPI server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory();
  };

  const handleExportCSV = () => {
    window.open(`${API_V1}/history/export/csv`, '_blank');
  };

  const handleDeleteRecord = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete log record #${id}?`)) return;
    try {
      const res = await fetch(`${API_V1}/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHistory(prev => prev.filter(h => h.id !== id));
        if (selectedRecord?.id === id) setSelectedRecord(null);
      }
    } catch {
      alert('Error deleting record');
    }
  };

  const handleSaveCorrection = async (id: number) => {
    if (!editPlateInput.trim()) return;
    try {
      const res = await fetch(`${API_V1}/history/${id}/correct`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrected_text: editPlateInput.trim() })
      });
      if (res.ok) {
        const updated = await res.json();
        setHistory(prev => prev.map(h => h.id === id ? updated : h));
        setEditingId(null);
        if (selectedRecord?.id === id) setSelectedRecord(updated);
      }
    } catch {
      alert('Failed to update correction');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'whitelisted':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Whitelisted</span>;
      case 'watchlist_alert':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">Watchlist Alert</span>;
      case 'review_required':
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-200">Review Required</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">Logged</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Recognition History & Logs</h2>
          <p className="text-sm text-slate-500 mt-1">Audit log of all processed license plates, crops, and confidence scores.</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchHistory}
            className="p-2.5 text-slate-600 bg-white hover:bg-slate-50 rounded-xl transition-colors border border-slate-200 shadow-xs"
            title="Refresh logs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button 
            onClick={handleExportCSV}
            className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 rounded-xl shadow-xs transition-colors border border-slate-200"
          >
            <Download className="w-4 h-4 mr-2 text-indigo-600" />
            Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-3 shrink-0" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-96">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search plate number (e.g. ABC1234)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">Filter Status:</span>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Records</option>
            <option value="valid">Valid Logged</option>
            <option value="whitelisted">Whitelisted</option>
            <option value="watchlist_alert">Watchlist Alerts</option>
            <option value="review_required">Review Required</option>
          </select>
        </div>
      </div>

      {/* Main Logs Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Record ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Plate Text</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Crop Preview</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Confidence Score</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {history.length > 0 ? (
                history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400 font-mono font-bold">
                      #{record.id}
                    </td>

                    {/* Plate Text (Editable Inline) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === record.id ? (
                        <div className="flex items-center space-x-2">
                          <input 
                            type="text" 
                            value={editPlateInput} 
                            onChange={(e) => setEditPlateInput(e.target.value.toUpperCase())}
                            className="px-2 py-1 text-sm font-mono font-bold border border-indigo-400 rounded focus:outline-none"
                          />
                          <button onClick={() => handleSaveCorrection(record.id)} className="text-xs text-indigo-600 font-bold hover:underline">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 hover:underline">Cancel</button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="px-3 py-1.5 inline-flex text-sm leading-5 font-mono font-bold rounded-lg bg-slate-900 text-amber-400 border border-slate-800 shadow-2xs">
                            {record.plate_text}
                          </span>
                          {record.is_corrected && (
                            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100" title="Manually edited">
                              Edited
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Crop Image */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.crop_image_url ? (
                        <img 
                          src={`${API_BASE_URL}${record.crop_image_url}`} 
                          alt="Crop" 
                          className="h-9 w-24 object-contain bg-slate-900 rounded p-1 border border-slate-700 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => setSelectedRecord(record)}
                        />
                      ) : (
                        <span className="text-xs text-slate-400 italic">No crop</span>
                      )}
                    </td>

                    {/* Confidence Score Meter */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-20 bg-slate-100 rounded-full h-2 mr-3 border border-slate-200 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full ${record.confidence >= 0.6 ? 'bg-emerald-500' : 'bg-amber-500'}`} 
                            style={{ width: `${Math.min(100, record.confidence * 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-extrabold ${record.confidence >= 0.6 ? 'text-emerald-600' : 'text-amber-600'}`}>
                          {(record.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </td>

                    {/* Timestamp */}
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        {new Date(record.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(record.status)}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => setSelectedRecord(record)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="View Full Detail"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingId(record.id);
                          setEditPlateInput(record.plate_text);
                        }}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Plate Text"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteRecord(record.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <FileText className="h-10 w-10 text-slate-300 mb-3" />
                      <h4 className="text-sm font-bold text-slate-800">No matching recognition records</h4>
                      <p className="text-xs text-slate-400 mt-1">Try adjusting your search or status filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Recognition Record #{selectedRecord.id}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Processed on {new Date(selectedRecord.timestamp).toLocaleString()}</p>
              </div>
              <button onClick={() => setSelectedRecord(null)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Plate Text</span>
                  <div className="text-2xl font-mono font-extrabold text-amber-400 mt-1">{selectedRecord.plate_text}</div>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">OCR Confidence</span>
                  <div className="text-2xl font-extrabold text-slate-800 mt-1">{(selectedRecord.confidence * 100).toFixed(1)}%</div>
                </div>
              </div>

              {selectedRecord.annotated_image_url && (
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">Annotated Detection Image:</span>
                  <div className="bg-slate-950 rounded-xl overflow-hidden border border-slate-800 p-2 text-center">
                    <img 
                      src={`${API_BASE_URL}${selectedRecord.annotated_image_url}`} 
                      alt="Annotated detection" 
                      className="max-h-64 mx-auto object-contain"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button 
                onClick={() => setSelectedRecord(null)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
