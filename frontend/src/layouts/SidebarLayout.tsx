import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  UploadCloud, 
  FileText, 
  LogOut, 
  Car, 
  LayoutDashboard, 
  Settings, 
  ShieldCheck, 
  Activity,
  Search
} from 'lucide-react';
import { API_V1 } from '../config';
import { useAuth } from '../context/AuthContext';

export default function SidebarLayout() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [apiOnline, setApiOnline] = useState<boolean | null>(null);

  const checkHealth = async () => {
    try {
      const res = await fetch(`${API_V1}/health`);
      if (res.ok) {
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950/50">
          <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-lg mr-3 border border-indigo-500/30">
            <Car className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-wide leading-tight">AutoLPR Pro</h1>
            <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Computer Vision OCR</p>
          </div>
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-6 overflow-y-auto">
          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Main Operations
            </div>
            <ul className="space-y-1">
              <li>
                <NavLink 
                  to="/"
                  end
                  className={({isActive}) => `w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/recognize"
                  className={({isActive}) => `w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <UploadCloud className="w-4 h-4 mr-3" />
                  Recognition & Upload
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/history"
                  className={({isActive}) => `w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <FileText className="w-4 h-4 mr-3" />
                  History & Logs
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <div className="px-3 mb-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Management
            </div>
            <ul className="space-y-1">
              <li>
                <NavLink 
                  to="/vehicles"
                  className={({isActive}) => `w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <ShieldCheck className="w-4 h-4 mr-3" />
                  Vehicle Registry
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/settings"
                  className={({isActive}) => `w-full flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 font-semibold' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'}`}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  Settings & Diagnostics
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>
        
        {/* User Card & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between mb-3 px-2">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-xs">
                {user ? user.username.substring(0, 2).toUpperCase() : 'AD'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-white truncate">{user?.username || 'admin'}</p>
                <p className="text-[10px] text-slate-400 capitalize">{user?.role || 'Administrator'}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="flex items-center justify-center w-full px-3 py-2 text-xs font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors border border-slate-800"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0 shadow-xs z-10">
          <div className="flex items-center text-slate-400 text-sm">
            <Search className="w-4 h-4 mr-2" />
            <span className="text-slate-400 text-xs">Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono text-[10px] text-slate-600">/history</kbd> to search logs</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              {apiOnline === true && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                  FastAPI & Tesseract Ready
                </span>
              )}
              {apiOnline === false && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-2"></span>
                  Backend API Offline
                </span>
              )}
              {apiOnline === null && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                  <Activity className="w-3 h-3 mr-1.5 animate-spin" />
                  Connecting...
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Page Content Outlet */}
        <div className="flex-1 overflow-auto p-8 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
