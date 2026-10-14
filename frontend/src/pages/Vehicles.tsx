import { useState, useEffect } from 'react';
import { 
  Car, 
  Search, 
  Plus, 
  ShieldCheck, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  X,
  AlertCircle
} from 'lucide-react';
import { API_V1 } from '../config';

interface Vehicle {
  id: number;
  plate_text: string;
  owner_name?: string;
  vehicle_model?: string;
  is_whitelist: boolean;
  is_watchlist: boolean;
  notes?: string;
  created_at: string;
}

export default function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [_loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Add/Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  
  const [formPlate, setFormPlate] = useState('');
  const [formOwner, setFormOwner] = useState('');
  const [formModel, setFormModel] = useState('');
  const [formType, setFormType] = useState<'none' | 'whitelist' | 'watchlist'>('whitelist');
  const [formNotes, setFormNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVehicles = async () => {
    setLoading(true);
    setError('');
    try {
      let url = `${API_V1}/vehicles`;
      if (searchQuery.trim()) {
        url += `?query=${encodeURIComponent(searchQuery.trim())}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      } else {
        setError('Failed to fetch vehicle registry');
      }
    } catch {
      setError('Backend API is unavailable. Ensure Python server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormPlate('');
    setFormOwner('');
    setFormModel('');
    setFormType('whitelist');
    setFormNotes('');
    setShowModal(true);
  };

  const openEditModal = (v: Vehicle) => {
    setEditingVehicle(v);
    setFormPlate(v.plate_text);
    setFormOwner(v.owner_name || '');
    setFormModel(v.vehicle_model || '');
    setFormType(v.is_watchlist ? 'watchlist' : (v.is_whitelist ? 'whitelist' : 'none'));
    setFormNotes(v.notes || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formPlate.trim()) return;

    setSubmitting(true);
    const payload = {
      plate_text: formPlate.trim().toUpperCase(),
      owner_name: formOwner.trim() || null,
      vehicle_model: formModel.trim() || null,
      is_whitelist: formType === 'whitelist',
      is_watchlist: formType === 'watchlist',
      notes: formNotes.trim() || null
    };

    try {
      let res;
      if (editingVehicle) {
        res = await fetch(`${API_V1}/vehicles/${editingVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`${API_V1}/vehicles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowModal(false);
        fetchVehicles();
      } else {
        const errData = await res.json();
        alert(errData.detail || 'Error saving vehicle');
      }
    } catch {
      alert('Connection error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Delete this vehicle from registry?')) return;
    try {
      const res = await fetch(`${API_V1}/vehicles/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setVehicles(prev => prev.filter(v => v.id !== id));
      }
    } catch {
      alert('Error deleting vehicle');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Vehicle Registry & Access Control</h2>
          <p className="text-sm text-slate-500 mt-1">Manage whitelisted access passes and security watchlist alert records.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="inline-flex items-center px-4 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Registered Vehicle
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-xl flex items-start">
          <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5 mr-3 shrink-0" />
          <p className="text-sm text-rose-700 font-medium">{error}</p>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <form onSubmit={(e) => { e.preventDefault(); fetchVehicles(); }} className="relative">
          <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search by plate number or owner name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>
      </div>

      {/* Vehicle Registry Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Plate Number</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Owner Name</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Vehicle Model</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Access Status</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Notes</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {vehicles.length > 0 ? (
                vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1.5 inline-flex text-sm leading-5 font-mono font-bold rounded-lg bg-slate-900 text-amber-400 border border-slate-800 shadow-2xs">
                        {v.plate_text}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-800">
                      {v.owner_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600">
                      {v.vehicle_model || 'Unspecified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {v.is_whitelist && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1" /> Whitelisted
                        </span>
                      )}
                      {v.is_watchlist && (
                        <span className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Watchlist Alert
                        </span>
                      )}
                      {!v.is_whitelist && !v.is_watchlist && (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-100 text-slate-600">
                          Standard Registered
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 italic max-w-xs truncate">
                      {v.notes || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <button 
                        onClick={() => openEditModal(v)}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Edit Vehicle"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete Vehicle"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <Car className="h-10 w-10 text-slate-300 mb-3" />
                      <h4 className="text-sm font-bold text-slate-800">No vehicles registered yet</h4>
                      <p className="text-xs text-slate-400 mt-1">Click "Add Registered Vehicle" above to create an entry.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">
                {editingVehicle ? 'Edit Registered Vehicle' : 'Add New Vehicle Record'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">License Plate Text *</label>
                <input 
                  type="text" 
                  required 
                  value={formPlate} 
                  onChange={(e) => setFormPlate(e.target.value.toUpperCase())}
                  placeholder="e.g. ABC1234"
                  className="w-full px-3 py-2 text-sm font-mono font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Owner Name</label>
                  <input 
                    type="text" 
                    value={formOwner} 
                    onChange={(e) => setFormOwner(e.target.value)}
                    placeholder="e.g. John Doe"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Vehicle Model</label>
                  <input 
                    type="text" 
                    value={formModel} 
                    onChange={(e) => setFormModel(e.target.value)}
                    placeholder="e.g. Toyota Camry"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Access Pass Category</label>
                <select 
                  value={formType} 
                  onChange={(e: any) => setFormType(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="whitelist">Whitelisted (Granted Pass)</option>
                  <option value="watchlist">Watchlist (Security Flagged Alert)</option>
                  <option value="none">Standard Registered</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Notes / Reason</label>
                <textarea 
                  rows={2}
                  value={formNotes} 
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="e.g. VIP parking permit or security flag details"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
