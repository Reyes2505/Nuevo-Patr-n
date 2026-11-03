import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import Logo from '../components/Logo';
import Footer from '../components/Footer';
import QRCode from 'react-qr-code';

export default function MyTrips() {
  const { user, logout, misBoletos } = useUser();
  const navigate = useNavigate();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-sm w-full">
          <h2 className="text-xl font-bold text-slate-800 mb-2">Inicia sesión</h2>
          <p className="text-sm text-slate-500 mb-6">Debes ingresar para ver tus boletos guardados.</p>
          <Link to="/login" className="block w-full bg-brand-red text-white font-bold py-3 rounded-xl">Ir al Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-600 hidden sm:inline">Hola, {user.nombre.split(' ')[0]}</span>
            <button onClick={() => { logout(); navigate('/'); }} className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg hover:bg-red-100 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-6 py-10 w-full">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Mis Viajes</h1>
        <p className="text-sm text-slate-500 mb-8">Aquí encontrarás todos tus boletos digitales con su código QR.</p>

        {misBoletos.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">Aún no tienes boletos</h3>
            <p className="text-sm text-slate-500 mb-6">Tus compras aparecerán aquí automáticamente.</p>
            <Link to="/" className="bg-brand-orange hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg">
              Comprar mi primer pasaje
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {misBoletos.map((boleto, index) => (
              <div key={index} className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                <div className="bg-brand-red text-white p-4 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-red-200">Boleto Digital</span>
                    <p className="font-bold text-lg">{boleto.origen} → {boleto.destino}</p>
                  </div>
                  <span className="text-2xl font-black">{boleto.turno.hora}</span>
                </div>
                
                <div className="p-5 flex items-center justify-center bg-slate-50 border-b border-slate-100">
                  <div className="bg-white p-3 rounded-xl border border-dashed border-slate-300">
                    <QRCode value={`BOLETO-${boleto.codigo}`} size={100} fgColor="#1E293B" />
                  </div>
                </div>

                <div className="p-5 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Asientos:</span>
                    <span className="font-bold text-brand-orange">{boleto.asientos}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fecha:</span>
                    <span className="font-semibold text-slate-800">{new Date(boleto.fecha).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Placa:</span>
                    <span className="font-mono font-bold text-slate-800">{boleto.turno.placa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operación:</span>
                    <span className="font-mono text-emerald-600 font-bold">{boleto.codigo}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
