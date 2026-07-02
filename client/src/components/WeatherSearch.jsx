import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import MapView from './MapView';
import SavedLocations from './SavedLocations';
import WeatherAlerts from './WeatherAlerts';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS',
  'KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
];

export default function WeatherSearch({ onSearchComplete }) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState({
    street_address: '',
    city: '',
    state: '',
    zipcode: '',
    date_of_loss: '',
  });
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [geocoding, setGeocoding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');
  const [addressDisplay, setAddressDisplay] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const debounceRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=us&addressdetails=1&viewbox=-91.513,42.508,-87.019,36.970&bounded=0`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'WeatherShield-InsurancePortal/1.0' },
      });
      const data = await res.json();
      setSuggestions(data);
      setShowSuggestions(data.length > 0);
      setActiveSuggestion(-1);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const handleAddressInput = (e) => {
    const value = e.target.value;
    setForm({ ...form, street_address: value });
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 300);
  };

  const handleSuggestionSelect = (suggestion) => {
    const addr = suggestion.address || {};
    const road = [addr.house_number, addr.road].filter(Boolean).join(' ');
    const city = addr.city || addr.town || addr.village || addr.hamlet || '';
    const iso = addr['ISO3166-2-lvl4'] || '';
    const parsed = iso.startsWith('US-') ? iso.slice(3) : (addr.state_code || '').toUpperCase();
    const stateCode = US_STATES.find((s) => s === parsed) || '';
    const zip = addr.postcode || '';

    setForm({
      ...form,
      street_address: road || suggestion.display_name.split(',')[0],
      city,
      state: stateCode,
      zipcode: zip.split('-')[0],
    });
    setCoords({ latitude: parseFloat(suggestion.lat), longitude: parseFloat(suggestion.lon) });
    setAddressDisplay(suggestion.display_name);
    setSuggestions([]);
    setShowSuggestions(false);
    setError('');
  };

  const handleAddressKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeSuggestion >= 0) {
      e.preventDefault();
      handleSuggestionSelect(suggestions[activeSuggestion]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const geocodeAddress = async () => {
    const { street_address, city, state, zipcode } = form;
    if (!city || !state) {
      setError('City and state are required for geocoding');
      return;
    }

    setGeocoding(true);
    setError('');

    try {
      const parts = [street_address, city, state, zipcode].filter(Boolean);
      const query = parts.join(', ') + ', USA';
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=us`;

      const res = await fetch(url, {
        headers: { 'User-Agent': 'WeatherShield-InsurancePortal/1.0' },
      });
      const data = await res.json();

      if (data.length === 0) {
        setError('Address not found. Please check your input and try again.');
        return;
      }

      const { lat, lon, display_name } = data[0];
      setCoords({ latitude: parseFloat(lat), longitude: parseFloat(lon) });
      setAddressDisplay(display_name);
    } catch {
      setError('Failed to geocode address. Please try again.');
    } finally {
      setGeocoding(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!coords.latitude || !coords.longitude) {
      setError('Please locate the address on the map first');
      return;
    }
    if (!form.date_of_loss) {
      setError('Please enter the date of loss');
      return;
    }

    setSearching(true);
    setError('');

    try {
      const res = await authFetch('/api/weather/search', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          latitude: coords.latitude,
          longitude: coords.longitude,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      onSearchComplete(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Weather Peril Search</h2>
        <p className="text-storm-400 mt-1">
          Enter an address and date of loss to retrieve 3-year historical weather and peril data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-storm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            Location Details
          </h3>

          <form onSubmit={handleSearch} className="space-y-4">
            <div className="relative" ref={suggestionsRef}>
              <label className="block text-sm text-storm-300 mb-1">Street Address</label>
              <input
                type="text"
                name="street_address"
                value={form.street_address}
                onChange={handleAddressInput}
                onKeyDown={handleAddressKeyDown}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                placeholder="Start typing an address (e.g. 123 Main St, Chicago, IL)..."
                autoComplete="off"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
              />
              {showSuggestions && suggestions.length > 0 && (
                <ul className="absolute z-50 w-full mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {suggestions.map((s, i) => (
                    <li
                      key={s.place_id}
                      onClick={() => handleSuggestionSelect(s)}
                      className={`px-4 py-3 cursor-pointer text-sm border-b border-white/5 last:border-b-0 transition ${
                        i === activeSuggestion
                          ? 'bg-storm-600/50 text-white'
                          : 'text-storm-200 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 text-storm-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="truncate">{s.display_name}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-storm-300 mb-1">City *</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Chicago"
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm text-storm-300 mb-1">State *</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
                >
                  <option value="" className="bg-gray-800">Select state</option>
                  {US_STATES.map((s) => (
                    <option key={s} value={s} className="bg-gray-800">{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-storm-300 mb-1">ZIP Code</label>
              <input
                type="text"
                name="zipcode"
                value={form.zipcode}
                onChange={handleChange}
                placeholder="60601"
                maxLength={5}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white placeholder-storm-500 focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
              />
            </div>

            <button
              type="button"
              onClick={geocodeAddress}
              disabled={geocoding || !form.city || !form.state}
              className="w-full py-2.5 bg-storm-700/50 hover:bg-storm-700 text-white rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {geocoding ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Locating...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  Locate on Map
                </>
              )}
            </button>

            {coords.latitude && (
              <p className="text-xs text-storm-400">
                Coordinates: {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
              </p>
            )}

            <hr className="border-white/10" />

            <div>
              <label className="block text-sm text-storm-300 mb-1">
                Date of Loss *
                <span className="text-storm-500 ml-1">(3-year lookback will be calculated)</span>
              </label>
              <input
                type="date"
                name="date_of_loss"
                value={form.date_of_loss}
                onChange={handleChange}
                max={today}
                required
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-storm-500 transition"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-red-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={searching || !coords.latitude || !form.date_of_loss}
              className="w-full py-3 bg-gradient-to-r from-storm-600 to-storm-700 hover:from-storm-500 hover:to-storm-600 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {searching ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Fetching 3 Years of Weather Data...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                  </svg>
                  Search Weather &amp; Peril Data
                </>
              )}
            </button>
          </form>
        </div>

        {/* Map */}
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-storm-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            Location Map
          </h3>
          <MapView latitude={coords.latitude} longitude={coords.longitude} address={addressDisplay} />
          {addressDisplay && (
            <p className="mt-3 text-sm text-storm-300 truncate" title={addressDisplay}>
              {addressDisplay}
            </p>
          )}
        </div>
      </div>

      <WeatherAlerts latitude={coords.latitude} longitude={coords.longitude} city={form.city} state={form.state} />

      <SavedLocations onSelectLocation={(loc) => {
        setForm({
          street_address: loc.street_address || '',
          city: loc.city,
          state: loc.state,
          zipcode: loc.zipcode || '',
          date_of_loss: form.date_of_loss,
        });
        setCoords({ latitude: loc.latitude, longitude: loc.longitude });
        setAddressDisplay([loc.street_address, loc.city, loc.state, loc.zipcode].filter(Boolean).join(', '));
      }} />
    </div>
  );
}
