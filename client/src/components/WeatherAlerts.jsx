import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SEVERITY_COLORS = {
  Extreme: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400 border-red-300 dark:border-red-700',
  Severe: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-700',
  Moderate: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border-yellow-300 dark:border-yellow-700',
  Minor: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700',
  Unknown: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600',
};

export default function WeatherAlerts({ latitude, longitude, city, state }) {
  const { token } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (latitude && longitude) {
      fetchAlerts();
    }
  }, [latitude, longitude]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/alerts?latitude=${latitude}&longitude=${longitude}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch {
      setAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  if (!latitude || !longitude) return null;

  return (
    <div className="bg-white dark:bg-storm-900/50 rounded-xl p-5 border border-gray-200 dark:border-white/10 mt-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        Real-Time Weather Alerts
        {city && state && <span className="text-sm font-normal text-gray-500 dark:text-storm-400">— {city}, {state}</span>}
      </h3>

      {loading ? (
        <div className="text-sm text-gray-500 dark:text-storm-400 py-4 text-center">
          <svg className="w-5 h-5 animate-spin mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Checking NWS alerts...
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-4 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            No active weather alerts for this location
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-storm-400">{alerts.length} active alert{alerts.length !== 1 ? 's' : ''}</p>
          {alerts.map((alert, i) => (
            <div key={alert.id || i} className={`rounded-lg border p-4 ${SEVERITY_COLORS[alert.severity] || SEVERITY_COLORS.Unknown}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{alert.event}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">{alert.severity}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/20">{alert.urgency}</span>
                  </div>
                  <p className="text-sm mt-1 opacity-90">{alert.headline}</p>
                  {alert.onset && (
                    <p className="text-xs mt-1 opacity-70">
                      {new Date(alert.onset).toLocaleString()} — {new Date(alert.expires).toLocaleString()}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setExpanded(expanded === i ? null : i)}
                  className="text-xs underline opacity-70 hover:opacity-100 ml-2 shrink-0"
                >
                  {expanded === i ? 'Less' : 'More'}
                </button>
              </div>
              {expanded === i && (
                <div className="mt-3 pt-3 border-t border-current/20 text-sm space-y-2">
                  {alert.description && <p className="whitespace-pre-wrap text-xs opacity-80">{alert.description}</p>}
                  {alert.instruction && (
                    <div className="mt-2 p-2 rounded bg-white/30 dark:bg-black/20 text-xs">
                      <strong>Instructions:</strong> {alert.instruction}
                    </div>
                  )}
                  {alert.senderName && <p className="text-xs opacity-60">Source: {alert.senderName}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
