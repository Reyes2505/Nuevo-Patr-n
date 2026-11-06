import { useState, useEffect } from 'react';
import SeatMap from './SeatMap';
import CheckoutModal from './CheckoutModal';
import { useUser } from '../context/UserContext';

export default function SeatDrawer({ isOpen, onClose, turno, origen, destino, misBoletos }) {
  const { user } = useUser();
  const [asientosSeleccionados, setAsientosSeleccionados] = useState([]);
  const [pasajeros, setPasajeros] = useState({});
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerActive, setIsTimerActive] = useState(false);
  
  const [isVisible, setIsVisible] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  
  const [modoCompra, setModoCompra] = useState('para_mi');

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setTimeout(() => setIsEntering(true), 20); 
    } else {
      setIsEntering(false);
      const timer = setTimeout(() => {
        setIsVisible(false);
        setAsientosSeleccionados([]);
        setPasajeros({});
        setIsTimerActive(false);
        setTimeLeft(180);
        setIsFullscreen(false);
        setModoCompra('para_mi');
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && asientosSeleccionados.length > 0) {
      setAsientosSeleccionados([]);
      setPasajeros({});
      setIsTimerActive(false);
      setTimeLeft(180);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, asientosSeleccionados.length]);

  const getDatosUsuario = () => {
    if (!user) return { nombre: '', apellidos: '', dni: '', edad: '', sexo: '' };
    const partes = (user.nombre || '').split(' ');
    const nombre = partes[0] || '';
    const apellidos = partes.slice(1).join(' ') || '';
    return { nombre, apellidos, dni: user.dni || '', edad: '', sexo: '' };
  };

  const handleSeatToggle = (num) => {
    if (asientosSeleccionados.includes(num)) {
      setAsientosSeleccionados(asientosSeleccionados.filter(n => n !== num));
      const p = { ...pasajeros };
      delete p[num];
      setPasajeros(p);
      if (asientosSeleccionados.length === 1) { setIsTimerActive(false); setTimeLeft(180); }
    } else {
      setAsientosSeleccionados([...asientosSeleccionados, num]);
      const nuevosPasajeros = { ...pasajeros };
      if (modoCompra === 'para_mi' && asientosSeleccionados.length === 0) {
        nuevosPasajeros[num] = getDatosUsuario();
      } else {
        nuevosPasajeros[num] = { nombre: '', apellidos: '', dni: '', edad: '', sexo: '' };
      }
      setPasajeros(nuevosPasajeros);
      if (!isTimerActive) setIsTimerActive(true);
    }
  };

  const handleCambiarModo = (nuevoModo) => {
    setModoCompra(nuevoModo);
    if (asientosSeleccionados.length > 0) {
      const nuevosPasajeros = { ...pasajeros };
      const primerAsiento = [...asientosSeleccionados].sort((a,b)=>a-b)[0];
      if (nuevoModo === 'para_mi') {
        nuevosPasajeros[primerAsiento] = getDatosUsuario();
      } else {
        nuevosPasajeros[primerAsiento] = { nombre: '', apellidos: '', dni: '', edad: '', sexo: '' };
      }
      setPasajeros(nuevosPasajeros);
    }
  };

  const handlePasajeroChange = (seat, field, value) => {
    setPasajeros({ ...pasajeros, [seat]: { ...pasajeros[seat], [field]: value } });
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const isFormularioCompleto = asientosSeleccionados.every(seat => {
    const p = pasajeros[seat] || {};
    return p.nombre?.trim() && p.apellidos?.trim() && p.dni?.length === 8 && p.edad && p.sexo;
  });

  if (!isVisible || !turno) return null;

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d140345.20891334774!2d-78.4190239880696!3d-7.23721881174142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s0x91b25b1049888c41%3A0x3d1050867546664a!2sTerminal%20Terrestre%20San%20Marcos%2C%203N%20411%2C%20Cajamarca%2006003!3m2!1d-7.167088799999999!2d-78.5015892!4m5!1s0x91b217c9aa61b89d%3A0x50c51759b06a9026!2sEmpresa%20transportes%20Divino%20Patr%C3%B3n%20San%20Marcos%20SRL.%2C%20Bolognesi%20318%2C%20San%20Marcos%2006321!3m2!1d-7.3363301!2d-78.17207719999999!5e1!3m2!1ses-419!2spe!4v1793914688439!5m2!1ses-419!2spe";

  return (
    <div 
      className={`fixed inset-0 z-[100] flex transition-colors duration-300
        items-end md:items-stretch md:justify-end
        ${isEntering ? 'bg-black/60' : 'bg-black/0'}`}
    >
      <div 
        className={`bg-white shadow-2xl flex flex-col relative 
          transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]
          w-full
          ${isEntering 
            ? 'translate-y-0 md:translate-x-0' 
            : 'translate-y-full md:translate-y-0 md:translate-x-full'
          }
          ${isFullscreen 
            ? 'h-full max-h-full rounded-none md:max-w-full' 
            : 'h-[92vh] md:h-full rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] md:max-w-lg'
          }
        `}
      >
        {/* Handle para arrastrar en móvil */}
        <div className="md:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 mb-1 flex-shrink-0"></div>

        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50 shrink-0">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selección de asientos</p>
            <h2 className="text-lg md:text-xl font-black text-slate-900">{turno.hora} · {turno.placa}</h2>
            <p className="text-xs text-slate-500 mb-2 md:mb-3">{origen} → {destino}</p>
            
            <button onClick={() => setIsFullscreen(!isFullscreen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm border active:scale-95
                ${isFullscreen ? 'bg-slate-900 text-white border-slate-900 hover:bg-black' : 'bg-white text-slate-600 border-slate-200 hover:text-brand-orange hover:border-brand-orange hover:bg-orange-50'}`}>
              {isFullscreen ? (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 14h6m0 0v6m0-6l-7 7m17-11h-6m0 0V4m0 6l7-7"/></svg>Minimizar</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/></svg>Ampliar</>
              )}
            </button>
          </div>
          
          <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-red-500 transition-colors active:scale-90 ml-4 shrink-0">
            <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Contenido */}
        <div className="flex-grow overflow-y-auto custom-scrollbar bg-[#F8F9FA]">
          <div className={`max-w-7xl mx-auto p-4 md:p-6 ${isFullscreen ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'space-y-4 md:space-y-6'}`}>
            
            {/* COLUMNA IZQUIERDA */}
            <div className={`${isFullscreen ? 'lg:col-span-7' : ''} space-y-4 md:space-y-6`}>
              
              {isFullscreen && (
                <div className="bg-[#18191B] text-white p-5 rounded-2xl shadow-lg flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Ruta seleccionada</p>
                    <h3 className="text-lg font-black">{origen} <span className="text-brand-orange">→</span> {destino}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Salida</p>
                    <p className="text-lg font-black text-brand-orange">{turno.hora}</p>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg>
                    Mapa del Vehículo
                  </h3>
                  <span className="text-[10px] font-black text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full">{asientosSeleccionados.length} seleccionados</span>
                </div>
                <SeatMap 
                  selectedSeats={asientosSeleccionados} 
                  onSeatToggle={handleSeatToggle} 
                  occupiedSeatsExternos={turno.ocupados || []}
                  darkMode={false}
                />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-100 flex items-center gap-2 bg-slate-50/50">
                  <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  <h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Ruta del viaje</h3>
                </div>
                <div className={`w-full relative transition-all duration-500 ${isFullscreen ? 'h-[350px]' : 'h-[180px] md:h-[200px]'}`}>
                  <iframe title="Ruta Google Maps" src={googleMapsUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade" className="absolute inset-0"></iframe>
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA */}
            <div className={`${isFullscreen ? 'lg:col-span-5' : ''}`}>
              {asientosSeleccionados.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
                  
                  {/* Selector de modo de compra */}
                  <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">¿Para quién es este viaje?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleCambiarModo('para_mi')}
                        className={`flex items-center gap-2 p-2 md:p-3 rounded-xl border-2 transition-all duration-200 ${
                          modoCompra === 'para_mi' 
                            ? 'border-brand-orange bg-orange-50 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          modoCompra === 'para_mi' ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        </div>
                        <div className="text-left min-w-0">
                          <p className={`text-[11px] md:text-xs font-black truncate ${modoCompra === 'para_mi' ? 'text-brand-orange' : 'text-slate-900'}`}>Para mí</p>
                          <p className="text-[9px] text-slate-500 font-medium truncate">Auto</p>
                        </div>
                      </button>
                      
                      <button
                        onClick={() => handleCambiarModo('para_tercero')}
                        className={`flex items-center gap-2 p-2 md:p-3 rounded-xl border-2 transition-all duration-200 ${
                          modoCompra === 'para_tercero' 
                            ? 'border-brand-orange bg-orange-50 shadow-sm' 
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`w-7 h-7 md:w-8 md:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          modoCompra === 'para_tercero' ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </div>
                        <div className="text-left min-w-0">
                          <p className={`text-[11px] md:text-xs font-black truncate ${modoCompra === 'para_tercero' ? 'text-brand-orange' : 'text-slate-900'}`}>Tercero</p>
                          <p className="text-[9px] text-slate-500 font-medium truncate">Otra persona</p>
                        </div>
                      </button>
                    </div>
                    
                    {modoCompra === 'para_mi' && user && (
                      <p className="text-[10px] text-emerald-700 font-bold mt-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                        Tus datos se cargan automáticamente
                      </p>
                    )}
                  </div>

                  <div className="p-3 md:p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Datos de pasajeros</h3>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 normal-case">Obligatorios</span>
                  </div>
                  
                  <div className="p-3 md:p-5 space-y-3 md:space-y-4 flex-grow overflow-y-auto">
                    {asientosSeleccionados.sort((a,b)=>a-b).map((seat, index) => {
                      const p = pasajeros[seat] || { nombre: '', apellidos: '', dni: '', edad: '', sexo: '' };
                      const isComplete = p.nombre?.trim() && p.apellidos?.trim() && p.dni?.length === 8 && p.edad && p.sexo;
                      const esPrimerAsiento = index === 0 && modoCompra === 'para_mi';
                      
                      return (
                        <div key={seat}
                          className={`p-3 md:p-4 rounded-xl border transition-all duration-300 ${isComplete ? 'bg-emerald-50/40 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-2 md:mb-3 pb-2 border-b border-slate-200/50">
                            <div className="flex items-center gap-2">
                              <span className={`w-6 h-6 md:w-7 md:h-7 text-[10px] md:text-xs bg-brand-orange text-white rounded-lg flex items-center justify-center font-black shadow-sm`}>{seat}</span>
                              <span className={`text-[11px] md:text-xs font-black text-slate-700`}>Asiento {seat}</span>
                              {esPrimerAsiento && (
                                <span className="text-[8px] md:text-[9px] font-black text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-full uppercase">Tú</span>
                              )}
                            </div>
                            {isComplete && (
                              <span className={`w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500 flex items-center justify-center`}>
                                <svg className={`w-2.5 h-2.5 md:w-3 md:h-3 text-white`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                            <input type="text" placeholder="Nombres" value={p.nombre} onChange={(e) => handlePasajeroChange(seat, 'nombre', e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 md:p-2.5 text-xs md:text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                            <input type="text" placeholder="Apellidos" value={p.apellidos} onChange={(e) => handlePasajeroChange(seat, 'apellidos', e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 md:p-2.5 text-xs md:text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                            <input type="text" placeholder="DNI" maxLength={8} value={p.dni} onChange={(e) => handlePasajeroChange(seat, 'dni', e.target.value.replace(/\D/g,'').slice(0,8))} className="bg-white border border-slate-200 rounded-lg p-2 md:p-2.5 text-xs md:text-sm font-mono font-bold focus:outline-none focus:border-brand-orange"/>
                            <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                              <input type="number" placeholder="Edad" value={p.edad} onChange={(e) => handlePasajeroChange(seat, 'edad', e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 md:p-2.5 text-xs md:text-sm font-mono font-bold focus:outline-none focus:border-brand-orange"/>
                              <select value={p.sexo} onChange={(e) => handlePasajeroChange(seat, 'sexo', e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 md:p-2.5 text-xs md:text-sm font-bold focus:outline-none focus:border-brand-orange">
                                <option value="">Sexo</option>
                                <option value="M">M</option>
                                <option value="F">F</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className={`bg-white rounded-2xl border border-dashed border-slate-300 h-full flex flex-col items-center justify-center p-6 md:p-8 text-center min-h-[250px] md:min-h-[300px]`}>
                  <div className={`w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mb-3 md:mb-4`}>
                    <svg className={`w-8 h-8 md:w-10 md:h-10 text-slate-300`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                  </div>
                  <h3 className={`text-base md:text-lg font-black text-slate-800 mb-1`}>Selecciona tus asientos</h3>
                  <p className={`text-xs md:text-sm text-slate-500 max-w-xs`}>Toca los asientos disponibles del mapa para comenzar.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-white shrink-0 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)] z-10">
          <div className={`flex justify-between items-center mb-3 md:mb-4 ${isFullscreen ? 'max-w-7xl mx-auto w-full' : ''}`}>
            <div>
              <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Total a pagar</p>
              <p className={`text-2xl md:text-3xl font-black text-slate-900`}>S/ {(asientosSeleccionados.length * 10).toFixed(2)}</p>
            </div>
            {isTimerActive && (
              <div className="text-right">
                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Reservado por</p>
                <p className={`text-base md:text-xl font-black font-mono ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-brand-orange'}`}>{formatTime(timeLeft)}</p>
              </div>
            )}
          </div>
          <div className={`${isFullscreen ? 'max-w-7xl mx-auto w-full' : ''}`}>
            <button 
              onClick={() => setIsPaymentOpen(true)}
              disabled={asientosSeleccionados.length === 0 || !isFormularioCompleto}
              className={`w-full py-3 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2
                ${asientosSeleccionados.length > 0 && isFormularioCompleto
                  ? 'bg-[#18191B] text-white hover:bg-black shadow-lg active:scale-[0.98]' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}>
              {asientosSeleccionados.length === 0 
                ? 'Selecciona un asiento' 
                : !isFormularioCompleto 
                  ? 'Completa los datos' 
                  : 'Ir al pago'}
              {asientosSeleccionados.length > 0 && isFormularioCompleto && (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              )}
            </button>
          </div>
        </div>
      </div>

      <CheckoutModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPagoCompletado={() => { setIsTimerActive(false); }}
        onIrAMisViajes={() => { onClose(); window.location.href = '/mis-viajes'; }}
        selectedSeats={asientosSeleccionados}
        total={asientosSeleccionados.length * 10}
        turno={turno}
        origen={origen}
        destino={destino}
        pasajeros={pasajeros}
      />
    </div>
  );
}
