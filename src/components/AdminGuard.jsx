import { Navigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';

export default function AdminGuard({ children }) {
  const { user, isAdmin } = useUser();

  // Si no hay usuario, redirigir a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si no es admin, mostrar pantalla de acceso denegado
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-md w-full">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Acceso Denegado</h2>
          <p className="text-sm text-slate-500 mb-6">No tienes permisos para acceder a esta sección.</p>
          <a href="/" className="block w-full bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl transition-colors">
            Volver al inicio
          </a>
        </div>
      </div>
    );
  }

  return children;
}
