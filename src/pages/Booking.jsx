import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import SeatMap from '../components/SeatMap';
import CheckoutSummary from '../components/CheckoutSummary';
import Logo from '../components/Logo';
import PaymentModal from '../components/PaymentModal';
import Footer from '../components/Footer';

export default function Booking() {
  const location = useLocation();
  const navigate = useNavigate();

  const turnoSeleccionado = location.state?.turno;
  const [origen, setOrigen] = useState(location.state?.origen || 'San Marcos');
  const [destino, setDestino] = useState(location.state?.destino || 'Cajamarca');

  useEffect(() => {
    if (!turnoSeleccionado) navigate('/');
  }, [turnoSeleccionado, navigate]);

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [timeLeft, setTimeLeft] = useState(180);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let interval = null;
    if (isTimerActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && selectedSeats.length > 0) {
      setSelectedSeats([]);
      setIsTimerActive(false);
      setTimeLeft(180);
      alert("El tiempo de reserva ha expirado. Los asientos han sido liberados.");
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeLeft, selectedSeats.length]);

  const handleSeatToggle = (seatNumber) => {
    if (selectedSeats.includes(seatNumber)) {
      const newSeats = selectedSeats.filter(num => num !== seatNumber);
      setSelectedSeats(newSeats);
      if (newSeats.length === 0) { setIsTimerActive(false); setTimeLeft(180); }
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
      if (!isTimerActive) setIsTimerActive(true);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (window.confirm("¿Deseas volver a la página principal? (Los asientos se liberarán)")) {
      navigate('/');
    }
  };

  if (!turnoSeleccionado) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans relative flex flex-col">
      
      {isTimerActive && !isModalOpen && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-3 animate-pulse">
          <span className="text-sm font-medium">Asientos reservados por:</span>
          <span className="text-xl font-bold font-mono text-brand-orange">{formatTime(timeLeft)}</span>
        </div>
      )}

      <main className="flex-grow max-w-6xl mx-auto px-4 py-8 w-full">
        <header className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-6 gap-4">
          <div className="flex items-center gap-4">
            <Link to="/" className="w-10 h-10 bg-white border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors shadow-sm text-slate-600">
              ←
            </Link>
            <Logo />
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm font-semibold text-slate-600">{origen} – {destino}</p>
            <span className="inline-block mt-2 bg-brand-red text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
              Turno: {turnoSeleccionado.hora}
            </span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 w-full">
            <SeatMap 
              selectedSeats={selectedSeats} 
              onSeatToggle={handleSeatToggle} 
              occupiedSeatsExternos={turnoSeleccionado.ocupados}
            />
          </div>
          <div className="lg:col-span-5 w-full">
            <CheckoutSummary 
              selectedSeats={selectedSeats} 
              timeLeft={formatTime(timeLeft)}
              isTimerActive={isTimerActive}
              origen={origen}
              destino={destino}
              turno={turnoSeleccionado}
              onOpenModal={() => setIsModalOpen(true)}
            />
          </div>
        </div>
      </main>

      <Footer />

      <PaymentModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        selectedSeats={selectedSeats}
        total={selectedSeats.length * 10}
        turno={turnoSeleccionado}
        origen={origen}
        destino={destino}
      />
    </div>
  );
}
