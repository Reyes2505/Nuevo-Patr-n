import { useState, useMemo } from 'react';
import TicketModal from '../components/TicketModal';
import { getTurnos, getFechas7Dias } from '../data/turnos';
// import SeatMap from '../components/SeatMap'; // Lo comentamos por si rompe la app

export default function POS() {
  const [terminalActual, setTerminalActual] = useState('San Marcos');
  const fechas = useMemo(() => getFechas7Dias(), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(fechas[0]);
  
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [asientoSeleccionado, setAsientoSeleccionado] = useState(null);
  
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  
  const [boletoCodigo, setBoletoCodigo] = useState('');
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  const todosLosTurnos = useMemo(() => getTurnos(), []);

  const turnosMostrados = useMemo(() => {
    return todosLosTurnos.filter(t => 
      t.origen === terminalActual && 
      t.fecha === fechaSeleccionada.fecha
    ).sort((a, b) => a.horaNumerica - b.horaNumerica);
  }, [todosLosTurnos, terminalActual, fechaSeleccionada]);

  const calcularTotal = () => 10.00;

  const handleVenta = (e) => {
    e.preventDefault();
    if (!turnoSeleccionado || !nombre || !telefono || !asientoSeleccionado) return;
    const codigo = `NP-${Date.now().toString().slice(-6)}`;
    setBoletoCodigo(codigo);
    setIsTicketOpen(true);
  };

  return (
    <div className="p-6">
      {/* PRUEBA VISUAL */}
      <div className="bg-red-500 text-white p-4 mb-6 rounded-lg font-bold text-xl shadow-lg">
        🚨 PRUEBA DE ACTUALIZACIÓN: Si ves este mensaje rojo, el archivo está conectado correctamente.
      </div>

      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900">Punto de Venta (POS)</h1>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-6 rounded-xl shadow-md border-2 border-blue-500 mb-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-500 mb-2">1. SELECCIONA TERMINAL</p>
          <div className="flex gap-2">
            <button 
              onClick={() => setTerminalActual('San Marcos')}
              className={`px-8 py-3 rounded-lg font-bold text-lg w-full ${terminalActual === 'San Marcos' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              San Marcos
            </button>
            <button 
              onClick={() => setTerminalActual('Cajamarca')}
              className={`px-8 py-3 rounded-lg font-bold text-lg w-full ${terminalActual === 'Cajamarca' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              Cajamarca
            </button>
          </div>
        </div>

        <div className="flex-1">
          <p className="text-sm font-bold text-slate-500 mb-2">2. SELECCIONA FECHA</p>
          <select 
            value={fechaSeleccionada.fecha}
            onChange={(e) => setFechaSeleccionada(fechas.find(f => f.fecha === e.target.value))}
            className="w-full bg-slate-50 border-2 border-slate-300 text-slate-800 font-bold text-lg rounded-lg px-4 py-3"
          >
            {fechas.map(f => (
              <option key={f.fecha} value={f.fecha}>{f.label} {f.dia} de {f.mes}</option>
            ))}
          </select>
        </div>
      </div>

      {/* COLUMNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COL 1 */}
        <div>
          <h2 className="text-sm font-black text-slate-800 mb-3 uppercase">Turnos Encontrados ({turnosMostrados.length})</h2>
          <div className="space-y-3">
            {turnosMostrados.map(turno => (
              <div 
                key={turno.id}
                onClick={() => setTurnoSeleccionado(turno)}
                className={`p-4 border-2 rounded-xl cursor-pointer ${turnoSeleccionado?.id === turno.id ? 'border-blue-600 bg-blue-50' : 'border-slate-200 bg-white'}`}
              >
                <span className="block text-lg font-black text-slate-900">{turno.hora}</span>
                <span className="block text-xs text-slate-500">{turno.conductor} · {turno.placa}</span>
              </div>
            ))}
          </div>
        </div>

        {/* COL 2 */}
        <div>
          <h2 className="text-sm font-black text-slate-800 mb-3 uppercase">Mapa (Temporalmente desactivado)</h2>
          <div className="bg-white border border-slate-200 rounded-xl p-4 min-h-[400px] flex items-center justify-center">
            <p className="text-slate-400">El mapa se mostrará aquí.</p>
          </div>
        </div>

        {/* COL 3 */}
        <div>
          <h2 className="text-sm font-black text-slate-800 mb-3 uppercase">Datos del Pasajero</h2>
          <form onSubmit={handleVenta} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <input type="text" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Nombre" required className="w-full mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3" />
            <input type="text" value={dni} onChange={e => setDni(e.target.value)} placeholder="DNI" className="w-full mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3" />
            <input type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono" required className="w-full mb-3 bg-slate-50 border border-slate-200 rounded-lg p-3" />
            
            <div className="bg-slate-100 rounded-lg p-3 mb-4 text-lg font-black text-blue-600">
              Asiento: {asientoSeleccionado ? `N° ${asientoSeleccionado}` : 'Ninguno'}
            </div>

            <button type="submit" className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">
              Emitir Boleto
            </button>
          </form>
        </div>

      </div>

      <TicketModal 
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        turno={turnoSeleccionado || {}}
        origen={turnoSeleccionado?.origen || ''}
        destino={turnoSeleccionado?.destino || ''}
        nombre={nombre}
        dni={dni}
        telefono={telefono}
        asiento={asientoSeleccionado}
        metodoPago={metodoPago}
        total={calcularTotal()}
        boletoCodigo={boletoCodigo}
        terminal={terminalActual}
      />
    </div>
  );
}