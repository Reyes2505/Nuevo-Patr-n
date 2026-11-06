import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { generarComprobante } from '../utils/facturacion';
import { getYapeEmpresa } from '../data/turnos';
import BoardingPass from './BoardingPass';

export default function PaymentModal({ isOpen, onClose, onPagoCompletado, onIrAMisViajes, selectedSeats, total, turno, origen, destino, pasajeros }) {
  const { agregarBoleto, misBoletos } = useUser();
  const [metodoPago, setMetodoPago] = useState('yape_empresa');
  const [codigoOperacion, setCodigoOperacion] = useState('');
  const [tarjeta, setTarjeta] = useState({ numero: '', titular: '', vencimiento: '', cvv: '' });
  const [error, setError] = useState('');
  const [paso, setPaso] = useState('pago');
  const [codigoReserva, setCodigoReserva] = useState('');
  const [comprobanteGenerado, setComprobanteGenerado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [boletoCreado, setBoletoCreado] = useState(null);
  const yapeEmpresa = getYapeEmpresa();

  if (!isOpen) return null;

  const handleConfirmar = (e) => {
    e.preventDefault();
    setError('');

    if (metodoPago === 'yape_empresa') {
      if (codigoOperacion.length < 4) { setError('El código debe tener al menos 4 dígitos.'); return; }
      const duplicado = misBoletos.find(b => b.codigo === codigoOperacion && b.turno?.id === turno?.id);
      if (duplicado) { setError('Este código ya fue registrado.'); return; }
    }

    if (metodoPago === 'tarjeta') {
      if (tarjeta.numero.replace(/\s/g, '').length < 16) { setError('Número de tarjeta inválido.'); return; }
      if (tarjeta.cvv.length < 3) { setError('CVV inválido.'); return; }
      if (!tarjeta.titular.trim()) { setError('Ingresa el nombre del titular.'); return; }
    }

    let codigoFinal = codigoOperacion;
    if (metodoPago === 'efectivo') {
      codigoFinal = `EF-${Date.now().toString().slice(-6)}`;
      setCodigoReserva(codigoFinal);
    }
    if (metodoPago === 'tarjeta') {
      codigoFinal = `TJ-${Date.now().toString().slice(-6)}`;
    }

    const asientosVendidos = misBoletos.filter(b => b.turno?.id === turno?.id).flatMap(b => b.asientosArray || []);
    const conflicto = selectedSeats.find(s => asientosVendidos.includes(s));
    if (conflicto) { setError(`El asiento ${conflicto} ya fue vendido.`); return; }

    const pasajerosArray = selectedSeats.sort((a,b)=>a-b).map(seat => {
      const p = pasajeros[seat] || {};
      return {
        asiento: seat,
        nombre: p.nombre || '',
        apellidos: p.apellidos || '',
        dni: p.dni || '',
        telefono: p.telefono || '',
        edad: p.edad || '',
        sexo: p.sexo || '',
        nacionalidad: 'Peruana',
      };
    });

    const nuevoBoleto = {
      codigo: codigoFinal,
      metodo: metodoPago === 'yape_empresa' ? 'yape' : metodoPago,
      estadoPago: metodoPago === 'efectivo' ? 'pendiente' : 'pagado',
      asientos: selectedSeats.sort((a,b)=>a-b).map(n=>`N°${n}`).join(', '),
      asientosArray: selectedSeats,
      origen, destino, turno,
      fecha: new Date().toISOString(),
      total,
      nombre: pasajerosArray[0]?.nombre ? `${pasajerosArray[0].nombre} ${pasajerosArray[0].apellidos}` : 'Cliente',
      dni: pasajerosArray[0]?.dni || '',
      pasajeros: pasajerosArray,
    };

    setProcesando(true);
    setTimeout(() => {
      agregarBoleto(nuevoBoleto);
      setBoletoCreado(nuevoBoleto);

      if (metodoPago !== 'efectivo') {
        const comprobante = generarComprobante(nuevoBoleto, 'boleta');
        setComprobanteGenerado(comprobante);
      }

      if (onPagoCompletado) onPagoCompletado();
      setProcesando(false);
      setPaso(metodoPago === 'efectivo' ? 'efectivo' : 'boleto');
    }, 1500);
  };

  const handleTarjetaChange = (e) => {
    let { name, value } = e.target;
    if (name === 'numero') {
      value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
    }
    if (name === 'vencimiento') {
      value = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').slice(0, 5);
    }
    if (name === 'cvv') {
      value = value.replace(/\D/g, '').slice(0, 4);
    }
    setTarjeta(prev => ({ ...prev, [name]: value }));
  };

  const metodos = [
    { id: 'yape_empresa', label: 'Yape Empresa', desc: 'Pago inmediato a Nuevo Patrón S.R.L.', logo: '/yape-logo.png' },
    { id: 'tarjeta', label: 'Tarjeta de crédito/débito', desc: 'Visa, Mastercard, American Express', logo: '/tarjeta-logo.png' },
    { id: 'efectivo', label: 'Efectivo en ventanilla', desc: 'Paga al llegar a la terminal', icon: 'cash' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8 animate-scale-in">
        
        {paso === 'pago' && !procesando && (
          <div className="p-6 md:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-black text-slate-900">Método de pago</h2>
              <p className="text-sm text-slate-500 mt-1">Pagos procesados a nombre de la empresa.</p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 mb-5 border border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Asientos</span>
                <span className="text-xs font-black text-slate-900">{selectedSeats.sort((a,b)=>a-b).map(n=>`N°${n}`).join(', ')}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                <span className="text-2xl font-black text-brand-orange tracking-tighter">S/ {total.toFixed(2)}</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {metodos.map((m) => {
                const isSelected = metodoPago === m.id;
                return (
                  <button key={m.id} onClick={() => setMetodoPago(m.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-300 ${
                      isSelected 
                        ? 'border-brand-orange bg-orange-50 shadow-md scale-[1.02]' 
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden transition-transform ${
                      isSelected ? 'bg-white border border-slate-200 scale-110' : 'bg-slate-100'
                    }`}>
                      {m.logo ? (
                        <img src={m.logo} alt={m.label} className="w-9 h-9 object-contain" />
                      ) : (
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isSelected ? 'bg-brand-orange text-white' : 'bg-slate-200 text-slate-600'}`}>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                        </div>
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-black text-slate-900">{m.label}</p>
                      <p className="text-xs text-slate-500">{m.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-brand-orange flex items-center justify-center animate-pop-in">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleConfirmar}>
              {metodoPago === 'yape_empresa' && (
                <div className="mb-4 animate-fade-in">
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <img src="/yape-logo.png" alt="Yape" className="w-5 h-5 object-contain" />
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider">Yape Negocios</p>
                    </div>
                    <p className="text-xs font-bold text-slate-700">{yapeEmpresa.titular}</p>
                    <p className="text-[10px] text-slate-500 font-mono">RUC: {yapeEmpresa.ruc}</p>
                    <p className="text-sm font-mono font-black text-slate-900 mt-1">{yapeEmpresa.numero}</p>
                  </div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Número de operación Yape</label>
                  <input type="text" value={codigoOperacion} onChange={(e) => setCodigoOperacion(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 482910" maxLength={10} required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono font-black text-slate-900 focus:outline-none focus:border-brand-orange transition-all"/>
                </div>
              )}

              {metodoPago === 'tarjeta' && (
                <div className="mb-4 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <img src="/tarjeta-logo.png" alt="Tarjeta" className="h-8 object-contain" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Número de tarjeta</label>
                    <input type="text" name="numero" value={tarjeta.numero} onChange={handleTarjetaChange} placeholder="1234 5678 9012 3456" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-base font-mono font-black text-slate-900 focus:outline-none focus:border-brand-orange"/>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Titular</label>
                    <input type="text" name="titular" value={tarjeta.titular} onChange={handleTarjetaChange} placeholder="Como aparece en la tarjeta" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-orange"/>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Vencimiento</label>
                      <input type="text" name="vencimiento" value={tarjeta.vencimiento} onChange={handleTarjetaChange} placeholder="MM/AA" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-brand-orange"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CVV</label>
                      <input type="text" name="cvv" value={tarjeta.cvv} onChange={handleTarjetaChange} placeholder="123" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-black text-slate-900 focus:outline-none focus:border-brand-orange"/>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 text-center">Pago procesado por Niubiz a nombre de Nuevo Patrón S.R.L.</p>
                </div>
              )}

              {metodoPago === 'efectivo' && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg animate-fade-in">
                  <p className="text-xs text-orange-700 font-medium">Reservarás tu asiento ahora y pagarás <strong>S/ {total.toFixed(2)}</strong> en ventanilla.</p>
                </div>
              )}

              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-lg mb-4 font-bold">{error}</div>}

              <button type="submit" className="w-full bg-brand-orange hover:bg-orange-700 text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all shadow-lg shadow-brand-orange/30 mb-3 flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                {metodoPago === 'efectivo' ? 'Generar código de reserva' : `Pagar S/ ${total.toFixed(2)}`}
              </button>
              <button type="button" onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all">
                Cancelar
              </button>
            </form>
          </div>
        )}

        {procesando && (
          <div className="p-8 text-center animate-fade-in">
            <div className="w-20 h-20 bg-brand-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-brand-orange animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 mb-1">Procesando pago...</h2>
            <p className="text-sm text-slate-500">Verificando transacción con la pasarela segura.</p>
          </div>
        )}

        {/* PANTALLA DE BOLETO CON COMPONENTE BoardingPass */}
        {paso === 'boleto' && boletoCreado && (
          <div className="p-4 md:p-6">
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
              </div>
              <h2 className="text-xl font-black text-slate-900">¡Pago exitoso!</h2>
              <p className="text-xs text-slate-500 mt-1">Tu boleto está listo</p>
            </div>

            <BoardingPass 
              boleto={boletoCreado}
              pasajeros={pasajeros}
              turno={turno}
              origen={origen}
              destino={destino}
              onClose={onIrAMisViajes}
            />
          </div>
        )}

        {paso === 'efectivo' && (
          <div className="animate-fade-in">
            <div className="bg-slate-900 p-6 text-white text-center">
              <h2 className="text-xl font-black">Reserva generada</h2>
              <p className="text-xs text-white/60 mt-1">Paga en ventanilla con este código</p>
            </div>
            <div className="p-6 md:p-8">
              <div className="bg-orange-50 border-2 border-dashed border-brand-orange rounded-2xl p-6 text-center mb-6">
                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-2">Código de reserva</p>
                <p className="text-4xl font-black text-slate-900 font-mono tracking-tight">{codigoReserva}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 mb-6">
                <p className="text-xs font-bold text-slate-700 mb-2">Instrucciones:</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc list-inside">
                  <li>Preséntate en la ventanilla de la terminal.</li>
                  <li>Menciona tu código de reserva.</li>
                  <li>Paga S/ {total.toFixed(2)} en efectivo.</li>
                </ul>
              </div>
              <button onClick={onIrAMisViajes} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all">
                Ir a mis viajes
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
