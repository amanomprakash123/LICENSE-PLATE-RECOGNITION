import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, Lock, User as UserIcon, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Unable to authenticate with backend or invalid credentials. You can enter using Demo Mode below while backend initializes.');
      setLoading(false);
    }
  };

  const handleDemoAccess = () => {
    // Instant demo login so user is never blocked while cloud server wakes up
    const demoUser = { id: 1, username: 'admin', email: 'admin@autolpr.local', role: 'admin' };
    localStorage.setItem('autolpr_token', 'demo_token_authenticated');
    localStorage.setItem('autolpr_user', JSON.stringify(demoUser));
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-2xl space-y-6 border border-slate-800">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-500/20">
            <Car className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">AutoLPR Pro</h1>
          <p className="text-xs text-slate-500">Sign in to access License Plate Recognition Console</p>
        </div>

        {error && (
          <div className="bg-rose-50 border-l-4 border-rose-500 p-3.5 rounded-xl flex items-start">
            <AlertCircle className="w-4 h-4 text-rose-500 mt-0.5 mr-2.5 shrink-0" />
            <p className="text-xs text-rose-700 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username or Email
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin or admin@autolpr.local"
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 font-medium"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting...
              </span>
            ) : (
              'Sign In to Dashboard'
            )}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 flex flex-col space-y-3">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center"
          >
            Direct Access / Explore Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
          </button>
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
            <p className="text-[11px] text-slate-500">
              Default credentials: <span className="font-mono font-bold text-slate-800">admin</span> / <span className="font-mono font-bold text-slate-800">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
