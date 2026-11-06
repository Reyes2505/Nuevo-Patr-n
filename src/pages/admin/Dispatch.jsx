import { useState, useEffect, useMemo, useCallback, memo, Fragment } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import { getTurnos } from '../../data/turnos';
import { useUser } from '../../context/UserContext';

const COLUMNAS = [
  { id: 'pagado', titulo: 'Por Abordar', icon: '⏳', color: 'blue', siguiente: 'en_terminal', etiquetaSiguiente: 'Marcar en terminal' },
  { id: 'en_terminal', titulo: 'En Terminal', icon: '📍', color: 'purple', siguiente: 'abordando', etiquetaSiguiente: 'Marcar abordado' },
  { id: 'abordando', titulo: 'Abordando', icon: '🚶', color: 'orange', siguiente: 'en_ruta', etiquetaSiguiente: 'Marcar en ruta' },
  { id: 'en_ruta', titulo: 'En Ruta', icon: '🚐', color: 'emerald', siguiente: null, etiquetaSiguiente: null },
  { id: 'no_show', titulo: 'No Show', icon: '❌', color: 'red', siguiente: null, etiquetaSiguiente: null },
];

const AGENCIAS = [
  { id: 'San Marcos', label: 'San Marcos', icon: '🏔️' },
  { id: 'Cajamarca', label: 'Cajamarca', icon: '🏙️' },
];

const COLORES = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700', dot: 'bg-blue-500', hover: 'hover:bg-blue-100' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700', dot: 'bg-purple-500', hover: 'hover:bg-purple-100' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700', dot: 'bg-orange-500', hover: 'hover:bg-orange-100' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700', dot: 'bg-emerald-500', hover: 'hover:bg-emerald-100' },
  red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-700', dot: 'bg-red-500', hover: 'hover:bg-red-100' },
};

const KEY_STORAGE = 'dispatchEstados';
const ESTADOS_VALIDOS = ['pagado', 'en_terminal', 'abordando', 'en_ruta', 'no_show'];
const HORA_LIMITE_EDICION = 20;
const MINUTO_LIMITE_EDICION = 15;

const to24h = (horaStr) => {
  const [hm, periodo] = horaStr.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (periodo === 'PM' && h !== 12) h += 12;
  if (periodo === 'AM' && h === 12) h = 0;
  return { h, m };
};

const estadoTurno = (turno, fechaRef) => {
  const ahora = new Date();
  const { h, m } = to24h(turno.hora);
  const salida = new Date();
  salida.setHours(h, m, 0, 0);
  const ref = new Date(fechaRef + 'T00:00:00');
  salida.setFullYear(ref.getFullYear(), ref.getMonth(), ref.getDate());
  const diffMin = Math.floor((salida - ahora) / 60000);
  if (diffMin < -5) return 'salido';
  if (diffMin < 0) return 'cerrando';
  if (diffMin < 15) return 'urgente';
  return 'normal';
};

const generarDias = () => {
  const dias = [];
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  
  const DIAS_PASADO = 3;
  const DIAS_FUTURO = 6;
  
  for (let i = -DIAS_PASADO; i <= DIAS_FUTURO; i++) {
    const d = new Date(hoy);
    d.setDate(d.getDate() + i);
    
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    
    let label;
    if (i === -1) label = 'Ayer';
    else if (i === 0) label = 'Hoy';
    else if (i === 1) label = 'Mañana';
    else label = d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric' });
    
    dias.push({
      iso: `${año}-${mes}-${dia}`,
      label,
      dia: d.getDate(),
      mes: d.toLocaleDateString('es-PE', { month: 'short' }),
      offset: i,
      esPasado: i < 0,
      esHoy: i === 0,
      esFuturo: i > 0,
    });
  }
  
  return dias;
};

const estaBloqueado = (offset) => {
  const ahora = new Date();
  if (offset < 0) return true;
  if (offset > 0) return false;
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  return horaActual > HORA_LIMITE_EDICION || (horaActual === HORA_LIMITE_EDICION && minutoActual >= MINUTO_LIMITE_EDICION);
};

export default function Dispatch() {
  const navigate = useNavigate();
  const { misBoletos } = useUser();
  const [turnos, setTurnos] = useState([]);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [estadosLocales, setEstadosLocales] = useState({});
  const [agencia, setAgencia] = useState('San Marcos');
  
  const dias = useMemo(() => generarDias(), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  });

  const diaSeleccionado = dias.find(d => d.iso === fechaSeleccionada);
  const bloqueado = estaBloqueado(diaSeleccionado?.offset ?? 0);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY_STORAGE) || '{}');
      setEstadosLocales(saved);
    } catch (e) { console.error(e); }
  }, []);

  const guardarEstados = useCallback((nuevos) => {
    if (bloqueado) {
      alert('⚠️ Este día está cerrado. Ya no se puede editar.');
      return;
    }
    setEstadosLocales(nuevos);
    localStorage.setItem(KEY_STORAGE, JSON.stringify(nuevos));
  }, [bloqueado]);

  useEffect(() => {
    const cargar = () => {
      if (!diaSeleccionado) return;
      const diaObjetivo = diaSeleccionado.offset;
      
      if (diaObjetivo < 0) {
        const turnosDeBoletos = new Map();
        misBoletos.forEach(b => {
          if (b.turno && b.turno.origen === agencia) {
            const fechaBoleto = b.fechaViaje || b.fecha?.split('T')[0];
            if (fechaBoleto === fechaSeleccionada) {
              turnosDeBoletos.set(b.turno.id, b.turno);
            }
          }
        });
        const turnosOrdenados = Array.from(turnosDeBoletos.values())
          .sort((a, b) => a.horaNumerica - b.horaNumerica);
        setTurnos(turnosOrdenados);
        setTurnoActivo(null);
        return;
      }
      
      const todos = getTurnos();
      const filtrados = todos
        .filter(t => t.dia === diaObjetivo && t.estado !== 'salido' && t.origen === agencia)
        .sort((a, b) => a.horaNumerica - b.horaNumerica);
      
      setTurnos(filtrados);
      setTurnoActivo(null);
    };
    
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [agencia, fechaSeleccionada, diaSeleccionado, misBoletos]);

  useEffect(() => {
    if (!turnoActivo && turnos.length > 0) setTurnoActivo(turnos[0]);
  }, [turnos, turnoActivo]);

  const boletos = useMemo(() => {
    if (!turnoActivo) return [];
    const checkIns = JSON.parse(localStorage.getItem('checkIns') || '{}');

    return misBoletos
      .filter(b => {
        if (b.estadoPago === 'reembolsado') return false;
        const fechaBoleto = b.fechaViaje || b.fecha?.split('T')[0];
        if (fechaBoleto !== fechaSeleccionada) return false;
        if (b.turno?.id === turnoActivo.id) return true;
        if (b.turno?.hora === turnoActivo.hora && b.turno?.origen === turnoActivo.origen) return true;
        return false;
      })
      .flatMap(b => (b.pasajeros || []).map((p, idx) => {
        const id = `${b.codigo}-${p.asiento || idx}`;
        const estadoInicial = checkIns[b.codigo] ? 'en_terminal' : 'pagado';
        return {
          id, asiento: p.asiento, nombre: p.nombre, apellidos: p.apellidos,
          dni: p.dni, edad: p.edad, sexo: p.sexo, codigoBoleto: b.codigo,
          metodo: b.metodo, total: b.total, checkIn: !!checkIns[b.codigo],
          estado: estadosLocales[id] || estadoInicial,
        };
      }));
  }, [turnoActivo, misBoletos, estadosLocales, fechaSeleccionada]);

  const cambiarEstado = useCallback((boletoId, nuevoEstado) => {
    if (!ESTADOS_VALIDOS.includes(nuevoEstado)) return;
    if (bloqueado) {
      alert('⚠️ Este día está cerrado. Ya no se puede editar.');
      return;
    }
    guardarEstados({ ...estadosLocales, [boletoId]: nuevoEstado });
  }, [estadosLocales, guardarEstados, bloqueado]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    if (!ESTADOS_VALIDOS.includes(over.id)) return;
    if (bloqueado) {
      alert('⚠️ Este día está cerrado. Ya no se puede editar.');
      return;
    }
    cambiarEstado(active.id, over.id);
  };

  const handleGenerarManifiesto = () => {
    const abordados = boletos
      .filter(b => b.estado === 'abordando' || b.estado === 'en_ruta')
      .map(b => ({
        asiento: b.asiento, nombre: b.nombre, apellidos: b.apellidos, dni: b.dni,
        nacionalidad: 'Peruana', edad: b.edad, sexo: b.sexo,
        origen: turnoActivo.origen, destino: turnoActivo.destino,
      }));

    if (abordados.length === 0) {
      alert('No hay pasajeros abordados todavía.');
      return;
    }

    navigate('/admin/manifest', {
      state: {
        pasajeros: abordados,
        turno: {
          hora: turnoActivo.hora, placa: turnoActivo.placa,
          conductor: turnoActivo.conductor,
          origen: turnoActivo.origen, destino: turnoActivo.destino,
          fecha: fechaSeleccionada,
        }
      }
    });
  };

  const conteos = useMemo(() => {
    const c = { pagado: 0, en_terminal: 0, abordando: 0, en_ruta: 0, no_show: 0 };
    boletos.forEach(b => { if (c[b.estado] !== undefined) c[b.estado]++; });
    return c;
  }, [boletos]);

  const total = boletos.length;
  const abordados = conteos.abordando + conteos.en_ruta;
  const recaudado = boletos.reduce((acc, b) => acc + (b.total || 0), 0);
  const ocupacion = total > 0 ? Math.round((abordados / total) * 100) : 0;
  const estado = turnoActivo ? estadoTurno(turnoActivo, fechaSeleccionada) : 'normal';

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col w-full overflow-x-hidden">
      
      {/* Banner de bloqueo */}
      {bloqueado && (
        <div className={`text-white px-4 py-2 text-center ${diaSeleccionado?.esPasado ? 'bg-slate-800' : 'bg-red-800'}`}>
          <p className="text-xs font-black uppercase tracking-wider">
            {diaSeleccionado?.esPasado 
              ? `🔒 Día ${fechaSeleccionada} archivado. Solo visualización.`
              : '🔒 Edición cerrada a las 8:15 PM. Solo visualización.'}
          </p>
        </div>
      )}

      <header className="bg-[#18191B] text-white w-full">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-orange rounded-xl flex items-center justify-center flex-shrink-0">
                <span className="text-white font-black text-lg">NP</span>
              </div>
              <div>
                <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest">
                  Centro de Control · {agencia}
                  {!bloqueado && diaSeleccionado?.esHoy && <span className="ml-2 text-emerald-400">● EN LÍNEA</span>}
                  {bloqueado && <span className="ml-2 text-red-400">🔒 ARCHIVADO</span>}
                </p>
                <h1 className="text-xl md:text-2xl font-black tracking-tight">
                  {turnoActivo ? `${turnoActivo.hora} · ${turnoActivo.placa}` : 'Sin turno activo'}
                </h1>
                {turnoActivo && (
                  <p className="text-xs text-white/60 mt-0.5">
                    {turnoActivo.conductor} · {turnoActivo.origen} → {turnoActivo.destino}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
              {AGENCIAS.map(a => (
                <button key={a.id} onClick={() => setAgencia(a.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-black text-xs uppercase tracking-wider transition-all ${
                    agencia === a.id ? 'bg-brand-orange text-white shadow-lg' : 'text-white/60 hover:text-white hover:bg-white/10'
                  }`}>
                  <span>{a.icon}</span>{a.label}
                </button>
              ))}
            </div>

            <button onClick={handleGenerarManifiesto} disabled={abordados === 0}
              className={`font-black text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all flex items-center gap-2 ${
                abordados > 0 ? 'bg-brand-orange hover:bg-orange-600 text-white shadow-lg shadow-brand-orange/30 active:scale-95' : 'bg-white/10 text-white/30 cursor-not-allowed'
              }`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
              Manifiesto ({abordados})
            </button>
          </div>
        </div>

        {/* SELECTOR DE FECHA - LÍNEA DE TIEMPO */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 overflow-x-auto">
            <div className="flex items-center gap-1 min-w-max">
              {dias.map((d, idx) => {
                const esSeleccionado = fechaSeleccionada === d.iso;
                const bloqueadoDia = estaBloqueado(d.offset);
                const esSeparadorIzquierda = d.esHoy && idx > 0 && dias[idx - 1].esPasado;
                const esSeparadorDerecha = d.esHoy && idx < dias.length - 1 && dias[idx + 1].esFuturo;
                
                return (
                  <Fragment key={d.iso}>
                    {esSeparadorIzquierda && (
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[8px] font-black text-white/40 uppercase">pasado</span>
                        <span className="text-white/20 text-lg">—</span>
                      </div>
                    )}
                    
                    <button onClick={() => setFechaSeleccionada(d.iso)}
                      className={`flex-shrink-0 flex flex-col items-center justify-center px-3 py-2 rounded-xl border-2 transition-all min-w-[72px] ${
                        esSeleccionado
                          ? 'border-brand-orange bg-brand-orange text-white shadow-lg scale-105'
                          : bloqueadoDia
                            ? 'border-white/5 bg-white/[0.03] text-white/30'
                            : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                      }`}>
                      <span className="text-[9px] font-black uppercase tracking-wider">{d.label}</span>
                      <span className={`text-lg font-black ${d.esHoy ? 'text-brand-orange' : ''}`}>{d.dia}</span>
                      <span className="text-[8px] font-bold opacity-70">{d.mes}</span>
                      {bloqueadoDia && !esSeleccionado && <span className="text-[8px] mt-0.5">🔒</span>}
                    </button>
                    
                    {esSeparadorDerecha && (
                      <div className="flex flex-col items-center px-2">
                        <span className="text-[8px] font-black text-white/40 uppercase">futuro</span>
                        <span className="text-white/20 text-lg">—</span>
                      </div>
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-4">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Total pasajeros</p><p className="text-xl font-black">{total}</p></div>
              <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Abordados</p><p className="text-xl font-black text-brand-orange">{abordados}</p></div>
              <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Recaudado</p><p className="text-xl font-black text-emerald-400">S/ {recaudado.toFixed(2)}</p></div>
              <div><p className="text-[9px] font-black text-white/40 uppercase tracking-widest">Ocupación</p><p className="text-xl font-black text-blue-400">{ocupacion}%</p></div>
            </div>
            <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand-orange to-orange-400 rounded-full transition-all duration-500" style={{ width: `${ocupacion}%` }} />
            </div>
          </div>
        </div>

        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {turnos.map(t => {
                const estadoT = estadoTurno(t, fechaSeleccionada);
                const esActivo = turnoActivo?.id === t.id;
                return (
                  <button key={t.id} onClick={() => setTurnoActivo(t)}
                    className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                      esActivo ? 'border-brand-orange bg-brand-orange text-white shadow-lg' 
                        : estadoT === 'urgente' || estadoT === 'cerrando' ? 'border-red-500/50 bg-red-500/20 text-red-300'
                          : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10'
                    }`}>
                    <span className="text-xs font-black">{t.hora}</span>
                    <span className="text-[9px] font-bold opacity-70">{t.placa}</span>
                  </button>
                );
              })}
              {turnos.length === 0 && <p className="text-xs text-white/40 font-bold py-2">No hay turnos para esta fecha</p>}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow w-full overflow-x-auto p-3 md:p-6">
        {turnoActivo ? (
          <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 md:gap-4 min-w-max pb-4">
              {COLUMNAS.map(col => (
                <ColumnaKanban key={col.id} columna={col}
                  boletos={boletos.filter(b => b.estado === col.id)}
                  conteo={conteos[col.id]}
                  onCambiarEstado={cambiarEstado}
                  bloqueado={bloqueado} />
              ))}
            </div>
          </DndContext>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-lg font-black text-slate-700">
                {turnos.length === 0 ? `Sin turnos en ${agencia}` : 'Selecciona un turno'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {turnos.length === 0 ? 'No hay turnos programados para esta fecha.' : 'Elige un turno arriba para gestionar el abordaje.'}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const ColumnaKanban = memo(function ColumnaKanban({ columna, boletos, conteo, onCambiarEstado, bloqueado }) {
  const { setNodeRef, isOver } = useDroppable({ id: columna.id });
  const colores = COLORES[columna.color];
  
  return (
    <div className={`flex flex-col bg-white rounded-xl overflow-hidden shadow-sm border-2 transition-colors flex-shrink-0 w-[240px] ${
      isOver && !bloqueado ? `border-brand-orange ${colores.bg}` : 'border-slate-200'
    } ${bloqueado ? 'opacity-75' : ''}`}>
      <div className={`px-3 py-3 border-b-4 ${colores.border} ${colores.bg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{columna.icon}</span>
            <h2 className={`font-black text-[11px] uppercase tracking-wider ${colores.text}`}>{columna.titulo}</h2>
          </div>
          <span className={`text-[11px] font-black px-2 py-0.5 rounded-full bg-white ${colores.text}`}>{conteo}</span>
        </div>
      </div>
      <div ref={setNodeRef} className="p-2 flex-grow space-y-2 min-h-[400px] max-h-[calc(100vh-560px)] overflow-y-auto bg-slate-50/50">
        <SortableContext items={boletos.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {boletos.length === 0 ? (
            <div className={`text-center py-8 border-2 border-dashed rounded-lg transition-colors ${
              isOver && !bloqueado ? 'border-brand-orange bg-orange-50' : 'border-slate-200'
            }`}>
              <p className="text-[10px] text-slate-400 font-bold">{isOver && !bloqueado ? 'Suelta aquí' : 'Sin pasajeros'}</p>
            </div>
          ) : (
            boletos.map(boleto => (
              <TarjetaPasajero key={boleto.id} boleto={boleto} columna={columna} onCambiarEstado={onCambiarEstado} bloqueado={bloqueado} />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
});

function TarjetaPasajero({ boleto, columna, onCambiarEstado, bloqueado }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boleto.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };

  const siguienteCol = COLUMNAS.find(c => c.id === columna.siguiente);

  return (
    <div ref={setNodeRef} style={style}
      className={`bg-white border border-slate-200 shadow-sm rounded-lg overflow-hidden transition-all ${
        isDragging ? 'ring-2 ring-brand-orange shadow-lg' : 'hover:shadow-md'
      }`}>
      <div {...attributes} {...listeners} className={`p-3 ${bloqueado ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'}`}>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-9 h-9 bg-[#18191B] text-white font-black flex items-center justify-center rounded-lg text-sm flex-shrink-0">{boleto.asiento}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{boleto.nombre} {boleto.apellidos}</p>
            <p className="text-[9px] text-slate-500">DNI: {boleto.dni}</p>
          </div>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <span className="text-[9px] font-mono font-bold text-slate-400">{boleto.codigoBoleto}</span>
          {boleto.checkIn ? (
            <span className="text-[8px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded uppercase">📍 Check-in</span>
          ) : (
            <span className="text-[8px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">Sin check-in</span>
          )}
        </div>
      </div>
      {siguienteCol && (
        <button onClick={() => !bloqueado && onCambiarEstado(boleto.id, siguienteCol.id)} disabled={bloqueado}
          className={`w-full text-[9px] font-black uppercase tracking-wider py-2 border-t border-slate-100 transition-colors ${
            bloqueado ? 'text-slate-300 bg-slate-50 cursor-not-allowed' : `${COLORES[columna.color].text} ${COLORES[columna.color].hover}`
          }`}>
          {bloqueado ? '🔒 Bloqueado' : `→ ${columna.etiquetaSiguiente}`}
        </button>
      )}
    </div>
  );
}
