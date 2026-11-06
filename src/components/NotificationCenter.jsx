import { useState, useEffect } from 'react';

export default function NotificationCenter() {
  const [notificaciones, setNotificaciones] = useState([]);

  useEffect(() => {
    const handleNuevaNotificacion = (e) => {
      const nueva = e.detail;
      const id = Date.now();
      setNotificaciones((prev) => [...prev, { ...nueva, id }]);

      // Auto-eliminar después de 10 segundos
      setTimeout(() => {
        setNotificaciones((prev) => prev.filter((n) => n.id !== id));
      }, 10000);
    };

    window.addEventListener('nueva-venta-declaracion', handleNuevaNotificacion);
    return () => window.removeEventListener('nueva-venta-declaracion', handleNuevaNotificacion);
  }, []);

  if (notificaciones.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3">
      {notificaciones.map((notif) => (
        <div key={notif.id} className="bg-[#18191B] text-white p-4 rounded-xl shadow-2xl border-l-4 border-amber-500 w-80 animate-slide-in-right">
          <div className="flex items-start gap-3">
            <div className="bg-amber-500/20 p-2 rounded-lg text-amber-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-wider text-amber-500">Declaración Jurada Pendiente</p>
              <p className="text-sm font-bold mt-1">Pasajero: {notif.pasajero}</p>
              <p className="text-xs text-slate-400">Asiento: {notif.asiento} · DNI: {notif.dni}</p>
              <p className="text-xs text-slate-400 mt-1">Impresión física: <span className="font-bold text-white">{notif.solicitaImpresion ? 'SÍ (+S/ 0.50)' : 'NO'}</span></p>
            </div>
            <button onClick={() => setNotificaciones((prev) => prev.filter(n => n.id !== notif.id))} className="text-slate-500 hover:text-white">✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}
