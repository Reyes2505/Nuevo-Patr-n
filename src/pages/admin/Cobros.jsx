import { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { useUser } from '../../context/UserContext';

export default function Cobros() {
  const { agregarBoleto, actualizarSolicitud } = useUser();
  const [boletos, setBoletos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [boletoGestion, setBoletoGestion] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const cargar = () => {
      const saved = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      setBoletos(saved);
    };
    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, []);

  const boletosFiltrados = boletos
    .filter(b => {
      if (filtro === 'pendientes') return b.estadoPago === 'pendiente';
      if (filtro === 'pagados') return b.estadoPago === 'pagado';
      if (filtro === 'reembolsados') return b.estadoPago === 'reembolsado';
      return true;
    })
    .filter(b => {
      if (!busqueda) return true;
      const q = busqueda.toLowerCase();
      return (
        b.codigo?.toLowerCase().includes(q) ||
        b.nombre?.toLowerCase().includes(q) ||
        b.dni?.includes(q) ||
        b.asientos?.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const totalPendientes = boletos.filter(b => b.estadoPago === 'pendiente').length;
  const totalPagados = boletos.filter(b => b.estadoPago === 'pagado').length;
  const totalReembolsados = boletos.filter(b => b.estadoPago === 'reembolsado').length;

  const getMetodoBadge = (metodo) => {
    if (metodo === 'yape') return { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Yape' };
    if (metodo === 'tarjeta') return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Tarjeta' };
    return { bg: 'bg-orange-100', text: 'text-brand-orange', label: 'Efectivo' };
  };

  const getEstadoBadge = (estado) => {
    if (estado === 'pagado') return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Pagado' };
    if (estado === 'pendiente') return { bg: 'bg-orange-100', text: 'text-brand-orange', label: 'Pendiente' };
    if (estado === 'reembolsado') return { bg: 'bg-red-100', text: 'text-red-700', label: 'Reembolsado' };
    return { bg: 'bg-slate-100', text: 'text-slate-500', label: estado };
  };

  // ACTUALIZAR ESTADO DEL BOLETO
  const handleCambiarEstado = (nuevoEstado) => {
    if (!boletoGestion) return;

    const saved = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    const actualizados = saved.map(b => {
      if (b.codigo === boletoGestion.codigo) {
        return {
          ...b,
          estadoPago: nuevoEstado,
          fechaConfirmacion: new Date().toISOString(),
        };
      }
      return b;
    });

    localStorage.setItem('misBoletos', JSON.stringify(actualizados));
    setBoletos(actualizados);
    
    // Notificar a otras pestañas
    const channel = new BroadcastChannel('sync-boletos');
    channel.postMessage({});
    channel.close();

    const accion = nuevoEstado === 'pagado' ? 'confirmado' : nuevoEstado === 'reembolsado' ? 'reembolsado' : 'actualizado';
    setMensaje(`Boleto ${boletoGestion.codigo} ${accion} correctamente.`);
    setBoletoGestion(null);
    setTimeout(() => setMensaje(''), 3000);
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Cobros</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona y confirma los pagos de los boletos vendidos.</p>
      </div>

      {mensaje && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-xl mb-4 font-bold animate-fade-slide-up">
          ✓ {mensaje}
        </div>
      )}

      {/* Buscador */}
      <div className="bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
          <input
            type="text"
            placeholder="Buscar por código, nombre, DNI o asiento..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setFiltro('todos')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'todos' ? 'bg-slate-900 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
          Todos ({boletos.length})
        </button>
        <button onClick={() => setFiltro('pendientes')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'pendientes' ? 'bg-orange-500 text-white shadow-md' : 'bg-orange-50 text-brand-orange border border-orange-200 hover:bg-orange-100'}`}>
          Pendientes ({totalPendientes})
        </button>
        <button onClick={() => setFiltro('pagados')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'pagados' ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'}`}>
          Pagados ({totalPagados})
        </button>
        <button onClick={() => setFiltro('reembolsados')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${filtro === 'reembolsados' ? 'bg-red-600 text-white shadow-md' : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'}`}>
          Reembolsados ({totalReembolsados})
        </button>
      </div>

      {/* Lista */}
      {boletosFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-lg font-black text-slate-800">No hay cobros para mostrar</p>
          <p className="text-sm text-slate-500 mt-1">Cambia el filtro o realiza una nueva venta.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {boletosFiltrados.map((boleto) => {
            const metodo = getMetodoBadge(boleto.metodo);
            const estado = getEstadoBadge(boleto.estadoPago);
            const fecha = new Date(boleto.fecha);
            return (
              <div 
                key={boleto.codigo} 
                onClick={() => setBoletoGestion(boleto)}
                className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col md:flex-row md:items-center gap-4 hover:shadow-lg hover:border-brand-orange/40 transition-all cursor-pointer group"
              >
                <div className="flex-shrink-0 w-24 text-center">
                  <p className="text-2xl font-black text-slate-900">{boleto.turno?.hora?.split(' ')[0] || '--:--'}</p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{boleto.turno?.hora?.split(' ')[1] || ''}</p>
                  <p className="text-[10px] font-bold text-slate-500 mt-1">{fecha.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</p>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{boleto.codigo}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${metodo.bg} ${metodo.text}`}>{metodo.label}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${estado.bg} ${estado.text}`}>{estado.label}</span>
                  </div>
                  <p className="font-black text-slate-900 truncate">{boleto.nombre || 'Cliente'}</p>
                  <p className="text-xs text-slate-500">{boleto.origen} → {boleto.destino} · Asientos: <span className="font-black text-brand-orange">{boleto.asientos}</span></p>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div>
                    <p className="text-xl font-black text-slate-900">S/ {boleto.total?.toFixed(2)}</p>
                    <p className="text-[10px] font-bold text-slate-400">DNI: {boleto.dni}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-orange group-hover:text-white transition-all">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"/></svg>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE GESTIÓN */}
      {boletoGestion && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setBoletoGestion(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full my-8 animate-scale-in" onClick={e => e.stopPropagation()}>
            
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex justify-between items-center bg-slate-50 rounded-t-3xl">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gestión de cobro</p>
                <h2 className="text-xl font-black text-slate-900">{boletoGestion.codigo}</h2>
              </div>
              <button onClick={() => setBoletoGestion(null)} className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            {/* Contenido */}
            <div className="p-5 space-y-4">
              
              {/* Estado actual */}
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Estado actual</span>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${getEstadoBadge(boletoGestion.estadoPago).bg} ${getEstadoBadge(boletoGestion.estadoPago).text}`}>
                    {getEstadoBadge(boletoGestion.estadoPago).label}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Monto</span>
                  <span className="text-2xl font-black text-brand-orange">S/ {boletoGestion.total?.toFixed(2)}</span>
                </div>
              </div>

              {/* QR para validar */}
              <div className="flex flex-col items-center bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-2">QR del boleto</p>
                <div className="bg-white p-3 border-2 border-dashed border-slate-300 rounded-xl">
                  <QRCode 
                    value={`${window.location.origin}/validar/${encodeURIComponent(`BOLETO-${boletoGestion.codigo}-${boletoGestion.asientos}-${boletoGestion.turno?.placa}`)}`}
                    size={100} 
                    fgColor="#0F172A"
                  />
                </div>
              </div>

              {/* Datos del pasajero */}
              <div className="bg-white border border-slate-200 rounded-xl p-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Datos del pasajero</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Pasajero</span>
                    <span className="font-black text-slate-900">{boletoGestion.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">DNI</span>
                    <span className="font-mono font-black text-slate-900">{boletoGestion.dni}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ruta</span>
                    <span className="font-black text-slate-900">{boletoGestion.origen} → {boletoGestion.destino}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Asientos</span>
                    <span className="font-black text-brand-orange">{boletoGestion.asientos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Salida</span>
                    <span className="font-black text-slate-900">{boletoGestion.turno?.hora} · {boletoGestion.turno?.placa}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-100">
                    <span className="text-slate-500">Método</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${getMetodoBadge(boletoGestion.metodo).bg} ${getMetodoBadge(boletoGestion.metodo).text}`}>{getMetodoBadge(boletoGestion.metodo).label}</span>
                  </div>
                </div>
              </div>

              {/* ACCIONES */}
              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Acciones disponibles</p>
                
                {boletoGestion.estadoPago === 'pendiente' && (
                  <button
                    onClick={() => handleCambiarEstado('pagado')}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Confirmar pago recibido
                  </button>
                )}

                {boletoGestion.estadoPago === 'pagado' && (
                  <button
                    onClick={() => handleCambiarEstado('reembolsado')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"/></svg>
                    Anular y reembolsar
                  </button>
                )}

                {boletoGestion.estadoPago === 'reembolsado' && (
                  <button
                    onClick={() => handleCambiarEstado('pagado')}
                    className="w-full bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider py-3.5 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Revertir reembolso
                  </button>
                )}

                <button
                  onClick={() => setBoletoGestion(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm py-3 rounded-xl transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
