import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { esAdmin } from '../data/admins'; // ← NUEVO: Importar

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  
  const [paso, setPaso] = useState('datos');
  const [dni, setDni] = useState('');
  const [celular, setCelular] = useState('');
  const [codigoGenerado, setCodigoGenerado] = useState('');
  const [codigoIngresado, setCodigoIngresado] = useState('');
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  
  const [usuarioExistente, setUsuarioExistente] = useState(null);
  const [esNuevoUsuario, setEsNuevoUsuario] = useState(false);

  useEffect(() => {
    if (dni.length === 8) {
      const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados') || '[]');
      const encontrado = usuariosRegistrados.find(u => u.dni === dni);
      
      if (encontrado) {
        setUsuarioExistente(encontrado);
        setEsNuevoUsuario(false);
        if (encontrado.celular) setCelular(encontrado.celular);
        if (encontrado.nombre) setNombre(encontrado.nombre);
      } else {
        setUsuarioExistente(null);
        setEsNuevoUsuario(true);
      }
    } else {
      setUsuarioExistente(null);
      setEsNuevoUsuario(false);
    }
  }, [dni]);

  const handleEnviarCodigo = (e) => {
    e.preventDefault();
    setError('');

    if (dni.length !== 8) { setError('El DNI debe tener 8 dígitos.'); return; }
    if (celular.length !== 9) { setError('El celular debe tener 9 dígitos (empieza con 9).'); return; }

    const nuevoCodigo = Math.floor(1000 + Math.random() * 9000).toString();
    setCodigoGenerado(nuevoCodigo);
    
    console.log(`📱 Código SMS para ${celular}: ${nuevoCodigo}`);
    
    setCargando(true);
    setTimeout(() => {
      setCargando(false);
      setPaso('verificacion');
      alert(`🔐 Código de verificación (simulación SMS): ${nuevoCodigo}`);
    }, 1000);
  };

  const handleVerificar = (e) => {
    e.preventDefault();
    setError('');

    if (codigoIngresado !== codigoGenerado) {
      setError('Código incorrecto. Intenta de nuevo.');
      return;
    }

    if (esNuevoUsuario && !nombre.trim()) {
      setError('Por favor ingresa tu nombre completo.');
      return;
    }

    setCargando(true);
    
    setTimeout(() => {
      let nombreFinal = nombre;
      
      if (esNuevoUsuario) {
        const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados') || '[]');
        const nuevoUsuario = {
          dni,
          nombre: nombre.trim(),
          celular,
          fechaRegistro: new Date().toISOString(),
        };
        localStorage.setItem('usuariosRegistrados', JSON.stringify([...usuariosRegistrados, nuevoUsuario]));
        nombreFinal = nombre.trim();
      } else {
        nombreFinal = usuarioExistente.nombre;
      }
      
      // NUEVO: Detectar si es admin por su DNI
      const esUsuarioAdmin = esAdmin(dni);
      
      // Si es admin y no estaba en la lista de registrados, lo agregamos
      if (esUsuarioAdmin) {
        const usuariosRegistrados = JSON.parse(localStorage.getItem('usuariosRegistrados') || '[]');
        const existe = usuariosRegistrados.find(u => u.dni === dni);
        if (!existe) {
          localStorage.setItem('usuariosRegistrados', JSON.stringify([
            ...usuariosRegistrados, 
            { dni, nombre: nombreFinal, celular, rol: 'admin', fechaRegistro: new Date().toISOString() }
          ]));
        }
      }
      
      // Login con el rol correspondiente
      login(dni, nombreFinal, celular);
      
      // Redirigir: admin va a /admin, cliente a /mis-viajes
      if (esUsuarioAdmin) {
        navigate('/admin');
      } else {
        navigate('/mis-viajes');
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-black text-brand-orange tracking-tighter">Nuevo</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">Patrón</span>
          </Link>
          <p className="text-sm text-slate-500 mt-2">Ingresa con tu DNI y celular</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 relative overflow-hidden">
          
          {paso === 'datos' && (
            <form onSubmit={handleEnviarCodigo}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"/></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900">Identifícate</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {usuarioExistente ? '¡Bienvenido de vuelta!' : 'No necesitas correo ni contraseña.'}
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">DNI</label>
                  <input 
                    type="text" 
                    value={dni} 
                    onChange={(e) => setDni(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    placeholder="Ej. 12345678"
                    maxLength={8}
                    required
                    className={`w-full bg-slate-50 border rounded-xl px-4 py-3.5 text-lg font-mono font-black text-slate-900 focus:outline-none focus:ring-2 transition-all ${
                      usuarioExistente 
                        ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-200' 
                        : 'border-slate-200 focus:border-brand-orange focus:ring-brand-orange/20'
                    }`}
                  />
                  {usuarioExistente && (
                    <p className="text-[10px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                      Hola, {usuarioExistente.nombre}
                      {esAdmin(dni) && (
                        <span className="ml-1 text-[9px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full uppercase">⚙️ Admin</span>
                      )}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Celular</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">+51</span>
                    <input 
                      type="tel" 
                      value={celular} 
                      onChange={(e) => setCelular(e.target.value.replace(/\D/g, '').slice(0, 9))}
                      placeholder="900 000 000"
                      maxLength={9}
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-14 pr-4 py-3.5 text-lg font-mono font-black text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 font-bold">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={cargando}
                className="w-full bg-gradient-to-r from-brand-orange to-orange-600 hover:from-orange-600 hover:to-brand-orange text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg shadow-brand-orange/30 active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cargando ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
                    Enviando código...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                    Enviar código SMS
                  </>
                )}
              </button>

              <div className="text-center mt-6">
                <Link to="/" className="text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors">
                  ← Volver al inicio
                </Link>
              </div>
            </form>
          )}

          {paso === 'verificacion' && (
            <form onSubmit={handleVerificar}>
              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h2 className="text-2xl font-black text-slate-900">
                  {esNuevoUsuario ? 'Crea tu cuenta' : 'Verifica tu SMS'}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Enviamos un código a <strong>+51 {celular}</strong>
                </p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Código de 4 dígitos</label>
                  <input 
                    type="text" 
                    value={codigoIngresado} 
                    onChange={(e) => setCodigoIngresado(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    maxLength={4}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-4 text-center text-3xl font-mono font-black text-slate-900 tracking-[1em] focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                  />
                </div>

                {esNuevoUsuario && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tu nombre completo</label>
                    <input 
                      type="text" 
                      value={nombre} 
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Ej. Juan Pérez García"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-sm font-bold text-slate-900 focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 transition-all"
                    />
                  </div>
                )}

                {!esNuevoUsuario && usuarioExistente && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Bienvenido de vuelta</p>
                    <p className="text-sm font-black text-slate-900">{usuarioExistente.nombre}</p>
                    <p className="text-[10px] text-slate-500 mt-1">DNI: {dni}</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 font-bold">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={cargando}
                className="w-full bg-[#18191B] hover:bg-black text-white font-black text-sm uppercase tracking-wider py-4 rounded-xl transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {cargando ? 'Verificando...' : (esNuevoUsuario ? 'Crear cuenta y entrar' : 'Verificar y entrar')}
              </button>

              <button 
                type="button"
                onClick={() => setPaso('datos')}
                className="w-full mt-3 text-xs font-bold text-slate-500 hover:text-brand-orange transition-colors"
              >
                ← Cambiar número
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6 px-8">
          Al continuar aceptas nuestros términos y condiciones. Tus datos están protegidos y no serán compartidos.
        </p>
      </div>
    </div>
  );
}
