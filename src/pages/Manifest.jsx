import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Manifest() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const pasajerosRegistrados = location.state?.pasajeros || [];
  const turno = location.state?.turno || { 
    hora: '—', 
    placa: '—', 
    conductor: '—', 
    fecha: new Date().toISOString().split('T')[0] 
  };
  
  // Indexación O(1) de asientos ocupados
  const mapaPasajeros = useMemo(() => {
    const mapa = {};
    pasajerosRegistrados.forEach(p => {
      const num = parseInt(p.asiento, 10);
      if (!isNaN(num)) mapa[num] = p;
    });
    return mapa;
  }, [pasajerosRegistrados]);

  // Generación fija de los 15 asientos de la HiAce
  const filas = useMemo(() => {
    return Array.from({ length: 15 }, (_, i) => ({
      asiento: i + 1,
      pasajero: mapaPasajeros[i + 1] || null,
    }));
  }, [mapaPasajeros]);
  
  const fechaFormateada = useMemo(() => {
    try {
      return new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric' 
      });
    } catch {
      return turno.fecha || '—';
    }
  }, [turno.fecha]);

  const fechaEmision = useMemo(() => new Date().toLocaleString('es-PE'), []);

  const handleImprimir = () => window.print();
  const handleVolver = () => navigate('/admin/dispatch');

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4 print:bg-white print:p-0 print:min-h-0">
      
      {/* Estilos específicos de inyección para impresión física exacta */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Barra de acciones en pantalla */}
      <div className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <button 
          onClick={handleVolver} 
          className="text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1.5"
        >
          ← Volver al Despacho
        </button>
        <button 
          onClick={handleImprimir} 
          className="bg-slate-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2"
        >
          <span>🖨️</span> Imprimir Manifiesto
        </button>
      </div>

      {/* Hoja física / Documento */}
      <div className="max-w-4xl mx-auto bg-white shadow-xl print:shadow-none p-6 print:p-0 text-slate-900 font-sans border border-slate-200 print:border-none">
        
        {/* CABECERA */}
        <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3 mb-3">
          <div className="flex items-center gap-3">
            <img src="/logo-patron.png" alt="Logo Patrón" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none text-slate-900">
                Manifiesto de Pasajeros
              </h1>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 mt-1">
                Empresa de Transportes Nuevo Patrón S.R.L.
              </p>
              <p className="text-[9px] font-mono text-slate-500">RUC: 20615321151</p>
            </div>
          </div>
          <div className="text-right text-[10px] font-mono leading-tight bg-slate-50 print:bg-transparent p-2 rounded border border-slate-200 print:border-none">
            <p><strong>FECHA:</strong> {fechaFormateada}</p>
            <p><strong>HORA:</strong> {turno.hora}</p>
            <p><strong>PLACA:</strong> {turno.placa}</p>
          </div>
        </div>

        {/* DATOS DEL VIAJE Y VEHÍCULO */}
        <div className="grid grid-cols-2 gap-3 mb-3 text-[11px] leading-snug">
          <div className="border border-slate-300 rounded p-2">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider border-b border-slate-200 pb-0.5">
              Ruta y Terminales
            </p>
            <p><strong>Ruta:</strong> San Marcos ⇄ Cajamarca</p>
            <p><strong>Origen:</strong> Terminal Terrestre San Marcos (3N 411)</p>
            <p><strong>Destino:</strong> Bolognesi 318, Cajamarca</p>
          </div>
          <div className="border border-slate-300 rounded p-2">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1 tracking-wider border-b border-slate-200 pb-0.5">
              Unidad de Transporte
            </p>
            <p className="truncate"><strong>Conductor:</strong> {turno.conductor}</p>
            <p><strong>Placa / N° Int:</strong> {turno.placa}</p>
            <p><strong>Modelo:</strong> Toyota HiAce Commuter (15 Pas.)</p>
          </div>
        </div>

        {/* TABLA DE 15 ASIENTOS */}
        <table className="w-full text-left text-[10px] border-collapse border border-slate-400">
          <thead>
            <tr className="bg-slate-900 text-white font-semibold">
              <th className="p-1.5 border border-slate-700 text-center w-10">As.</th>
              <th className="p-1.5 border border-slate-700">Apellidos y Nombres</th>
              <th className="p-1.5 border border-slate-700 text-center w-10">Edad</th>
              <th className="p-1.5 border border-slate-700 text-center w-10">Sexo</th>
              <th className="p-1.5 border border-slate-700 text-center w-20">DNI</th>
              <th className="p-1.5 border border-slate-700 text-center w-24">Origen</th>
              <th className="p-1.5 border border-slate-700 text-center w-24">Destino</th>
              <th className="p-1.5 border border-slate-700 text-center w-24">Firma / Huella</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const p = fila.pasajero;
              const estaLleno = Boolean(p);
              const nombreCompleto = p 
                ? (p.apellidos && p.nombre ? `${p.apellidos}, ${p.nombre}` : p.nombreCompleto || p.nombre || '—')
                : '';
              
              return (
                <tr 
                  key={fila.asiento} 
                  className={`border-b border-slate-300 h-6 ${estaLleno ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <td className={`p-1 text-center font-black text-xs border border-slate-300 ${estaLleno ? 'bg-slate-100 text-slate-900' : 'text-slate-400'}`}>
                    {fila.asiento}
                  </td>

                  {estaLleno ? (
                    <>
                      <td className="p-1 border border-slate-300 font-medium truncate max-w-[180px]">
                        {nombreCompleto}
                      </td>
                      <td className="p-1 border border-slate-300 text-center">{p.edad || '—'}</td>
                      <td className="p-1 border border-slate-300 text-center">{p.sexo || '—'}</td>
                      <td className="p-1 border border-slate-300 text-center font-mono font-medium">{p.dni}</td>
                      <td className="p-1 border border-slate-300 text-center truncate">{p.origen || 'San Marcos'}</td>
                      <td className="p-1 border border-slate-300 text-center truncate">{p.destino || 'Cajamarca'}</td>
                      <td className="p-1 border border-slate-300 text-center"></td>
                    </>
                  ) : (
                    <>
                      <td className="p-1 border border-slate-300 text-slate-400 italic text-[9px]">— Disponible —</td>
                      <td className="p-1 border border-slate-300"></td>
                      <td className="p-1 border border-slate-300"></td>
                      <td className="p-1 border border-slate-300"></td>
                      <td className="p-1 border border-slate-300 text-center text-slate-400 text-[9px]">San Marcos</td>
                      <td className="p-1 border border-slate-300 text-center text-slate-400 text-[9px]">Cajamarca</td>
                      <td className="p-1 border border-slate-300 text-center text-slate-300 text-[9px]">___________</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RESUMEN RÁPIDO */}
        <div className="mt-3 flex justify-between items-center text-[11px] border-t border-slate-300 pt-2 font-mono">
          <div>
            <span><strong>OCUPADOS:</strong> {pasajerosRegistrados.length} / 15</span>
            <span className="ml-4 text-slate-600"><strong>LIBRES:</strong> {15 - pasajerosRegistrados.length}</span>
          </div>
          <div className="text-[9px] text-slate-500">
            Emisión: {fechaEmision}
          </div>
        </div>

        {/* FIRMAS DE RESPONSABILIDAD */}
        <div className="grid grid-cols-2 gap-16 mt-8 text-xs break-inside-avoid">
          <div className="text-center">
            <div className="border-b border-slate-800 w-44 mx-auto mb-1"></div>
            <p className="font-bold text-[11px]">Conductor Responsable</p>
            <p className="text-[9px] text-slate-600 truncate">{turno.conductor}</p>
          </div>
          <div className="text-center">
            <div className="border-b border-slate-800 w-44 mx-auto mb-1"></div>
            <p className="font-bold text-[11px]">Despacho / Control</p>
            <p className="text-[9px] text-slate-600">Agencia San Marcos</p>
          </div>
        </div>

        {/* PIE LEGAL SUTRAN */}
        <div className="mt-6 text-[8px] text-slate-500 text-center border-t border-slate-200 pt-1.5 leading-tight break-inside-avoid">
          <p>Documento oficial emitido conforme al D.S. N° 017-2009-MTC (Reglamento Nacional de Administración de Transporte).</p>
          <p className="italic">Uso exclusivo para control de garita, fiscalización de SUTRAN y manifiesto de ruta.</p>
        </div>

      </div>
    </div>
  );
}