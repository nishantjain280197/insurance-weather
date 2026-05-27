import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ComparisonView() {
  const { authFetch } = useAuth();
  const [locations, setLocations] = useState([
    { city: '', state: '', latitude: '', longitude: '', date_of_loss: '', label: '' },
    { city: '', state: '', latitude: '', longitude: '', date_of_loss: '', label: '' },
  ]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'];

  const handleLocChange = (idx, field, value) => {
    setLocations((prev) => prev.map((loc, i) => i === idx ? { ...loc, [field]: value } : loc));
  };

  const addLocation = () => {
    if (locations.length >= 5) return;
    setLocations([...locations, { city: '', state: '', latitude: '', longitude: '', date_of_loss: '', label: '' }]);
  };

  const removeLocation = (idx) => {
    if (locations.length <= 2) return;
    setLocations(locations.filter((_, i) => i !== idx));
  };

  const geocodeLocation = async (idx) => {
    const loc = locations[idx];
    if (!loc.city || !loc.state) return;
    try {
      const query = `${loc.city}, ${loc.state}, USA`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`;
      const res = await fetch(url, { headers: { 'User-Agent': 'WeatherShield-InsurancePortal/1.0' } });
      const data = await res.json();
      if (data.length > 0) {
        handleLocChange(idx, 'latitude', data[0].lat);
        handleLocChange(idx, 'longitude', data[0].lon);
      }
    } catch { /* ignore */ }
  };

  const handleCompare = async () => {
    const valid = locations.filter((l) => l.city && l.state && l.latitude && l.longitude && l.date_of_loss);
    if (valid.length < 2) {
      setError('At least 2 complete locations are required');
      return;
    }

    setLoading(true);
    setError('');
    const compareResults = [];

    for (const loc of valid) {
      try {
        const res = await authFetch('/api/weather/search', {
          method: 'POST',
          body: JSON.stringify({
            city: loc.city,
            state: loc.state,
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude),
            date_of_loss: loc.date_of_loss,
            street_address: '',
            zipcode: '',
          }),
        });
        const data = await res.json();
        if (res.ok) {
          compareResults.push({ location: loc, data });
        } else {
          compareResults.push({ location: loc, error: data.error });
        }
      } catch (err) {
        compareResults.push({ location: loc, error: err.message });
      }
    }

    setResults(compareResults);
    setLoading(false);
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comparison View</h2>
          <p className="text-gray-500 dark:text-storm-400 mt-1">Compare weather peril data across multiple locations side-by-side</p>
        </div>
        {locations.length < 5 && (
          <button onClick={addLocation} className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-storm-600 text-gray-700 dark:text-storm-300 hover:bg-gray-100 dark:hover:bg-storm-800 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Add Location
          </button>
        )}
      </div>

      {/* Location inputs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {locations.map((loc, idx) => (
          <div key={idx} className="bg-white dark:bg-storm-900/50 rounded-xl p-4 border border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">Location {idx + 1}</span>
              {locations.length > 2 && (
                <button onClick={() => removeLocation(idx)} className="text-red-500 hover:text-red-700 text-xs">Remove</button>
              )}
            </div>
            <div className="space-y-2">
              <input type="text" placeholder="Label (optional)" value={loc.label} onChange={(e) => handleLocChange(idx, 'label', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
              <input type="text" placeholder="City *" value={loc.city} onChange={(e) => handleLocChange(idx, 'city', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
              <select value={loc.state} onChange={(e) => handleLocChange(idx, 'state', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm">
                <option value="">State *</option>
                {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="flex gap-2">
                <input type="text" placeholder="Lat" value={loc.latitude} onChange={(e) => handleLocChange(idx, 'latitude', e.target.value)} className="w-1/2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
                <input type="text" placeholder="Lng" value={loc.longitude} onChange={(e) => handleLocChange(idx, 'longitude', e.target.value)} className="w-1/2 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
              </div>
              <button onClick={() => geocodeLocation(idx)} disabled={!loc.city || !loc.state} className="w-full py-1.5 text-xs rounded-lg bg-storm-600/20 text-storm-400 hover:bg-storm-600/40 transition disabled:opacity-30">
                Auto-fill coordinates
              </button>
              <input type="date" value={loc.date_of_loss} max={today} onChange={(e) => handleLocChange(idx, 'date_of_loss', e.target.value)} className="w-full px-3 py-1.5 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm" />
            </div>
          </div>
        ))}
      </div>

      {error && <div className="mb-4 p-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm">{error}</div>}

      <button onClick={handleCompare} disabled={loading} className="w-full py-3 bg-gradient-to-r from-storm-600 to-storm-700 hover:from-storm-500 hover:to-storm-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? 'Comparing...' : 'Compare Locations'}
      </button>

      {/* Results comparison table */}
      {results.length >= 2 && (
        <div className="mt-6 bg-white dark:bg-storm-900/50 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Comparison Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-storm-800">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">Metric</th>
                  {results.map((r, i) => (
                    <th key={i} className="px-4 py-3 text-left text-gray-600 dark:text-storm-300">
                      {r.location.label || `${r.location.city}, ${r.location.state}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-storm-700">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Total Days</td>
                  {results.map((r, i) => <td key={i} className="px-4 py-3 text-gray-700 dark:text-storm-300">{r.data?.insights?.summary?.total_days ?? '—'}</td>)}
                </tr>
                <tr className="bg-gray-50/50 dark:bg-storm-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Peril Days</td>
                  {results.map((r, i) => <td key={i} className="px-4 py-3 text-red-600 dark:text-red-400 font-semibold">{r.data?.insights?.summary?.peril_days ?? '—'}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Peril %</td>
                  {results.map((r, i) => <td key={i} className="px-4 py-3 text-gray-700 dark:text-storm-300">{r.data?.insights?.summary?.peril_percentage ? `${r.data.insights.summary.peril_percentage}%` : '—'}</td>)}
                </tr>
                <tr className="bg-gray-50/50 dark:bg-storm-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Avg Temperature</td>
                  {results.map((r, i) => <td key={i} className="px-4 py-3 text-gray-700 dark:text-storm-300">{r.data?.insights?.summary?.avg_temperature ? `${r.data.insights.summary.avg_temperature}°F` : '—'}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Max Wind Gust</td>
                  {results.map((r, i) => <td key={i} className="px-4 py-3 text-gray-700 dark:text-storm-300">{r.data?.insights?.summary?.max_wind_gust ? `${r.data.insights.summary.max_wind_gust} mph` : '—'}</td>)}
                </tr>
                <tr className="bg-gray-50/50 dark:bg-storm-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Avg Precipitation</td>
                  {results.map((r, i) => <td key={i} className="px-4 py-3 text-gray-700 dark:text-storm-300">{r.data?.insights?.summary?.avg_daily_precipitation ? `${r.data.insights.summary.avg_daily_precipitation}"` : '—'}</td>)}
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">Top Perils</td>
                  {results.map((r, i) => (
                    <td key={i} className="px-4 py-3">
                      {r.data?.insights?.peril_frequency ? (
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(r.data.insights.peril_frequency).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([peril, count]) => (
                            <span key={peril} className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-storm-600/20 text-storm-300">{peril}: {count}</span>
                          ))}
                        </div>
                      ) : '—'}
                    </td>
                  ))}
                </tr>
                <tr className="bg-gray-50/50 dark:bg-storm-800/30">
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">DOL Perils</td>
                  {results.map((r, i) => (
                    <td key={i} className="px-4 py-3">
                      {r.data?.insights?.date_of_loss?.perils?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {r.data.insights.date_of_loss.perils.map((p, pi) => (
                            <span key={pi} className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-red-600/20 text-red-400">{p.type}</span>
                          ))}
                        </div>
                      ) : <span className="text-green-500 text-xs">None</span>}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
