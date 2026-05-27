import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const FIELD_CONFIG = [
  { key: 'wind_speed_mph', label: 'Wind Speed Threshold (mph)', group: 'Wind', type: 'number', step: '0.1', description: 'Minimum wind gust to trigger wind peril' },
  { key: 'wind_severe_mph', label: 'Wind Severe (mph)', group: 'Wind', type: 'number', step: '0.1', description: 'Wind gust for Severe classification' },
  { key: 'wind_extreme_mph', label: 'Wind Extreme (mph)', group: 'Wind', type: 'number', step: '0.1', description: 'Wind gust for Extreme classification' },
  { key: 'rain_minor_inches', label: 'Rain Minor (inches)', group: 'Rain', type: 'number', step: '0.1', description: 'Minimum precipitation for Minor peril' },
  { key: 'rain_moderate_inches', label: 'Rain Moderate (inches)', group: 'Rain', type: 'number', step: '0.1', description: 'Precipitation for Moderate classification' },
  { key: 'rain_severe_inches', label: 'Rain Severe (inches)', group: 'Rain', type: 'number', step: '0.1', description: 'Precipitation for Severe classification' },
  { key: 'winter_temp_max_f', label: 'Winter Storm Max Temp (°F)', group: 'Winter', type: 'number', step: '0.1', description: 'Maximum temperature for winter storm' },
  { key: 'tornado_wind_mph', label: 'Tornado Risk Wind (mph)', group: 'Tornado', type: 'number', step: '0.1', description: 'Wind threshold for tornado risk detection' },
  { key: 'hail_codes', label: 'Hail WMO Codes', group: 'WMO Codes', type: 'text', description: 'Comma-separated WMO weather codes for hail' },
  { key: 'thunderstorm_codes', label: 'Thunderstorm WMO Codes', group: 'WMO Codes', type: 'text', description: 'Comma-separated WMO codes for thunderstorms' },
  { key: 'winter_storm_codes', label: 'Winter Storm WMO Codes', group: 'WMO Codes', type: 'text', description: 'Comma-separated WMO codes for winter storms' },
  { key: 'ice_storm_codes', label: 'Ice Storm WMO Codes', group: 'WMO Codes', type: 'text', description: 'Comma-separated WMO codes for ice storms' },
];

export default function PerilThresholds() {
  const { token } = useAuth();
  const [thresholds, setThresholds] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      const res = await fetch('/api/thresholds', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setThresholds(data);
    } catch (err) {
      setMessage('Failed to load thresholds');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setThresholds((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/thresholds', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(thresholds),
      });
      if (res.ok) {
        setMessage('Thresholds saved successfully!');
      } else {
        setMessage('Failed to save thresholds');
      }
    } catch {
      setMessage('Error saving thresholds');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset all thresholds to defaults?')) return;
    try {
      const res = await fetch('/api/thresholds/reset', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setThresholds(data.thresholds);
      setMessage('Thresholds reset to defaults');
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Error resetting thresholds');
    }
  };

  if (loading) return <div className="text-center py-8 text-gray-500 dark:text-storm-400">Loading thresholds...</div>;

  const groups = [...new Set(FIELD_CONFIG.map((f) => f.group))];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Peril Thresholds</h2>
          <p className="text-gray-500 dark:text-storm-400 mt-1">Configure detection thresholds for weather perils</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 dark:border-storm-600 text-gray-700 dark:text-storm-300 hover:bg-gray-100 dark:hover:bg-storm-800 transition"
          >
            Reset to Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm rounded-lg bg-storm-600 text-white hover:bg-storm-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving...' : 'Save Thresholds'}
          </button>
        </div>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('success') || message.includes('reset') ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group} className="bg-white dark:bg-storm-900/50 rounded-xl p-6 border border-gray-200 dark:border-white/10">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-storm-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
              </svg>
              {group}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FIELD_CONFIG.filter((f) => f.group === group).map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-storm-300 mb-1">{field.label}</label>
                  <input
                    type={field.type}
                    step={field.step}
                    value={thresholds?.[field.key] ?? ''}
                    onChange={(e) => handleChange(field.key, field.type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-storm-600 bg-white dark:bg-storm-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-storm-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 dark:text-storm-500 mt-1">{field.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
