import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const PERIL_COLORS = {
  Hail: '#3b82f6',
  Wind: '#8b5cf6',
  Thunderstorm: '#f59e0b',
  'Heavy Rain / Flooding': '#06b6d4',
  'Winter Storm': '#6366f1',
  'Tornado Risk': '#ef4444',
  'Ice Storm': '#14b8a6',
};

export default function MapHeatmap() {
  const { token } = useAuth();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeril, setSelectedPeril] = useState('all');

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapInstanceRef.current = map;
    renderMarkers(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [history, selectedPeril]);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/weather/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const renderMarkers = (map) => {
    markersRef.current.forEach((m) => map.removeLayer(m));
    markersRef.current = [];

    const perilLocations = {};

    history.forEach((entry) => {
      const key = `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`;
      if (!perilLocations[key]) {
        perilLocations[key] = {
          lat: entry.latitude,
          lng: entry.longitude,
          city: entry.city,
          state: entry.state,
          searches: 0,
          perils: {},
        };
      }
      perilLocations[key].searches += 1;
    });

    history.forEach((entry) => {
      const key = `${entry.latitude.toFixed(3)},${entry.longitude.toFixed(3)}`;
      try {
        const histRes = fetch(`/api/weather/history/${entry.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // We'll use the stored search data in a simplified way
      } catch { /* ignore */ }
    });

    Object.values(perilLocations).forEach((loc) => {
      const radius = Math.min(Math.max(loc.searches * 8, 12), 40);
      const color = selectedPeril === 'all' ? '#ef4444' : (PERIL_COLORS[selectedPeril] || '#ef4444');
      const opacity = Math.min(0.3 + loc.searches * 0.15, 0.8);

      const circle = L.circleMarker([loc.lat, loc.lng], {
        radius,
        fillColor: color,
        fillOpacity: opacity,
        color: color,
        weight: 2,
        opacity: 0.8,
      }).addTo(map);

      circle.bindPopup(`
        <div style="font-family: sans-serif; min-width: 150px;">
          <strong>${loc.city}, ${loc.state}</strong><br/>
          <span style="color: #666;">Searches: ${loc.searches}</span>
        </div>
      `);

      markersRef.current.push(circle);
    });
  };

  if (loading) return <div className="text-center py-8 text-gray-500 dark:text-storm-400">Loading map data...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Peril Heatmap</h2>
          <p className="text-gray-500 dark:text-storm-400 mt-1">Visualize historical peril density across searched locations</p>
        </div>
      </div>

      {/* Peril filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setSelectedPeril('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedPeril === 'all' ? 'bg-red-500 text-white' : 'bg-gray-100 dark:bg-storm-800 text-gray-600 dark:text-storm-400 hover:bg-gray-200 dark:hover:bg-storm-700'}`}
        >
          All Perils
        </button>
        {Object.entries(PERIL_COLORS).map(([peril, color]) => (
          <button
            key={peril}
            onClick={() => setSelectedPeril(peril)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selectedPeril === peril ? 'text-white' : 'bg-gray-100 dark:bg-storm-800 text-gray-600 dark:text-storm-400 hover:bg-gray-200 dark:hover:bg-storm-700'}`}
            style={selectedPeril === peril ? { backgroundColor: color } : {}}
          >
            {peril}
          </button>
        ))}
      </div>

      {/* Map */}
      <div className="bg-white dark:bg-storm-900/50 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
        {history.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-storm-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
            <p>No search history yet. Search for locations to build the heatmap.</p>
          </div>
        ) : (
          <div ref={mapRef} style={{ height: '500px', width: '100%' }} />
        )}
      </div>

      {/* Legend */}
      {history.length > 0 && (
        <div className="mt-4 bg-white dark:bg-storm-900/50 rounded-xl p-4 border border-gray-200 dark:border-white/10">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Legend</h4>
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-400 opacity-40" />
              <span className="text-gray-600 dark:text-storm-400">1 search</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-red-500 opacity-60" />
              <span className="text-gray-600 dark:text-storm-400">2-3 searches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-600 opacity-80" />
              <span className="text-gray-600 dark:text-storm-400">4+ searches</span>
            </div>
            <span className="text-gray-400 dark:text-storm-500 ml-4">Circle size = search frequency • Color intensity = density</span>
          </div>
        </div>
      )}
    </div>
  );
}
