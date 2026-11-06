import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { ROLES } from '../data/admins';
import Footer from '../components/Footer';

export default function Profile() {
  const { user, logout, misBoletos, isAdmin } = useUser();
  const navigate = useNavigate();
  
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    email: user?.email || '',
    telefono: user?.celular || '',
    dni: user?.dni || '',
  });
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  // Estadísticas
  const estadisticas = useMemo(() => {
    const boletosValidos = (misBoletos || []).filter(b => b.estadoPago === 'pagado');
    const totalViajes = boletosValidos.length;
    const totalInvertido = boletosValidos.reduce((acc, b) => acc + (b.total || 0), 0);
    const asientosComprados = boletosValidos.flatMap(b => b.asientosArray || []).length;

    const conteoAsientos = {};
    boletosValidos.forEach(b => {
      (b.asientosArray || []).forEach(a => {
        conteoAsientos[a] = (conteoAsientos[a] || 0) + 1;
      });
    });
    let asientoFavorito = '---';
    let maxAsiento = 0;
    Object.entries(conteoAsientos).forEach(([asiento, count]) => {
      if (count > maxAsiento) {
        maxAsiento = count;
        asientoFavorito = asiento;
      }
    });

    const conteoRutas = {};
    boletosValidos.forEach(b => {
      const ruta = `${b.origen} → ${b.destino}`;
      conteoRutas[ruta] = (conteoRutas[ruta] || 0) + 1;
    });
    let rutaFavorita = '---';
    let maxRuta = 0;
    Object.entries(conteoRutas).forEach(([ruta, count]) => {
      if (count > maxRuta) {
        maxRuta = count;
        rutaFavorita = ruta;
      }
    });

    const duracionViajeMin = 105;
    const tiempoTotalMin = totalViajes * duracionViajeMin;
    const tiempoPromedioMin = totalViajes > 0 ? Math.round(tiempoTotalMin / totalViajes) : 0;
    const horasPromedio = Math.floor(tiempoPromedioMin / 60);
    const minutosPromedio = tiempoPromedioMin % 60;

    return {
      totalViajes,
      totalInvertido,
      asientosComprados,
      asientoFavorito,
      rutaFavorita,
      tiempoPromedio: totalViajes > 0 ? `${horasPromedio}h ${minutosPromedio}m` : '---',
    };
  }, [misBoletos]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Inicia sesión</h2>
          <p className="text-sm text-slate-500 mb-6">Debes ingresar para ver tu perfil.</p>
          <Link to="/login" className="block w-full bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl transition-colors">Ir al Login</Link>
        </div>
      </div>
    );
  }

  const handleGuardar = (e) => {
    e.preventDefault();
    setGuardando(true);
    setTimeout(() => {
      const userActualizado = { ...user, ...formData, celular: formData.telefono };
      localStorage.setItem('user', JSON.stringify(userActualizado));
      setGuardando(false);
      setEditando(false);
      setMensaje('Datos actualizados correctamente.');
      setTimeout(() => setMensaje(''), 3000);
      window.location.reload();
    }, 800);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Rol actual (admin o cliente)
  const rolActual = ROLES[user.rol] || ROLES.cliente;
  const esAdminActual = user.rol === 'admin';

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-black text-brand-orange tracking-tighter">Nuevo</span>
            <span className="text-xl font-black text-slate-900 tracking-tighter">Patrón</span>
          </Link>
          <div className="flex items-center gap-3">
            {esAdminActual && (
              <Link to="/admin" className="hidden sm:flex items-center gap-1.5 bg-brand-orange hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                Panel Admin
              </Link>
            )}
            <Link to="/mis-viajes" className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 hover:bg-slate-100 transition-colors text-xs font-bold text-slate-700">
              <svg className="w-4 h-4 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
              Mis Viajes
            </Link>
            <button onClick={handleLogout} className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors" title="Cerrar Sesión">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto px-6 py-10 w-full">
        
        {/* HERO DEL PERFIL */}
        <div className={`bg-white rounded-3xl border-2 p-8 shadow-sm mb-6 animate-fade-slide-up ${
          esAdminActual ? 'border-amber-300 bg-gradient-to-br from-amber-50/50 to-white' : 'border-slate-200'
        }`}>
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar grande */}
            <div className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-4xl font-black shadow-lg flex-shrink-0 ${
              esAdminActual 
                ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-amber-500/30' 
                : 'bg-gradient-to-br from-brand-orange to-orange-600 shadow-brand-orange/30'
            }`}>
              {user.nombre?.charAt(0).toUpperCase() || 'U'}
            </div>
            
            {/* Info principal */}
            <div className="flex-1 text-center md:text-left">
              <p className="text-[11px] font-black text-brand-orange uppercase tracking-widest mb-1">Tu perfil de cliente</p>
              <h1 className="text-3xl font-black text-slate-900">{user.nombre || 'Usuario Nuevo Patrón'}</h1>
              <p className="text-sm text-slate-500 font-medium mt-1">DNI: {user.dni || '---'} · Cel: {user.celular ? `+51 ${user.celular}` : '---'}</p>
              
              <div className="flex flex-wrap gap-2 justify-center md:justify-start mt-4">
                {/* BADGE DINÁMICO: Dorado para admin, verde para cliente */}
                {esAdminActual ? (
                  <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-amber-500 text-white px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/30">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    Administrador
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-xs font-bold text-emerald-700">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    Cliente Verificado
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full text-xs font-bold text-slate-600">
                  <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                  {estadisticas.totalViajes} viaje{estadisticas.totalViajes !== 1 ? 's' : ''} realizado{estadisticas.totalViajes !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Botón editar */}
            {!editando && (
              <button onClick={() => setEditando(true)}
                className="bg-[#18191B] hover:bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-black/10 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                Editar Perfil
              </button>
            )}
          </div>
        </div>

        {/* SECCIÓN DE PRIVILEGIOS (solo si es admin) */}
        {esAdminActual && (
          <div className="bg-gradient-to-br from-[#18191B] to-slate-800 rounded-3xl p-6 mb-6 shadow-xl animate-fade-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-400 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Privilegios de Administrador</p>
                <h3 className="text-lg font-black text-white">Acceso total al sistema</h3>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
              {rolActual.privilegios.map((priv, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-white/70">
                  <svg className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                  {priv}
                </div>
              ))}
            </div>

            <Link to="/admin" className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-black text-sm px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              Ir al Panel de Administración
            </Link>
          </div>
        )}

        {mensaje && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-xl mb-6 font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            {mensaje}
          </div>
        )}

        {/* ESTADÍSTICAS DEL CLIENTE */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-slide-up">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 13l2-5h14l2 5M5 13h14v6H5v-6z"/></svg>
            </div>
            <p className="text-2xl font-black text-slate-900">{estadisticas.totalViajes}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Viajes totales</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-2xl font-black text-slate-900">S/ {estadisticas.totalInvertido.toFixed(2)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total invertido</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-slide-up" style={{ animationDelay: '200ms' }}>
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
            </div>
            <p className="text-2xl font-black text-slate-900">{estadisticas.asientosComprados}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Asientos comprados</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm animate-fade-slide-up" style={{ animationDelay: '300ms' }}>
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <p className="text-2xl font-black text-slate-900">{estadisticas.tiempoPromedio}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tiempo promedio</p>
          </div>
        </div>

        {/* PREFERENCIAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-[#18191B] to-slate-800 rounded-2xl p-6 text-white shadow-lg animate-fade-slide-up">
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg>
              <h3 className="text-xs font-black uppercase tracking-wider text-white/70">Tu asiento favorito</h3>
            </div>
            <p className="text-5xl font-black text-brand-orange mb-1">{estadisticas.asientoFavorito !== '---' ? `N°${estadisticas.asientoFavorito}` : '---'}</p>
            <p className="text-xs text-white/50 font-medium">El asiento que más has reservado</p>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm animate-fade-slide-up" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center gap-2 mb-4">
              <svg className="w-5 h-5 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">Tu ruta favorita</h3>
            </div>
            <p className="text-2xl font-black text-slate-900 mb-1">{estadisticas.rutaFavorita}</p>
            <p className="text-xs text-slate-400 font-medium">La ruta que más has viajado</p>
          </div>
        </div>

        {/* INFORMACIÓN PERSONAL */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-fade-slide-up">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-black text-slate-900">Información Personal</h2>
              <p className="text-xs text-slate-500">Estos datos se usan para tus boletos.</p>
            </div>
            {editando && (
              <button onClick={() => setEditando(false)} className="text-xs font-bold text-slate-500 hover:text-slate-900">
                Cancelar
              </button>
            )}
          </div>
          
          <form onSubmit={handleGuardar} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Nombre completo</label>
                <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                  disabled={!editando}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DNI</label>
                <input type="text" value={formData.dni} onChange={(e) => setFormData({...formData, dni: e.target.value})}
                  disabled={!editando} maxLength={8}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Celular</label>
                <input type="tel" value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                  disabled={!editando} placeholder="+51 999 999 999"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Correo (opcional)</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={!editando} placeholder="correo@ejemplo.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all"/>
              </div>
            </div>

            {editando && (
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setEditando(false)} className="px-5 py-2.5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={guardando} className="px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-brand-orange hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center gap-2">
                  {guardando && <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>}
                  {guardando ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* SEGURIDAD Y OTROS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <div>
              <h3 className="font-black text-slate-900">Seguridad</h3>
              <p className="text-xs text-slate-500 mb-3">Tu sesión se guarda en tu dispositivo.</p>
              <button className="text-xs font-black text-brand-orange uppercase tracking-wider hover:underline">Cerrar sesión en todos los dispositivos →</button>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </div>
            <div>
              <h3 className="font-black text-slate-900">Eliminar cuenta</h3>
              <p className="text-xs text-slate-500 mb-3">Esta acción es irreversible.</p>
              <button className="text-xs font-black text-red-600 uppercase tracking-wider hover:underline">Solicitar eliminación →</button>
            </div>
          </div>
        </div>

        {/* ACCESOS RÁPIDOS */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/mis-viajes" className="bg-[#18191B] hover:bg-black text-white p-5 rounded-2xl flex items-center justify-between transition-all group">
            <div>
              <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-1">Acción rápida</p>
              <p className="text-lg font-black">Ver mis boletos</p>
            </div>
            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center group-hover:bg-brand-orange transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
            </div>
          </Link>

          <Link to="/" className="bg-brand-orange hover:bg-orange-700 text-white p-5 rounded-2xl flex items-center justify-between transition-all group">
            <div>
              <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1">Acción rápida</p>
              <p className="text-lg font-black">Comprar nuevo boleto</p>
            </div>
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            </div>
          </Link>
        </div>

      </main>
      
      <Footer />
    </div>
  );
}
