import { useState, useEffect } from 'react';
import { getTurnos } from '../../data/turnos';
import { useUser } from '../../context/UserContext';
import SeatMap from '../../components/SeatMap';

export default function POS() {
  const { agregarBoleto } = useUser();
  const [turnos, setTurnos] = useState([]);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', dni: '', telefono: '' });
  const [mensaje, setMensaje] = useState('');
  const [asientosOcupados, setAsientosOcupados] = useState([]);
  const [hoy] = useState(new Date().toISOString().split('T')[0]);

  // Cargar turnos del día
  useEffect(() => {
    const cargar = () => {
      const todos = getTurnos().filter(t => t.dia === 0);
      setTurnos(todos);
    };
    cargar();
  }, []);

  // Cargar asientos ocupados del turno seleccionado
  useEffect(() => {
    if (turnoSeleccionado) {
      const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const ocupados = boletos
        .filter(b => b.turno?.id === turnoSeleccionado.id && b.estadoPago !== 'reembolsado')
        .flatMap(b => b.asientosArray || []);
      setAsientosOcupados(ocupados);
    }
  }, [turnoSeleccionado]);

  // Agrupar por bloques horarios
  const turnosAgrupados = turnos.reduce((acc, t) => {
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
      pasajeros: [{ 
        asiento: asientoSeleccionado, 
        nombre: formData.nombre, 
        apellidos: '', 
        dni: formData.dni, 
        edad: '', 
        sexo: '' 
      }],
    };

    agregarBoleto(nuevoBoleto);
    setMensaje(`✓ Boleto ${nuevoBoleto.codigo} emitido (Asiento N°${asientoSeleccionado})`);
    setFormData({ nombre: '', dni: '', telefono: '' });
    setAsientoSeleccionado(null);
    
    // Actualizar asientos ocupados
    setAsientosOcupados([...asientosOcupados, asientoSeleccionado]);
    
    setTimeout(() => setMensaje(''), 4000);
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Punto de Venta (POS)</h1>
        <p className="text-sm text-slate-500 mt-1">Registra ventas presenciales en la agencia.</p>
      </div>

      {mensaje && (
        <div className={`text-sm p-3 rounded-xl mb-4 font-bold ${
          mensaje.includes('✓') ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: Turnos */}
        <div className="lg:col-span-4">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">1. Selecciona un turno</h2>
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
            {['Mañana', 'Tarde', 'Noche'].map(bloque => {
              const lista = turnosAgrupados[bloque] || [];
              if (lista.length === 0) return null;
              return (
                <div key={bloque}>
                  <h3 className="text-xs font-black text-slate-700 mb-2 sticky top-0 bg-white py-1">{bloque}</h3>
                  <div className="space-y-2">
                    {lista.map(t => {
                      const ocupados = (JSON.parse(localStorage.getItem('misBoletos') || '[]'))
                        .filter(b => b.turno?.id === t.id && b.estadoPago !== 'reembolsado')
                        .flatMap(b => b.asientosArray || []);
                      const libres = 15 - ocupados.length;
                      
                      return (
                        <button
                          key={t.id}
                          onClick={() => { setTurnoSeleccionado(t); setAsientoSeleccionado(null); }}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            turnoSeleccionado?.id === t.id
                              ? 'border-brand-orange bg-orange-50 shadow-md'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-lg font-black text-slate-900">{t.hora}</p>
                              <p className="text-[10px] text-slate-500 font-bold">{t.conductor} · {t.placa}</p>
                            </div>
                            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${
                              libres > 5 ? 'bg-emerald-100 text-emerald-700' : 
                              libres > 0 ? 'bg-orange-100 text-brand-orange' : 'bg-red-100 text-red-700'
                            }`}>{libres} libres</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA CENTRAL: Mapa de asientos */}
        <div className="lg:col-span-5">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">2. Selecciona un asiento</h2>
          {!turnoSeleccionado ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center h-[400px] flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/></svg>
              </div>
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
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                  asientoSeleccionado ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  {asientoSeleccionado ? `Asiento N°${asientoSeleccionado}` : 'Sin seleccionar'}
                </span>
              </div>

              <div className="bg-slate-50 rounded-xl p-2">
                <SeatMap 
                  selectedSeats={asientoSeleccionado ? [asientoSeleccionado] : []}
                  onSeatToggle={handleSeatToggle}
                  occupiedSeatsExternos={asientosOcupados}
                  lockedSeats={[]}
                />
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-4 mt-4 text-[9px] font-bold text-slate-500 uppercase tracking-wider flex-wrap">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-white border border-slate-300 rounded"></div> Libre
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-brand-orange rounded"></div> Seleccionado
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 bg-slate-200 rounded"></div> Vendido
                </div>
              </div>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Formulario */}
        <div className="lg:col-span-3">
          <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">3. Datos del pasajero</h2>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm h-fit sticky top-6">
            <form onSubmit={handleEmitir} className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nombre completo</label>
                <input 
                  type="text" 
                  value={formData.nombre} 
                  onChange={(e) => setFormData({...formData, nombre: e.target.value})} 
                  placeholder="Ej. Juan Pérez" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">DNI</label>
                <input 
                  type="text" 
                  value={formData.dni} 
                  onChange={(e) => setFormData({...formData, dni: e.target.value.replace(/\D/g, '').slice(0, 8)})} 
                  maxLength={8} 
                  placeholder="12345678" 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono font-bold focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Teléfono (opcional)</label>
                <input 
                  type="tel" 
                  value={formData.telefono} 
                  onChange={(e) => setFormData({...formData, telefono: e.target.value.replace(/\D/g, '').slice(0, 9)})} 
                  placeholder="999 999 999" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
                />
              </div>

              {/* Asiento seleccionado */}
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Asiento seleccionado</p>
                {asientoSeleccionado ? (
                  <p className="text-2xl font-black text-brand-orange">N° {asientoSeleccionado}</p>
                ) : (
                  <p className="text-sm font-bold text-slate-400 italic">Ninguno</p>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total</span>
                  <span className="text-2xl font-black text-brand-orange">S/ 10.00</span>
                </div>
                <button 
                  type="submit" 
                  disabled={!turnoSeleccionado || !asientoSeleccionado || !formData.nombre || !formData.dni}
                  className={`w-full font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-all ${
                    turnoSeleccionado && asientoSeleccionado && formData.nombre && formData.dni
                      ? 'bg-[#18191B] hover:bg-black text-white shadow-lg active:scale-95'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Emitir boleto
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
