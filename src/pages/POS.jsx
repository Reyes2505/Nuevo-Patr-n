import { useState } from 'react';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import TicketModal from '../components/TicketModal';

export default function POS() {
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [nombre, setNombre] = useState('');
  const [dni, setDni] = useState('');
  const [telefono, setTelefono] = useState('');
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [boletoCodigo, setBoletoCodigo] = useState('');
  const [isTicketOpen, setIsTicketOpen] = useState(false);

  const turnos = [
    { id: 1, hora: '04:00 AM', placa: 'M5S-188', conductor: 'Carlos Mendoza P.', asientosLibres: 13 },
    { id: 2, hora: '04:30 AM', placa: 'T3X-120', conductor: 'Víctor Huamán R.', asientosLibres: 10 },
    { id: 3, hora: '05:00 AM', placa: 'A8K-942', conductor: 'Julio César B.', asientosLibres: 15 },
  ];

  const handleVenta = (e) => {
    e.preventDefault();
    if (!turnoSeleccionado || !nombre || !telefono) return;
    
    const codigo = `NP-${Date.now().toString().slice(-6)}`;
    setBoletoCodigo(codigo);
    setIsTicketOpen(true);
  };

  const handleCerrarTicket = () => {
    setIsTicketOpen(false);
    setNombre(''); setDni(''); setTelefono(''); setMetodoPago('efectivo');
    setTurnoSeleccionado(null); setBoletoCodigo('');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] flex flex-col">
      <header className="bg-[#1A1A1A] text-white px-6 py-3 flex justify-between items-center border-b-4 border-[#D9531E]">
        <div className="flex items-center gap-4">
          <div className="bg-white p-1 rounded"><Logo /></div>
          <div>
            <h1 className="font-black text-lg uppercase tracking-wider">Punto de Venta</h1>
            <p className="text-[10px] text-slate-400 font-mono">Agencia San Marcos · Terminal Terrestre</p>
          </div>
        </div>
        <div className="bg-emerald-600 text-white px-3 py-1 rounded text-xs font-black uppercase tracking-wider">
          Caja Abierta
        </div>
      </header>

      <main className="flex-grow max-w-7xl mx-auto w-full p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-4 uppercase tracking-wider">1. Selecciona el Turno</h2>
          <div className="space-y-3">
            {turnos.map((turno) => (
              <div 
                key={turno.id}
                onClick={() => setTurnoSeleccionado(turno)}
                className={`p-4 border-2 cursor-pointer transition-all flex justify-between items-center ${
                  turnoSeleccionado?.id === turno.id 
                    ? 'border-[#D9531E] bg-[#D9531E]/5' 
                    : 'border-[#1A1A1A]/20 bg-white hover:border-[#1A1A1A]'
                }`}
              >
                <div>
                  <span className="block text-2xl font-black text-[#1A1A1A]">{turno.hora}</span>
                  <span className="block text-xs text-[#1A1A1A]/60 font-medium">{turno.conductor} · {turno.placa}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40">Libres</span>
                  <span className="block text-xl font-black text-emerald-600">{turno.asientosLibres}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-[#1A1A1A] mb-4 uppercase tracking-wider">2. Datos del Pasajero</h2>
          <form onSubmit={handleVenta} className="bg-white border-2 border-[#1A1A1A] p-6 space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-1">Nombre completo</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className="w-full border-2 border-[#1A1A1A]/20 p-3 text-sm font-bold focus:outline-none focus:border-[#D9531E]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-1">DNI</label>
                <input type="text" value={dni} onChange={(e) => setDni(e.target.value)} maxLength={8} className="w-full border-2 border-[#1A1A1A]/20 p-3 text-sm font-bold focus:outline-none focus:border-[#D9531E]" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-1">Teléfono (WhatsApp)</label>
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="9XXXXXXXX" required className="w-full border-2 border-[#1A1A1A]/20 p-3 text-sm font-bold focus:outline-none focus:border-[#D9531E]" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/60 mb-2">Método de Pago</label>
              <div className="grid grid-cols-3 gap-2">
                {['efectivo', 'yape', 'credito'].map((metodo) => (
                  <button key={metodo} type="button" onClick={() => setMetodoPago(metodo)} className={`py-2 text-xs font-black uppercase tracking-wider border-2 transition-colors ${metodoPago === metodo ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]' : 'bg-white text-[#1A1A1A] border-[#1A1A1A]/20 hover:border-[#1A1A1A]'}`}>
                    {metodo}
                  </button>
                ))}
              </div>
            </div>

            {turnoSeleccionado && (
              <div className="border-t-2 border-dashed border-[#1A1A1A]/20 pt-4 mt-4 flex justify-between items-center">
                <span className="text-xs font-black uppercase tracking-widest text-[#1A1A1A]/60">Total a Cobrar</span>
                <span className="text-2xl font-black text-[#D9531E]">S/ 10.00</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={!turnoSeleccionado}
              className={`w-full py-4 mt-4 font-black text-sm uppercase tracking-widest transition-colors ${
                turnoSeleccionado 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              Generar Boleto Digital
            </button>
          </form>
        </div>
      </main>
      <Footer />

      {/* MODAL DEL BOLETO ESTÉTICO */}
      <TicketModal 
        isOpen={isTicketOpen}
        onClose={handleCerrarTicket}
        turno={turnoSeleccionado || {}}
        nombre={nombre}
        dni={dni}
        telefono={telefono}
        metodoPago={metodoPago}
        boletoCodigo={boletoCodigo}
      />
    </div>
  );
}
