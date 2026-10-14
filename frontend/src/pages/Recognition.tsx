import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Edit3, 
  ShieldCheck, 
  AlertTriangle,
  ArrowRight,
  Copy,
  Check
} from 'lucide-react';
import { API_V1, API_BASE_URL } from '../config';

interface RecognitionResponse {
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

export default function Recognition() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [result, setResult] = useState<RecognitionResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  
  const [correctionText, setCorrectionText] = useState('');
  const [savingCorr, setSavingCorr] = useState(false);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError('');
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFileSelect(selected);
  };

  const loadSampleImage = async (sampleName: string) => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/samples/${sampleName}`);
      const blob = await res.blob();
      const sampleFile = new File([blob], sampleName, { type: 'image/jpeg' });
      handleFileSelect(sampleFile);
    } catch {
      setError(`Failed to load sample image ${sampleName}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError('');
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_V1}/recognize`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Upload failed');

      setResult(data);
      setCorrectionText(data.plate_text);
    } catch (e: any) {
      setError(e.message || 'Connection error. Ensure backend Python server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCorrection = async () => {
    if (!result || !correctionText.trim()) return;
    setSavingCorr(true);
    try {
      const res = await fetch(`${API_V1}/history/${result.id}/correct`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ corrected_text: correctionText.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      }
    } catch {
      setError('Failed to update plate record correction');
    } finally {
      setSavingCorr(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">License Plate Recognition</h2>
          <p className="text-sm text-slate-500 mt-1">Upload a vehicle photo to run OpenCV detection & Tesseract OCR analysis.</p>
        </div>
        {result && (
          <button 
            onClick={() => navigate('/history')}
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View in Logs & History <ArrowRight className="w-4 h-4 ml-1.5" />
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-3 shrink-0" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Main Upload & Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Upload & Sample Picker */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">1. Select Vehicle Image</h3>
            
            <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-slate-300 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-indigo-400 transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <UploadCloud className="w-10 h-10 text-indigo-500 mb-3" />
                <p className="mb-1 text-sm text-slate-700 font-medium"><span className="font-bold text-indigo-600">Click to upload</span> or drag image here</p>
                <p className="text-xs text-slate-400">JPEG, PNG or WEBP (Max 10MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </label>

            {/* Quick Sample Selector */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Or Try Preset Test Samples:</span>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => loadSampleImage('sample_abc1234.jpg')}
                  className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200 transition-colors text-center"
                >
                  ABC1234
                </button>
                <button 
                  onClick={() => loadSampleImage('sample_xyz9876.jpg')}
                  className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200 transition-colors text-center"
                >
                  XYZ9876
                </button>
                <button 
                  onClick={() => loadSampleImage('sample_lpr2026.jpg')}
                  className="px-3 py-2 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-xs font-mono font-bold rounded-lg border border-slate-200 transition-colors text-center"
                >
                  LPR2026
                </button>
              </div>
            </div>

            <button 
              onClick={handleUpload}
              disabled={loading || !file}
              className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing Image & OCR...
                </>
              ) : (
                'Run License Plate Recognition'
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Visual Preview & Results */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-4">2. Recognition Results</h3>

            {/* Image Preview Window */}
            {preview ? (
              <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 mb-6 min-h-[220px] flex items-center justify-center">
                <img 
                  src={result?.annotated_image_url ? `${API_BASE_URL}${result.annotated_image_url}` : preview} 
                  alt="Vehicle analysis" 
                  className="max-h-72 object-contain" 
                />
                {result?.annotated_image_url && (
                  <span className="absolute top-3 left-3 bg-emerald-500 text-slate-950 font-bold text-[10px] uppercase px-2.5 py-1 rounded-md shadow-md">
                    Annotated Detection Overlay
                  </span>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-12 mb-6 bg-slate-50 text-center">
                <FileText className="w-10 h-10 text-slate-300 mb-2" />
                <span className="text-slate-500 text-sm font-medium">No image selected for preview</span>
              </div>
            )}

            {/* Result Details Box */}
            {result && (
              <div className="space-y-5">
                {/* Plate Output Banner */}
                <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Recognized License Plate</span>
                    <div className="text-3xl font-mono font-extrabold text-amber-400 tracking-wider mt-1 flex items-center">
                      {result.plate_text}
                      <button 
                        onClick={() => copyToClipboard(result.plate_text)}
                        className="ml-3 p-1.5 text-slate-400 hover:text-white rounded-md transition-colors"
                        title="Copy text"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="text-right sm:border-l sm:border-slate-800 sm:pl-6">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">OCR Confidence</span>
                    <div className={`text-2xl font-extrabold mt-1 ${result.confidence >= 0.6 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {(result.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Crop Image & Match Info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cropped Plate Image */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Detected Plate Crop</span>
                    {result.crop_image_url ? (
                      <div className="bg-slate-900 rounded-lg p-2 flex items-center justify-center h-24 border border-slate-800">
                        <img 
                          src={`${API_BASE_URL}${result.crop_image_url}`} 
                          alt="Cropped License Plate" 
                          className="max-h-20 max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic">No crop available</div>
                    )}
                  </div>

                  {/* Vehicle Match Status */}
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 flex flex-col justify-between">
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">Registry Match Status</span>
                    <div>
                      {result.status === 'whitelisted' && (
                        <div className="flex items-center text-emerald-700 bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                          <ShieldCheck className="w-5 h-5 mr-2 shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Whitelisted Vehicle Pass</p>
                            <p className="text-[11px] text-emerald-600">{result.vehicle?.owner_name || 'Verified Owner'}</p>
                          </div>
                        </div>
                      )}
                      {result.status === 'watchlist_alert' && (
                        <div className="flex items-center text-rose-700 bg-rose-50 border border-rose-200 p-2.5 rounded-lg">
                          <AlertTriangle className="w-5 h-5 mr-2 shrink-0 animate-bounce" />
                          <div>
                            <p className="text-xs font-bold">Security Alert: Watchlist</p>
                            <p className="text-[11px] text-rose-600">{result.vehicle?.owner_name || 'Flagged Record'}</p>
                          </div>
                        </div>
                      )}
                      {result.status !== 'whitelisted' && result.status !== 'watchlist_alert' && (
                        <div className="flex items-center text-blue-700 bg-blue-50 border border-blue-200 p-2.5 rounded-lg">
                          <CheckCircle2 className="w-5 h-5 mr-2 shrink-0" />
                          <div>
                            <p className="text-xs font-bold">Standard Record Logged</p>
                            <p className="text-[11px] text-blue-600">Saved to database history</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Manual Review / Correction */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 pt-4">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2 flex items-center">
                    <Edit3 className="w-3.5 h-3.5 mr-1.5 text-indigo-600" /> Manual OCR Correction
                  </span>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={correctionText}
                      onChange={(e) => setCorrectionText(e.target.value.toUpperCase())}
                      placeholder="Enter corrected plate text..."
                      className="flex-1 px-3 py-2 text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <button 
                      onClick={handleSaveCorrection}
                      disabled={savingCorr || !correctionText.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingCorr ? 'Saving...' : 'Update Record'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
