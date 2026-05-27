import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export default function SavedLocations({ onSelectLocation }) {
  const { authFetch } = useAuth();
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', street_address: '', city: '', state: '', zipcode: '', latitude: '', longitude: '' });
  const [saving, setSaving] = useState(false);

  const fetchLocations = useCallback(async () => {
    try {
      const res = await authFetch('/api/locations');
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error('Failed to fetch locations:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authFetch('/api/locations', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          latitude: parseFloat(form.latitude),
          longitude: parseFloat(form.longitude),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setLocations([data, ...locations]);
      setForm({ name: '', street_address: '', city: '', state: '', zipcode: '', latitude: '', longitude: '' });
      setShowForm(false);
    } catch (err) {
      console.error('Failed to save location:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this saved location?')) return;
    try {
      await authFetch(`/api/locations/${id}`, { method: 'DELETE' });
      setLocations(locations.filter((l) => l.id !== id));
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 dark:border-white/10 shadow-sm dark:shadow-none">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
          </svg>
          Saved Locations
        </h3>
        <button
          onClick={() => setShowForm(!showForm)}
          className="text-sm text-storm-500 hover:text-storm-400 transition"
        >
          {showForm ? 'Cancel' : '+ Add Location'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSave} className="mb-4 p-4 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 space-y-3">
          <input
            type="text"
            placeholder="Location name (e.g., Main Office)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="w-full px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500"
          />
          <div className="grid grid-cols-2 gap-2">
            <input type="text" placeholder="Street Address" value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500" />
            <input type="text" placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500" />
            <input type="text" placeholder="State (e.g. TX)" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500" />
            <input type="text" placeholder="ZIP" value={form.zipcode} onChange={(e) => setForm({ ...form, zipcode: e.target.value })} className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500" />
            <input type="number" step="any" placeholder="Latitude" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} required className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500" />
            <input type="number" step="any" placeholder="Longitude" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} required className="px-3 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500" />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full px-4 py-2 bg-storm-600 hover:bg-storm-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Location'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-4">
          <svg className="animate-spin h-5 w-5 text-storm-400" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : locations.length === 0 ? (
        <p className="text-center text-gray-400 dark:text-storm-500 text-sm py-4">No saved locations yet</p>
      ) : (
        <div className="space-y-2">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-white/5 rounded-lg border border-gray-100 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              <button
                onClick={() => onSelectLocation(loc)}
                className="flex-1 text-left"
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">{loc.name}</p>
                <p className="text-xs text-gray-500 dark:text-storm-400">
                  {[loc.city, loc.state].filter(Boolean).join(', ')}
                </p>
              </button>
              <button
                onClick={() => handleDelete(loc.id)}
                className="p-1 text-gray-400 dark:text-storm-500 hover:text-red-400 transition ml-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
