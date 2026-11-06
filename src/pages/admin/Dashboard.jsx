import { useState, useEffect } from 'react';

const COMISION_TASA = 0.0295; // 2.95% sobre ventas diarias

export default function Dashboard() {
  const [misBoletos, setMisBoletos] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    setMisBoletos(saved);

    const handleStorage = (e) => {
      if (e.key === 'misBoletos') {
        setMisBoletos(JSON.parse(e.newValue || '[]'));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Filtrar solo boletos pagados (no pendientes ni reembolsados)
  const boletosPagados = misBoletos.filter(b => b.estadoPago === 'pagado');
  
  // Filtrar los de hoy
  const hoy = new Date().toISOString().split('T')[0];
  const boletosHoy = boletosPagados.filter(b => b.fecha && b.fecha.startsWith(hoy));

  // Cálculos
  const totalVentasHoy = boletosHoy.reduce((sum, b) => sum + (b.total || 0), 0);
  const pasajerosHoy = boletosHoy.length;
  const comisionHoy = totalVentasHoy * COMISION_TASA;
  const ingresoNetoHoy = totalVentasHoy - comisionHoy;

  // Desglose por método
  const yape = boletosHoy.filter(b => b.metodo === 'yape').reduce((s, b) => s + b.total, 0);
  const tarjeta = boletosHoy.filter(b => b.metodo === 'tarjeta').reduce((s, b) => s + b.total, 0);
  const efectivo = boletosHoy.filter(b => b.metodo === 'efectivo').reduce((s, b) => s + b.total, 0);
  const pendientesCobro = misBoletos.filter(b => b.estadoPago === 'pendiente').length;

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Resumen operativo</h1>
        <p className="text-sm text-slate-500 mt-1">Datos en tiempo real del día {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas del día</p>
          <p className="text-2xl font-black text-slate-900">S/ {totalVentasHoy.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{pasajerosHoy} boletos pagados</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comisión (2.95%)</p>
          <p className="text-2xl font-black text-red-600">- S/ {comisionHoy.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-1">Sobre ventas recaudadas</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Ingreso neto</p>
          <p className="text-2xl font-black text-emerald-700">S/ {ingresoNetoHoy.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Después de comisión</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pendientes de pago</p>
          <p className="text-2xl font-black text-orange-600">{pendientesCobro}</p>
          <p className="text-[10px] text-slate-400 mt-1">Efectivo por cobrar</p>
        </div>
      </div>

      {/* Desglose por método */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-3">
          <h2 className="text-xs font-black text-slate-700 uppercase tracking-wider">Desglose por método de pago</h2>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="grid grid-cols-4 px-5 py-4 items-center">
            <div className="col-span-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              <span className="text-sm font-bold text-slate-700">Yape Empresa</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Comisión {(yape * COMISION_TASA).toFixed(2)}</div>
            <div className="text-right font-mono text-lg font-black text-slate-900">S/ {yape.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-4 px-5 py-4 items-center">
            <div className="col-span-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-slate-700 rounded-full"></span>
              <span className="text-sm font-bold text-slate-700">Tarjeta</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Comisión {(tarjeta * COMISION_TASA).toFixed(2)}</div>
            <div className="text-right font-mono text-lg font-black text-slate-900">S/ {tarjeta.toFixed(2)}</div>
          </div>
          <div className="grid grid-cols-4 px-5 py-4 items-center">
            <div className="col-span-2 flex items-center gap-2">
              <span className="w-2 h-2 bg-brand-orange rounded-full"></span>
              <span className="text-sm font-bold text-slate-700">Efectivo</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">Comisión {(efectivo * COMISION_TASA).toFixed(2)}</div>
            <div className="text-right font-mono text-lg font-black text-slate-900">S/ {efectivo.toFixed(2)}</div>
          </div>
        </div>
        <div className="bg-slate-900 text-white px-5 py-3 flex justify-between items-center">
          <span className="text-[10px] font-black uppercase tracking-wider text-white/60">Total recaudado del día</span>
          <span className="font-mono text-lg font-black">S/ {totalVentasHoy.toFixed(2)}</span>
        </div>
      </div>

      {/* Comisión desglosada */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs font-black text-red-700 uppercase tracking-wider">Comisión de plataforma (2.95%)</p>
            <p className="text-[10px] text-red-600 mt-1">Cobrada sobre las ventas del día</p>
          </div>
          <p className="text-2xl font-black text-red-700">- S/ {comisionHoy.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
