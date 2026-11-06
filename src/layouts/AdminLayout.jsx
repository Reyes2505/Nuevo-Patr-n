import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';
import Dashboard from '../pages/admin/Dashboard';
import POS from '../pages/admin/POS';
import Dispatch from '../pages/admin/Dispatch';
import Cobros from '../pages/admin/Cobros';
import Reembolsos from '../pages/admin/Reembolsos';
import Flota from '../pages/admin/Flota';
import Tributario from '../pages/admin/Tributario';
import { useUser } from '../context/UserContext';

export default function AdminLayout() {
  const navigate = useNavigate();
  const { solicitudesReembolso } = useUser();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alertasCobros, setAlertasCobros] = useState(0);
  const [alertasReembolsos, setAlertasReembolsos] = useState(0);

  useEffect(() => {
    const handleCambiarTab = (e) => setActiveTab(e.detail);
    window.addEventListener('cambiarTab', handleCambiarTab);

    const saved = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    setAlertasCobros(saved.filter(b => b.estadoPago === 'pendiente').length);
    setAlertasReembolsos(solicitudesReembolso.filter(s => s.estado === 'pendiente').length);

    return () => window.removeEventListener('cambiarTab', handleCambiarTab);
  }, [solicitudesReembolso]);

  const tabs = [
    { id: 'dashboard', name: 'Resumen', code: '00' },
    { id: 'pos', name: 'Boletería', code: '01' },
    { id: 'cobros', name: 'Cobros', code: '02', badge: alertasCobros },
    { id: 'despacho', name: 'Despacho', code: '03' },
    { id: 'flota', name: 'Flota', code: '04' },
    { id: 'tributario', name: 'Tributario', code: '05' },
    { id: 'reembolsos', name: 'Reembolsos', code: '06', badge: alertasReembolsos },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'pos': return <POS />;
      case 'cobros': return <Cobros />;
      case 'despacho': return <Dispatch />;
      case 'flota': return <Flota />;
      case 'tributario': return <Tributario />;
      case 'reembolsos': return <Reembolsos />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen fixed top-0 left-0 z-20">
        <div className="p-6 border-b border-slate-100">
          <div className="mb-4"><Logo /></div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Panel de administración</p>
        </div>

        <nav className="flex-grow p-3 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  isActive ? 'bg-brand-orange text-white shadow-lg shadow-brand-orange/20' : 'text-slate-600 hover:bg-slate-50'
                }`}>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-[10px] ${isActive ? 'text-white/70' : 'text-slate-400'}`}>{tab.code}</span>
                  {tab.name}
                </div>
                {tab.badge > 0 && (
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${isActive ? 'bg-white text-brand-orange' : 'bg-orange-100 text-orange-700'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button onClick={() => navigate('/')} className="w-full text-left text-xs font-bold text-slate-500 hover:text-red-600 transition-colors px-3 py-2">← Salir al sitio público</button>
        </div>
      </aside>

      <main className="ml-64 flex-grow min-h-screen flex flex-col">
        <header className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center sticky top-0 z-10">
          <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            Nuevo Patrón / <span className="text-slate-900">{tabs.find(t => t.id === activeTab)?.name}</span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
        </header>

        <div className="p-8 flex-grow">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
