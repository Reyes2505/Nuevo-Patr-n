import { useState } from 'react';
import Logo from './Logo';

export default function Footer() {
  const [showReclamaciones, setShowReclamaciones] = useState(false);

  return (
    <>
      <footer className="bg-slate-900 text-slate-300 pt-16 pb-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10 mb-12">
          
          {/* Columna 1: Marca */}
          <div>
            <div className="bg-white inline-block p-2 rounded-xl mb-4">
              <Logo />
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Empresa de Transportes Nuevo Patrón San Marcos S.R.L. Brindamos servicio de transporte interprovincial seguro y puntual en la ruta San Marcos ⇄ Cajamarca.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-orange transition-colors text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              <a href="#" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-brand-orange transition-colors text-white">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.126-.074-.271-.085-.579-.185-.995-.361-1.75-.752-2.898-2.523-2.985-2.64-.087-.118-.714-.95-.714-1.812 0-.862.453-1.286.613-1.46.161-.174.349-.218.465-.218.116 0 .232.002.333.006.106.004.249-.04.391.299.145.343.492 1.201.534 1.287.043.087.072.188.014.304-.058.116-.116.188-.174.259-.058.071-.121.143-.173.208-.058.072-.119.15-.05.272.069.122.309.508.663.823.456.405.838.532.958.591.121.059.192.048.264-.03.072-.078.313-.363.396-.487.083-.124.166-.103.281-.059.115.044.731.343.857.405.126.062.21.092.24.143.03.052.03.301-.114.706z"/></svg>
              </a>
            </div>
          </div>

          {/* Columna 2: Enlaces Rápidos */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Enlaces de Interés</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-brand-orange transition-colors">Inicio</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Nuestras Rutas</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Horarios de Salida</a></li>
              <li><a href="#" className="hover:text-brand-orange transition-colors">Contacto / WhatsApp</a></li>
              <li>
                <button onClick={() => setShowReclamaciones(true)} className="hover:text-brand-orange transition-colors flex items-center gap-2">
                  <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                  Libro de Reclamaciones
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Información Legal (Actualizada con SUNAT) */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase tracking-widest text-xs">Información Legal</h4>
            <ul className="space-y-3 text-sm text-slate-400">
              <li><strong className="text-slate-200">Razón Social:</strong> EMPRESA DE TRANSPORTES NUEVO PATRON SAN MARCOS S.R.L.</li>
              <li><strong className="text-slate-200">Nombre Comercial:</strong> NUEVO PATRON SAN MARCOS</li>
              <li><strong className="text-slate-200">RUC:</strong> 20615321151</li>
              <li><strong className="text-slate-200">Domicilio Fiscal:</strong> AV. AVENIDA VIA EVITAMIENTO SUR CUADRA NRO. 10 INT. 01 BAR. SAN MARTIN CAJAMARCA - CAJAMARCA - CAJAMARCA</li>
              <li><strong className="text-slate-200">Actividad Económica:</strong> 4922 - Otras actividades de transporte por vía terrestre</li>
              <li><strong className="text-slate-200">Inicio de Actividades:</strong> 17/01/2026</li>
              <li><strong className="text-slate-200">Estado:</strong> <span className="text-emerald-400 font-bold">ACTIVO</span> | <span className="text-emerald-400 font-bold">HABIDO</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Empresa de Transportes Nuevo Patrón San Marcos S.R.L. Todos los derechos reservados.</p>
          <div className="flex gap-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-white transition-colors">Términos y Condiciones</a>
            <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
          </div>
        </div>
      </footer>

      {/* MODAL DEL LIBRO DE RECLAMACIONES (Obligatorio en Perú) */}
      {showReclamaciones && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <h2 className="font-black text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                Libro de Reclamaciones
              </h2>
              <button onClick={() => setShowReclamaciones(false)} className="text-white hover:text-red-200 font-bold text-xl">&times;</button>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-4">Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571), este establecimiento cuenta con un Libro de Reclamaciones virtual.</p>
              <form className="space-y-3">
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
                <button type="button" onClick={() => { alert("Reclamo registrado con éxito. Recibirá una respuesta en un plazo máximo de 30 días hábiles."); setShowReclamaciones(false); }} className="w-full bg-slate-900 hover:bg-black text-white font-bold py-3 rounded-xl transition-all">
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
