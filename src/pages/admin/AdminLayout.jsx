import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import NotificationCenter from '../../components/NotificationCenter';
import MonitorEmbarque from '../../components/MonitorEmbarque';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  const menuItems = [
    { path: '/admin', label: 'Resumen', icon: 'dashboard', exact: true },
    { path: '/admin/cobros', label: 'Cobros', icon: 'cash' },
    { path: '/admin/dispatch', label: 'Despacho', icon: 'truck' },
    { path: '/admin/scanner', label: 'Escáner QR', icon: 'scanner' },
    { path: '/admin/monitoreo', label: 'Monitoreo', icon: 'map' },
    { path: '/admin/flota', label: 'Flota', icon: 'users' },
    { path: '/admin/pos', label: 'POS', icon: 'pos' },
    { path: '/admin/reembolsos', label: 'Reembolsos', icon: 'refund' },
    { path: '/admin/tributario', label: 'Tributario', icon: 'document' },
  ];

  const getIcon = (name) => {
    switch(name) {
      case 'dashboard': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>;
      case 'cash': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>;
      case 'truck': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0zM13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"/>;
      case 'scanner': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>;
      case 'map': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>;
      case 'users': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>;
      case 'pos': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>;
      case 'refund': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"/>;
      case 'document': return <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>;
      default: return null;
    }
  };

  const isActive = (item) => {
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        bg-[#18191B] text-white flex flex-col transition-all duration-300 fixed h-full z-50
        ${sidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full md:translate-x-0 md:w-20'}
        md:z-40
      `}>
        <div className="h-16 md:h-20 flex items-center justify-between md:justify-center border-b border-white/10 px-4">
          {sidebarOpen ? (
            <div className="flex items-center gap-1">
              <span className="text-xl font-black text-brand-orange tracking-tighter">Nuevo</span>
              <span className="text-xl font-black text-white tracking-tighter">Patrón</span>
            </div>
          ) : (
            <span className="text-xl font-black text-brand-orange hidden md:block">NP</span>
          )}
          
          <button onClick={() => setSidebarOpen(false)} className="md:hidden w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <nav className="flex-1 py-4 md:py-6 space-y-1 px-2 md:px-3 overflow-y-auto">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive(item) 
                  ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {getIcon(item.icon)}
              </svg>
              <span className={`text-sm font-bold truncate ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-2 md:p-3 border-t border-white/10 space-y-2">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all w-full">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/></svg>
            <span className={`text-sm font-bold ${sidebarOpen ? 'block' : 'hidden md:hidden'}`}>Ir al sitio</span>
          </button>
        </div>
      </aside>

      <div className="md:hidden fixed top-0 left-0 right-0 bg-[#18191B] text-white z-30 h-14 flex items-center justify-between px-4">
        <button onClick={() => setSidebarOpen(true)} className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
        <div className="flex items-center gap-1">
          <span className="text-base font-black text-brand-orange">Nuevo</span>
          <span className="text-base font-black text-white">Patrón</span>
        </div>
        <div className="w-9"></div>
      </div>

      <main className={`
        flex-1 transition-all duration-300 
        pt-14 md:pt-0
        ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}
        p-4 md:p-8
      `}>
        <Outlet />
      </main>

      {/* COMPONENTES DE NOTIFICACIÓN EN TIEMPO REAL */}
      <NotificationCenter />
      <MonitorEmbarque />
    </div>
  );
}
