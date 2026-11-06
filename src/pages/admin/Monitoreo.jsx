import { useState, useEffect, useMemo, useRef } from 'react';
import { getTurnos } from '../../data/turnos';
import { useUser } from '../../context/UserContext';

const TERMINAL = { lat: -7.1670888, lng: -78.5015892 };
const RADIO_TERMINAL_M = 100;
const UMBRAL_RIESGO_M = 500;

const calcularDistancia = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(Δφ/2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
};

const to24h = (horaStr) => {
  const [hm, periodo] = horaStr.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (periodo === 'PM' && h !== 12) h += 12;
  if (periodo === 'AM' && h === 12) h = 0;
  return { h, m };
};

const estadoTurno = (turno, fechaRef) => {
  const ahora = new Date();
  const { h, m } = to24h(turno.hora);
  const salida = new Date();
  salida.setHours(h, m, 0, 0);
  
  const ref = new Date(fechaRef + 'T00:00:00');
  salida.setFullYear(ref.getFullYear(), ref.getMonth(), ref.getDate());
  
  const diffMin = Math.floor((salida - ahora) / 60000);
  if (diffMin < -5) return 'salido';
  if (diffMin < 0) return 'cerrando';
  if (diffMin < 15) return 'urgente';
  if (diffMin < 30) return 'proximo';
  return 'normal';
};

const generarUltimos7Dias = () => {
  const dias = [];
  const ahora = new Date();
  ahora.setHours(12, 0, 0, 0);
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(ahora);
    d.setDate(d.getDate() - i);
    
    const año = d.getFullYear();
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const dia = String(d.getDate()).padStart(2, '0');
    
    dias.push({
      iso: `${año}-${mes}-${dia}`,
      label: i === 0 ? 'Hoy' : i === 1 ? 'Ayer' : d.toLocaleDateString('es-PE', { weekday: 'short', day: 'numeric', month: 'short' }),
      dia: d.getDate(),
      mes: d.toLocaleDateString('es-PE', { month: 'short' }),
      esHoy: i === 0,
      offset: -i,
    });
  }
  
  return dias;
};

export default function Monitoreo() {
  const { misBoletos } = useUser();
  const [turnos, setTurnos] = useState([]);
  const [turnoActivo, setTurnoActivo] = useState(null);
  const [ubicaciones, setUbicaciones] = useState({});
  const [checkIns, setCheckIns] = useState({});
  const [ahora, setAhora] = useState(new Date());
  const [pasajeroSeleccionado, setPasajeroSeleccionado] = useState(null);
  
  const dias = useMemo(() => generarUltimos7Dias(), []);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  });
  
  const diaSeleccionado = dias.find(d => d.iso === fechaSeleccionada);
  const esHoy = diaSeleccionado?.esHoy || false;
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);

  // Cargar turnos del día seleccionado
  useEffect(() => {
    const cargar = () => {
      const todos = getTurnos();
      const offset = diaSeleccionado?.offset ?? 0;
      
      if (offset < 0) {
        // Días pasados: usar los turnos de los boletos
        const turnosDeBoletos = new Map();
        misBoletos.forEach(b => {
          if (b.turno) {
            const fechaBoleto = b.fechaViaje || b.fecha?.split('T')[0];
            if (fechaBoleto === fechaSeleccionada) {
              turnosDeBoletos.set(b.turno.id, b.turno);
            }
          }
        });
        const turnosOrdenados = Array.from(turnosDeBoletos.values())
          .sort((a, b) => a.horaNumerica - b.horaNumerica);
        setTurnos(turnosOrdenados);
        setTurnoActivo(turnosOrdenados[0] || null);
        return;
      }
      
      // Hoy y futuro: usar getTurnos()
      const filtrados = todos
        .filter(t => t.dia === offset && t.estado !== 'salido')
        .sort((a, b) => a.horaNumerica - b.horaNumerica);
      setTurnos(filtrados);
      setTurnoActivo(filtrados[0] || null);
    };
    
    cargar();
    const interval = setInterval(cargar, 30000);
    return () => clearInterval(interval);
  }, [fechaSeleccionada, diaSeleccionado, misBoletos]);

  // Reloj
  useEffect(() => {
    const interval = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Cargar ubicaciones y check-ins
  useEffect(() => {
    const cargar = () => {
      try {
        setUbicaciones(JSON.parse(localStorage.getItem('ubicacionesClientes') || '{}'));
        setCheckIns(JSON.parse(localStorage.getItem('checkIns') || '{}'));
      } catch (e) { console.error(e); }
    };
    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, []);

  // Calcular pasajeros del turno activo
  const pasajeros = useMemo(() => {
    if (!turnoActivo) return [];
    
    return misBoletos
      .filter(b => {
        if (b.estadoPago === 'reembolsado') return false;
        const fechaBoleto = b.fechaViaje || b.fecha?.split('T')[0];
        if (fechaBoleto !== fechaSeleccionada) return false;
        if (b.turno?.id === turnoActivo.id) return true;
        if (b.turno?.hora === turnoActivo.hora) return true;
        return false;
      })
      .flatMap(b => (b.pasajeros || []).map((p, idx) => {
        const ubicacion = ubicaciones[p.dni] || ubicaciones[b.dni] || null;
        const distancia = ubicacion 
          ? calcularDistancia(ubicacion.lat, ubicacion.lng, TERMINAL.lat, TERMINAL.lng)
          : null;
        const tieneCheckIn = !!checkIns[b.codigo];
        
        let estado = 'sin_ubicacion';
        if (tieneCheckIn) estado = 'en_terminal';
        else if (distancia !== null && distancia <= RADIO_TERMINAL_M) estado = 'en_terminal';
        else if (distancia !== null && distancia <= UMBRAL_RIESGO_M) estado = 'en_camino';
        else if (distancia !== null) estado = 'riesgo';

        return {
          id: `${b.codigo}-${p.asiento || idx}`,
          asiento: p.asiento,
          nombre: p.nombre,
          apellidos: p.apellidos,
          dni: p.dni,
          telefono: p.telefono || '',
          codigoBoleto: b.codigo,
          checkIn: tieneCheckIn,
          ubicacion,
          distancia,
          estado,
        };
      }));
  }, [misBoletos, turnoActivo, ubicaciones, checkIns, fechaSeleccionada]);

  const conteos = useMemo(() => {
    const c = { en_terminal: 0, en_camino: 0, riesgo: 0, sin_ubicacion: 0, total: pasajeros.length };
    pasajeros.forEach(p => { c[p.estado]++; });
    return c;
  }, [pasajeros]);

  // Inicializar mapa
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: TERMINAL,
        zoom: 12,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
          { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      });

      new window.google.maps.Marker({
        position: TERMINAL,
        map: mapInstanceRef.current,
        title: 'Terminal Terrestre San Marcos',
        icon: {
          url: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="%2318191B"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>',
          scaledSize: new window.google.maps.Size(40, 40),
        },
      });

      new window.google.maps.Circle({
        strokeColor: '#18191B',
        strokeOpacity: 0.5,
        strokeWeight: 2,
        fillColor: '#18191B',
        fillOpacity: 0.1,
        map: mapInstanceRef.current,
        center: TERMINAL,
        radius: RADIO_TERMINAL_M,
      });
    }
  }, []);

  // Actualizar marcadores
  useEffect(() => {
    if (!window.google || !mapInstanceRef.current) return;

    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const colores = {
      en_terminal: '#10b981',
      en_camino: '#3b82f6',
      riesgo: '#ef4444',
      sin_ubicacion: '#94a3b8',
    };

    pasajeros.forEach(p => {
      if (!p.ubicacion) return;

      const color = colores[p.estado];
      const marker = new window.google.maps.Marker({
        position: { lat: p.ubicacion.lat, lng: p.ubicacion.lng },
        map: mapInstanceRef.current,
        title: `${p.nombre} ${p.apellidos} - Asiento ${p.asiento}`,
        icon: {
          url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="${encodeURIComponent(color)}"><circle cx="12" cy="10" r="8"/><text x="12" y="14" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${p.asiento}</text><path d="M12 22l-4-6h8z" fill="${encodeURIComponent(color)}"/></svg>`,
          scaledSize: new window.google.maps.Size(36, 36),
        },
      });

      marker.addListener('click', () => setPasajeroSeleccionado(p));
      markersRef.current.push(marker);
    });
  }, [pasajeros]);

  const handleLlamar = (pasajero) => {
    const mensaje = encodeURIComponent(
      `Hola ${pasajero.nombre}, te contactamos de Nuevo Patrón. Tu boleto ${pasajero.codigoBoleto} sale a las ${turnoActivo.hora}. ¿Estás en camino al terminal?`
    );
    const telefonoLimpio = pasajero.telefono?.replace(/\D/g, '') || '';
    window.open(`https://wa.me/51${telefonoLimpio}?text=${mensaje}`, '_blank');
  };

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'en_terminal': return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'En Terminal' };
      case 'en_camino': return { bg: 'bg-blue-100', text: 'text-blue-700', label: 'En camino' };
      case 'riesgo': return { bg: 'bg-red-100', text: 'text-red-700', label: 'En riesgo' };
      case 'sin_ubicacion': return { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Sin ubicación' };
      default: return { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Desconocido' };
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="mb-6">
          <p className="text-[10px] font-black text-brand-orange uppercase tracking-widest mb-1">Centro de monitoreo en vivo</p>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">Monitoreo de Clientes</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Estado en tiempo real de los pasajeros · {ahora.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>

        {/* SELECTOR DE CALENDARIO */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {dias.map(d => {
            const esSeleccionado = fechaSeleccionada === d.iso;
            return (
              <button
                key={d.iso}
                onClick={() => setFechaSeleccionada(d.iso)}
                className={`flex-shrink-0 flex flex-col items-center justify-center px-4 py-3 rounded-xl border-2 transition-all min-w-[80px] ${
                  esSeleccionado
                    ? 'border-brand-orange bg-brand-orange text-white shadow-lg scale-105'
                    : d.esHoy
                      ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-wider ${esSeleccionado ? 'text-white/80' : 'text-slate-400'}`}>
                  {d.label}
                </span>
                <span className={`text-lg font-black ${esSeleccionado ? 'text-white' : 'text-slate-900'}`}>
                  {d.dia}
                </span>
                <span className={`text-[9px] font-bold uppercase ${esSeleccionado ? 'text-white/70' : 'text-slate-400'}`}>
                  {d.mes}
                </span>
              </button>
            );
          })}
        </div>

        {/* SELECTOR DE TURNO */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-6">
          {turnos.map(t => {
            const estado = estadoTurno(t, fechaSeleccionada);
            const esActivo = turnoActivo?.id === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTurnoActivo(t)}
                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all min-w-[180px] ${
                  esActivo
                    ? 'border-brand-orange bg-brand-orange text-white shadow-lg'
                    : estado === 'urgente' || estado === 'cerrando'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : estado === 'proximo'
                        ? 'border-orange-400 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-left">
                  <p className={`text-lg font-black ${esActivo ? 'text-white' : 'text-slate-900'}`}>{t.hora}</p>
                  <p className={`text-[10px] font-bold ${esActivo ? 'text-white/70' : 'text-slate-500'}`}>{t.placa} · {t.conductor}</p>
                </div>
              </button>
            );
          })}
          {turnos.length === 0 && (
            <p className="text-sm text-slate-400 font-bold py-2">No hay turnos para esta fecha</p>
          )}
        </div>

        {turnoActivo ? (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total pasajeros</p>
                <p className="text-3xl font-black text-slate-900">{conteos.total}</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-200 shadow-sm">
                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">En terminal</p>
                <p className="text-3xl font-black text-emerald-700">{conteos.en_terminal}</p>
              </div>
              <div className="bg-blue-50 rounded-2xl p-5 border border-blue-200 shadow-sm">
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest mb-1">En camino</p>
                <p className="text-3xl font-black text-blue-700">{conteos.en_camino}</p>
              </div>
              <div className="bg-red-50 rounded-2xl p-5 border border-red-200 shadow-sm">
                <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">En riesgo</p>
                <p className="text-3xl font-black text-red-700">{conteos.riesgo}</p>
              </div>
            </div>

            {/* MAPA + LISTA */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Mapa en tiempo real</h2>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      {pasajeros.filter(p => p.ubicacion).length} pasajeros con ubicación compartida
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[10px] font-bold">
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Terminal</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Camino</span>
                    <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500"></span> Riesgo</span>
                  </div>
                </div>
                <div ref={mapRef} className="w-full h-[500px]" />
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="p-4 border-b border-slate-100">
                  <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Pasajeros</h2>
                  <p className="text-[10px] text-slate-500 mt-0.5">Haz clic para ver detalle</p>
                </div>
                <div className="flex-grow overflow-y-auto max-h-[500px] divide-y divide-slate-100">
                  {pasajeros.map(p => {
                    const badge = getEstadoBadge(p.estado);
                    const esSeleccionado = pasajeroSeleccionado?.id === p.id;
                    return (
                      <div
                        key={p.id}
                        onClick={() => {
                          setPasajeroSeleccionado(p);
                          if (p.ubicacion && mapInstanceRef.current) {
                            mapInstanceRef.current.panTo({ lat: p.ubicacion.lat, lng: p.ubicacion.lng });
                            mapInstanceRef.current.setZoom(15);
                          }
                        }}
                        className={`p-3 cursor-pointer transition-colors ${
                          esSeleccionado ? 'bg-orange-50 border-l-4 border-brand-orange' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-[#18191B] text-white rounded-lg flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-black">{p.asiento}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-slate-900 truncate">{p.nombre} {p.apellidos}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${badge.bg} ${badge.text}`}>{badge.label}</span>
                              {p.distancia !== null && <span className="text-[9px] text-slate-400">{p.distancia}m</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {pasajeros.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-xs text-slate-400 font-bold">Sin pasajeros</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* DETALLE DEL PASAJERO */}
            {pasajeroSeleccionado && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-[#18191B] text-white rounded-2xl flex flex-col items-center justify-center">
                      <span className="text-[9px] font-bold text-white/60">N°</span>
                      <span className="text-xl font-black">{pasajeroSeleccionado.asiento}</span>
                    </div>
                    <div>
                      <p className="text-lg font-black text-slate-900">{pasajeroSeleccionado.nombre} {pasajeroSeleccionado.apellidos}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>DNI: {pasajeroSeleccionado.dni}</span>
                        <span className="font-mono">{pasajeroSeleccionado.codigoBoleto}</span>
                        {pasajeroSeleccionado.telefono && <span>📞 {pasajeroSeleccionado.telefono}</span>}
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${getEstadoBadge(pasajeroSeleccionado.estado).bg} ${getEstadoBadge(pasajeroSeleccionado.estado).text}`}>
                          {getEstadoBadge(pasajeroSeleccionado.estado).label}
                        </span>
                        {pasajeroSeleccionado.distancia !== null && (
                          <span className="text-xs text-slate-500">📍 A {pasajeroSeleccionado.distancia}m del terminal</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {pasajeroSeleccionado.estado !== 'en_terminal' && (
                      <button onClick={() => handleLlamar(pasajeroSeleccionado)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors active:scale-95">
                        📞 Llamar
                      </button>
                    )}
                    {pasajeroSeleccionado.ubicacion && (
                      <button onClick={() => window.open(`https://www.google.com/maps?q=${pasajeroSeleccionado.ubicacion.lat},${pasajeroSeleccionado.ubicacion.lng}`, '_blank')} className="bg-slate-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors active:scale-95">
                        🗺️ Abrir en Google Maps
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
            <p className="text-lg font-black text-slate-900">Sin turnos para esta fecha</p>
            <p className="text-sm text-slate-500 mt-1">No hay turnos programados o todos ya salieron.</p>
          </div>
        )}
      </div>
    </div>
  );
}
