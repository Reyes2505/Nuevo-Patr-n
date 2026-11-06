import { useState, useEffect } from 'react';

// Coordenadas del Terminal Terrestre San Marcos
const TERMINAL_COORDS = {
  lat: -7.167088799999999,
  lng: -78.5015892,
};

// Radio en metros (100m = llegó al terminal)
const RADIO_METROS = 100;

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export function useGeofence(activo = true) {
  const [enTerminal, setEnTerminal] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [distancia, setDistancia] = useState(null);

  useEffect(() => {
    if (!activo) return;
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada');
      setCargando(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const dist = calcularDistancia(latitude, longitude, TERMINAL_COORDS.lat, TERMINAL_COORDS.lng);
        setDistancia(Math.round(dist));
        setEnTerminal(dist <= RADIO_METROS);
        setCargando(false);
        setError(null);
      },
      (err) => {
        setError(err.message);
        setCargando(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [activo]);

  return { enTerminal, cargando, error, distancia, coords: TERMINAL_COORDS, radio: RADIO_METROS };
}
