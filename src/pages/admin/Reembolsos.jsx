import { useState } from 'react';
import { useUser } from '../../context/UserContext';

export default function Reembolsos() {
  const { solicitudesReembolso, actualizarSolicitud } = useUser();
  const [filtro, setFiltro] = useState('pendiente');
  const [modalInfo, setModalInfo] = useState(null);

  const getEstadoColor = (estado) => {
    if (estado === 'aprobado') return 'bg-emerald-100 text-emerald-700';
    if (estado === 'rechazado') return 'bg-red-100 text-red-700';
    return 'bg-orange-100 text-brand-orange';
  };

  const solicitudesFiltradas = (solicitudesReembolso || []).filter(s => {
    if (filtro === 'todas') return true;
    return s.estado === filtro;
  });

  const handleReevaluar = (id, nuevoEstado) => {
    if (confirm(`¿Estás seguro de ${nuevoEstado === 'aprobado' ? 'aprobar' : 'rechazar'} este reembolso?`)) {
      actualizarSolicitud(id, nuevoEstado);
      setModalInfo(null);
    }
  };

  const tabs = [
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'aprobado', label: 'Aprobados' },
    { key: 'rechazado', label: 'Rechazados' },
    { key: 'todas', label: 'Todas' },
  ];

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Reembolsos</h1>
        <p className="text-sm text-slate-500 mt-1">Gestiona las solicitudes de devolución de boletos.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const count = tab.key === 'todas' ? solicitudesReembolso.length : solicitudesReembolso.filter(s => s.estado === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFiltro(tab.key)}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                filtro === tab.key ? 'bg-[#18191B] text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {solicitudesFiltradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <p className="text-lg font-black text-slate-800">No hay solicitudes en esta categoría</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudesFiltradas.map(sol => (
            <div key={sol.id} className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-[10px] font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{sol.id}</span>
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getEstadoColor(sol.estado)}`}>{sol.estado}</span>
                  </div>
                  <h3 className="font-black text-slate-900">Boleto {sol.boletoCodigo}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {sol.boletoData?.origen} → {sol.boletoData?.destino} · {sol.boletoData?.turno?.hora}
                  </p>
                  <div className="mt-3 bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Motivo</p>
                    <p className="text-xs text-slate-600 italic">"{sol.motivo}"</p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Monto solicitado</p>
                  <p className="text-2xl font-black text-slate-900">S/ {sol.monto?.toFixed(2)}</p>
                  <button
                    onClick={() => setModalInfo(sol)}
                    className="mt-2 text-[10px] font-black text-brand-orange uppercase tracking-wider hover:underline"
                  >
                    Ver más información →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de más info */}
      {modalInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60" onClick={() => setModalInfo(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Detalle de solicitud</p>
                <h2 className="text-xl font-black text-slate-900">{modalInfo.id}</h2>
              </div>
              <button onClick={() => setModalInfo(null)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">✕</button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Boleto</p>
                <p className="font-mono font-black text-slate-900">{modalInfo.boletoCodigo}</p>
                <p className="text-xs text-slate-600 mt-1">{modalInfo.boletoData?.nombre} · DNI {modalInfo.boletoData?.dni}</p>
                <p className="text-xs text-slate-500">{modalInfo.boletoData?.origen} → {modalInfo.boletoData?.destino} · {modalInfo.boletoData?.turno?.hora}</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4">
                <p className="text-[10px] font-black text-brand-orange uppercase mb-1">Motivo</p>
                <p className="text-sm text-slate-700 italic">"{modalInfo.motivo}"</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Monto</p>
                  <p className="text-lg font-black text-slate-900">S/ {modalInfo.monto?.toFixed(2)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase">Estado actual</p>
                  <p className={`text-xs font-black uppercase mt-1 px-2 py-0.5 rounded inline-block ${getEstadoColor(modalInfo.estado)}`}>{modalInfo.estado}</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {modalInfo.estado !== 'aprobado' && (
                <button onClick={() => handleReevaluar(modalInfo.id, 'aprobado')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-colors">
                  Aprobar reembolso
                </button>
              )}
              {modalInfo.estado !== 'rechazado' && (
                <button onClick={() => handleReevaluar(modalInfo.id, 'rechazado')} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl transition-colors">
                  Rechazar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
