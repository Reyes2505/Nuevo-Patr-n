import { useState, useEffect, useMemo } from 'react';

const COMISION_TASA = 0.0295;

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export default function Dashboard() {
  const [misBoletos, setMisBoletos] = useState([]);
  const [ahora, setAhora] = useState(new Date());
  const [periodo, setPeriodo] = useState('hoy');

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    setMisBoletos(saved);

    const handleStorage = (e) => {
      if (e.key === 'misBoletos') {
        setMisBoletos(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorage);

    const interval = setInterval(() => setAhora(new Date()), 60000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const datos = useMemo(() => {
    const hoyStr = ahora.toISOString().split('T')[0];
    const boletosPagados = misBoletos.filter(b => b.estadoPago === 'pagado');

    // Filtrar por período
    let boletosFiltrados = [];
    if (periodo === 'hoy') {
      boletosFiltrados = boletosPagados.filter(b => {
        const fecha = b.fecha || b.fechaViaje;
        return fecha && fecha.split('T')[0] === hoyStr;
      });
    } else if (periodo === 'semana') {
      const hace7Dias = new Date(ahora);
      hace7Dias.setDate(hace7Dias.getDate() - 7);
      boletosFiltrados = boletosPagados.filter(b => {
        const fecha = new Date(b.fecha || b.fechaViaje);
        return fecha >= hace7Dias;
      });
    } else if (periodo === 'mes') {
      const mesActual = ahora.getMonth();
      const añoActual = ahora.getFullYear();
      boletosFiltrados = boletosPagados.filter(b => {
        const fecha = new Date(b.fecha || b.fechaViaje);
        return fecha.getMonth() === mesActual && fecha.getFullYear() === añoActual;
      });
    }

    const totalVentas = boletosFiltrados.reduce((s, b) => s + (b.total || 0), 0);
    const pasajeros = boletosFiltrados.length;
    const comision = totalVentas * COMISION_TASA;
    const neto = totalVentas - comision;

    // Desglose por método
    const yape = boletosFiltrados.filter(b => b.metodo === 'yape').reduce((s, b) => s + (b.total || 0), 0);
    const tarjeta = boletosFiltrados.filter(b => b.metodo === 'tarjeta').reduce((s, b) => s + (b.total || 0), 0);
    const efectivo = boletosFiltrados.filter(b => b.metodo === 'efectivo').reduce((s, b) => s + (b.total || 0), 0);

    // Pendientes (todos los pendientes, no solo del período)
    const pendientes = misBoletos.filter(b => b.estadoPago === 'pendiente').length;

    // Ventas por hora (solo para hoy o semana)
    const ventasPorHora = {};
    if (periodo === 'hoy') {
      for (let h = 5; h <= 20; h++) ventasPorHora[h] = 0;
      boletosFiltrados.forEach(b => {
        const hora = b.turno?.hora?.split(' ')[0];
        if (hora) {
          const [h] = hora.split(':').map(Number);
          const esPM = b.turno.hora.includes('PM');
          const h24 = esPM && h !== 12 ? h + 12 : h;
          if (ventasPorHora[h24] !== undefined) {
            ventasPorHora[h24] += b.total || 0;
          }
        }
      });
    }

    const maxVenta = Math.max(...Object.values(ventasPorHora), 1);

    return {
      totalVentas,
      pasajeros,
      comision,
      neto,
      yape,
      tarjeta,
      efectivo,
      pendientes,
      ventasPorHora,
      maxVenta,
    };
  }, [misBoletos, periodo, ahora]);

  const fechaFormateada = ahora.toLocaleDateString('es-PE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const horaFormateada = ahora.toLocaleTimeString('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">

        {/* HEADER EJECUTIVO */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">Panel de control</p>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Resumen operativo</h1>
              <p className="text-sm text-slate-500 font-medium mt-1 capitalize">{fechaFormateada} · {horaFormateada}</p>
            </div>

            {/* Selector de período */}
            <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
              {[
                { id: 'hoy', label: 'Hoy' },
                { id: 'semana', label: '7 días' },
                { id: 'mes', label: 'Mes' },
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setPeriodo(p.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                    periodo === p.id
                      ? 'bg-brand-orange text-white shadow-md'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* KPIs PRINCIPALES */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {/* Ventas */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas del período</p>
            <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">S/ {datos.totalVentas.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 mt-1">{datos.pasajeros} boletos vendidos</p>
          </div>

          {/* Comisión */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comisión (2.95%)</p>
            <p className="text-2xl md:text-3xl font-black text-red-600 tracking-tighter">-S/ {datos.comision.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 mt-1">Sobre ventas recaudadas</p>
          </div>

          {/* Neto */}
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Ingreso neto</p>
            <p className="text-2xl md:text-3xl font-black text-emerald-700 tracking-tighter">S/ {datos.neto.toFixed(2)}</p>
            <p className="text-[10px] text-emerald-600 mt-1">Después de comisión</p>
          </div>

          {/* Pendientes */}
          <div className={`rounded-2xl p-5 border shadow-sm ${
            datos.pendientes > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                datos.pendientes > 0 ? 'bg-brand-orange' : 'bg-slate-100'
              }`}>
                <svg className={`w-5 h-5 ${datos.pendientes > 0 ? 'text-white' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
            </div>
            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${datos.pendientes > 0 ? 'text-brand-orange' : 'text-slate-400'}`}>Pendientes de pago</p>
            <p className={`text-2xl md:text-3xl font-black tracking-tighter ${datos.pendientes > 0 ? 'text-brand-orange' : 'text-slate-900'}`}>{datos.pendientes}</p>
            <p className="text-[10px] text-slate-400 mt-1">Efectivo por cobrar</p>
          </div>
        </div>

        {/* GRÁFICO DE VENTAS POR HORA (solo si es "hoy") */}
        {periodo === 'hoy' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ventas por hora</h2>
                <p className="text-[10px] text-slate-500 mt-0.5">Distribución de ingresos durante el día</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase">Pico</p>
                <p className="text-sm font-black text-slate-900">S/ {Math.max(...Object.values(datos.ventasPorHora)).toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-end gap-1 h-32 md:h-40">
              {Object.entries(datos.ventasPorHora).map(([hora, venta]) => {
                const altura = (venta / datos.maxVenta) * 100;
                const esPico = venta === datos.maxVenta && venta > 0;
                return (
                  <div key={hora} className="flex-1 flex flex-col items-center gap-1 group">
                    <div className="relative w-full flex items-end justify-center" style={{ height: '100%' }}>
                      {venta > 0 && (
                        <div className="absolute -top-6 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap z-10">
                          S/ {venta.toFixed(2)}
                        </div>
                      )}
                      <div
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          esPico
                            ? 'bg-gradient-to-t from-brand-orange to-orange-400'
                            : venta > 0
                              ? 'bg-gradient-to-t from-slate-700 to-slate-500'
                              : 'bg-slate-100'
                        } group-hover:opacity-80`}
                        style={{ height: `${Math.max(altura, 3)}%`, minHeight: venta > 0 ? '8px' : '3px' }}
                      />
                    </div>
                    <span className={`text-[8px] md:text-[9px] font-black ${esPico ? 'text-brand-orange' : 'text-slate-400'}`}>
                      {hora}h
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DESGLOSE POR MÉTODO */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
          <div className="p-5 border-b border-slate-100">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Desglose por método de pago</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">Distribución de ingresos del período</p>
          </div>

          <div className="p-5 space-y-4">
            {/* Yape */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                  <span className="text-sm font-black text-slate-700">Yape Empresa</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">S/ {datos.yape.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-400">Comisión {(datos.yape * COMISION_TASA).toFixed(2)}</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${datos.totalVentas > 0 ? (datos.yape / datos.totalVentas) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Tarjeta */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-slate-700"></span>
                  <span className="text-sm font-black text-slate-700">Tarjeta</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">S/ {datos.tarjeta.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-400">Comisión {(datos.tarjeta * COMISION_TASA).toFixed(2)}</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-slate-700 rounded-full transition-all duration-500"
                  style={{ width: `${datos.totalVentas > 0 ? (datos.tarjeta / datos.totalVentas) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Efectivo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-brand-orange"></span>
                  <span className="text-sm font-black text-slate-700">Efectivo</span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">S/ {datos.efectivo.toFixed(2)}</p>
                  <p className="text-[9px] text-slate-400">Comisión {(datos.efectivo * COMISION_TASA).toFixed(2)}</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-orange rounded-full transition-all duration-500"
                  style={{ width: `${datos.totalVentas > 0 ? (datos.efectivo / datos.totalVentas) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Total recaudado */}
          <div className="bg-[#18191B] text-white px-5 py-4 flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-white/60">Total recaudado del período</span>
            <span className="text-xl font-black font-mono">S/ {datos.totalVentas.toFixed(2)}</span>
          </div>
        </div>

        {/* COMISIÓN DE PLATAFORMA (destacada) */}
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-5 border border-red-200 shadow-sm mb-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"/></svg>
              </div>
              <div>
                <p className="text-xs font-black text-red-700 uppercase tracking-wider">Comisión de plataforma (2.95%)</p>
                <p className="text-[10px] text-red-600 mt-0.5">Cobrada sobre las ventas del período</p>
              </div>
            </div>
            <p className="text-2xl md:text-3xl font-black text-red-700 tracking-tighter">-S/ {datos.comision.toFixed(2)}</p>
          </div>
        </div>

        {/* ALERTA DE PENDIENTES */}
        {datos.pendientes > 0 && (
          <div className="bg-orange-50 rounded-2xl p-5 border border-orange-200 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-black text-slate-900">
                  {datos.pendientes} {datos.pendientes === 1 ? 'boleto pendiente' : 'boletos pendientes'} de pago
                </p>
                <p className="text-xs text-slate-600 mt-0.5">Hay reservas en efectivo que aún no han sido cobradas.</p>
              </div>
              <button 
                onClick={() => window.location.href = '/admin/cobros'}
                className="bg-brand-orange hover:bg-orange-600 text-white font-black text-xs uppercase tracking-wider px-4 py-2.5 rounded-lg transition-all active:scale-95 flex-shrink-0"
              >
                Ir a cobros
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
