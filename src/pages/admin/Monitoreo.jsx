import { useState, useEffect } from 'react';
import { getTurnos } from '../../data/turnos';

// Coordenadas del terminal
const TERMINAL = { lat: -7.1670888, lng: -78.5015892 };

// Calcular distancia en metros
const distancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

export default function Monitoreo() {
  const [boletos, setBoletos] = useState([]);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [turnosHoy, setTurnosHoy] = useState([]);
  const [reloj, setReloj] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setReloj(new Date()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const cargar = () => {
      // Turnos de hoy
      const turnos = getTurnos().filter(t => t.dia === 0);
      setTurnosHoy(turnos);
      
      // Si no hay turno seleccionado, elegir el próximo
      if (!turnoActivo && turnos.length > 0) {
        const proximo = turnos.find(t => {
          const [h, m] = t.hora.replace(' PM', '').replace(' AM', '').split(':').map(Number);
          const esPM = t.hora.includes('PM');
          const h24 = esPM && h !== 12 ? h + 12 : h;
          const fecha = new Date();
          fecha.setHours(h24, m, 0, 0);
          return fecha > reloj;
        });
        setTurnoActivo(proximo || turnos[0]);
      }

      // Cargar boletos + check-ins + ubicaciones
      const todosBoletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const checkIns = JSON.parse(localStorage.getItem('checkIns') || '{}');
      const ubicaciones = JSON.parse(localStorage.getItem('ubicacionesClientes') || '{}');
      
      const boletosConUbicacion = todosBoletos
        .filter(b => b.estadoPago !== 'reembolsado')
        .flatMap(b => (b.pasajeros || []).map(p => {
          const codigoCheckIn = checkIns[b.codigo];
          const ubicacion = ubicaciones[b.dni] || null;
          const distanciaAlTerminal = ubicacion 
            ? distancia(ubicacion.lat, ubicacion.lng, TERMINAL.lat, TERMINAL.lng)
            : null;
          
          return {
            ...p,
            codigoBoleto: b.codigo,
            origen: b.origen,
            destino: b.destino,
            hora: b.turno?.hora,
            turnoId: b.turno?.id,
            metodo: b.metodo,
            checkIn: !!codigoCheckIn,
            checkInTimestamp: codigoCheckIn?.timestamp || null,
            ubicacion,
            distanciaAlTerminal,
            intervencion: false,
          };
        }));
      
      setBoletos(boletosConUbicacion);
    };

    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, [reloj, turnoActivo]);

  // Filtrar por turno activo
  const pasajerosDelTurno = boletos.filter(b => b.turnoId === turnoActivo?.id);

  // Calcular estados
  const conCheckIn = pasajerosDelTurno.filter(p => p.checkIn).length;
  const sinCheckIn = pasajerosDelTurno.filter(p => !p.checkIn).length;
  const requierenIntervencion = pasajerosDelTurno.filter(p => 
    !p.checkIn && p.distanciaAlTerminal !== null && p.distanciaAlTerminal > 500
  ).length;
  const sinUbicacion = pasajerosDelTurno.filter(p => !p.ubicacion).length;

  const handleIntervencion = (pasajero) => {
    // Registrar intervención
    const intervenciones = JSON.parse(localStorage.getItem('intervenciones') || '[]');
    intervenciones.push({
      boletoCodigo: pasajero.codigoBoleto,
      asiento: pasajero.asiento,
      nombre: pasajero.nombre,
      timestamp: new Date().toISOString(),
      distancia: pasajero.distanciaAlTerminal,
    });
    localStorage.setItem('intervenciones', JSON.stringify(intervenciones));
    
    // Abrir WhatsApp con mensaje predefinido
    const mensaje = encodeURIComponent(
      `Hola ${pasajero.nombre}, te contactamos de Nuevo Patrón. Tu boleto ${pasajero.codigoBoleto} sale a las ${pasajero.hora}. ` +
      `¿Estás en camino al terminal? Si tienes algún problema, avísanos.`
    );
    window.open(`https://wa.me/51${pasajero.telefono || ''}?text=${mensaje}`, '_blank');
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-200 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Monitoreo de Clientes</h1>
          <p className="text-sm text-slate-500 mt-1">Estado en tiempo real de los pasajeros y su ubicación.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black uppercase">
            {reloj.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
        </div>
      </div>

      {/* Selector de turno */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6">
        {turnosHoy.map(t => (
          <button
            key={t.id}
            onClick={() => setTurnoActivo(t)}
            className={`flex-shrink-0 px-4 py-3 rounded-xl text-xs font-black transition-all ${
              turnoActivo?.id === t.id
                ? 'bg-[#18191B] text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {t.hora} · {t.placa}
          </button>
        ))}
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pasajeros</p>
          <p className="text-3xl font-black text-slate-900">{pasajerosDelTurno.length}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl border border-emerald-200 p-5 shadow-sm">
          <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Con check-in</p>
          <p className="text-3xl font-black text-emerald-700">{conCheckIn}</p>
        </div>
        <div className="bg-orange-50 rounded-2xl border border-orange-200 p-5 shadow-sm">
          <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">Sin check-in</p>
          <p className="text-3xl font-black text-brand-orange">{sinCheckIn}</p>
        </div>
        <div className="bg-red-50 rounded-2xl border border-red-200 p-5 shadow-sm">
          <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Requieren llamada</p>
          <p className="text-3xl font-black text-red-700">{requierenIntervencion}</p>
        </div>
      </div>

      {/* Lista de pasajeros */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Pasajeros del turno {turnoActivo?.hora} · {turnoActivo?.placa}
          </h3>
          <span className="text-[10px] font-bold text-slate-500">{sinUbicacion} sin ubicación activa</span>
        </div>

        {pasajerosDelTurno.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-sm font-black text-slate-600">No hay pasajeros registrados para este turno</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pasajerosDelTurno.map((p, i) => {
              const requiereIntervencion = !p.checkIn && p.distanciaAlTerminal !== null && p.distanciaAlTerminal > 500;
              const esHoy = p.fechaViaje === new Date().toISOString().split('T')[0];
              
              return (
                <div key={`${p.codigoBoleto}-${p.asiento}`} className="p-4 flex items-center gap-4 hover:bg-slate-50">
                  <div className="w-10 h-10 bg-brand-orange text-white rounded-lg flex items-center justify-center text-sm font-black flex-shrink-0">
                    {p.asiento}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-black text-slate-900 text-sm">{p.nombre} {p.apellidos}</p>
                      {p.checkIn ? (
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">✓ Check-in</span>
                      ) : (
                        <span className="text-[9px] font-black text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full uppercase">Sin check-in</span>
                      )}
                      {p.ubicacion ? (
                        <span className="text-[9px] font-bold text-slate-500">
                          📍 {p.distanciaAlTerminal < 100 ? 'En terminal' : `${p.distanciaAlTerminal}m`}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-slate-400">📍 Sin ubicación</span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">DNI: {p.dni} · {p.metodo?.toUpperCase()} · {p.codigoBoleto}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {requiereIntervencion && (
                      <button
                        onClick={() => handleIntervencion(p)}
                        className="bg-red-600 hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-colors active:scale-95 flex items-center gap-1.5"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                        Llamar
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (p.ubicacion) {
                          window.open(`https://www.google.com/maps?q=${p.ubicacion.lat},${p.ubicacion.lng}`, '_blank');
                        } else {
                          alert('Este cliente no ha compartido su ubicación.');
                        }
                      }}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider px-3 py-2 rounded-lg transition-colors active:scale-95"
                    >
                      Ver mapa
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Leyenda */}
      <div className="mt-4 bg-white rounded-2xl border border-slate-200 p-4">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Leyenda</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[10px] text-slate-600">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Con check-in (está en terminal)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span> Sin check-in
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span> Requiere llamada (+500m del terminal)
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-300"></span> Sin ubicación compartida
          </div>
        </div>
      </div>
    </div>
  );
}
