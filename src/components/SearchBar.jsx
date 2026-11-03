import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar() {
  const navigate = useNavigate();
  const [origen, setOrigen] = useState('San Marcos');
  const [destino, setDestino] = useState('Cajamarca');
  const [fecha, setFecha] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    navigate('/reserva', { state: { origen, destino } });
  };

  const handleSwap = () => {
    setOrigen(destino);
    setDestino(origen);
  };

  return (
    <form onSubmit={handleSearch} className="bg-white p-2 sm:p-3 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-slate-100 w-full max-w-4xl mx-auto relative z-20 flex flex-col md:flex-row items-stretch gap-2">
      
      {/* Bloque Origen y Destino */}
      <div className="flex-1 flex flex-col sm:flex-row bg-slate-50 rounded-2xl border border-slate-200 overflow-hidden relative group">
        
        {/* Origen */}
        <div className="flex-1 p-3 sm:p-4 hover:bg-slate-100 transition-colors cursor-pointer relative">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Origen</label>
          <div className="flex items-center gap-2">
            <span className="text-brand-orange text-lg">📍</span>
            <select 
              value={origen} 
              onChange={(e) => setOrigen(e.target.value)} 
              className="bg-transparent w-full text-base font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="San Marcos">San Marcos (Terminal)</option>
              <option value="Cajamarca">Cajamarca (Bolognesi)</option>
            </select>
          </div>
        </div>

        {/* Botón de intercambio flotante */}
        <button 
          type="button" 
          onClick={handleSwap}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 md:left-auto md:right-0 md:translate-x-1/2 z-10 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-md text-slate-500 hover:text-brand-orange hover:scale-110 transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path></svg>
        </button>

        {/* Destino */}
        <div className="flex-1 p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Destino</label>
          <div className="flex items-center gap-2">
            <span className="text-brand-red text-lg">🏁</span>
            <select 
              value={destino} 
              onChange={(e) => setDestino(e.target.value)} 
              className="bg-transparent w-full text-base font-bold text-slate-800 focus:outline-none appearance-none cursor-pointer"
            >
              <option value="Cajamarca">Cajamarca (Bolognesi)</option>
              <option value="San Marcos">San Marcos (Terminal)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Fecha */}
      <div className="flex-1 bg-slate-50 rounded-2xl border border-slate-200 p-3 sm:p-4 hover:bg-slate-100 transition-colors">
        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Fecha</label>
        <input 
          type="date" 
          value={fecha} 
          onChange={(e) => setFecha(e.target.value)} 
          required 
          className="bg-transparent w-full text-base font-bold text-slate-800 focus:outline-none cursor-pointer" 
        />
      </div>

      {/* Botón Buscar */}
      <button 
        type="submit" 
        className="bg-gradient-to-r from-brand-orange to-brand-red hover:from-orange-600 hover:to-red-800 text-white font-bold text-lg rounded-2xl px-8 py-4 sm:py-0 transition-all shadow-lg hover:shadow-brand-red/30 flex items-center justify-center gap-2"
      >
        <span>Buscar</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </button>
    </form>
  );
}
