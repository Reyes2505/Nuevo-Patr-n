import { useState, useEffect } from 'react';
import RouteMap from './RouteMap';

export default function CheckoutSummary({ selectedSeats, timeLeft, isTimerActive, origen, destino, turno, onOpenModal }) {
  const fare = 10.00;
  const total = selectedSeats.length * fare;
  const [tiempoViaje, setTiempoViaje] = useState('Calculando...');

  const dirOrigen = origen === 'San Marcos' ? 'Terminal Terrestre San Marcos (3N 411)' : 'Bolognesi 318, Cajamarca';
  const dirDestino = destino === 'Cajamarca' ? 'Bolognesi 318, Cajamarca' : 'Terminal Terrestre San Marcos (3N 411)';

  useEffect(() => {
    const originPos = [-7.1670, -78.5015];
    const destPos = [-7.3363, -78.1720];
    const url = `https://router.project-osrm.org/route/v1/driving/${originPos[1]},${originPos[0]};${destPos[1]},${destPos[0]}?overview=false`;
    fetch(url).then(r => r.json()).then(data => {
      if (data.routes && data.routes.length > 0) {
        const minutos = Math.round(data.routes[0].duration / 60);
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        setTiempoViaje(h > 0 ? `${h}h ${m} min` : `${m} min`);
      }
    }).catch(() => setTiempoViaje('54 min'));
  }, []);

  return (
    <div className="w-full max-w-md flex flex-col gap-6">
      
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden">
        <div className="bg-slate-50/80 p-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Tu Viaje</h3>
            <span className="text-xs font-bold bg-white text-blue-600 px-3 py-1 rounded-full shadow-sm border border-blue-100 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {tiempoViaje}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origen</span>
              <span className="font-bold text-slate-800 text-sm">{origen}</span>
            </div>
            <div className="text-slate-300">→</div>
            <div className="flex-1 text-right">
              <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destino</span>
              <span className="font-bold text-slate-800 text-sm">{destino}</span>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
            <div>
              <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Salida</span>
              <span className="font-black text-slate-800 text-xl">{turno?.hora}</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] font-black text-slate-400 uppercase mb-1">Vehículo</span>
              <span className="font-bold text-slate-700 text-sm block">Toyota Hiace</span>
              <span className="text-xs text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">{turno?.placa}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 space-y-2.5 px-1">
            <p className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-orange-100 text-brand-orange flex items-center justify-center shrink-0">O</span> 
              <span className="pt-1"><strong>Origen:</strong> {dirOrigen}</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">D</span> 
              <span className="pt-1"><strong>Destino:</strong> {dirDestino}</span>
            </p>
            <p className="flex items-start gap-3">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">C</span> 
              <span className="pt-1"><strong>Conductor:</strong> {turno?.conductor}</span>
            </p>
          </div>
        </div>

        <RouteMap />
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-6">
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-slate-500 font-medium">Asientos elegidos</span>
          <span className={`font-black px-3 py-1 rounded-lg ${selectedSeats.length > 0 ? 'bg-orange-100 text-brand-orange' : 'bg-slate-100 text-slate-400'}`}>
            {selectedSeats.length > 0 ? selectedSeats.sort((a,b)=>a-b).map(n => `N°${n}`).join(', ') : 'Ninguno'}
          </span>
        </div>
        
        <div className="flex justify-between items-center mb-4 text-sm border-b border-slate-100 pb-4">
          <span className="text-slate-500 font-medium">Tarifa (x{selectedSeats.length})</span>
          <span className="font-bold text-slate-700">S/ {total.toFixed(2)}</span>
        </div>
        
        <div className="flex justify-between items-end mb-6">
          <span className="font-black text-slate-800 text-lg">Total</span>
          <span className="text-4xl font-black text-brand-red tracking-tighter">S/ {total.toFixed(2)}</span>
        </div>

        {isTimerActive && (
          <div className="bg-orange-50 border border-orange-200 text-orange-700 text-xs p-3 rounded-xl mb-5 flex items-center justify-between font-medium">
            <span className="flex items-center gap-2">
              <span className="animate-pulse w-2 h-2 rounded-full bg-orange-500"></span>
              Reserva expira en:
            </span>
            <span className="font-black font-mono text-sm bg-white px-2 py-0.5 rounded border border-orange-200">{timeLeft}</span>
          </div>
        )}

        {/* BOTÓN CONECTADO AL MODAL */}
        <button 
          onClick={onOpenModal}
          disabled={selectedSeats.length === 0}
          className={`w-full py-4 rounded-2xl font-black text-white text-lg transition-all flex items-center justify-center gap-2
            ${selectedSeats.length > 0
              ? 'bg-gradient-to-r from-[#5C1E8C] to-[#7c2aa8] shadow-[0_10px_20px_-10px_rgba(92,30,140,0.8)] hover:shadow-[0_15px_25px_-10px_rgba(92,30,140,0.9)] hover:-translate-y-0.5' 
              : 'bg-slate-300 cursor-not-allowed shadow-none'
            }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          Pagar con Yape
        </button>
        <p className="text-center text-[11px] text-slate-400 font-medium mt-4">
          Pago 100% seguro · Boleto QR inmediato
        </p>
      </div>
    </div>
  );
}
