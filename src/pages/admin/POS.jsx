import { useState, useEffect, useMemo } from 'react';
import { getTurnos } from '../../data/turnos';
import { useUser } from '../../context/UserContext';
import SeatMap from '../../components/SeatMap';
import NotificationCenter from '../../components/NotificationCenter'; 
import TicketCard from '../../components/TicketCard';

export default function POS() {
  const { agregarBoleto } = useUser();
  
  const [terminalActual, setTerminalActual] = useState('San Marcos');
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', dni: '', telefono: '' });
  const [mensaje, setMensaje] = useState('');
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [hoy] = useState(new Date().toISOString().split('T')[0]);

  // --- HISTORIAL PERSISTENTE ---
  // Inicializamos el estado leyendo el localStorage
  const [historialAlerta, setHistorialAlerta] = useState(() => {
    const guardadas = localStorage.getItem('historialAlertaPOS');
    return guardadas ? JSON.parse(guardadas) : [];
  });
  const [alertaExpandida, setAlertaExpandida] = useState(null);

  // Cada vez que el historial cambie, lo guardamos en localStorage
  useEffect(() => {
    localStorage.setItem('historialAlertaPOS', JSON.stringify(historialAlerta));
  }, [historialAlerta]);

  useEffect(() => {
    const handleNuevaAlerta = (e) => {
      const nueva = e.detail;
      // Evitar duplicados
      setHistorialAlerta((prev) => {
        const existe = prev.find(n => n.codigoBoleto === nueva.codigoBoleto && !n.leido);
        if (existe) return prev; 
        return [{ ...nueva, id: Date.now(), leido: false }, ...prev];
      });
    };
    window.addEventListener('nueva-venta-declaracion', handleNuevaAlerta);
    return () => window.removeEventListener('nueva-venta-declaracion', handleNuevaAlerta);
  }, []);

  const marcarComoLeida = (id, codigoBoleto) => {
    setHistorialAlerta(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    
    if (codigoBoleto) {
      const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const index = boletos.findIndex(b => b.codigo === codigoBoleto);
      if (index !== -1) {
        boletos[index].declaracionFirmada = true;
        localStorage.setItem('misBoletos', JSON.stringify(boletos));
        window.dispatchEvent(new Event('declaracion-aprobada'));
      }
    }
  };
  
  const limpiarLeidas = () => {
    setHistorialAlerta(prev => prev.filter(n => !n.leido));
  };

  const alertasNoLeidas = historialAlerta.filter(n => !n.leido).length;

  // --- LÓGICA DEL POS ---
  useEffect(() => {
    const cargar = () => {
      const todos = getTurnos().filter(t => t.dia === 0);
      setTurnos(todos);
    };
    cargar();
  }, []);

  const turnosFiltradosPorTerminal = useMemo(() => {
    return turnos.filter(t => t.origen === terminalActual);
  }, [turnos, terminalActual]);

  useEffect(() => {
    if (turnoSeleccionado) {
      const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const ocupados = boletos
        .filter(b => b.turno?.id === turnoSeleccionado.id && b.estadoPago !== 'reembolsado')
        .flatMap(b => b.asientosArray || []);
      setAsientosOcupados(ocupados);
    }
  }, [turnoSeleccionado]);

  const turnosAgrupados = turnosFiltradosPorTerminal.reduce((acc, t) => {
    const h = parseInt(t.hora.split(':')[0]);
    const esPM = t.hora.includes('PM');
    let h24 = h;
    if (esPM && h !== 12) h24 += 12;
    if (!esPM && h === 12) h24 = 0;
    let bloque = 'Mañana';
    if (h24 >= 12 && h24 < 19) bloque = 'Tarde';
    if (h24 >= 19 || h24 < 5) bloque = 'Noche';
    if (!acc[bloque]) acc[bloque] = [];
    acc[bloque].push(t);
    return acc;
  }, {});

  const handleSeatToggle = (num) => {
    setAsientoSeleccionado(asientoSeleccionado === num ? null : num);
  };

  const handleEmitir = (e) => {
    e.preventDefault();
    if (!turnoSeleccionado) { setMensaje('❌ Selecciona un turno primero.'); return; }
    if (!asientoSeleccionado) { setMensaje('❌ Selecciona un asiento.'); return; }
    if (!formData.nombre || !formData.dni) { setMensaje('❌ Completa nombre y DNI.'); return; }

    const nuevoBoleto = {
      codigo: `POS-${Date.now().toString().slice(-6)}`,
      metodo: 'efectivo',
      estadoPago: 'pagado',
      asientos: `N°${asientoSeleccionado}`,
      asientosArray: [asientoSeleccionado],
      origen: turnoSeleccionado.origen,
      destino: turnoSeleccionado.destino,
      turno: turnoSeleccionado,
      fecha: new Date().toISOString(),
      fechaViaje: hoy,
      total: 10,
      nombre: formData.nombre,
      dni: formData.dni,
      pasajeros: [{ asiento: asientoSeleccionado, nombre: formData.nombre, apellidos: '', dni: formData.dni, edad: '', sexo: '' }],
      declaracionFirmada: false
    };

    agregarBoleto(nuevoBoleto);
    setMensaje(`✓ Boleto ${nuevoBoleto.codigo} emitido (Asiento N°${asientoSeleccionado})`);
    setFormData({ nombre: '', dni: '', telefono: '' });
    setAsientoSeleccionado(null);
    setAsientosOcupados([...asientosOcupados, asientoSeleccionado]);
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Punto de Venta (POS)</h1>
          <p className="text-sm text-slate-500 mt-1">Registra ventas presenciales en la agencia.</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => { setTerminalActual('San Marcos'); setTurnoSeleccionado(null); }} className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${terminalActual === 'San Marcos' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>San Marcos</button>
            <button onClick={() => { setTerminalActual('Cajamarca'); setTurnoSeleccionado(null); }} className={`px-4 py-2 rounded-lg text-sm font-black uppercase tracking-wider transition-all ${terminalActual === 'Cajamarca' ? 'bg-white text-brand-orange shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Cajamarca</button>
          </div>
        </div>
      </div>

      {mensaje && (
        <div className={`text-sm p-3 rounded-xl mb-4 font-bold ${mensaje.includes('✓') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">1. Turnos en {terminalActual}</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {Object.keys(turnosAgrupados).length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 text-center"><p className="text-sm font-bold text-slate-500">No hay turnos disponibles hoy para esta terminal.</p></div>
            ) : (
              ['Mañana', 'Tarde', 'Noche'].map(bloque => {
                const lista = turnosAgrupados[bloque] || [];
                if (lista.length === 0) return null;
                return (
                  <div key={bloque}>
                    <h3 className="text-xs font-black text-slate-700 mb-2 sticky top-0 bg-[#F8F9FA] py-1 z-10">{bloque}</h3>
                    <div className="space-y-2">
                      {lista.map(t => {
                        const ocupados = (JSON.parse(localStorage.getItem('misBoletos') || '[]')).filter(b => b.turno?.id === t.id && b.estadoPago !== 'reembolsado').flatMap(b => b.asientosArray || []);
                        const libres = 15 - ocupados.length;
                        return (
                          <button key={t.id} onClick={() => { setTurnoSeleccionado(t); setAsientoSeleccionado(null); }} className={`w-full text-left p-3 rounded-xl border-2 transition-all ${turnoSeleccionado?.id === t.id ? 'border-brand-orange bg-orange-50 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="text-lg font-black text-slate-900">{t.hora}</p>
                                <p className="text-[10px] text-slate-500 font-bold">{t.conductor} · {t.placa}</p>
                              </div>
                              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${libres > 5 ? 'bg-emerald-100 text-emerald-700' : libres > 0 ? 'bg-orange-100 text-brand-orange' : 'bg-red-100 text-red-700'}`}>{libres} libres</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-5">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">2. Selecciona un asiento</h2>
          {!turnoSeleccionado ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4"><svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg></div>
              <p className="text-sm font-black text-slate-600">Selecciona un turno</p>
              <p className="text-xs text-slate-400 mt-1">El mapa de asientos aparecerá aquí</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mapa del vehículo</p>
                  <p className="text-sm font-black text-slate-900">{turnoSeleccionado.hora} · {turnoSeleccionado.placa}</p>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${asientoSeleccionado ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'}`}>{asientoSeleccionado ? `Asiento N°${asientoSeleccionado}` : 'Sin seleccionar'}</span>
              </div>
              <div className="bg-slate-50 rounded-xl p-2">
                <SeatMap selectedSeats={asientoSeleccionado ? [asientoSeleccionado] : []} onSeatToggle={handleSeatToggle} occupiedSeatsExternos={asientosOcupados} lockedSeats={[]} />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">3. Datos del pasajero</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit sticky top-6">
            <form onSubmit={handleEmitir} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre completo</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} placeholder="Ej. Juan Pérez" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNI</label>
                <input type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})} maxLength={8} placeholder="12345678" required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono (opcional)</label>
                <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)})} placeholder="999 999 999" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"/>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Asiento seleccionado</p>
                {asientoSeleccionado ? <p className="text-2xl font-black text-brand-orange">N° {asientoSeleccionado}</p> : <p className="text-sm font-bold text-slate-400 italic">Ninguno</p>}
              </div>
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                  <span className="text-2xl font-black text-brand-orange">S/ 10.00</span>
                </div>
                <button type="submit" disabled={!turnoSeleccionado || !asientoSeleccionado || !formData.nombre || !formData.dni} className={`w-full font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-all ${turnoSeleccionado && asientoSeleccionado && formData.nombre && formData.dni ? 'bg-[#18191B] hover:bg-black text-white shadow-lg active:scale-95' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  Emitir boleto
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Bandeja de Alertas (Declaraciones Juradas)</h2>
              <p className="text-xs text-slate-500 font-medium">Ventas web que requieren revisión física.</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            {alertasNoLeidas > 0 && (
              <span className="bg-red-100 text-red-700 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                {alertasNoLeidas} Pendientes
              </span>
            )}
            <button onClick={limpiarLeidas} className="text-xs font-bold text-slate-500 hover:text-slate-800 bg-white px-3 py-1.5 rounded-lg border border-slate-200">Limpiar atendidas</button>
          </div>
        </div>

        <div className="p-4">
          {historialAlerta.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm font-bold text-slate-400">No hay alertas de Declaración Jurada por ahora.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {historialAlerta.map((alerta) => (
                <div key={alerta.id} className={`p-4 rounded-xl border-2 transition-all ${alerta.leido ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-amber-50 border-amber-300 shadow-sm'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] font-black">{alerta.asiento}</span>
                      <p className="text-sm font-black text-slate-900">{alerta.pasajero}</p>
                    </div>
                    {alerta.leido ? (
                      <span className="text-[9px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">Atendido</span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-200 px-2 py-0.5 rounded animate-pulse">Pendiente</span>
                    )}
                  </div>
                  
                  <p className="text-xs text-slate-600 mb-2">DNI: {alerta.dni}</p>
                  
                  {alerta.solicitaImpresion && (
                    <div className="mb-2 bg-emerald-100 text-emerald-800 text-[10px] font-black p-1.5 rounded flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                      Solicitó Impresión (+S/ 0.50)
                    </div>
                  )}

                  <div className="flex gap-2 mt-3">
                    <button 
                      onClick={() => setAlertaExpandida(alerta)}
                      className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold text-xs py-2 rounded-lg transition-colors"
                    >
                      Ver más info
                    </button>
                    {!alerta.leido && (
                      <button 
                        onClick={() => marcarComoLeida(alerta.id, alerta.codigoBoleto)}
                        className="flex-1 bg-[#18191B] text-white hover:bg-black font-bold text-xs py-2 rounded-lg transition-colors"
                      >
                        Atender
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {alertaExpandida && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-card-enter relative">
            <button onClick={() => setAlertaExpandida(null)} className="absolute top-2 right-2 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center z-10">✕</button>
            
            <div className="p-4 bg-slate-100 flex justify-center">
               <TicketCard 
                 boleto={{
                   codigo: alertaExpandida.codigoBoleto || 'WEB',
                   origen: terminalActual,
                   destino: terminalActual === 'San Marcos' ? 'Cajamarca' : 'San Marcos',
                   nombre: alertaExpandida.pasajero,
                   dni: alertaExpandida.dni,
                   asientos: `N°${alertaExpandida.asiento}`,
                   turno: { placa: alertaExpandida.placa || 'M5S-188', hora: alertaExpandida.hora || '--:--' },
                   total: alertaExpandida.solicitaImpresion ? 10.50 : 10.00,
                   estadoPago: 'pagado',
                   metodo: 'web'
                 }}
                 turno={{ placa: alertaExpandida.placa || 'M5S-188', hora: alertaExpandida.hora || '--:--' }}
               />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <button 
                onClick={() => {
                  marcarComoLeida(alertaExpandida.id, alertaExpandida.codigoBoleto);
                  setAlertaExpandida(null);
                }} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-colors shadow-md"
              >
                Ya revisé el documento físico
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationCenter />
    </div>
  );
}
