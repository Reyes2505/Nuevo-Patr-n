import RouteMap from './RouteMap';

export default function CheckoutSummary({ selectedSeats, origen, destino, turno, onOpenModal, errorFormulario, todosCompletos, asientosPendientes }) {
  const fare = 10.00;
  const total = selectedSeats.length * fare;

  const dirOrigen = origen === 'San Marcos' 
    ? 'Bolognesi 318, San Marcos 06321' 
    : 'Terminal Terrestre San Marcos, 3N 411, Cajamarca 06003';
  const dirDestino = destino === 'Cajamarca' 
    ? 'Terminal Terrestre San Marcos, 3N 411, Cajamarca 06003' 
    : 'Bolognesi 318, San Marcos 06321';

  return (
    <div className="w-full flex flex-col gap-4 lg:sticky lg:top-20">
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex items-center justify-between gap-3">
            
            {/* ORIGEN */}
            <div className="flex items-center gap-2 flex-1">
              <div className="w-7 h-7 rounded-full bg-white border-2 border-brand-orange flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-brand-orange">O</span>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Origen</p>
                <p className="text-xs font-black text-slate-900 truncate">{origen}</p>
              </div>
            </div>

            {/* FLECHA ANIMADA */}
            <div className="text-brand-orange flex-shrink-0 animate-pulse-arrow">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </div>

            {/* DESTINO */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <div className="min-w-0 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Destino</p>
                <p className="text-xs font-black text-slate-900 truncate">{destino}</p>
              </div>
              <div className="w-7 h-7 rounded-full bg-white border-2 border-brand-red flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-black text-brand-red">D</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Salida</span>
            <span className="font-black text-slate-900">{turno?.hora}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Placa</span>
            <span className="font-mono font-black text-slate-900">{turno?.placa}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-bold">Conductor</span>
            <span className="font-black text-slate-900 truncate ml-2 text-right">{turno?.conductor}</span>
          </div>
        </div>

        <div className="px-4 pb-4 space-y-1.5">
          <p className="text-[10px] text-slate-500 flex items-start gap-1.5">
            <span className="text-brand-orange font-black flex-shrink-0">O</span>
            <span className="leading-snug">{dirOrigen}</span>
          </p>
          <p className="text-[10px] text-slate-500 flex items-start gap-1.5">
            <span className="text-brand-red font-black flex-shrink-0">D</span>
            <span className="leading-snug">{dirDestino}</span>
          </p>
        </div>

        <RouteMap />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-0.5">
                {selectedSeats.length === 0 ? 'Sin asientos' : `${selectedSeats.length} asiento${selectedSeats.length > 1 ? 's' : ''}`}
              </p>
              <p className="text-xs font-bold text-slate-700">Tarifa única × pasajero</p>
            </div>
            <p className="text-3xl font-black text-brand-orange tracking-tighter">S/ {total.toFixed(2)}</p>
          </div>

          {selectedSeats.length > 0 && (
            <div className={`text-[11px] p-2.5 rounded-lg mb-3 font-bold flex items-center justify-between ${
              todosCompletos ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
            }`}>
              <span>
                {todosCompletos 
                  ? '✓ Todos los pasajeros registrados' 
                  : `Faltan ${asientosPendientes} pasajero${asientosPendientes !== 1 ? 's' : ''} por registrar`
                }
              </span>
              {todosCompletos && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              )}
            </div>
          )}

          {errorFormulario && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] p-2.5 rounded-lg mb-3 font-bold">
              {errorFormulario}
            </div>
          )}

          <button 
            onClick={onOpenModal} 
            disabled={!todosCompletos}
            className={`w-full py-3.5 font-black text-sm uppercase tracking-wider transition-all rounded-xl shadow-lg ${
              todosCompletos 
                ? 'bg-brand-orange hover:bg-orange-700 text-white shadow-brand-orange/30 hover:-translate-y-0.5' 
                : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
            }`}>
            {todosCompletos ? 'Continuar con el pago' : 'Completa los datos'}
          </button>
        </div>

        <div className="px-5 pb-4 border-t border-slate-100 pt-3">
          <div className="flex items-center justify-center gap-4 opacity-60">
            <img src="/yape-logo.png" alt="Yape" className="h-5 object-contain" />
            <img src="/tarjeta-logo.png" alt="Tarjeta" className="h-5 object-contain" />
            <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
              Efectivo
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
