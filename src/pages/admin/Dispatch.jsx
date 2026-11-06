import { useState, useEffect } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useNavigate } from 'react-router-dom';
import Logo from '../../components/Logo';

const columnas = [
  { id: 'pagado', titulo: 'Por Abordar', color: 'border-blue-500' },
  { id: 'en_terminal', titulo: 'En Terminal', color: 'border-purple-500' },
  { id: 'abordando', titulo: 'Abordando', color: 'border-orange-500' },
  { id: 'en_ruta', titulo: 'En Ruta', color: 'border-emerald-500' },
  { id: 'no_show', titulo: 'No Show', color: 'border-red-500' },
];

export default function Dispatch() {
  const [boletos, setBoletos] = useState([]);
  const [turnoInfo, setTurnoInfo] = useState({ hora: '04:30 PM', placa: 'M5S-188', conductor: 'Carlos Mendoza P.', origen: 'San Marcos', destino: 'Cajamarca' });
  const [horaSalida, setHoraSalida] = useState(null);
  const [reloj, setReloj] = useState(new Date());
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    const cargar = () => {
      const todos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const checkIns = JSON.parse(localStorage.getItem('checkIns') || '{}');
      
      const turnoActualId = 'T-20261105-1630-SM';
      
      const boletosDelTurno = todos
        .filter(b => b.turno?.id === turnoActualId && b.estadoPago === 'pagado')
        .flatMap(b => (b.pasajeros || []).map((p) => {
          const tieneCheckIn = checkIns[b.codigo] || b.estadoAbordaje === 'check_in';
          let estadoInicial = 'pagado';
          if (tieneCheckIn) estadoInicial = 'en_terminal';
          
          return {
            id: `${b.codigo}-${p.asiento}`,
            asiento: p.asiento,
            nombre: p.nombre,
            apellidos: p.apellidos,
            dni: p.dni,
            edad: p.edad,
            sexo: p.sexo,
            origen: b.origen,
            destino: b.destino,
            codigoBoleto: b.codigo,
            metodo: b.metodo,
            estado: estadoInicial,
            checkIn: tieneCheckIn,
          };
        }));

      setBoletos(boletosDelTurno);
    };

    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setReloj(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (turnoInfo.hora) {
      const [horaStr, periodo] = turnoInfo.hora.split(' ');
      let [h, m] = horaStr.split(':').map(Number);
      if (periodo === 'PM' && h !== 12) h += 12;
      if (periodo === 'AM' && h === 12) h = 0;
      
      const fechaSalida = new Date();
      fechaSalida.setHours(h, m, 0, 0);
      setHoraSalida(fechaSalida);
    }
  }, [turnoInfo.hora]);

  const yaSalio = horaSalida && reloj >= horaSalida;

  useEffect(() => {
    if (yaSalio && boletos.length > 0) {
      setBoletos(prev => prev.map(b => {
        if (b.estado === 'pagado' || b.estado === 'en_terminal') {
          return { ...b, estado: 'no_show' };
        }
        if (b.estado === 'abordando') {
          return { ...b, estado: 'en_ruta' };
        }
        return b;
      }));
    }
  }, [yaSalio]);

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const boletoId = active.id;
    const nuevaColumna = over.id;
    setBoletos((prev) =>
      prev.map((b) => (b.id === boletoId ? { ...b, estado: nuevaColumna } : b))
    );
  };

  const handleGenerarManifiesto = () => {
    const pasajerosAbordados = boletos
      .filter(b => b.estado === 'abordando' || b.estado === 'en_ruta')
      .map(b => ({
        asiento: b.asiento,
        nombre: b.nombre,
        apellidos: b.apellidos,
        dni: b.dni,
        nacionalidad: 'Peruana',
        edad: b.edad,
        sexo: b.sexo,
        origen: b.origen,
        destino: b.destino,
      }));

    if (pasajerosAbordados.length === 0) {
      alert('No hay pasajeros abordados todavía. El manifiesto se generará cuando al menos uno aborde.');
      return;
    }

    navigate('/admin/manifest', {
      state: {
        pasajeros: pasajerosAbordados,
        turno: {
          ...turnoInfo,
          fecha: new Date().toISOString().split('T')[0],
        }
      }
    });
  };

  const total = boletos.length;
  const abordando = boletos.filter(b => b.estado !== 'pagado' && b.estado !== 'en_terminal' && b.estado !== 'no_show').length;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b-4 border-brand-orange">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded"><Logo /></div>
          <div>
            <h1 className="font-black text-lg uppercase tracking-wider">Panel de Despacho</h1>
            <p className="text-[10px] text-slate-400 font-mono">Turno {turnoInfo.hora} · {turnoInfo.placa}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Abordados</span>
            <span className="block text-2xl font-black">{abordando} / {total}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Hora salida</span>
            <span className={`block text-lg font-black font-mono ${yaSalio ? 'text-red-400' : 'text-emerald-400'}`}>
              {turnoInfo.hora}
            </span>
          </div>
          <button 
            onClick={handleGenerarManifiesto}
            className="bg-brand-orange hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2 transition-colors active:scale-95"
          >
            Generar Manifiesto
          </button>
        </div>
      </header>

      {yaSalio && (
        <div className="bg-red-50 border-b border-red-200 px-6 py-3 text-center">
          <p className="text-xs font-black text-red-700 uppercase tracking-wider">
            🚨 El vehículo ya salió. Los pasajeros no abordados se marcaron como "No Show".
          </p>
        </div>
      )}

      <main className="flex-grow p-6">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {columnas.map((col) => (
              <ColumnaKanban key={col.id} columna={col} boletos={boletos.filter((b) => b.estado === col.id)} />
            ))}
          </div>
        </DndContext>
      </main>
    </div>
  );
}

function ColumnaKanban({ columna, boletos }) {
  const { setNodeRef } = useDroppable({ id: columna.id });
  return (
    <div className="flex flex-col bg-white border-2 border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
      <div className={`px-3 py-2 border-b-4 ${columna.color} bg-slate-50`}>
        <h2 className="font-black text-xs uppercase tracking-wider text-slate-700 flex justify-between items-center">
          {columna.titulo}
          <span className="bg-white border border-slate-300 px-1.5 py-0.5 rounded text-[10px]">{boletos.length}</span>
        </h2>
      </div>
      <div ref={setNodeRef} className="p-2 flex-grow space-y-2 bg-slate-50/50">
        <SortableContext items={boletos.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {boletos.length === 0 ? (
            <div className="text-center text-slate-400 py-8 text-[10px] font-medium border-2 border-dashed border-slate-200 rounded-lg">
              Arrastra aquí
            </div>
          ) : (
            boletos.map((boleto) => <TarjetaBoleto key={boleto.id} boleto={boleto} />)
          )}
        </SortableContext>
      </div>
    </div>
  );
}

function TarjetaBoleto({ boleto }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: boleto.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 50 : 'auto' };
  
  const getEstadoBadge = () => {
    if (boleto.estado === 'en_terminal') return 'bg-purple-100 text-purple-700';
    if (boleto.estado === 'abordando') return 'bg-orange-100 text-brand-orange';
    if (boleto.estado === 'en_ruta') return 'bg-emerald-100 text-emerald-700';
    if (boleto.estado === 'no_show') return 'bg-red-100 text-red-700';
    return 'bg-blue-100 text-blue-700';
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`bg-white border border-slate-200 shadow-sm p-3 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'ring-2 ring-brand-orange ring-opacity-50' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 bg-brand-orange text-white font-black flex items-center justify-center rounded text-sm">{boleto.asiento}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-slate-800 truncate">{boleto.nombre} {boleto.apellidos}</p>
          <p className="text-[9px] text-slate-500">DNI: {boleto.dni}</p>
        </div>
      </div>
      <div className="flex justify-between items-center text-[9px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-100">
        <span className={`px-1.5 py-0.5 rounded font-black uppercase ${getEstadoBadge()}`}>
          {boleto.estado.replace('_', ' ')}
        </span>
        {boleto.checkIn && <span className="text-purple-600 font-bold">📍 Check-in</span>}
      </div>
    </div>
  );
}
