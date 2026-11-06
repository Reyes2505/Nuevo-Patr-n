import { useState, useEffect } from 'react';
import { getFechas7Dias } from '../data/turnos';

export default function SearchBar({ origen, setOrigen, destino, setDestino, diaSeleccionado, setDiaSeleccionado }) {
  const [fechas, setFechas] = useState([]);

  useEffect(() => {
    setFechas(getFechas7Dias());
  }, []);

  const handleSwap = () => { 
    setOrigen(destino); 
    setDestino(origen); 
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-5 relative overflow-hidden group">
      
      {/* Degradado sutil que aparece en hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

      <div className="relative z-10">
        {/* Selector de Ruta */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ruta del viaje</p>
          <div className="flex items-stretch gap-2 p-1 bg-slate-50 rounded-xl border border-slate-100">
            <button 
              onClick={() => { setOrigen('San Marcos'); setDestino('Cajamarca'); }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                origen === 'San Marcos' 
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}>
              San Marcos
            </button>
            
            <button 
              onClick={handleSwap}
              className="w-10 bg-white rounded-lg flex items-center justify-center text-slate-400 hover:text-brand-orange shadow-sm border border-slate-200 hover:border-brand-orange/30 transition-all duration-500 hover:rotate-180">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
            </button>

            <button 
              onClick={() => { setOrigen('Cajamarca'); setDestino('San Marcos'); }}
              className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wider rounded-lg transition-all ${
                origen === 'Cajamarca' 
                  ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}>
              Cajamarca
            </button>
          </div>
        </div>

        {/* Selector de Fecha */}
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha (próximos 7 días)</p>
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {fechas.map((f) => (
              <button 
                key={f.index} 
                onClick={() => setDiaSeleccionado(f.index)}
                className={`flex-shrink-0 flex flex-col items-center justify-center w-16 py-3 rounded-xl transition-all duration-300 hover:-translate-y-1 ${
                  diaSeleccionado === f.index
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'bg-slate-50 text-slate-600 hover:bg-white hover:shadow-md border border-slate-100'
                }`}>
                <span className="text-[9px] font-black uppercase tracking-wider opacity-70">{f.label}</span>
                <span className="text-xl font-black leading-none mt-1">{f.dia}</span>
                <span className="text-[9px] font-bold uppercase opacity-60">{f.mes}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
