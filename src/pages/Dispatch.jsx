import { useState } from 'react';
import { DndContext, closestCorners, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import { useNavigate } from 'react-router-dom';

// Datos de prueba con TODOS los campos legales exigidos por la SUTRAN
const boletosIniciales = [
  { id: 'T1', asiento: 1, nombre: 'Juan Carlos', apellidos: 'Pérez Gómez', dni: '45678912', nacionalidad: 'Peruana', edad: 34, sexo: 'M', origen: 'San Marcos', destino: 'Cajamarca', hora: '04:30 PM', yape: '482910', estado: 'pagado' },
  { id: 'T2', asiento: 2, nombre: 'María Elena', apellidos: 'Quispe Huamán', dni: '78451296', nacionalidad: 'Peruana', edad: 28, sexo: 'F', origen: 'San Marcos', destino: 'Cajamarca', hora: '04:30 PM', yape: '112233', estado: 'pagado' },
  { id: 'T3', asiento: 3, nombre: 'Carlos Andrés', apellidos: 'Mendoza Rojas', dni: '12345678', nacionalidad: 'Peruana', edad: 45, sexo: 'M', origen: 'San Marcos', destino: 'Cajamarca', hora: '04:30 PM', yape: '998877', estado: 'pagado' },
  { id: 'T4', asiento: 4, nombre: 'Rosa María', apellidos: 'Flores Vílchez', dni: '87654321', nacionalidad: 'Peruana', edad: 52, sexo: 'F', origen: 'San Marcos', destino: 'Cajamarca', hora: '04:30 PM', yape: '554433', estado: 'pagado' },
];

const columnas = [
  { id: 'pagado', titulo: 'Por Abordar', color: 'border-blue-500' },
  { id: 'abordando', titulo: 'Abordando', color: 'border-orange-500' },
  { id: 'en_ruta', titulo: 'En Ruta', color: 'border-emerald-500' },
];

export default function Dispatch() {
  const [boletos, setBoletos] = useState(boletosIniciales);
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    const boletoId = active.id;
    const nuevaColumna = over.id;
    setBoletos((prev) =>
      prev.map((b) => (b.id === boletoId ? { ...b, estado: nuevaColumna } : b))
    );
  };

  // Ir al manifiesto con los pasajeros que ya abordaron
  const handleGenerarManifiesto = () => {
    const pasajerosAbordando = boletos.filter(b => b.estado !== 'pagado');
    navigate('/manifiesto', { state: { pasajeros: pasajerosAbordando, turno: { hora: '04:30 PM', placa: 'M5S-188', conductor: 'Carlos Mendoza P.' } } });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center border-b-4 border-brand-orange">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded"><Logo /></div>
          <div>
            <h1 className="font-black text-lg uppercase tracking-wider">Panel de Despacho</h1>
            <p className="text-[10px] text-slate-400 font-mono">Turno 04:30 PM · M5S-188</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Pasajeros a bordo</span>
            <span className="block text-2xl font-black">{boletos.filter(b => b.estado !== 'pagado').length} / {boletos.length}</span>
          </div>
          <button 
            onClick={handleGenerarManifiesto}
            className="bg-brand-orange hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider px-4 py-2 transition-colors"
          >
            Generar Manifiesto
          </button>
        </div>
      </header>

      <main className="flex-grow p-6">
        <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columnas.map((col) => (
              <ColumnaKanban key={col.id} columna={col} boletos={boletos.filter((b) => b.estado === col.id)} />
            ))}
          </div>
        </DndContext>
      </main>
      <Footer />
    </div>
  );
}

function ColumnaKanban({ columna, boletos }) {
  const { setNodeRef } = useDroppable({ id: columna.id });
  return (
    <div className="flex flex-col bg-white border-2 border-slate-200 rounded-xl overflow-hidden min-h-[400px]">
      <div className={`px-4 py-3 border-b-4 ${columna.color} bg-slate-50`}>
        <h2 className="font-black text-sm uppercase tracking-wider text-slate-700 flex justify-between items-center">
          {columna.titulo}
          <span className="bg-white border border-slate-300 px-2 py-0.5 rounded text-xs">{boletos.length}</span>
        </h2>
      </div>
      <div ref={setNodeRef} className="p-3 flex-grow space-y-3 bg-slate-50/50">
        <SortableContext items={boletos.map(b => b.id)} strategy={verticalListSortingStrategy}>
          {boletos.length === 0 ? (
            <div className="text-center text-slate-400 py-10 text-xs font-medium border-2 border-dashed border-slate-200 rounded-lg">
              Arrastra tarjetas aquí
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
  
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`bg-white border border-slate-200 shadow-sm p-3 rounded-lg cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${isDragging ? 'ring-2 ring-brand-orange ring-opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-orange text-white font-black flex items-center justify-center rounded text-sm">{boleto.asiento}</div>
          <div>
            <span className="block text-[10px] font-black uppercase tracking-widest text-slate-400">Asiento</span>
            <span className="block text-sm font-bold text-slate-800">{boleto.nombre} {boleto.apellidos}</span>
          </div>
        </div>
      </div>
      <div className="text-[10px] text-slate-500 mt-1">DNI: {boleto.dni} · {boleto.edad} años · {boleto.sexo}</div>
      <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-2 pt-2 border-t border-slate-100">
        <span className="text-emerald-600 font-bold">✓ Yape: {boleto.yape}</span>
      </div>
    </div>
  );
}
