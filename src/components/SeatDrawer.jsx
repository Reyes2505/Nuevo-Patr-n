import { useState, useEffect } from 'react';
import SeatMap from './SeatMap';
import CheckoutModal from './CheckoutModal';
import { useUser } from '../context/UserContext';

const ModalDeclaracion = ({ isOpen, onClose, onAceptar, onSolicitarImpreso, costoImpresion }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-card-enter">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <div>
            <h3 className="font-black text-lg">Declaración Jurada</h3>
            <p className="text-xs text-slate-300">Autorización y Descargo de Responsabilidad</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-red-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto bg-slate-100 p-4">
          <iframe src="/declaracion-jurada.pdf" className="w-full h-[400px] border-0 rounded-lg shadow-sm" title="Declaración Jurada" />
          <p className="text-xs text-slate-500 mt-3 text-center">Por favor, lea atentamente el documento. Al aceptar, usted confirma que ha leído y está de acuerdo con los términos.</p>
        </div>
        <div className="p-4 bg-white border-t border-slate-200 flex flex-col sm:flex-row gap-3">
          <button onClick={onAceptar} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl transition-colors shadow-md">Aceptar Digitalmente (Gratis)</button>
          <button onClick={onSolicitarImpreso} className="flex-1 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 font-black py-3 rounded-xl transition-colors">Solicitar Impresión (+ S/ {costoImpresion.toFixed(2)})</button>
        </div>
      </div>
    </div>
  );
};

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

  const [modalDeclaracionAbierto, setModalDeclaracionAbierto] = useState(false);
  const [declaracionAceptada, setDeclaracionAceptada] = useState(false);
  const [solicitaImpresion, setSolicitaImpresion] = useState(false);
  const COSTO_IMPRESION = 0.50;
  const [requiereDeclaracion, setRequiereDeclaracion] = useState(false);

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
        setDeclaracionAceptada(false);
        setSolicitaImpresion(false);
        setRequiereDeclaracion(false);
        setModalDeclaracionAbierto(false);
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

  const calcularEdad = (fechaNacimiento) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad > 0 ? edad : '';
  };

  const getDatosUsuario = () => {
    if (!user) return { nombre: '', apellidos: '', dni: '', edad: '', sexo: '' };
    const nombreCompleto = (user.nombre || '').trim();
    const partes = nombreCompleto.split(/\s+/);
    let nombre = ''; let apellidos = '';
    if (partes.length === 1) { nombre = partes[0]; }
    else if (partes.length === 2) { nombre = partes[0]; apellidos = partes[1]; }
    else if (partes.length === 3) { nombre = partes[0]; apellidos = `${partes[1]} ${partes[2]}`; }
    else if (partes.length >= 4) { nombre = `${partes[0]} ${partes[1]}`; apellidos = partes.slice(2).join(' '); }
    return { nombre, apellidos, dni: user.dni || '', edad: calcularEdad(user.fechaNacimiento) || '', sexo: user.sexo || '' };
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
    let nuevoValor = value;
    if (field === 'edad') {
      const num = parseInt(value, 10);
      if (value === '') nuevoValor = '';
      else if (isNaN(num) || num < 0) nuevoValor = 0;
      else if (num > 120) nuevoValor = 120;
    }
    const nuevosPasajeros = { ...pasajeros, [seat]: { ...pasajeros[seat], [field]: nuevoValor } };
    setPasajeros(nuevosPasajeros);

    const requiere = Object.values(nuevosPasajeros).some(p => {
      const edad = parseInt(p.edad, 10);
      return !isNaN(edad) && (edad < 13 || edad >= 80);
    });
    setRequiereDeclaracion(requiere);
    if (!requiere) { setDeclaracionAceptada(false); setSolicitaImpresion(false); }
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  
  const totalBase = asientosSeleccionados.length * 10;
  const totalFinal = totalBase + (solicitaImpresion ? COSTO_IMPRESION : 0);

  const isFormularioCompleto = asientosSeleccionados.every(seat => {
    const p = pasajeros[seat] || {};
    return p.nombre?.trim() && p.apellidos?.trim() && p.dni?.length === 8 && p.edad !== '' && p.sexo;
  });

  if (!isVisible || !turno) return null;

  const googleMapsUrl = "https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d140345.20891334774!2d-78.4190239880696!3d-7.23721881174142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s0x91b25b1049888c41%3A0x3d1050867546664a!2sTerminal%20Terrestre%20San%20Marcos%2C%203N%20411%2C%20Cajamarca%2006003!3m2!1d-7.167088799999999!2d-78.5015892!4m5!1s0x91b217c9aa61b89d%3A0x50c51759b06a9026!2sEmpresa%20transportes%20Divino%20Patr%C3%B3n%20San%20Marcos%20SRL.%2C%20Bolognesi%20318%2C%20San%20Marcos%2006321!3m2!1d-7.3363301!2d-78.17207719999999!5e1!3m2!1ses-419!2spe!4v1793914688439!5m2!1ses-419!2spe";

  return (
    <div className={`fixed inset-0 z-[100] flex transition-colors duration-300 items-end md:items-stretch md:justify-end ${isEntering ? 'bg-black/60' : 'bg-black/0'}`}>
      <div className={`bg-white shadow-2xl flex flex-col relative transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] w-full ${isEntering ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'} ${isFullscreen ? 'h-full max-h-full rounded-none md:max-w-full' : 'h-[92vh] md:h-full rounded-t-[2rem] md:rounded-t-none md:rounded-l-[2rem] md:max-w-lg'}`}>
        
        <div className="md:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto mt-2 mb-1 flex-shrink-0"></div>

        <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-start bg-slate-50 shrink-0">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selección de asientos</p>
            <h2 className="text-lg md:text-xl font-black text-slate-900">{turno.hora} · {turno.placa}</h2>
            <p className="text-xs text-slate-500 mb-2 md:mb-3">{origen} → {destino}</p>
            
            <button onClick={() => setIsFullscreen(!isFullscreen)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-300 shadow-sm border active:scale-95 ${isFullscreen ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:text-brand-orange hover:border-brand-orange'}`}>
              {isFullscreen ? 'Minimizar' : 'Ampliar'}
            </button>
          </div>
          <button onClick={onClose} className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-red-500 ml-4 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="flex-grow overflow-y-auto bg-[#F8F9FA]">
          <div className={`max-w-7xl mx-auto p-4 md:p-6 ${isFullscreen ? 'grid grid-cols-1 lg:grid-cols-12 gap-6' : 'space-y-4 md:space-y-6'}`}>
            
            <div className={`${isFullscreen ? 'lg:col-span-7' : ''} space-y-4 md:space-y-6`}>
              <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-3 md:mb-4">
                  <h3 className="text-xs font-black text-slate-500 uppercase tracking-wider">Mapa del Vehículo</h3>
                  <span className="text-[10px] font-black text-brand-orange bg-orange-50 px-2.5 py-1 rounded-full">{asientosSeleccionados.length} seleccionados</span>
                </div>
                <SeatMap selectedSeats={asientosSeleccionados} onSeatToggle={handleSeatToggle} occupiedSeatsExternos={turno.ocupados || []} />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 border-b border-slate-100 bg-slate-50/50"><h3 className="text-[11px] font-black text-slate-700 uppercase tracking-wider">Ruta del viaje</h3></div>
                <div className={`w-full relative ${isFullscreen ? 'h-[350px]' : 'h-[180px] md:h-[200px]'}`}>
                  <iframe title="Ruta Google Maps" src={googleMapsUrl} width="100%" height="100%" style={{ border: 0 }} className="absolute inset-0"></iframe>
                </div>
              </div>
            </div>

            <div className={`${isFullscreen ? 'lg:col-span-5' : ''}`}>
              {asientosSeleccionados.length > 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm h-full flex flex-col">
                  <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">¿Para quién es este viaje?</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => handleCambiarModo('para_mi')} className={`flex items-center gap-2 p-2 md:p-3 rounded-xl border-2 transition-all ${modoCompra === 'para_mi' ? 'border-brand-orange bg-orange-50' : 'border-slate-200 bg-white'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${modoCompra === 'para_mi' ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                        </div>
                        <div className="text-left"><p className={`text-[11px] font-black ${modoCompra === 'para_mi' ? 'text-brand-orange' : 'text-slate-900'}`}>Para mí</p><p className="text-[9px] text-slate-500">Auto</p></div>
                      </button>
                      <button onClick={() => handleCambiarModo('para_tercero')} className={`flex items-center gap-2 p-2 md:p-3 rounded-xl border-2 transition-all ${modoCompra === 'para_tercero' ? 'border-brand-orange bg-orange-50' : 'border-slate-200 bg-white'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${modoCompra === 'para_tercero' ? 'bg-brand-orange text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </div>
                        <div className="text-left"><p className={`text-[11px] font-black ${modoCompra === 'para_tercero' ? 'text-brand-orange' : 'text-slate-900'}`}>Tercero</p><p className="text-[9px] text-slate-500">Otra persona</p></div>
                      </button>
                    </div>
                  </div>

                  <div className="p-3 md:p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Datos de pasajeros</h3>
                    <span className="text-[9px] font-bold text-slate-400">Obligatorios</span>
                  </div>
                  
                  <div className="p-3 md:p-5 space-y-3 md:space-y-4 flex-grow overflow-y-auto">
                    {asientosSeleccionados.sort((a,b)=>a-b).map((seat, index) => {
                      const p = pasajeros[seat] || { nombre: '', apellidos: '', dni: '', edad: '', sexo: '' };
                      const isComplete = p.nombre?.trim() && p.apellidos?.trim() && p.dni?.length === 8 && p.edad !== '' && p.sexo;
                      const esPrimerAsiento = index === 0 && modoCompra === 'para_mi';
                      const esMenorOAdultoMayor = p.edad !== '' && (parseInt(p.edad) < 13 || parseInt(p.edad) >= 80);
                      
                      return (
                        <div key={seat} className={`p-3 md:p-4 rounded-xl border transition-all ${isComplete ? 'bg-emerald-50/40 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center justify-between mb-2 md:mb-3 pb-2 border-b border-slate-200/50">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 text-[10px] bg-brand-orange text-white rounded-lg flex items-center justify-center font-black">{seat}</span>
                              <span className="text-[11px] font-black text-slate-700">Asiento {seat}</span>
                            </div>
                            {isComplete && (
                              <span className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                              </span>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-1.5">
                            <input type="text" placeholder="Nombres" value={p.nombre} onChange={(e) => handlePasajeroChange(seat, 'nombre', e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:border-brand-orange outline-none"/>
                            <input type="text" placeholder="Apellidos" value={p.apellidos} onChange={(e) => handlePasajeroChange(seat, 'apellidos', e.target.value)} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:border-brand-orange outline-none"/>
                            <input type="text" placeholder="DNI" maxLength={8} value={p.dni} onChange={(e) => handlePasajeroChange(seat, 'dni', e.target.value.replace(/\D/g,'').slice(0,8))} className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold focus:border-brand-orange outline-none"/>
                            
                            <div className="grid grid-cols-2 gap-1.5">
                              <input type="number" placeholder="Edad" value={p.edad} onChange={(e) => handlePasajeroChange(seat, 'edad', e.target.value)} disabled={esPrimerAsiento} className={`border rounded-lg p-2 text-xs font-mono font-bold outline-none ${esPrimerAsiento ? 'bg-slate-100 text-slate-500' : 'bg-white'} ${esMenorOAdultoMayor ? 'border-red-400 bg-red-50' : 'border-slate-200'}`} />
                              <select value={p.sexo} onChange={(e) => handlePasajeroChange(seat, 'sexo', e.target.value)} disabled={esPrimerAsiento} className={`border rounded-lg p-2 text-xs font-bold outline-none ${esPrimerAsiento ? 'bg-slate-100 text-slate-500' : 'bg-white'}`}>
                                <option value="">Sexo</option>
                                <option value="Masculino">Masculino</option>
                                <option value="Femenino">Femenino</option>
                                <option value="Otro">Otro</option>
                              </select>
                            </div>
                          </div>

                          {esMenorOAdultoMayor && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                              <div>
                                <p className="text-[10px] font-bold text-amber-700 leading-tight">Requiere Declaración Jurada.</p>
                                <button type="button" onClick={() => setModalDeclaracionAbierto(true)} className="text-[10px] font-black text-brand-orange underline mt-1">Leer y firmar aquí</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-slate-300 h-full flex flex-col items-center justify-center p-6 text-center min-h-[250px]">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
                  </div>
                  <h3 className="text-base font-black text-slate-800">Selecciona tus asientos</h3>
                  <p className="text-xs text-slate-500">Toca los asientos disponibles para comenzar.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-6 border-t border-slate-200 bg-white shrink-0 z-10 shadow-[0_-10px_30px_-15px_rgba(0,0,0,0.1)]">
          {requiereDeclaracion && !declaracionAceptada && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs font-bold text-red-700">Falta firmar la Declaración Jurada.</p>
              <button type="button" onClick={() => setModalDeclaracionAbierto(true)} className="text-xs font-black bg-red-600 text-white px-3 py-1.5 rounded-lg">Firmar ahora</button>
            </div>
          )}

          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total a pagar</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl md:text-3xl font-black text-slate-900">S/ {totalFinal.toFixed(2)}</p>
                {solicitaImpresion && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Incluye impresión (+S/0.50)</span>}
              </div>
            </div>
            {isTimerActive && <div className="text-right"><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reservado por</p><p className={`text-base md:text-xl font-black font-mono ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-brand-orange'}`}>{formatTime(timeLeft)}</p></div>}
          </div>

          <button 
            onClick={() => setIsPaymentOpen(true)}
            disabled={asientosSeleccionados.length === 0 || !isFormularioCompleto || (requiereDeclaracion && !declaracionAceptada)}
            className={`w-full py-3 md:py-4 rounded-xl font-black text-xs md:text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${asientosSeleccionados.length > 0 && isFormularioCompleto && (!requiereDeclaracion || declaracionAceptada) ? 'bg-[#18191B] text-white hover:bg-black shadow-lg' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
          >
            {asientosSeleccionados.length === 0 ? 'Selecciona un asiento' : !isFormularioCompleto ? 'Completa los datos' : (requiereDeclaracion && !declaracionAceptada) ? 'Falta firmar declaración' : 'Ir al pago'}
          </button>
        </div>
      </div>

      <ModalDeclaracion 
        isOpen={modalDeclaracionAbierto} 
        onClose={() => setModalDeclaracionAbierto(false)}
        costoImpresion={COSTO_IMPRESION}
        onAceptar={() => {
          setDeclaracionAceptada(true);
          setSolicitaImpresion(false);
          setModalDeclaracionAbierto(false);
        }}
        onSolicitarImpreso={() => {
          setDeclaracionAceptada(true);
          setSolicitaImpresion(true);
          setModalDeclaracionAbierto(false);
        }}
      />

      <CheckoutModal 
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPagoCompletado={() => { setIsTimerActive(false); }}
        onIrAMisViajes={() => { onClose(); window.location.href = '/mis-viajes'; }}
        selectedSeats={asientosSeleccionados}
        total={totalFinal}
        turno={turno}
        origen={origen}
        destino={destino}
        pasajeros={pasajeros}
        declaracionFirmada={declaracionAceptada}
        solicitaImpresion={solicitaImpresion}
      />
    </div>
  );
}
