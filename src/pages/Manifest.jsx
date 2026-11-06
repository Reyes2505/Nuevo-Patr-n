import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

export default function Manifest() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const pasajerosRegistrados = location.state?.pasajeros || [];
  const turno = location.state?.turno || { hora: '—', placa: '—', conductor: '—', fecha: new Date().toISOString().split('T')[0] };
  
  const mapaPasajeros = {};
  pasajerosRegistrados.forEach(p => {
    const num = parseInt(p.asiento);
    if (!isNaN(num)) {
      mapaPasajeros[num] = p;
    }
  });

  const filas = [];
  for (let i = 1; i <= 15; i++) {
    filas.push({
      asiento: i,
      pasajero: mapaPasajeros[i] || null,
    });
  }
  
  const fechaFormateada = new Date(turno.fecha + 'T12:00:00').toLocaleDateString('es-PE', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  const handleImprimir = () => window.print();
  const handleVolver = () => navigate('/admin/dispatch');

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 print:bg-white print:p-0">
      
      <div className="max-w-5xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <button onClick={handleVolver} className="text-sm font-bold text-slate-600 hover:text-brand-orange transition-colors flex items-center gap-2">
          ← Volver al Despacho
        </button>
        <button onClick={handleImprimir} className="bg-slate-900 hover:bg-black text-white font-black text-xs uppercase tracking-widest px-6 py-3 rounded-xl shadow-lg transition-all">
          🖨️ Imprimir Manifiesto
        </button>
      </div>

      <div className="max-w-5xl mx-auto bg-white shadow-2xl print:shadow-none p-8 print:p-4 text-slate-900 font-sans">
        
        {/* CABECERA */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-4">
          <div className="flex items-center gap-4">
            <img src="/logo-patron.png" alt="Logo" className="h-16 w-auto" />
            <div>
              <h1 className="text-2xl font-black uppercase tracking-tight leading-none">Manifiesto de Pasajeros</h1>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">Empresa de Transportes Nuevo Patrón S.R.L.</p>
              <p className="text-[10px] font-mono text-slate-500">RUC: 20615321151</p>
            </div>
          </div>
          <div className="text-right text-[10px] font-mono">
            <p><strong>FECHA:</strong> {fechaFormateada}</p>
            <p><strong>HORA SALIDA:</strong> {turno.hora}</p>
            <p><strong>PLACA:</strong> {turno.placa}</p>
            <p><strong>CONDUCTOR:</strong> {turno.conductor}</p>
          </div>
        </div>

        {/* DATOS DEL VIAJE Y CONDUCTOR */}
        <div className="grid grid-cols-2 gap-4 mb-4 text-xs">
          <div className="border border-slate-300 p-2">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Datos del Viaje</p>
            <p><strong>Ruta:</strong> San Marcos ⇄ Cajamarca</p>
            <p><strong>Salida:</strong> Terminal Terrestre San Marcos (3N 411)</p>
            <p><strong>Llegada:</strong> Bolognesi 318, Cajamarca</p>
          </div>
          <div className="border border-slate-300 p-2">
            <p className="text-[9px] font-black uppercase text-slate-500 mb-1">Datos del Conductor</p>
            <p><strong>Nombre:</strong> {turno.conductor}</p>
            <p><strong>Placa:</strong> {turno.placa}</p>
            <p><strong>Vehículo:</strong> Toyota Hiace Commuter</p>
          </div>
        </div>

        {/* TABLA CON 15 FILAS FIJAS */}
        <table className="w-full text-left text-[10px] border-collapse">
          <thead>
            <tr className="bg-slate-900 text-white">
              <th className="p-2 border border-slate-900 text-center w-10">Asiento</th>
              <th className="p-2 border border-slate-900">Nombres y Apellidos</th>
              <th className="p-2 border border-slate-900 text-center w-12">Edad</th>
              <th className="p-2 border border-slate-900 text-center w-12">Sexo</th>
              <th className="p-2 border border-slate-900 text-center w-20">DNI</th>
              <th className="p-2 border border-slate-900 text-center w-24">Origen</th>
              <th className="p-2 border border-slate-900 text-center w-24">Destino</th>
              <th className="p-2 border border-slate-900 text-center w-20">Firma</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => {
              const p = fila.pasajero;
              const estaLleno = p !== null;
              
              return (
                <tr 
                  key={fila.asiento} 
                  className={`border-b border-slate-300 ${estaLleno ? '' : 'bg-slate-50'}`}
                >
                  <td className={`p-2 text-center font-black text-sm border-r border-slate-300 ${estaLleno ? 'bg-slate-100 text-slate-900' : 'bg-slate-50 text-slate-400'}`}>
                    {fila.asiento}
                  </td>

                  {estaLleno ? (
                    <>
                      <td className="p-2 font-semibold">{p.apellidos}, {p.nombre}</td>
                      <td className="p-2 text-center">{p.edad}</td>
                      <td className="p-2 text-center">{p.sexo}</td>
                      <td className="p-2 text-center font-mono">{p.dni}</td>
                      <td className="p-2 text-center">{p.origen || 'San Marcos'}</td>
                      <td className="p-2 text-center">{p.destino || 'Cajamarca'}</td>
                      <td className="p-2 text-center"></td>
                    </>
                  ) : (
                    <>
                      <td className="p-2 text-slate-300 italic text-[9px]">— (disponible) —</td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2"></td>
                      <td className="p-2 text-center text-slate-400 text-[9px]">San Marcos</td>
                      <td className="p-2 text-center text-slate-400 text-[9px]">Cajamarca</td>
                      <td className="p-2 text-center text-slate-300 text-[9px]">_______</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* RESUMEN */}
        <div className="mt-4 flex justify-between items-center text-xs border-t border-slate-300 pt-3">
          <div>
            <p className="font-bold">Total de pasajeros registrados: <span className="text-brand-orange">{pasajerosRegistrados.length}</span></p>
            <p className="text-slate-500 text-[10px]">Asientos disponibles: {15 - pasajerosRegistrados.length}</p>
          </div>
          <div className="text-right text-[9px] text-slate-500">
            <p>Manifiesto generado: {new Date().toLocaleString('es-PE')}</p>
          </div>
        </div>

        {/* FIRMAS */}
        <div className="grid grid-cols-2 gap-12 mt-12 text-xs">
          <div className="text-center">
            <div className="border-b-2 border-slate-900 w-48 mx-auto mb-1"></div>
            <p className="font-bold">Firma del Conductor</p>
            <p className="text-[9px] text-slate-500">{turno.conductor}</p>
            <p className="text-[9px] text-slate-500">DNI: _______________</p>
          </div>
          <div className="text-center">
            <div className="border-b-2 border-slate-900 w-48 mx-auto mb-1"></div>
            <p className="font-bold">Firma del Despachador</p>
            <p className="text-[9px] text-slate-500">Agencia San Marcos</p>
            <p className="text-[9px] text-slate-500">DNI: _______________</p>
          </div>
        </div>

        {/* PIE LEGAL */}
        <div className="mt-8 text-[8px] text-slate-500 text-center border-t border-slate-300 pt-2">
          <p>Este manifiesto se emite en cumplimiento del D.S. N° 017-2009-MTC y el Reglamento Nacional de Administración de Transporte.</p>
          <p>La información contenida es de carácter confidencial y para uso exclusivo de la SUTRAN y autoridades competentes.</p>
          <p className="mt-1 italic">Los asientos marcados como "disponible" deben llenarse manualmente si se recoge un pasajero en el trayecto.</p>
        </div>
      </div>
    </div>
  );
}
