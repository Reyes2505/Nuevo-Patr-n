import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useUser();
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (email && nombre) {
      login(email, nombre);
      navigate('/mis-viajes');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex overflow-hidden border border-slate-100">
        
        {/* Lado Izquierdo: Branding */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#8B1C1C] to-[#D9531E] p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          <div className="relative z-10">
            <div className="bg-white inline-block p-2 rounded-xl mb-6">
              <Logo />
            </div>
            <h2 className="text-3xl font-black text-white leading-tight">Tus viajes,<br/>siempre contigo.</h2>
            <p className="text-white/80 mt-4 text-sm">Inicia sesión para guardar tus boletos QR y acceder a ellos cuando quieras, incluso sin conexión.</p>
          </div>
          <p className="text-white/60 text-xs relative z-10">© 2026 Nuevo Patrón San Marcos S.R.L.</p>
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center">
          <Link to="/" className="text-sm text-slate-500 hover:text-brand-red mb-8 flex items-center gap-2">
            ← Volver al inicio
          </Link>
          <h1 className="text-2xl font-black text-slate-800 mb-2">Bienvenido</h1>
          <p className="text-sm text-slate-500 mb-8">Ingresa tus datos para acceder a tus boletos.</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nombre completo</label>
              <input 
                type="text" 
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Correo electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-100 transition-all"
              />
            </div>
            <button 
              type="submit" 
              className="w-full bg-brand-red hover:bg-red-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg mt-4"
            >
              Ingresar / Registrarme
            </button>
          </form>
          <p className="text-xs text-center text-slate-400 mt-6">Al continuar, aceptas nuestros Términos y Condiciones.</p>
        </div>
      </div>
    </div>
  );
}
