import { useState, useEffect } from 'react';
import { useGeofence } from '../hooks/useGeofence';

export default function CheckInTerminal({ boleto }) {
  const { enTerminal, cargando, error, distancia, radio } = useGeofence(true);
  const [checkInRealizado, setCheckInRealizado] = useState(false);
  const [ubicacionGuardada, setUbicacionGuardada] = useState(null);

  // Guardar ubicación cada vez que se obtiene
  useEffect(() => {
    if (distancia !== null && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          
          // Guardar ubicación del cliente (por DNI)
          const ubicaciones = JSON.parse(localStorage.getItem('ubicacionesClientes') || '{}');
          ubicaciones[boleto.dni] = {
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString(),
            boletoCodigo: boleto.codigo,
          };
          localStorage.setItem('ubicacionesClientes', JSON.stringify(ubicaciones));
          setUbicacionGuardada({ lat: latitude, lng: longitude });
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [distancia, boleto.dni, boleto.codigo]);

  useEffect(() => {
    const checkIns = JSON.parse(localStorage.getItem('checkIns') || '{}');
    if (checkIns[boleto.codigo]) {
      setCheckInRealizado(true);
    }
  }, [boleto.codigo]);

  useEffect(() => {
    if (enTerminal && !checkInRealizado) {
      const checkIns = JSON.parse(localStorage.getItem('checkIns') || '{}');
      checkIns[boleto.codigo] = {
        timestamp: new Date().toISOString(),
        distancia: Math.round(distancia),
      };
      localStorage.setItem('checkIns', JSON.stringify(checkIns));
      
      const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const actualizados = boletos.map(b => 
        b.codigo === boleto.codigo ? { ...b, estadoAbordaje: 'check_in' } : b
      );
      localStorage.setItem('misBoletos', JSON.stringify(actualizados));
      
      setCheckInRealizado(true);

      const channel = new BroadcastChannel('sync-checkins');
      channel.postMessage({ boletoCodigo: boleto.codigo });
      channel.close();
    }
  }, [enTerminal, checkInRealizado, boleto.codigo, distancia]);

  if (cargando) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-blue-600 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
        <p className="text-[10px] font-bold text-blue-700">Detectando ubicación...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
        <p className="text-[10px] font-bold text-slate-500">📍 Activa la ubicación para check-in automático</p>
      </div>
    );
  }

  if (checkInRealizado) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 flex items-center gap-2">
        <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
        </div>
        <div>
          <p className="text-[10px] font-black text-emerald-700">✓ Check-in completado</p>
          <p className="text-[9px] text-emerald-600">Estás en el terminal. Preséntate en la puerta.</p>
        </div>
      </div>
    );
  }

  if (enTerminal) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
        <p className="text-[10px] font-black text-emerald-700">📍 ¡Estás en el terminal!</p>
        <p className="text-[9px] text-emerald-600">Haciendo check-in automático...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5">
      <p className="text-[10px] font-bold text-slate-500">
        📍 A {distancia}m del terminal (radio: {radio}m)
      </p>
      <p className="text-[9px] text-slate-400 mt-0.5">Check-in automático al llegar.</p>
    </div>
  );
}
