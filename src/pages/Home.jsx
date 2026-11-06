import { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTurnos, getFechas7Dias } from '../data/turnos';
import { useUser } from '../context/UserContext';
import SeatDrawer from '../components/SeatDrawer';

const CAPACIDAD = 15;
const POCOS_ASIENTOS = 5;
const GRACIA_MIN = 5;
const UMBRAL_CRONOMETRO_MIN = 60;
const INCREMENTO_POR_BLOQUE = 5; // Mostrar 5 por bloque inicialmente

const BLOQUES = [
  { id: 'Mañana', desde: 5, hasta: 12, tono: 'from-amber-100 to-amber-200 text-amber-600' },
  { id: 'Tarde', desde: 12, hasta: 19, tono: 'from-orange-100 to-orange-200 text-brand-orange' },
  { id: 'Noche', desde: 19, hasta: 24, tono: 'from-indigo-100 to-indigo-200 text-indigo-600' },
];

const TONOS = {
  normal: { caja: 'bg-slate-50', texto: 'text-slate-900', etiqueta: 'text-slate-400' },
  poco_tiempo: { caja: 'bg-orange-50', texto: 'text-orange-600', etiqueta: 'text-orange-600' },
  urgente: { caja: 'bg-red-50', texto: 'text-red-600', etiqueta: 'text-red-600' },
  proximo_a_salir: { caja: 'bg-red-50', texto: 'text-red-600', etiqueta: 'text-red-600' },
};

const to24h = (horaStr) => {
  const [hm, periodo] = horaStr.split(' ');
  let [h, m] = hm.split(':').map(Number);
  if (periodo === 'PM' && h !== 12) h += 12;
  if (periodo === 'AM' && h === 12) h = 0;
  return { h, m };
};

const fechaDeSalida = (turno, ahora) => {
  const { h, m } = to24h(turno.hora);
  const d = new Date(ahora);
  d.setDate(d.getDate() + (turno.dia || 0));
  d.setHours(h, m, 0, 0);
  return d;
};

const estadoTemporal = (salida, ahora) => {
  const diffMs = salida - ahora;
  const pasados = Math.floor(-diffMs / 60000);
  const min = Math.floor(diffMs / 60000);
  const seg = Math.floor((diffMs % 60000) / 1000);

  if (pasados > GRACIA_MIN) return { estado: 'ya_salio', mensaje: 'Fuera de horario', min: 0, seg: 0 };
  if (pasados >= 0) return { estado: 'proximo_a_salir', mensaje: 'Cierre próximo', min: 0, seg: 0 };
  if (min < 5) return { estado: 'urgente', mensaje: 'Último llamado', min, seg };
  if (min < 15) return { estado: 'poco_tiempo', mensaje: 'Tiempo limitado', min, seg };
  return { estado: 'normal', mensaje: 'Disponible', min, seg };
};

const bloqueDe = (horaStr) => {
  const { h } = to24h(horaStr);
  const h29 = h < 4 ? h + 24 : h;
  if (h29 >= 5 && h29 < 12) return 'Mañana';
  if (h29 >= 12 && h29 < 19) return 'Tarde';
  return 'Noche';
};

function useNow(ms) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

const PATHS = {
  swap: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
  chevron: 'M9 5l7 7-7 7',
  chevronDown: 'M19 9l-7 7-7-7',
  chevronUp: 'M5 15l7-7 7 7',
  check: 'M5 13l4 4L19 7',
  user: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  clock: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  wifi: 'M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0',
  sun: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z',
  moon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z',
  arrow: 'M13 7l5 5m0 0l-5 5m5-5H6',
  gear: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
};

const Icon = ({ name, className = 'w-4 h-4', stroke = 2 }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={stroke} d={PATHS[name]} />
  </svg>
);

const LINKS = ['Rutas', 'Horarios', 'Tarifas', 'Preguntas'];

function Navbar({ user, onNavigate }) {
  const inicial = user?.nombre?.charAt(0).toUpperCase() || 'U';
  const primerNombre = user?.nombre?.split(' ')[0] || 'Mi perfil';

  return (
    <nav className="w-full bg-white/95 backdrop-blur-md sticky top-0 z-50 border-b border-slate-200/50">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-3 flex justify-between items-center">
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1 text-xl md:text-2xl font-black tracking-tighter">
          <span className="text-brand-orange">Nuevo</span>
          <span className="text-slate-900">Patrón</span>
        </button>
        <div className="hidden md:flex gap-8 text-sm font-bold text-slate-600">
          {LINKS.map((l) => <a key={l} href="#" className="hover:text-brand-orange transition-colors">{l}</a>)}
        </div>
        {user ? (
          <div className="flex items-center gap-2">
            {user.rol === 'admin' && (
              <button onClick={() => onNavigate('/admin')} className="flex items-center justify-center bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-md hover-lift w-8 h-8 rounded-full md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-xl text-xs font-black">
                <Icon name="gear" />
                <span className="hidden md:inline ml-1.5">Admin</span>
              </button>
            )}
            <button onClick={() => onNavigate('/perfil')} className="flex items-center justify-center text-white font-black shadow-md hover-lift bg-brand-orange w-8 h-8 rounded-full text-xs md:w-auto md:h-auto md:px-4 md:py-2 md:rounded-xl md:text-sm">
              <span className="md:hidden">{inicial}</span>
              <span className="hidden md:inline">{primerNombre}</span>
            </button>
          </div>
        ) : (
          <button onClick={() => onNavigate('/login')} className="bg-[#18191B] text-white px-3 py-1.5 md:px-5 md:py-2.5 rounded-lg md:rounded-xl text-xs md:text-sm font-bold shadow-lg hover-lift">
            <span className="md:hidden">Ingresar</span>
            <span className="hidden md:inline">Iniciar sesión</span>
          </button>
        )}
      </div>
    </nav>
  );
}

const BADGES = [
  { icon: 'clock', color: 'text-brand-orange', texto: 'Salidas cada 30 min' },
  { icon: 'wifi', color: 'text-blue-500', texto: 'WiFi a bordo' },
];

function Hero() {
  return (
    <header className="w-full max-w-6xl mx-auto px-4 md:px-6 pt-4 md:pt-12 pb-6 md:pb-24 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-brand-orange/20 via-orange-300/10 to-transparent rounded-full blur-3xl pointer-events-none animate-pulse-glow motion-reduce:animate-none" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-center relative z-10">
        <div className="relative flex justify-center items-center md:order-last">
          <div className="hidden md:block absolute w-[450px] h-[450px] border-2 border-dashed border-orange-200 rounded-full opacity-40" />
          <div className="hidden md:block absolute w-[380px] h-[380px] bg-gradient-to-br from-orange-50 to-white rounded-full shadow-inner" />
          <div className="relative z-10" style={{ maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 75%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 75%)' }}>
            <img src="/van-hero.jpg" alt="Van de Nuevo Patrón" width={550} height={366} fetchpriority="high" className="w-full max-w-[280px] md:max-w-[550px] object-contain animate-float-van motion-reduce:animate-none" />
          </div>
        </div>
        <div className="space-y-3 md:space-y-6 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full text-[10px] font-black text-brand-orange uppercase tracking-wider">
            <span className="w-1.5 h-1.5 bg-brand-orange rounded-full animate-pulse"></span>
            Servicio Premium
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-[4rem] font-black text-slate-900 leading-tight tracking-tight">
            Viaja cómodo, seguro y a tiempo entre <span className="text-brand-orange">San Marcos</span> y <span className="text-brand-orange">Cajamarca</span>
          </h1>
          <p className="text-sm md:text-lg text-slate-500 max-w-md mx-auto md:mx-0 font-medium">Transporte interprovincial de pasajeros. Elige tu horario y reserva tu asiento en segundos.</p>
          <ul className="flex flex-wrap gap-2 justify-center md:justify-start">
            {BADGES.map((b) => (
              <li key={b.texto} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-700 shadow-sm">
                <Icon name={b.icon} className={`w-3 h-3 ${b.color}`} />
                {b.texto}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-[11px] font-bold text-slate-700 shadow-sm">
              <span className="text-green-500 text-xs" aria-hidden="true">●</span> Yape, Plin o efectivo
            </li>
          </ul>
        </div>
      </div>
    </header>
  );
}

const Campo = ({ label, children, className = '' }) => (
  <div className={`bg-slate-50 md:bg-transparent rounded-xl p-3 md:px-5 md:py-3 flex-1 min-w-0 ${className}`}>
    <p className="text-[10px] font-black text-slate-400">{label}</p>
    <div className="text-sm md:text-lg font-black text-slate-900 truncate">{children}</div>
  </div>
);

function SearchBar({ origen, destino, fecha, pasajeros, maxPasajeros, onSwap, onPasajeros, onBuscar }) {
  return (
    <section aria-label="Buscar viaje" className="w-full max-w-5xl mx-auto px-4 md:px-6 -mt-2 md:-mt-16 relative z-20">
      <div className="bg-white rounded-2xl md:rounded-[2rem] p-3 shadow-xl border border-slate-100 flex flex-col md:flex-row md:items-center gap-2 md:gap-0">
        <Campo label="Origen">{origen}</Campo>
        <button onClick={onSwap} aria-label="Intercambiar origen y destino" className="self-center w-9 h-9 bg-white border-2 border-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:border-brand-orange hover:text-brand-orange hover:rotate-180 transition-all duration-300 motion-reduce:transition-none -my-3 md:my-0 z-10 shrink-0">
          <Icon name="swap" />
        </button>
        <Campo label="Destino">{destino}</Campo>
        <div className="grid grid-cols-2 md:contents gap-2">
          <Campo label="Fecha" className="md:border-l md:border-slate-200">
            {fecha.label}, {fecha.dia} {fecha.mes}
          </Campo>
          <div className="bg-slate-50 md:bg-transparent rounded-xl p-3 md:px-5 md:py-3 flex-1 flex items-center justify-between md:border-l md:border-slate-200">
            <div>
              <p className="text-[10px] font-black text-slate-400">Pasajeros</p>
              <p className="text-sm md:text-lg font-black text-slate-900" aria-live="polite">{pasajeros}</p>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => onPasajeros(-1)} disabled={pasajeros <= 1} aria-label="Quitar un pasajero" className="w-7 h-7 bg-white border border-slate-200 rounded-lg font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">−</button>
              <button onClick={() => onPasajeros(1)} disabled={pasajeros >= maxPasajeros} aria-label="Agregar un pasajero" className="w-7 h-7 bg-white border border-slate-200 rounded-lg font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors">+</button>
            </div>
          </div>
        </div>
        <button onClick={onBuscar} className="bg-gradient-to-r from-brand-orange to-orange-600 text-white font-black shadow-lg shadow-brand-orange/30 hover-lift flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm md:py-5 md:px-8 md:ml-2 md:rounded-[1.5rem] md:text-base">
          Elegir asiento <Icon name="arrow" stroke={2.5} />
        </button>
      </div>
    </section>
  );
}

function DateStrip({ fechas, seleccionada, onSelect }) {
  return (
    <div role="tablist" aria-label="Fecha de viaje" className="flex gap-2 overflow-x-auto pb-3 mb-5 md:mb-8 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
      {fechas.map((f) => {
        const activa = seleccionada.index === f.index;
        const sub = activa ? 'text-white/80' : 'text-slate-400';
        return (
          <button key={f.index} role="tab" aria-selected={activa} onClick={() => onSelect(f)}
            className={`flex-shrink-0 flex flex-col items-center justify-center w-14 md:w-20 h-16 md:h-20 rounded-2xl transition-all duration-300 active:scale-95 ${activa ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30 scale-105' : 'bg-white text-slate-500 shadow-sm hover:shadow-md hover-lift'}`}>
            <span className={`text-[9px] md:text-[10px] font-black ${sub}`}>{f.label}</span>
            <span className="text-base md:text-xl font-black leading-none my-0.5">{f.dia}</span>
            <span className={`text-[8px] md:text-[9px] font-bold ${sub}`}>{f.mes}</span>
          </button>
        );
      })}
    </div>
  );
}

function Cuenta({ salida, compacto = false }) {
  const now = useNow(1000);
  const t = estadoTemporal(salida, now);
  const tono = TONOS[t.estado] ?? TONOS.normal;
  const cerrando = t.estado === 'proximo_a_salir';

  if (t.estado === 'normal' && t.min > UMBRAL_CRONOMETRO_MIN) return null;

  return (
    <div className={`rounded-xl text-center transition-colors ${tono.caja} ${compacto ? 'p-1.5' : 'p-3 md:rounded-2xl'}`}>
      <p className={`font-black font-mono tracking-tight tabular-nums ${tono.texto} ${compacto ? 'text-sm' : 'text-xl'}`}>
        {cerrando ? '🚨' : `${t.min}:${String(Math.max(0, t.seg)).padStart(2, '0')}`}
      </p>
      {!compacto && <p className={`text-[10px] font-black mt-0.5 ${tono.etiqueta}`}>{t.mensaje}</p>}
    </div>
  );
}

const TurnoCard = memo(function TurnoCard({ turno, ahora, pasajeros, onSelect, index }) {
  const salida = fechaDeSalida(turno, ahora);
  const t = estadoTemporal(salida, ahora);
  const libres = turno.asientosDisponibles;
  const agotado = libres === 0;
  const sinCupo = !agotado && libres < pasajeros;
  const cerrando = t.estado === 'proximo_a_salir';
  const urgente = t.estado === 'urgente' || cerrando;
  const bloqueado = agotado || sinCupo || cerrando;
  const pocos = libres > 0 && libres <= POCOS_ASIENTOS;
  const [hora, periodo] = turno.hora.split(' ');

  const mostrarCronometro = t.estado !== 'normal' || t.min <= UMBRAL_CRONOMETRO_MIN;

  // Paleta de colores según estado
  const colores = agotado 
    ? { acento: 'bg-slate-300', fondo: 'bg-slate-50', texto: 'text-slate-400', badge: 'bg-slate-100 text-slate-500' }
    : urgente 
      ? { acento: 'bg-red-500', fondo: 'bg-red-50/50', texto: 'text-red-600', badge: 'bg-red-100 text-red-700' }
      : pocos 
        ? { acento: 'bg-brand-orange', fondo: 'bg-orange-50/50', texto: 'text-brand-orange', badge: 'bg-orange-100 text-brand-orange' }
        : { acento: 'bg-emerald-500', fondo: 'bg-white', texto: 'text-brand-orange', badge: 'bg-emerald-100 text-emerald-700' };

  return (
    <button 
      type="button" 
      disabled={bloqueado} 
      onClick={() => onSelect(turno)} 
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className={`
        group relative w-full text-left overflow-hidden
        transition-all duration-300 animate-card-enter motion-reduce:animate-none
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange
        
        /* MOBILE: Layout horizontal compacto */
        flex items-center gap-3 bg-white rounded-2xl p-3
        shadow-[0_1px_3px_rgba(0,0,0,0.05),0_1px_2px_rgba(0,0,0,0.03)]
        border border-slate-100
        
        /* DESKTOP: Layout vertical con más personalidad */
        md:flex-col md:items-stretch md:p-0 md:rounded-3xl md:shadow-[0_4px_20px_-4px_rgba(0,0,0,0.08)]
        md:border md:border-slate-100
        
        ${bloqueado 
          ? 'opacity-60 cursor-not-allowed' 
          : urgente 
            ? 'ring-2 ring-red-200 shadow-lg shadow-red-500/10 md:hover:shadow-2xl md:hover:shadow-red-500/20' 
            : 'md:hover:shadow-[0_20px_40px_-8px_rgba(255,106,0,0.25)] md:hover:-translate-y-1 md:hover:border-brand-orange/30 active:scale-[0.98] md:active:scale-100'
        }
      `}
    >
      {/* Acento lateral (mobile) / superior (desktop) */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 md:left-0 md:right-0 md:top-0 md:bottom-auto md:w-full md:h-1 ${colores.acento}`} />

      {/* CONTENIDO MOBILE: Horizontal compacto */}
      <div className="flex md:hidden items-center gap-3 w-full pl-2">
        {/* Hora */}
        <div className="flex-shrink-0 text-center min-w-[52px]">
          <p className={`text-lg font-black tracking-tight leading-none ${bloqueado ? 'text-slate-400' : 'text-slate-900'}`}>
            {hora}
          </p>
          <p className="text-[8px] font-black text-slate-400 mt-0.5">{periodo}</p>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-bold truncate ${bloqueado ? 'text-slate-400' : 'text-slate-700'}`}>
            {turno.conductor || 'Por asignar'}
          </p>
          <p className="text-[9px] text-slate-400 truncate">{turno.placa || 'M5S-188'}</p>
        </div>

        {/* Estado y flecha */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {mostrarCronometro ? (
            <span className={`text-[10px] font-black font-mono px-2 py-1 rounded-lg ${
              urgente ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-brand-orange'
            }`}>
              {cerrando ? '🚨' : `${t.min}:${String(t.seg).padStart(2, '0')}`}
            </span>
          ) : (
            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${colores.badge}`}>
              {agotado ? 'Agotado' : `${libres} libres`}
            </span>
          )}
          <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
            bloqueado ? 'bg-slate-100 text-slate-300' : `${colores.acento} text-white`
          }`}>
            <Icon name="chevron" stroke={3} className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* CONTENIDO DESKTOP: Vertical con personalidad */}
      <div className="hidden md:flex md:flex-col md:p-5 md:pt-6 relative">
        {/* Hora grande */}
        <div className="flex items-baseline justify-between mb-1">
          <div>
            <p className={`text-4xl font-black tracking-tighter leading-none ${bloqueado ? 'text-slate-400' : 'text-slate-900'}`}>
              {hora}
            </p>
            <p className="text-[10px] font-black text-slate-400 mt-1 tracking-wider">
              {periodo} · {turno.placa || 'M5S-188'}
            </p>
          </div>
          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${colores.badge}`}>
            {agotado ? 'Agotado' : `${libres} libres`}
          </span>
        </div>

        {/* Conductor */}
        <p className="flex items-center gap-1.5 mb-3 text-xs font-bold text-slate-500">
          <Icon name="user" className="w-3 h-3 text-slate-300" />
          <span className="truncate">{turno.conductor || 'Por asignar'}</span>
        </p>

        {/* Estado / Cronómetro destacado */}
        {mostrarCronometro ? (
          <div className={`rounded-xl p-3 mb-3 text-center ${
            urgente ? 'bg-red-50 border border-red-100' : 'bg-orange-50 border border-orange-100'
          }`}>
            <p className={`text-2xl font-black font-mono tracking-tight tabular-nums ${
              urgente ? 'text-red-600' : 'text-brand-orange'
            }`}>
              {cerrando ? '🚨 CERRANDO' : `${t.min}:${String(t.seg).padStart(2, '0')}`}
            </p>
            <p className={`text-[9px] font-black uppercase tracking-widest mt-0.5 ${
              urgente ? 'text-red-600' : 'text-brand-orange'
            }`}>{t.mensaje}</p>
          </div>
        ) : (
          <div className="rounded-xl p-3 mb-3 text-center bg-slate-50 border border-slate-100">
            <p className="text-lg font-black font-mono tracking-tight text-slate-900">
              {hora} {periodo}
            </p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Programado</p>
          </div>
        )}

        {/* Barra de ocupación */}
        <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mb-4" role="presentation">
          <div 
            className={`h-full transition-all duration-500 ${
              agotado ? 'bg-slate-300' : pocos ? 'bg-brand-orange' : 'bg-emerald-500'
            }`} 
            style={{ width: `${((CAPACIDAD - libres) / CAPACIDAD) * 100}%` }} 
          />
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between mt-auto">
          <span className={`text-[11px] font-black uppercase tracking-wider ${
            bloqueado ? 'text-slate-400' : colores.texto
          }`}>
            {agotado ? 'No disponible' : sinCupo ? `Solo ${libres}` : cerrando ? 'Cierre próximo' : urgente ? 'Último llamado' : 'Seleccionar'}
          </span>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
            bloqueado 
              ? 'bg-slate-100 text-slate-300' 
              : `${colores.acento} text-white group-hover:scale-110`
          }`}>
            <Icon name="chevron" stroke={3} />
          </div>
        </div>
      </div>
    </button>
  );
});

export default function Home() {
  const navigate = useNavigate();
  const { user, misBoletos } = useUser();

  const [turnos, setTurnos] = useState([]);
  const [origen, setOrigen] = useState('San Marcos');
  const [destino, setDestino] = useState('Cajamarca');
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [pasajeros, setPasajeros] = useState(1);
  const [turnoSeleccionado, setTurnoSeleccionado] = useState(null);
  const [aviso, setAviso] = useState('');

  // Estado para controlar cuántos turnos se muestran por bloque
  const [mostradosPorBloque, setMostradosPorBloque] = useState({
    Mañana: INCREMENTO_POR_BLOQUE,
    Tarde: INCREMENTO_POR_BLOQUE,
    Noche: INCREMENTO_POR_BLOQUE,
  });

  const ahora = useNow(30000);
  const fechasDisponibles = useMemo(() => getFechas7Dias(), []);

  useEffect(() => {
    if (!fechaSeleccionada && fechasDisponibles.length) setFechaSeleccionada(fechasDisponibles[0]);
  }, [fechasDisponibles, fechaSeleccionada]);

  // Resetear el contador cuando cambia la fecha o ruta
  useEffect(() => {
    setMostradosPorBloque({
      Mañana: INCREMENTO_POR_BLOQUE,
      Tarde: INCREMENTO_POR_BLOQUE,
      Noche: INCREMENTO_POR_BLOQUE,
    });
  }, [fechaSeleccionada, origen, destino]);

  useEffect(() => {
    const cargar = () => setTurnos(getTurnos());
    cargar();
    const id = setInterval(cargar, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!aviso) return;
    const id = setTimeout(() => setAviso(''), 4000);
    return () => clearTimeout(id);
  }, [aviso]);

  const vendidosPorTurno = useMemo(() => {
    const mapa = new Map();
    misBoletos.forEach((b) => {
      if (!b.turno?.id || b.estadoPago === 'reembolsado') return;
      const set = mapa.get(b.turno.id) ?? new Set();
      (b.asientosArray || []).forEach((a) => set.add(a));
      mapa.set(b.turno.id, set);
    });
    return mapa;
  }, [misBoletos]);

  // CORREGIDO: Sin límite total, todos los turnos disponibles
  const turnosFiltrados = useMemo(() => {
    if (!fechaSeleccionada) return [];
    return turnos
      .filter((t) => t.origen === origen && t.destino === destino && t.dia === fechaSeleccionada.index)
      .map((t) => {
        const ocupados = new Set([...(t.ocupados || []), ...(vendidosPorTurno.get(t.id) ?? [])]);
        const salida = fechaDeSalida(t, ahora);
        return { ...t, asientosDisponibles: Math.max(0, CAPACIDAD - ocupados.size), salidaTimestamp: salida.getTime() };
      })
      .filter((t) => estadoTemporal(fechaDeSalida(t, ahora), ahora).estado !== 'ya_salio')
      .sort((a, b) => a.salidaTimestamp - b.salidaTimestamp);
  }, [turnos, origen, destino, fechaSeleccionada, vendidosPorTurno, ahora]);

  const grupos = useMemo(
    () => BLOQUES.map((b) => {
      const listaCompleta = turnosFiltrados.filter((t) => bloqueDe(t.hora) === b.id);
      const cantidadAMostrar = mostradosPorBloque[b.id] ?? INCREMENTO_POR_BLOQUE;
      return {
        ...b,
        listaCompleta,
        lista: listaCompleta.slice(0, cantidadAMostrar),
        hayMas: listaCompleta.length > cantidadAMostrar,
        totalOcultos: listaCompleta.length - cantidadAMostrar,
      };
    }).filter((b) => b.listaCompleta.length > 0),
    [turnosFiltrados, mostradosPorBloque],
  );

  const maxPasajeros = useMemo(() => Math.max(1, ...turnosFiltrados.map((t) => t.asientosDisponibles)), [turnosFiltrados]);

  useEffect(() => { setPasajeros((p) => Math.min(p, maxPasajeros)); }, [maxPasajeros]);

  const intercambiarRuta = useCallback(() => { setOrigen(destino); setDestino(origen); }, [origen, destino]);
  const cambiarPasajeros = useCallback((delta) => setPasajeros((p) => Math.min(maxPasajeros, Math.max(1, p + delta))), [maxPasajeros]);
  const buscar = useCallback(() => { document.getElementById('turnos-section')?.scrollIntoView({ behavior: 'smooth' }); }, []);

  const abrirTurno = useCallback((turno) => {
    const estado = estadoTemporal(fechaDeSalida(turno, Date.now()), Date.now()).estado;
    if (estado === 'proximo_a_salir' || estado === 'ya_salio') {
      setAviso('Este vehículo ya está cerrando. Elige otro horario.');
      return;
    }
    setTurnoSeleccionado(turno);
  }, []);

  const verMas = useCallback((bloqueId) => {
    setMostradosPorBloque((prev) => ({
      ...prev,
      [bloqueId]: (prev[bloqueId] ?? INCREMENTO_POR_BLOQUE) + INCREMENTO_POR_BLOQUE,
    }));
  }, []);

  const verTodas = useCallback((bloqueId, total) => {
    setMostradosPorBloque((prev) => ({
      ...prev,
      [bloqueId]: total,
    }));
  }, []);

  if (!fechaSeleccionada) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] font-sans pb-24 md:pb-20 selection:bg-brand-orange selection:text-white">
      <Navbar user={user} onNavigate={navigate} />
      <Hero />
      <SearchBar origen={origen} destino={destino} fecha={fechaSeleccionada} pasajeros={pasajeros} maxPasajeros={maxPasajeros} onSwap={intercambiarRuta} onPasajeros={cambiarPasajeros} onBuscar={buscar} />
      
      <section id="turnos-section" className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-8 md:mt-20 scroll-mt-20">
        <div className="mb-4 md:mb-8">
          <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Turnos disponibles</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium mt-1 capitalize">{fechaSeleccionada.label} {fechaSeleccionada.dia} de {fechaSeleccionada.mes}</p>
        </div>
        
        <DateStrip fechas={fechasDisponibles} seleccionada={fechaSeleccionada} onSelect={setFechaSeleccionada} />
        
        <div className="space-y-8 md:space-y-12">
          {grupos.map((g) => (
            <div key={g.id}>
              <div className="flex items-center gap-2 mb-3 md:mb-5">
                <span className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm bg-gradient-to-br ${g.tono}`}>
                  <Icon name={g.id === 'Noche' ? 'moon' : 'sun'} className="w-3.5 h-3.5" />
                </span>
                <h3 className="text-base md:text-lg font-black text-slate-900">{g.id}</h3>
                <span className="text-[11px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm">
                  {g.listaCompleta.length} {g.listaCompleta.length === 1 ? 'salida' : 'salidas'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                {g.lista.map((t, i) => (
                  <TurnoCard key={`${t.id}-${fechaSeleccionada.index}`} turno={t} ahora={ahora} pasajeros={pasajeros} onSelect={abrirTurno} index={i} />
                ))}
              </div>

              {/* BOTONES VER MÁS / VER TODAS */}
              {g.hayMas && (
                <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
                  <button
                    onClick={() => verMas(g.id)}
                    className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 font-black text-xs md:text-sm px-5 md:px-6 py-2.5 md:py-3 rounded-xl shadow-sm hover:shadow-md hover:border-brand-orange/50 hover:text-brand-orange transition-all duration-300 active:scale-[0.98]"
                  >
                    <Icon name="chevronDown" stroke={2.5} />
                    Ver {Math.min(INCREMENTO_POR_BLOQUE, g.totalOcultos)} más
                  </button>
                  <button
                    onClick={() => verTodas(g.id, g.listaCompleta.length)}
                    className="inline-flex items-center gap-2 bg-brand-orange text-white font-black text-xs md:text-sm px-5 md:px-6 py-2.5 md:py-3 rounded-xl shadow-md hover:bg-orange-600 transition-all duration-300 active:scale-[0.98]"
                  >
                    Ver todas ({g.listaCompleta.length})
                    <Icon name="chevronDown" stroke={2.5} />
                  </button>
                </div>
              )}
            </div>
          ))}

          {turnosFiltrados.length === 0 && (
            <div className="py-10 md:py-20 text-center bg-white rounded-3xl shadow-sm">
              <p className="text-sm font-black text-slate-900">No quedan salidas para este día</p>
              <p className="text-xs text-slate-500 mt-1">Elige otra fecha arriba para ver más horarios.</p>
            </div>
          )}
        </div>
      </section>

      <div role="status" aria-live="polite" className="fixed bottom-6 inset-x-4 z-[60] flex justify-center pointer-events-none">
        {aviso && (
          <p className="pointer-events-auto bg-[#18191B] text-white text-sm font-bold px-4 py-3 rounded-xl shadow-2xl max-w-sm animate-card-enter motion-reduce:animate-none">{aviso}</p>
        )}
      </div>

      <SeatDrawer isOpen={!!turnoSeleccionado} onClose={() => setTurnoSeleccionado(null)} turno={turnoSeleccionado} origen={origen} destino={destino} misBoletos={misBoletos} pasajeros={pasajeros} />
    </div>
  );
}
