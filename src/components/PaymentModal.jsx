import { useState } from 'react';
import QRCode from 'react-qr-code';
import { useUser } from '../context/UserContext';

export default function PaymentModal({ isOpen, onClose, selectedSeats, total, turno, origen, destino }) {
  const { agregarBoleto } = useUser();
  const [paso, setPaso] = useState('pago');
  const [codigoOperacion, setCodigoOperacion] = useState('');

  if (!isOpen) return null;

  const handleConfirmarPago = (e) => {
    e.preventDefault();
    if (codigoOperacion.length < 4) {
      alert("Por favor, ingresa un número de operación válido (mínimo 4 dígitos).");
      return;
    }

    // Guardamos el boleto en el historial del usuario
    agregarBoleto({
      codigo: codigoOperacion,
      asientos: selectedSeats.sort((a,b)=>a-b).map(n => `N°${n}`).join(', '),
      origen,
      destino,
      turno,
      fecha: new Date().toISOString(),
      total
    });

    setTimeout(() => setPaso('boleto'), 800);
  };

  const asientosString = selectedSeats.sort((a,b)=>a-b).map(n => `N°${n}`).join(', ');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {paso === 'pago' ? (
          <div className="p-6 sm:p-8">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[#5C1E8C] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
              </div>
              <h2 className="text-2xl font-black text-slate-800">Pago con Yape</h2>
              <p className="text-sm text-slate-500 mt-1">Escanea el QR o transfiere al número del chofer</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 text-center">
              <span className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Monto a pagar</span>
              <span className="text-4xl font-black text-brand-red tracking-tighter">S/ {total.toFixed(2)}</span>
              <div className="mt-4 pt-4 border-t border-slate-200">
                <p className="text-xs text-slate-500 mb-1">Yape del conductor ({turno?.conductor}):</p>
                <p className="font-mono font-bold text-lg text-slate-800">{turno?.yape}</p>
              </div>
            </div>

            <form onSubmit={handleConfirmarPago}>
              <label className="block text-xs font-bold text-slate-700 mb-2">Número de Operación (Yape)</label>
              <input 
                type="text" 
                value={codigoOperacion}
                onChange={(e) => setCodigoOperacion(e.target.value.replace(/\D/g, ''))}
                placeholder="Ej. 482910"
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-3 text-center text-lg font-mono font-bold text-slate-800 focus:outline-none focus:border-[#5C1E8C] focus:ring-2 focus:ring-purple-200 transition-all mb-6"
                maxLength={10}
                required
              />
              <button type="submit" className="w-full bg-[#5C1E8C] hover:bg-[#4a1770] text-white font-bold py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mb-3">
                Confirmar Pago
              </button>
              <button type="button" onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all">
                Cancelar
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="bg-brand-red p-6 text-white text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              <h2 className="text-xl font-black tracking-wide relative z-10">¡Pago Exitoso!</h2>
              <p className="text-xs text-red-100 relative z-10 mt-1">El boleto ha sido guardado en tu cuenta</p>
            </div>

            <div className="p-6 sm:p-8">
              <div className="bg-white p-4 rounded-2xl border-2 border-dashed border-slate-200 flex justify-center mb-6">
                <QRCode value={`BOLETO-${turno?.id}-${selectedSeats.join('-')}-${codigoOperacion}`} size={160} fgColor="#1E293B" />
              </div>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Asientos:</span>
                  <span className="font-bold text-brand-orange">{asientosString}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Ruta:</span>
                  <span className="font-semibold text-slate-800">{origen} → {destino}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">Operación:</span>
                  <span className="font-mono font-bold text-emerald-600">{codigoOperacion}</span>
                </div>
              </div>
              <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2">
                Listo, ir a Mis Viajes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
