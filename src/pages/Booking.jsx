import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SeatMap from '../components/SeatMap';
import CheckoutSummary from '../components/CheckoutSummary';
import Logo from '../components/Logo';
import PaymentModal from '../components/PaymentModal';
import Footer from '../components/Footer';
import { useUser } from '../context/UserContext';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();
  const { misBoletos } = useUser();
  const turnoSeleccionado = location.state?.turno;
  const [origen] = useState(location.state?.origen || 'San Marcos');
  const [destino] = useState(location.state?.destino || 'Cajamarca');

  useEffect(() => { if (!turnoSeleccionado) navigate('/'); }, [turnoSeleccionado, navigate]);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pagoCompletado, setPagoCompletado] = useState(false);
  const [pasajeros, setPasajeros] = useState({});
  const [errorFormulario, setErrorFormulario] = useState('');
  const [asientoExpandido, setAsientoExpandido] = useState(null);

  const asientosVendidos = misBoletos
    .filter(b => b.turno?.id === turnoSeleccionado?.id && b.estadoPago !== 'reembolsado')
    .flatMap(b => b.asientosArray || []);
  const asientosOcupados = [...new Set(asientosVendidos)];

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && selectedSeats.length > 0 && !pagoCompletado) {
      setSelectedSeats([]);
      setPasajeros({});
      setIsTimerActive(false);
      setTimeLeft(180);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, selectedSeats.length, pagoCompletado]);

  const handleSeatToggle = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      const newSeats = selectedSeats.filter(num => num !== seatNumber);
      setSelectedSeats(newSeats);
      const nuevosPasajeros = { ...pasajeros };
      delete nuevosPasajeros[seatNumber];
      setPasajeros(nuevosPasajeros);
      if (asientoExpandido === seatNumber) setAsientoExpandido(null);
      if (newSeats.length === 0) { setIsTimerActive(false); setTimeLeft(180); }
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
      setPasajeros(prev => ({ 
        ...prev, 
        [seatNumber]: { nombre: '', apellidos: '', dni: '', telefono: '', edad: '', sexo: '' } 
      }));
      if (!isTimerActive) setIsTimerActive(true);
      setAsientoExpandido(seatNumber);
    }
  };

  const handlePasajeroChange = (seatNumber, campo, valor) => {
    setPasajeros(prev => ({ ...prev, [seatNumber]: { ...prev[seatNumber], [campo]: valor } }));
    if (errorFormulario) setErrorFormulario('');
  };

  const formatTime = (s) => `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;

  const estaCompleto = (seatNumber) => {
    const p = pasajeros[seatNumber];
    if (!p) return false;
    return p.nombre?.trim() && p.apellidos?.trim() && p.dni?.length === 8 && p.edad && p.sexo;
  };

  const todosCompletos = selectedSeats.length > 0 && selectedSeats.every(seat => estaCompleto(seat));
  const asientosPendientes = selectedSeats.filter(seat => !estaCompleto(seat));

  const handleContinuarPago = () => {
    if (selectedSeats.length === 0) { setErrorFormulario('Selecciona al menos un asiento.'); return; }
    if (!todosCompletos) {
      setErrorFormulario(`Completa los datos de los asientos pendientes: ${asientosPendientes.sort((a,b)=>a-b).join(', ')}`);
      const primerPendiente = asientosPendientes[0];
      if (primerPendiente) setAsientoExpandido(primerPendiente);
      return;
    }
    setErrorFormulario('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (!pagoCompletado) {
      setSelectedSeats([]);
      setPasajeros({});
      setIsTimerActive(false);
      setTimeLeft(180);
    }
  };

  const handlePagoCompletado = () => { setPagoCompletado(true); setIsTimerActive(false); };
  const handleIrAMisViajes = () => { setIsModalOpen(false); navigate('/mis-viajes'); };

  if (!turnoSeleccionado) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-9 h-9 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors text-slate-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            </Link>
            <Logo />
          </div>
          
          <div className="flex items-center gap-3">
            {isTimerActive && !isModalOpen && (
              <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-brand-orange rounded-full animate-pulse"></span>
                <span className="text-xs font-black text-brand-orange font-mono">{formatTime(timeLeft)}</span>
              </div>
            )}
            <div className="text-right hidden sm:block">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{turnoSeleccionado.hora}</p>
              <p className="text-xs font-black text-slate-900">{turnoSeleccionado.placa}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-8 py-6 w-full">
        
        {/* GRID PRINCIPAL (Bento Box) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA (Croquis + Formulario) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Croquis */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <SeatMap 
                selectedSeats={selectedSeats} 
                onSeatToggle={handleSeatToggle} 
                occupiedSeatsExternos={asientosOcupados} 
              />
              {selectedSeats.length > 0 && (
                <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tus asientos:</span>
                  {selectedSeats.sort((a,b)=>a-b).map(n => {
                    const completo = estaCompleto(n);
                    return (
                      <span key={n} className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black ${
                        completo ? 'bg-brand-orange text-white' : 'bg-red-100 text-red-700 border border-red-200'
                      }`}>
                        N° {n} {completo ? '✓' : '!'}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. Formulario de Pasajeros (Acordeón) */}
            {selectedSeats.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Datos de pasajeros</h3>
                  </div>
                  <span className={`text-[10px] font-bold ${todosCompletos ? 'text-emerald-600' : 'text-red-600'}`}>
                    {selectedSeats.length - asientosPendientes.length}/{selectedSeats.length} completos
                  </span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedSeats.sort((a,b)=>a-b).map((seatNumber) => {
                    const p = pasajeros[seatNumber] || { nombre: '', apellidos: '', dni: '', telefono: '', edad: '', sexo: '' };
                    const expandido = asientoExpandido === seatNumber;
                    const completo = estaCompleto(seatNumber);
                    
                    return (
                      <div key={seatNumber} className={completo ? '' : 'bg-red-50/20'}>
                        <button
                          onClick={() => setAsientoExpandido(expandido ? null : seatNumber)}
                          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${
                              completo ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                            }`}>
                              {completo ? '✓' : seatNumber}
                            </span>
                            <div>
                              <p className="text-xs font-black text-slate-700">Asiento N° {seatNumber}</p>
                              <p className={`text-[10px] ${completo ? 'text-slate-500' : 'text-red-600 font-bold'}`}>
                                {completo ? `${p.nombre} ${p.apellidos}` : 'Datos pendientes'}
                              </p>
                            </div>
                          </div>
                          <svg className={`w-4 h-4 text-slate-400 transition-transform ${expandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                        </button>

                        {expandido && (
                          <div className="px-4 pb-4 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Nombres *</label>
                              <input type="text" value={p.nombre} onChange={(e) => handlePasajeroChange(seatNumber, 'nombre', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Apellidos *</label>
                              <input type="text" value={p.apellidos} onChange={(e) => handlePasajeroChange(seatNumber, 'apellidos', e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                            </div>
                            <div>
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">DNI *</label>
                              <input type="text" value={p.dni} onChange={(e) => handlePasajeroChange(seatNumber, 'dni', e.target.value.replace(/\D/g, '').slice(0, 8))} maxLength={8}
                                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-brand-orange"/>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Edad *</label>
                                <input type="number" value={p.edad} onChange={(e) => handlePasajeroChange(seatNumber, 'edad', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:border-brand-orange"/>
                              </div>
                              <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1">Sexo *</label>
                                <select value={p.sexo} onChange={(e) => handlePasajeroChange(seatNumber, 'sexo', e.target.value)}
                                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:outline-none focus:border-brand-orange">
                                  <option value="">--</option>
                                  <option value="M">M</option>
                                  <option value="F">F</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA (Resumen y Pago) */}
          <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            {/* Tarjeta de Turno */}
            <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-lg">
              <p className="text-[9px] font-black text-white/50 uppercase tracking-widest mb-2">Turno seleccionado</p>
              <p className="text-3xl font-black tracking-tighter">{turnoSeleccionado.hora}</p>
              <div className="flex items-center gap-2 mt-3 border-t border-white/10 pt-3">
                <div className="w-8 h-8 rounded-full bg-white/10 overflow-hidden flex-shrink-0">
                  {turnoSeleccionado.fotoConductor ? (
                    <img src={turnoSeleccionado.fotoConductor} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/40 text-xs font-black">
                      {turnoSeleccionado.conductor?.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold">{turnoSeleccionado.conductor}</p>
                  <p className="text-[9px] font-mono text-white/40">{turnoSeleccionado.placa}</p>
                </div>
              </div>
            </div>

            {/* Tarjeta de Pago */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-4">
                <span className="text-xs font-black text-slate-500 uppercase">Total</span>
                <span className="text-3xl font-black text-brand-orange tracking-tighter">
                  S/ {(selectedSeats.length * 10).toFixed(2)}
                </span>
              </div>

              {errorFormulario && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] p-2 rounded-lg mb-4 font-bold text-center">
                  {errorFormulario}
                </div>
              )}

              <button 
                onClick={handleContinuarPago}
                disabled={selectedSeats.length === 0}
                className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-wider transition-all shadow-lg ${
                  selectedSeats.length > 0 
                    ? 'bg-brand-orange text-white shadow-brand-orange/30 hover:bg-orange-700' 
                    : 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
                }`}>
                Continuar con el pago
              </button>
              
              <div className="flex justify-center gap-3 mt-4 opacity-50">
                <img src="/yape-logo.png" alt="Yape" className="h-4 object-contain" />
                <img src="/tarjeta-logo.png" alt="Tarjeta" className="h-4 object-contain" />
                <span className="text-[9px] font-black text-slate-400 uppercase">Efectivo</span>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onPagoCompletado={handlePagoCompletado}
        onIrAMisViajes={handleIrAMisViajes}
        selectedSeats={selectedSeats} 
        total={selectedSeats.length * 10} 
        turno={turnoSeleccionado} 
        origen={origen} 
        destino={destino}
        pasajeros={pasajeros}
      />
    </div>
  );
}
