import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const STATUS_CONFIG = {
  open: { label: 'Open', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  under_review: { label: 'Under Review', color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  approved: { label: 'Approved', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  denied: { label: 'Denied', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
  closed: { label: 'Closed', color: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400' },
};

const PERIL_TYPES = ['Hail', 'Wind', 'Thunderstorm', 'Heavy Rain / Flooding', 'Winter Storm', 'Tornado Risk', 'Ice Storm', 'Other'];

export default function ClaimsDashboard() {
  const { token } = useAuth();
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ claim_number: '', policy_number: '', claimant_name: '', city: '', state: '', date_of_loss: '', peril_type: '', amount_claimed: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { fetchClaims(); fetchStats(); }, [filter]);

  const fetchClaims = async () => {
    const res = await fetch(`/api/claims?status=${filter}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setClaims(data.claims || []);
  };

  const fetchStats = async () => {
    const res = await fetch('/api/claims/stats', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setStats(data);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount_claimed: form.amount_claimed ? parseFloat(form.amount_claimed) : null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      setForm({ claim_number: '', policy_number: '', claimant_name: '', city: '', state: '', date_of_loss: '', peril_type: '', amount_claimed: '', notes: '' });
      fetchClaims();
      fetchStats();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    await fetch(`/api/claims/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchClaims();
    fetchStats();
  };

  const deleteClaim = async (id) => {
    if (!confirm('Delete this claim?')) return;
    await fetch(`/api/claims/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchClaims();
    fetchStats();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Claims Dashboard</h2>
          <p className="text-gray-500 dark:text-storm-400 mt-1">Track and manage insurance claims alongside weather data</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 text-sm rounded-lg bg-storm-600 text-white hover:bg-storm-700 transition flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          New Claim
        </button>
      </div>

      {/* Stats cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="bg-white dark:bg-storm-900/50 rounded-lg p-3 border border-gray-200 dark:border-white/10 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats[key] ?? 0}</p>
              <p className={`text-xs font-medium mt-1 ${cfg.color.split(' ').filter(c => c.startsWith('text-')).join(' ')}`}>{cfg.label}</p>
            </div>
          ))}
          <div className="bg-white dark:bg-storm-900/50 rounded-lg p-3 border border-gray-200 dark:border-white/10 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${(stats.total_claimed || 0).toLocaleString()}</p>
            <p className="text-xs text-gray-500 dark:text-storm-400 mt-1">Total Claimed</p>
          </div>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-storm-900/50 rounded-xl p-6 border border-gray-200 dark:border-white/10 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Claim</h3>
          {error && <div className="mb-3 p-2 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">{error}</div>}
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input required type="text" placeholder="Claim Number *" value={form.claim_number} onChange={(e) => setForm({ ...form, claim_number: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <input type="text" placeholder="Policy Number" value={form.policy_number} onChange={(e) => setForm({ ...form, policy_number: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <input type="text" placeholder="Claimant Name" value={form.claimant_name} onChange={(e) => setForm({ ...form, claimant_name: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <input type="text" placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <input type="date" placeholder="Date of Loss" value={form.date_of_loss} onChange={(e) => setForm({ ...form, date_of_loss: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <select value={form.peril_type} onChange={(e) => setForm({ ...form, peril_type: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm">
              <option value="">Peril Type</option>
              {PERIL_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input type="number" step="0.01" placeholder="Amount Claimed ($)" value={form.amount_claimed} onChange={(e) => setForm({ ...form, amount_claimed: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <input type="text" placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            <div className="md:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" disabled={saving} className="px-4 py-2 bg-storm-600 text-white rounded-lg text-sm hover:bg-storm-700 disabled:opacity-50">{saving ? 'Creating...' : 'Create Claim'}</button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 dark:border-storm-600 text-gray-700 dark:text-storm-300 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-storm-800">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {['all', ...Object.keys(STATUS_CONFIG)].map((s) => (
          <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${filter === s ? 'bg-storm-600 text-white' : 'bg-gray-100 dark:bg-storm-800 text-gray-600 dark:text-storm-400 hover:bg-gray-200 dark:hover:bg-storm-700'}`}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Claims table */}
      <div className="bg-white dark:bg-storm-900/50 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {claims.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-storm-400">
            <p>No claims found. Create your first claim to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-storm-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Claim #</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Claimant</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Location</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">DOL</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Peril</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Status</th>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-storm-700">
                {claims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-gray-50 dark:hover:bg-storm-800/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{claim.claim_number}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-storm-300">{claim.claimant_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-storm-300">{claim.city && claim.state ? `${claim.city}, ${claim.state}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-storm-300">{claim.date_of_loss || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-storm-300">{claim.peril_type || '—'}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-storm-300">{claim.amount_claimed ? `$${parseFloat(claim.amount_claimed).toLocaleString()}` : '—'}</td>
                    <td className="px-4 py-3">
                      <select value={claim.status} onChange={(e) => updateStatus(claim.id, e.target.value)} className={`px-2 py-1 rounded text-xs font-medium ${STATUS_CONFIG[claim.status]?.color || ''}`}>
                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteClaim(claim.id)} className="text-red-500 hover:text-red-700 text-xs">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
