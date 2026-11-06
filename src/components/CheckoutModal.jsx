import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import { useUser } from '../context/UserContext';
import { getYapeEmpresa } from '../data/turnos';

export default function CheckoutModal({ isOpen, onClose, onPagoCompletado, selectedSeats, total, turno, origen, destino, pasajeros }) {
  const { agregarBoleto, misBoletos } = useUser();
  const navigate = useNavigate();
  const [step, setStep] = useState('form');
  const [metodoPago, setMetodoPago] = useState('yape_empresa');
  const [codigoOperacion, setCodigoOperacion] = useState('');
  const [tarjeta, setTarjeta] = useState({ numero: '', titular: '', vencimiento: '', cvv: '' });
  const [error, setError] = useState('');
  const [boletoCreado, setBoletoCreado] = useState(null);
  const yapeEmpresa = getYapeEmpresa();

  if (!isOpen) return null;

  const validarPasajeros = () => {
    for (const seat of selectedSeats) {
      const p = pasajeros[seat] || {};
      if (!p.nombre?.trim()) return `Falta el nombre del pasajero en el asiento N°${seat}.`;
      if (!p.apellidos?.trim()) return `Faltan los apellidos del pasajero en el asiento N°${seat}.`;
      if (!p.dni || p.dni.length !== 8) return `El DNI del asiento N°${seat} debe tener 8 dígitos.`;
      if (!p.edad) return `Falta la edad del pasajero en el asiento N°${seat}.`;
      if (!p.sexo) return `Falta el sexo del pasajero en el asiento N°${seat}.`;
    }
    return null;
  };

  const handlePagar = (e) => {
    e.preventDefault();
    setError('');

    const errorPasajeros = validarPasajeros();
    if (errorPasajeros) { setError(errorPasajeros); return; }

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
    if (metodoPago === 'efectivo') codigoFinal = `EF-${Date.now().toString().slice(-6)}`;
    if (metodoPago === 'tarjeta') codigoFinal = `TJ-${Date.now().toString().slice(-6)}`;

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

    // Calcular fecha del viaje
    const hoy = new Date();
    const fechaViajeObj = new Date(hoy);
    if (turno.dia !== undefined) {
      fechaViajeObj.setDate(fechaViajeObj.getDate() + turno.dia);
    }
    const fechaViaje = fechaViajeObj.toISOString().split('T')[0];

    const nuevoBoleto = {
      codigo: codigoFinal,
      metodo: metodoPago === 'yape_empresa' ? 'yape' : metodoPago,
      estadoPago: metodoPago === 'efectivo' ? 'pendiente' : 'pagado',
      asientos: selectedSeats.sort((a,b)=>a-b).map(n=>`N°${n}`).join(', '),
      asientosArray: selectedSeats,
      origen, destino, turno,
      fecha: new Date().toISOString(),
      fechaViaje,
      total,
      nombre: `${pasajerosArray[0].nombre} ${pasajerosArray[0].apellidos}`,
      dni: pasajerosArray[0].dni,
      pasajeros: pasajerosArray,
    };

    setStep('processing');
    
    setTimeout(() => {
      agregarBoleto(nuevoBoleto);
      setBoletoCreado(nuevoBoleto);
      
      if (metodoPago !== 'efectivo') {
        setStep('printing');
        setTimeout(() => {
          setStep('success');
          if (onPagoCompletado) onPagoCompletado();
        }, 1800);
      } else {
        setStep('success');
        if (onPagoCompletado) onPagoCompletado();
      }
    }, 2000);
  };

  const handleTarjetaChange = (e) => {
    let { name, value } = e.target;
    if (name === 'numero') value = value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
    if (name === 'vencimiento') value = value.replace(/\D/g, '').replace(/(\d{2})(?=\d)/, '$1/').slice(0, 5);
    if (name === 'cvv') value = value.replace(/\D/g, '').slice(0, 4);
    setTarjeta(prev => ({ ...prev, [name]: value }));
  };

  const irAMisViajes = () => {
    onClose();
    navigate('/mis-viajes');
  };

  const metodos = [
    { id: 'yape_empresa', label: 'Yape Empresa', desc: 'Pago inmediato', logo: '/yape-logo.png' },
    { id: 'tarjeta', label: 'Tarjeta', desc: 'Visa, Mastercard', logo: '/tarjeta-logo.png' },
    { id: 'efectivo', label: 'Efectivo', desc: 'Paga en ventanilla', icon: 'cash' }
  ];

  const qrValue = boletoCreado 
    ? `${window.location.origin}/validar/${encodeURIComponent(`BOLETO-${boletoCreado.codigo}-${boletoCreado.asientos}-${turno?.placa}`)}`
    : '';

  const fechaViajeFormateada = boletoCreado?.fechaViaje
    ? new Date(boletoCreado.fechaViaje + 'T00:00:00').toLocaleDateString('es-ES', { 
        weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' 
      })
    : '';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden my-8 relative"
      >
        <AnimatePresence mode="wait">
          
          {/* PASO 1: FORMULARIO */}
          {step === 'form' && (
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="p-6">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Finaliza tu compra</h2>
                <p className="text-sm text-slate-500 mt-1">Pago seguro a nombre de Nuevo Patrón.</p>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 mb-5 border border-slate-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Asientos</span>
                  <span className="text-xs font-black text-slate-900">{selectedSeats.sort((a,b)=>a-b).map(n=>`N°${n}`).join(', ')}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-brand-orange tracking-tighter">S/ {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 mb-5">
                {metodos.map((m) => {
                  const isSelected = metodoPago === m.id;
                  return (
                    <button key={m.id} onClick={() => setMetodoPago(m.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 ${
                        isSelected ? 'border-brand-orange bg-orange-50 shadow-md scale-[1.02]' : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}>
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden ${isSelected ? 'bg-white border border-slate-200' : 'bg-slate-100'}`}>
                        {m.logo ? <img src={m.logo} alt={m.label} className="w-6 h-6 object-contain" /> : 
                          <svg className={`w-4 h-4 ${isSelected ? 'text-brand-orange' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z"/></svg>
                        }
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-black text-xs text-slate-900">{m.label}</p>
                        <p className="text-[10px] text-slate-500">{m.desc}</p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-brand-orange flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <form onSubmit={handlePagar}>
                {metodoPago === 'yape_empresa' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 overflow-hidden">
                    <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-3">
                      <p className="text-[10px] font-black text-purple-700 uppercase tracking-wider mb-1">Yape Negocios</p>
                      <p className="text-[10px] text-slate-600">RUC: {yapeEmpresa.ruc}</p>
                      <p className="text-xs font-mono font-black text-slate-900">{yapeEmpresa.numero}</p>
                    </div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Número de operación</label>
                    <input type="text" value={codigoOperacion} onChange={(e) => setCodigoOperacion(e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 482910" maxLength={10} required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-center text-lg font-mono font-black text-slate-900 focus:outline-none focus:border-brand-orange"/>
                  </motion.div>
                )}

                {metodoPago === 'tarjeta' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 space-y-2 overflow-hidden">
                    <input type="text" name="numero" value={tarjeta.numero} onChange={handleTarjetaChange} placeholder="Número de tarjeta" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-black focus:outline-none focus:border-brand-orange"/>
                    <input type="text" name="titular" value={tarjeta.titular} onChange={handleTarjetaChange} placeholder="Titular" required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                    <div className="grid grid-cols-2 gap-2">
                      <input type="text" name="vencimiento" value={tarjeta.vencimiento} onChange={handleTarjetaChange} placeholder="MM/AA" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-black focus:outline-none focus:border-brand-orange"/>
                      <input type="text" name="cvv" value={tarjeta.cvv} onChange={handleTarjetaChange} placeholder="CVV" required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-black focus:outline-none focus:border-brand-orange"/>
                    </div>
                  </motion.div>
                )}

                {metodoPago === 'efectivo' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-xl overflow-hidden">
                    <p className="text-xs text-orange-700 font-medium">Reservarás tu asiento y pagarás <strong>S/ {total.toFixed(2)}</strong> en ventanilla.</p>
                  </motion.div>
                )}

                {error && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 font-bold">
                    {error}
                  </motion.div>
                )}

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" 
                  className="w-full bg-gradient-to-r from-brand-orange to-orange-600 text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl shadow-lg shadow-brand-orange/30 mb-2 flex items-center justify-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                  {metodoPago === 'efectivo' ? 'Generar reserva' : `Pagar S/ ${total.toFixed(2)}`}
                </motion.button>
                <button type="button" onClick={onClose} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all">
                  Cancelar
                </button>
              </form>
            </motion.div>
          )}

          {/* PASO 2: PROCESANDO */}
          {step === 'processing' && (
            <motion.div key="processing" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="p-12 text-center">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border-4 border-slate-100 border-t-brand-orange rounded-full"/>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
                </div>
              </div>
              <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="text-xl font-black text-slate-900 mb-1">Procesando pago seguro...</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="text-sm text-slate-500">Verificando transacción con la pasarela.</motion.p>
            </motion.div>
          )}

          {/* PASO 3: IMPRIMIENDO */}
          {step === 'printing' && (
            <motion.div key="printing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-8 text-center overflow-hidden relative">
              <div className="w-full h-2 bg-slate-900 rounded-full mb-4 shadow-inner relative z-10"></div>
              <motion.div initial={{ y: -300, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xl text-left max-w-xs mx-auto relative">
                <div className="flex justify-between items-center border-b border-dashed border-slate-300 pb-2 mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Nuevo Patrón</span>
                  <span className="text-[10px] font-mono font-black text-brand-orange">{boletoCreado?.codigo}</span>
                </div>
                <p className="text-sm font-black text-slate-900">{origen} → {destino}</p>
                <p className="text-xs text-slate-500">{turno?.hora} · {turno?.placa}</p>
                <div className="w-full h-8 mt-3 bg-[repeating-linear-gradient(90deg,#000_0px,#000_2px,#fff_2px,#fff_4px)] opacity-80 rounded-sm"></div>
              </motion.div>
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-6 animate-pulse">Imprimiendo boleto...</p>
            </motion.div>
          )}

          {/* PASO 4: ÉXITO CON BOLETO PREMIUM */}
          {step === 'success' && boletoCreado && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} className="p-6">
              <div className="text-center mb-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  <motion.svg initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                  </motion.svg>
                </motion.div>
                <h2 className="text-2xl font-black text-slate-900">¡Pago exitoso!</h2>
              </div>

              {/* BOLETO PREMIUM */}
              <div className="bg-[#18191B] rounded-2xl overflow-hidden shadow-2xl mb-4">
                {/* Header del boleto */}
                <div className="p-4 flex justify-between items-center border-b border-white/10">
                  <div>
                    <p className="text-[9px] font-black text-brand-orange uppercase tracking-widest">Nuevo Patrón</p>
                    <p className="text-[8px] font-mono text-white/50">RUC 20615321151</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Código</p>
                    <p className="text-xs font-mono font-black text-brand-orange">{boletoCreado.codigo}</p>
                  </div>
                </div>

                <div className="p-5 bg-white">
                  {/* FECHA DEL VIAJE - DESTACADA */}
                  <div className="bg-gradient-to-r from-brand-orange to-orange-600 rounded-xl p-3 mb-4 text-center">
                    <p className="text-[9px] font-black text-white/80 uppercase tracking-widest mb-1">Fecha del viaje</p>
                    <p className="text-sm font-black text-white capitalize">{fechaViajeFormateada}</p>
                  </div>

                  {/* RUTA */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-slate-300">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
                      <p className="text-lg font-black text-slate-900">{origen}</p>
                    </div>
                    <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                    <div className="text-right">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
                      <p className="text-lg font-black text-slate-900">{destino}</p>
                    </div>
                  </div>

                  {/* HORA DE SALIDA - DESTACADA */}
                  <div className="bg-slate-50 rounded-xl p-3 mb-4 text-center border border-slate-200">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hora de salida</p>
                    <p className="text-2xl font-black text-slate-900">{turno?.hora}</p>
                  </div>

                  {/* QR CODE */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-white p-3 border-2 border-dashed border-slate-300 rounded-xl">
                      <QRCode value={qrValue} size={120} fgColor="#0F172A" />
                    </div>
                  </div>

                  {/* INFO PRIMORDIAL */}
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Pasajero</span>
                      <span className="text-xs font-black text-slate-900 text-right truncate max-w-[200px]">{boletoCreado.nombre}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">DNI</span>
                      <span className="text-xs font-mono font-black text-slate-900">{boletoCreado.dni}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Asientos</span>
                      <span className="text-sm font-black text-brand-orange">{boletoCreado.asientos}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Placa</span>
                      <span className="text-xs font-mono font-black text-slate-900">{turno?.placa}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                      <span className="text-sm font-black text-slate-900">S/ {total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Código de barras simulado */}
                  <div className="w-full h-10 bg-[repeating-linear-gradient(90deg,#0F172A_0px,#0F172A_2px,#fff_2px,#fff_4px)] opacity-80 rounded-sm mb-3"></div>
                  
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-center">
                    <p className="text-[9px] font-black text-brand-orange uppercase">Presenta este QR al abordar · Válido solo el día del viaje</p>
                  </div>
                </div>

                <div className="py-2 text-center bg-[#18191B]">
                  <p className="text-[8px] font-mono text-white/50 uppercase tracking-widest">Boleto digital · Válido solo para la fecha indicada</p>
                </div>
              </div>

              <button onClick={irAMisViajes} className="w-full bg-[#18191B] hover:bg-black text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-95">
                Ir a mis viajes
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
