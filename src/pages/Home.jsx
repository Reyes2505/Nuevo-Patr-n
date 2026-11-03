import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import { getTurnos } from '../data/turnos';
import { useUser } from '../context/UserContext';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [turnos, setTurnos] = useState([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState(0);
  const [origen, setOrigen] = useState('San Marcos');
  const [destino, setDestino] = useState('Cajamarca');

  useEffect(() => {
    setTurnos(getTurnos());
  }, []);

  const turnosDelDia = turnos.filter(t => t.dia === diaSeleccionado);
  const handleSelectTurno = (turno) => navigate('/reserva', { state: { turno, origen, destino } });

  return (
    <div className="min-h-screen bg-[#FAF8F5] font-sans selection:bg-[#D9531E] selection:text-white flex flex-col">
      
      {/* HEADER: Limpio, fondo blanco, logo a color */}
      <header className="fixed w-full top-0 z-50 bg-white border-b border-[#E5E0D8]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex justify-between items-center">
          <div className="h-12 w-auto flex items-center">
            <Logo />
          </div>
          <nav className="hidden md:flex gap-8 text-sm font-bold text-[#1A1A1A]">
            <a href="#salidas" className="hover:text-[#D9531E] transition-colors">Horarios</a>
            <a href="#contacto" className="hover:text-[#D9531E] transition-colors">Contacto</a>
            <Link to={user ? "/mis-viajes" : "/login"} className="bg-[#1A1A1A] hover:bg-[#333] text-white px-5 py-2.5 rounded-sm uppercase tracking-wider text-xs transition-colors">
              {user ? 'Mis Viajes' : 'Ingresar'}
            </Link>
          </nav>
          <Link to={user ? "/mis-viajes" : "/login"} className="md:hidden text-xs font-black uppercase border-2 border-[#1A1A1A] px-3 py-1.5">
            {user ? 'Mis Viajes' : 'Ingresar'}
          </Link>
        </div>
      </header>

      <main className="flex-grow pt-20">
        
        {/* HERO: La foto de la Van es la Protagonista */}
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-20 md:pb-32">
          {/* Textura de puntos en el fondo */}
          <div className="absolute inset-0 z-0 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(#1A1A1A 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          </div>

          <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Columna Izquierda: Texto y Foto */}
            <div className="relative">
              <div className="inline-block bg-[#D9531E] text-white font-black text-[10px] px-3 py-1 uppercase tracking-widest mb-6">
                Servicio Oficial · Ruta 3N
              </div>
              <h1 className="text-5xl md:text-7xl font-black text-[#1A1A1A] leading-[0.9] tracking-tighter mb-6">
                VIAJA EN <br/>
                <span className="text-[#D9531E]">NUEVO PATRÓN</span>
              </h1>
              <p className="text-lg text-[#1A1A1A]/70 font-medium max-w-md mb-8">
                San Marcos ⇄ Cajamarca. Salidas cada 30 minutos desde las 4:00 AM. Reserva tu asiento y paga con Yape.
              </p>

              {/* Foto de la Van Real */}
              <div className="relative">
                <div className="absolute -inset-2 bg-[#1A1A1A]/5 rotate-2 rounded-lg"></div>
                <img 
                  src="/van.png" 
                  alt="Minivan Nuevo Patrón"
                  className="relative w-full h-auto object-cover rounded-lg shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)]"
                />
                {/* Etiqueta sobre la foto */}
                <div className="absolute bottom-4 left-4 bg-white px-3 py-1.5 shadow-lg border-l-4 border-[#D9531E] flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Unidad Verificada</span>
                  <span className="font-mono font-black text-sm text-[#1A1A1A]">M5S-188</span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Tarjeta de Reserva Compacta */}
            <div className="lg:pl-10">
              <div className="bg-white border border-[#E5E0D8] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.1)] relative">
                {/* Pestaña de la tarjeta */}
                <div className="bg-[#1A1A1A] text-white text-center py-2">
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Reserva tu Asiento</span>
                </div>
                
                <div className="p-6 md:p-8">
                  <form className="space-y-5">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 mb-2">Origen</label>
                      <select value={origen} onChange={(e) => setOrigen(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-none px-4 py-3 text-base font-bold text-[#1A1A1A] focus:outline-none focus:border-[#D9531E] appearance-none cursor-pointer">
                        <option>San Marcos (Terminal)</option>
                        <option>Cajamarca (Bolognesi 318)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50 mb-2">Destino</label>
                      <select value={destino} onChange={(e) => setDestino(e.target.value)} className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-none px-4 py-3 text-base font-bold text-[#1A1A1A] focus:outline-none focus:border-[#D9531E] appearance-none cursor-pointer">
                        <option>Cajamarca (Bolognesi 318)</option>
                        <option>San Marcos (Terminal)</option>
                      </select>
                    </div>

                    <button onClick={() => document.getElementById('salidas').scrollIntoView({ behavior: 'smooth' })} type="button" className="w-full bg-[#D9531E] hover:bg-[#B94216] text-white font-black text-sm uppercase tracking-widest py-4 transition-colors mt-2">
                      Ver Turnos Disponibles
                    </button>
                  </form>

                  <div className="mt-6 pt-4 border-t border-dashed border-[#E5E0D8] flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1A1A1A]/60">Tarifa Única</span>
                    <span className="text-2xl font-black text-[#1A1A1A]">S/ 10.00</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECCIÓN DE SALIDAS: Diseño tipo "Boletos de Abordar" */}
        <section id="salidas" className="bg-white border-y border-[#E5E0D8] py-20">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h2 className="text-4xl md:text-5xl font-black text-[#1A1A1A] tracking-tighter uppercase">Salidas de Hoy</h2>
                <p className="text-[#1A1A1A]/60 font-medium mt-2">Selecciona un horario para ver los asientos disponibles.</p>
              </div>
              
              <div className="flex gap-2 bg-[#FAF8F5] p-1 border border-[#E5E0D8]">
                {['Hoy', 'Mañana', 'Pasado'].map((dia, index) => (
                  <button 
                    key={dia}
                    onClick={() => setDiaSeleccionado(index)} 
                    className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-colors ${diaSeleccionado === index ? 'bg-[#1A1A1A] text-white' : 'text-[#1A1A1A]/60 hover:text-[#1A1A1A]'}`}
                  >
                    {dia}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de "Tickets" */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {turnosDelDia.map((turno) => {
                const isSaturado = turno.asientosDisponibles <= 3;
                return (
                  <div 
                    key={turno.id} 
                    onClick={() => handleSelectTurno(turno)}
                    className="group bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#1A1A1A] cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col"
                  >
                    {/* Cabecera del ticket */}
                    <div className="bg-[#1A1A1A] text-white px-4 py-2 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#FAF8F5]/60">Boleto de Viaje</span>
                      <span className="font-mono text-xs font-bold">{turno.placa}</span>
                    </div>

                    {/* Cuerpo del ticket */}
                    <div className="p-5 flex-grow">
                      <div className="flex justify-between items-baseline mb-4 pb-4 border-b border-dashed border-[#1A1A1A]/20">
                        <div>
                          <span className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 mb-1">Salida</span>
                          <span className="text-3xl font-black text-[#1A1A1A] tracking-tighter">{turno.hora}</span>
                        </div>
                        <div className="text-right">
                          <span className="block text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/40 mb-1">Tarifa</span>
                          <span className="text-lg font-black text-[#D9531E]">S/ 10</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[#1A1A1A]/50">Conductor</span>
                          <span className="font-bold text-[#1A1A1A]">{turno.conductor}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#1A1A1A]/50">Asientos</span>
                          <span className={`font-bold ${isSaturado ? 'text-red-600' : 'text-emerald-600'}`}>
                            {turno.asientosDisponibles} disponibles
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pie del ticket (Botón) */}
                    <div className="px-5 pb-5">
                      <button className="w-full bg-white group-hover:bg-[#D9531E] border border-[#1A1A1A] group-hover:border-[#D9531E] text-[#1A1A1A] group-hover:text-white font-black text-xs py-3 uppercase tracking-widest transition-all">
                        Reservar Asiento
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
