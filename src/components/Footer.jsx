import { useState } from 'react';
import Logo from './Logo';

export default function Footer() {
  const [showReclamaciones, setShowReclamaciones] = useState(false);

  return (
    <>
      <footer className="bg-white border-t border-slate-200 pt-12 pb-8 mt-auto">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          
          <div>
            <Logo />
            <p className="text-sm text-slate-500 leading-relaxed mt-4">
              Empresa de Transportes Nuevo Patrón San Marcos S.R.L. Transporte interprovincial seguro y puntual en la ruta San Marcos ⇄ Cajamarca.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Enlaces de Interés</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><a href="#" className="hover:text-brand-orange transition-colors">Inicio</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Nuestras Rutas</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Horarios</a></li>
              <li>
                <button onClick={() => setShowReclamaciones(true)} className="hover:text-brand-orange transition-colors flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Libro de Reclamaciones
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4">Información Legal</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li><strong className="text-slate-700">Razón Social:</strong> EMPRESA DE TRANSPORTES NUEVO PATRON SAN MARCOS S.R.L.</li>
              <li><strong className="text-slate-700">RUC:</strong> 20615321151</li>
              <li><strong className="text-slate-700">Domicilio:</strong> AV. VIA EVITAMIENTO SUR CUADRA NRO. 10 INT. 01 BAR. SAN MARTIN CAJAMARCA</li>
              <li><strong className="text-slate-700">Estado:</strong> <span className="text-emerald-600 font-bold">ACTIVO | HABIDO</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-6 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Nuevo Patrón S.R.L. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-slate-700 transition-colors">Términos y Condiciones</a>
            <a href="#" className="hover:text-slate-700 transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </footer>

      {/* MODAL LIBRO DE RECLAMACIONES */}
      {showReclamaciones && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-black text-lg">Libro de Reclamaciones</h2>
              <button onClick={() => setShowReclamaciones(false)} className="text-white hover:text-red-200 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571), este establecimiento cuenta con un Libro de Reclamaciones virtual.</p>
              <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); alert("Reclamo registrado con éxito."); setShowReclamaciones(false); }}>
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="Nombres" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" required />
                  <input type="text" placeholder="Apellidos" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" required />
                </div>
                <input type="email" placeholder="Correo electrónico" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" required />
                <select className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm text-slate-600">
                  <option>Tipo de Reclamo</option>
                  <option>Reclamo (Disconformidad con el servicio)</option>
                  <option>Queja (Malestar con la atención)</option>
                </select>
                <textarea placeholder="Detalle de su reclamo" rows="3" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm" required></textarea>
                <button type="submit" className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all">
                  Enviar Reclamo
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
