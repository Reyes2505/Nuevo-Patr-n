import { useState, useMemo, useRef } from 'react';

export default function Tributario() {
  const [mesSeleccionado, setMesSeleccionado] = useState(new Date().getMonth());
  const [anioSeleccionado, setAnioSeleccionado] = useState(new Date().getFullYear());
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [modalDiaAbierto, setModalDiaAbierto] = useState(false);
  const [filtroMetodo, setFiltroMetodo] = useState('todos');
  
  // Tooltip flotante
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, contenido: null });
  const graficoRef = useRef(null);

  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const anios = [2024, 2025, 2026, 2027];

  const datos = useMemo(() => {
    const todosBoletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');

    const boletosDelMes = todosBoletos.filter(b => {
      if (b.estadoPago !== 'pagado') return false;
      const fecha = new Date(b.fecha || 0);
      return fecha.getMonth() === mesSeleccionado && fecha.getFullYear() === anioSeleccionado;
    });

    const totalRecaudado = boletosDelMes.reduce((acc, b) => acc + (b.total || 0), 0);
    const cantidadBoletos = boletosDelMes.length;

    const yape = boletosDelMes.filter(b => b.metodo === 'yape').reduce((acc, b) => acc + (b.total || 0), 0);
    const tarjeta = boletosDelMes.filter(b => b.metodo === 'tarjeta').reduce((acc, b) => acc + (b.total || 0), 0);
    const efectivo = boletosDelMes.filter(b => b.metodo === 'efectivo').reduce((acc, b) => acc + (b.total || 0), 0);

    const precioSinIGV = totalRecaudado / 1.18;
    const igv = totalRecaudado - precioSinIGV;
    const baseNeta = precioSinIGV;
    const comisionYape = yape * 0.0295;
    const rentaMYPE = baseNeta * 0.015;
    const netoEmpresa = totalRecaudado - igv - comisionYape - rentaMYPE;

    const diasDelMes = new Date(anioSeleccionado, mesSeleccionado + 1, 0).getDate();
    const ventasPorDia = Array.from({ length: diasDelMes }, (_, i) => {
      const dia = i + 1;
      const boletosDelDia = boletosDelMes.filter(b => {
        const fecha = new Date(b.fecha || 0);
        return fecha.getDate() === dia;
      });
      const ventas = boletosDelDia.reduce((acc, b) => acc + (b.total || 0), 0);
      return { 
        dia, 
        ventas, 
        boletos: boletosDelDia.length,
        boletosDetalle: boletosDelDia,
        yape: boletosDelDia.filter(b => b.metodo === 'yape').reduce((a, b) => a + (b.total || 0), 0),
        tarjeta: boletosDelDia.filter(b => b.metodo === 'tarjeta').reduce((a, b) => a + (b.total || 0), 0),
        efectivo: boletosDelDia.filter(b => b.metodo === 'efectivo').reduce((a, b) => a + (b.total || 0), 0),
      };
    });

    return {
      totalRecaudado, cantidadBoletos, yape, tarjeta, efectivo,
      igv, baseNeta, comisionYape, rentaMYPE, netoEmpresa,
      ventasPorDia, boletosDelMes,
    };
  }, [mesSeleccionado, anioSeleccionado]);

  const maxVentas = Math.max(...datos.ventasPorDia.map(d => d.ventas), 1);

  const ahora = new Date();
  const esMesActual = mesSeleccionado === ahora.getMonth() && anioSeleccionado === ahora.getFullYear();
  const esMesFuturo = new Date(anioSeleccionado, mesSeleccionado, 1) > ahora;
  const estadoPeriodo = esMesFuturo ? 'FUTURO' : esMesActual ? 'EN CURSO' : 'CERRADO';

  const abrirDetalleDia = (dia) => {
    setDiaSeleccionado(datos.ventasPorDia.find(d => d.dia === dia));
    setModalDiaAbierto(true);
  };

  const ALTURA_GRAFICO = 220;
  const marcasY = [maxVentas, maxVentas * 0.75, maxVentas * 0.5, maxVentas * 0.25, 0];

  // Manejadores del tooltip
  const handleMouseEnterBarra = (e, dia, valor) => {
    if (valor === 0) return;
    const rect = graficoRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    setTooltip({
      visible: true,
      x,
      y,
      contenido: {
        dia: dia.dia,
        boletos: dia.boletos,
        ventas: valor,
        yape: dia.yape,
        tarjeta: dia.tarjeta,
        efectivo: dia.efectivo,
      }
    });
  };

  const handleMouseMoveBarra = (e) => {
    if (!tooltip.visible) return;
    const rect = graficoRef.current?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0);
    const y = e.clientY - (rect?.top || 0);
    setTooltip(prev => ({ ...prev, x, y }));
  };

  const handleMouseLeaveBarra = () => {
    setTooltip({ visible: false, x: 0, y: 0, contenido: null });
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4">
        <h1 className="text-3xl font-black text-slate-900">Gestión Tributaria</h1>
        <p className="text-sm text-slate-500 mt-1">Reporte de IGV, comisiones y obligaciones del período.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-wrap gap-3 items-center">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Mes</label>
          <select value={mesSeleccionado} onChange={(e) => setMesSeleccionado(parseInt(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-brand-orange">
            {meses.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Año</label>
          <select value={anioSeleccionado} onChange={(e) => setAnioSeleccionado(parseInt(e.target.value))} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:border-brand-orange">
            {anios.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">
            {meses[mesSeleccionado]} {anioSeleccionado}
          </span>
          <span className={`px-3 py-2 rounded-xl text-xs font-black uppercase ${
            estadoPeriodo === 'EN CURSO' ? 'bg-emerald-100 text-emerald-700' :
            estadoPeriodo === 'CERRADO' ? 'bg-slate-100 text-slate-600' :
            'bg-purple-100 text-purple-700'
          }`}>{estadoPeriodo}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ventas totales</p>
          <p className="text-2xl font-black text-slate-900">S/ {datos.totalRecaudado.toFixed(2)}</p>
          <p className="text-[10px] text-slate-400 mt-1">{datos.cantidadBoletos} boletos</p>
        </div>
        <div className="bg-orange-50 p-5 rounded-2xl border border-orange-200">
          <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">IGV (18%)</p>
          <p className="text-2xl font-black text-brand-orange">S/ {datos.igv.toFixed(2)}</p>
          <p className="text-[10px] text-orange-600 mt-1">Para SUNAT</p>
        </div>
        <div className="bg-purple-50 p-5 rounded-2xl border border-purple-200">
          <p className="text-[10px] font-black text-purple-700 uppercase tracking-widest mb-1">Comisión Yape</p>
          <p className="text-2xl font-black text-purple-700">- S/ {datos.comisionYape.toFixed(2)}</p>
          <p className="text-[10px] text-purple-500 mt-1">2.95% pasarela</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Neto empresa</p>
          <p className="text-2xl font-black text-emerald-700">S/ {datos.netoEmpresa.toFixed(2)}</p>
          <p className="text-[10px] text-emerald-600 mt-1">Después de IGV y Yape</p>
        </div>
      </div>

      {/* Gráfico con tooltip flotante */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Ventas por día</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Pasa el cursor sobre una barra para ver detalles · Haz clic para abrir el detalle</p>
          </div>
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {['todos', 'yape', 'tarjeta', 'efectivo'].map(m => (
              <button
                key={m}
                onClick={() => setFiltroMetodo(m)}
                className={`px-3 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${
                  filtroMetodo === m ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {datos.cantidadBoletos === 0 ? (
          <p className="text-center text-sm text-slate-400 py-10">Sin ventas registradas</p>
        ) : (
          <div className="relative" ref={graficoRef}>
            <div className="flex gap-3">
              {/* Eje Y */}
              <div className="flex flex-col justify-between text-right pr-2" style={{ height: `${ALTURA_GRAFICO}px` }}>
                {marcasY.map((marca, i) => (
                  <span key={i} className="text-[9px] font-bold text-slate-400">
                    S/ {marca.toFixed(0)}
                  </span>
                ))}
              </div>

              {/* Barras */}
              <div className="flex-1 flex items-end gap-0.5 overflow-x-auto pb-4" style={{ height: `${ALTURA_GRAFICO + 30}px` }}>
                {datos.ventasPorDia.map(d => {
                  const valor = filtroMetodo === 'todos' ? d.ventas : d[filtroMetodo];
                  const alturaPx = valor > 0 ? (valor / maxVentas) * ALTURA_GRAFICO : 0;
                  const esHoy = d.dia === ahora.getDate() && esMesActual;
                  const tieneVentas = valor > 0;
                  
                  return (
                    <div
                      key={d.dia}
                      className="flex flex-col items-center min-w-[20px] flex-1 group"
                      style={{ height: `${ALTURA_GRAFICO + 30}px` }}
                    >
                      {/* Valor arriba */}
                      {tieneVentas && (
                        <span className="text-[8px] font-black text-slate-700 mb-0.5">
                          {valor.toFixed(0)}
                        </span>
                      )}
                      
                      {/* Barra clicable */}
                      <div className="flex-1 flex items-end w-full px-0.5">
                        <button
                          onMouseEnter={(e) => handleMouseEnterBarra(e, d, valor)}
                          onMouseMove={handleMouseMoveBarra}
                          onMouseLeave={handleMouseLeaveBarra}
                          onClick={() => tieneVentas && abrirDetalleDia(d.dia)}
                          disabled={!tieneVentas}
                          className={`w-full rounded-t transition-all ${
                            tieneVentas 
                              ? 'bg-gradient-to-t from-brand-orange to-orange-400 hover:from-orange-600 hover:to-orange-500 cursor-pointer' 
                              : 'bg-slate-100 cursor-default'
                          }`}
                          style={{ height: `${Math.max(alturaPx, tieneVentas ? 4 : 2)}px` }}
                        />
                      </div>
                      
                      {/* Día */}
                      <span className={`text-[9px] font-bold mt-1 ${
                        esHoy ? 'text-brand-orange font-black' : 'text-slate-400'
                      }`}>
                        {d.dia}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* TOOLTIP FLOTANTE */}
            {tooltip.visible && tooltip.contenido && (
              <div
                className="absolute z-50 pointer-events-none"
                style={{
                  left: `${tooltip.x}px`,
                  top: `${tooltip.y - 10}px`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div className="bg-slate-900 text-white rounded-xl shadow-2xl p-3 min-w-[180px] border border-slate-700">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                    <span className="text-[10px] font-black text-brand-orange uppercase">
                      {tooltip.contenido.dia} de {meses[mesSeleccionado]}
                    </span>
                    <span className="text-[9px] text-white/50">{tooltip.contenido.boletos} boletos</span>
                  </div>
                  <p className="text-xl font-black text-white mb-2">S/ {tooltip.contenido.ventas.toFixed(2)}</p>
                  <div className="space-y-1 text-[9px]">
                    <div className="flex justify-between">
                      <span className="text-white/60">Yape:</span>
                      <span className="text-purple-300 font-bold">S/ {tooltip.contenido.yape.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Tarjeta:</span>
                      <span className="text-blue-300 font-bold">S/ {tooltip.contenido.tarjeta.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Efectivo:</span>
                      <span className="text-orange-300 font-bold">S/ {tooltip.contenido.efectivo.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-white/10 text-center">
                    <span className="text-[8px] text-white/40 uppercase">Clic para ver detalle</span>
                  </div>
                </div>
                {/* Flecha del tooltip */}
                <div className="w-3 h-3 bg-slate-900 rotate-45 mx-auto -mt-1.5"></div>
              </div>
            )}
          </div>
        )}

        {/* Resumen debajo del gráfico */}
        {datos.cantidadBoletos > 0 && (
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100 text-[10px]">
            <span className="text-slate-400">
              Mejor día: <strong className="text-slate-900">
                {datos.ventasPorDia.reduce((max, d) => d.ventas > max.ventas ? d : max, datos.ventasPorDia[0]).dia} de {meses[mesSeleccionado]}
              </strong>
            </span>
            <span className="text-slate-400">
              Días con ventas: <strong className="text-slate-900">{datos.ventasPorDia.filter(d => d.ventas > 0).length}</strong> de {datos.ventasPorDia.length}
            </span>
            <span className="text-slate-400">
              Promedio diario: <strong className="text-slate-900">
                S/ {(datos.totalRecaudado / datos.ventasPorDia.filter(d => d.ventas > 0).length || 0).toFixed(2)}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Calendario interactivo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Calendario del período</h2>
            <span className="text-[10px] text-slate-400">Haz clic en un día con ventas</span>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
              <div key={i} className="text-center text-[9px] font-black text-slate-400 uppercase py-1">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: new Date(anioSeleccionado, mesSeleccionado, 1).getDay() === 0 ? 6 : new Date(anioSeleccionado, mesSeleccionado, 1).getDay() - 1 }, (_, i) => (
              <div key={`empty-${i}`} className="aspect-square"></div>
            ))}
            {datos.ventasPorDia.map(d => {
              const intensidad = d.ventas / maxVentas;
              const esHoy = d.dia === ahora.getDate() && esMesActual;
              const esFuturo = d.dia > ahora.getDate() && esMesActual;
              const tieneVentas = d.ventas > 0;
              
              return (
                <button
                  key={d.dia}
                  onClick={() => tieneVentas && abrirDetalleDia(d.dia)}
                  disabled={!tieneVentas}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center transition-all relative group
                    ${tieneVentas ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-brand-orange' : 'cursor-default'}
                    ${esHoy ? 'ring-2 ring-slate-900 ring-offset-1' : ''}
                  `}
                  style={{ backgroundColor: tieneVentas ? `rgba(255, 106, 0, ${0.15 + intensidad * 0.85})` : (esFuturo ? '#FAFAFA' : '#F8F9FA') }}
                >
                  <span className={`text-[10px] font-black ${
                    intensidad > 0.5 ? 'text-white' : tieneVentas ? 'text-slate-700' : 'text-slate-400'
                  }`}>
                    {d.dia}
                  </span>
                  {tieneVentas && (
                    <span className={`text-[7px] font-bold ${intensidad > 0.5 ? 'text-white/80' : 'text-slate-500'}`}>
                      S/{d.ventas.toFixed(0)}
                    </span>
                  )}
                  {tieneVentas && (
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                      {d.boletos} boleto{d.boletos !== 1 ? 's' : ''} · S/ {d.ventas.toFixed(2)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 mt-4 text-[9px] font-bold text-slate-500">
            <span>Menos</span>
            <div className="flex gap-0.5">
              <div className="w-3 h-3 rounded bg-orange-100"></div>
              <div className="w-3 h-3 rounded bg-orange-300"></div>
              <div className="w-3 h-3 rounded bg-orange-500"></div>
              <div className="w-3 h-3 rounded bg-brand-orange"></div>
            </div>
            <span>Más</span>
            <span className="ml-auto flex items-center gap-1">
              <div className="w-3 h-3 rounded ring-2 ring-slate-900 ring-offset-1"></div> Hoy
            </span>
          </div>
        </div>

        {/* Obligaciones */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4">Obligaciones del período</h2>
          <div className="space-y-3">
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-black text-slate-900">Declaración IGV-Renta</p>
                  <p className="text-[10px] text-slate-500">Formulario 621 · Vence el 20 de {meses[(mesSeleccionado + 1) % 12]}</p>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                  datos.cantidadBoletos > 0 ? 'bg-orange-100 text-brand-orange' : 'bg-slate-100 text-slate-500'
                }`}>
                  {datos.cantidadBoletos > 0 ? 'Pendiente' : 'Sin declarar'}
                </span>
              </div>
              <p className="text-lg font-black text-brand-orange">S/ {datos.igv.toFixed(2)}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-black text-slate-900">Comisión Yape</p>
                  <p className="text-[10px] text-slate-500">Cobro de la pasarela</p>
                </div>
                <span className="text-[9px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full uppercase">2.95%</span>
              </div>
              <p className="text-lg font-black text-purple-700">S/ {datos.comisionYape.toFixed(2)}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="text-xs font-black text-slate-900">Renta MYPE (1.5%)</p>
                  <p className="text-[10px] text-slate-500">Sobre base neta</p>
                </div>
                <span className="text-[9px] font-black text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full uppercase">Estimado</span>
              </div>
              <p className="text-lg font-black text-slate-900">S/ {datos.rentaMYPE.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DETALLE DEL DÍA */}
      {modalDiaAbierto && diaSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setModalDiaAbierto(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-200 flex justify-between items-start bg-slate-50 rounded-t-2xl">
              <div>
                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">Detalle del día</p>
                <h2 className="text-2xl font-black text-slate-900">
                  {diaSeleccionado.dia} de {meses[mesSeleccionado]} de {anioSeleccionado}
                </h2>
                <p className="text-xs text-slate-500">{diaSeleccionado.boletos} boleto{diaSeleccionado.boletos !== 1 ? 's' : ''} vendido{diaSeleccionado.boletos !== 1 ? 's' : ''}</p>
              </div>
              <button onClick={() => setModalDiaAbierto(false)} className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-purple-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-black text-purple-700 uppercase">Yape</p>
                  <p className="text-lg font-black text-purple-700">S/ {diaSeleccionado.yape.toFixed(2)}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-black text-blue-700 uppercase">Tarjeta</p>
                  <p className="text-lg font-black text-blue-700">S/ {diaSeleccionado.tarjeta.toFixed(2)}</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                  <p className="text-[9px] font-black text-brand-orange uppercase">Efectivo</p>
                  <p className="text-lg font-black text-brand-orange">S/ {diaSeleccionado.efectivo.toFixed(2)}</p>
                </div>
              </div>

              <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3">Boletos del día</h3>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {diaSeleccionado.boletosDetalle.map(b => (
                  <div key={b.codigo} className="bg-slate-50 rounded-xl p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-black text-slate-500 bg-white px-1.5 py-0.5 rounded">{b.codigo}</span>
                        <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          b.metodo === 'yape' ? 'bg-purple-100 text-purple-700' :
                          b.metodo === 'tarjeta' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-brand-orange'
                        }`}>{b.metodo}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 truncate">{b.nombre}</p>
                      <p className="text-[10px] text-slate-500">{b.asientos} · {b.turno?.hora}</p>
                    </div>
                    <p className="font-black text-slate-900">S/ {b.total?.toFixed(2)}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-500 uppercase tracking-wider">Total del día</span>
                <span className="text-2xl font-black text-brand-orange">S/ {diaSeleccionado.ventas.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
