import { useEffect, useRef } from 'react';
import L from 'leaflet';

const DEFAULT_CENTER = [39.8283, -98.5795];
const DEFAULT_ZOOM = 4;

export default function MapView({ latitude, longitude, address }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapRef.current).setView(DEFAULT_CENTER, DEFAULT_ZOOM);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(mapInstanceRef.current);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (latitude && longitude) {
      mapInstanceRef.current.setView([latitude, longitude], 13);

      if (markerRef.current) {
        markerRef.current.remove();
      }

      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 32px; height: 32px; background: linear-gradient(135deg, #4c6ef5, #364fc7);
          border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
          border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      markerRef.current = L.marker([latitude, longitude], { icon })
        .addTo(mapInstanceRef.current)
        .bindPopup(`<strong>${address || 'Selected Location'}</strong><br/>Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`)
        .openPopup();
    }
  }, [latitude, longitude, address]);

  return (
    <div
      ref={mapRef}
      className="h-64 rounded-xl overflow-hidden border border-white/10"
      style={{ minHeight: '256px' }}
    />
  );
}
