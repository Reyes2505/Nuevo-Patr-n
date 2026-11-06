import { createContext, useState, useEffect, useContext } from 'react';
import { esAdmin as checkEsAdmin } from '../data/admins';

const UserContext = createContext();

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('user');
    if (saved) return JSON.parse(saved);
  } catch (e) { console.error(e); }
  return null;
};

export function UserProvider({ children }) {
  const [user, setUser] = useState(getInitialUser);
  const [misBoletos, setMisBoletos] = useState([]);
  const [solicitudesReembolso, setSolicitudesReembolso] = useState([]);

  useEffect(() => {
    const loadData = () => {
      try {
        setMisBoletos(JSON.parse(localStorage.getItem('misBoletos') || '[]'));
        setSolicitudesReembolso(JSON.parse(localStorage.getItem('solicitudesReembolso') || '[]'));
        const savedUser = localStorage.getItem('user');
        if (savedUser) setUser(JSON.parse(savedUser));
      } catch (e) { console.error(e); }
    };
    loadData();

    const handleStorageChange = (e) => {
      if (e.key === 'misBoletos' || e.key === 'solicitudesReembolso' || e.key === 'user') loadData();
    };
    window.addEventListener('storage', handleStorageChange);

    const channel = new BroadcastChannel('sync-boletos');
    channel.onmessage = () => loadData();

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.close();
    };
  }, []);

  // LOGIN CON ROL AUTOMÁTICO
  const login = (dni, nombre, celular) => {
    const esAdminUser = checkEsAdmin(dni); // ← Verificamos si es admin
    const newUser = { 
      dni, 
      nombre, 
      celular,
      rol: esAdminUser ? 'admin' : 'cliente', // ← NUEVO
      fechaRegistro: new Date().toISOString()
    };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));

    // Reclamar boletos huérfanos
    const todosBoletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    const boletosHuerfanos = todosBoletos.filter(b => b.dni === dni && !b.userId);
    
    if (boletosHuerfanos.length > 0) {
      const actualizados = todosBoletos.map(b => 
        (b.dni === dni && !b.userId) ? { ...b, userId: dni, reclamado: true } : b
      );
      localStorage.setItem('misBoletos', JSON.stringify(actualizados));
      setMisBoletos(actualizados);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const agregarBoleto = (boleto) => {
    const saved = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    const boletoConUsuario = {
      ...boleto,
      userId: user?.dni || null,
      userCelular: user?.celular || null,
    };
    const nuevos = [boletoConUsuario, ...saved];
    localStorage.setItem('misBoletos', JSON.stringify(nuevos));
    setMisBoletos(nuevos);
    notifyChange();
  };

  const solicitarReembolso = (boleto, motivo) => {
    const saved = JSON.parse(localStorage.getItem('solicitudesReembolso') || '[]');
    const nuevaSolicitud = {
      id: `RE-${Date.now()}`,
      boletoCodigo: boleto.codigo,
      boletoData: boleto,
      motivo,
      fecha: new Date().toISOString(),
      estado: 'pendiente',
      monto: boleto.total,
      userId: user?.dni || null,
    };
    const nuevas = [nuevaSolicitud, ...saved];
    localStorage.setItem('solicitudesReembolso', JSON.stringify(nuevas));
    setSolicitudesReembolso(nuevas);
    notifyChange();
  };

  const actualizarSolicitud = (idSolicitud, nuevoEstado, montoDevuelto = null) => {
    const savedSolicitudes = JSON.parse(localStorage.getItem('solicitudesReembolso') || '[]');
    const solicitud = savedSolicitudes.find(s => s.id === idSolicitud);
    
    const actualizadas = savedSolicitudes.map(s => 
      s.id === idSolicitud 
        ? { ...s, estado: nuevoEstado, montoDevuelto: montoDevuelto ?? s.monto, fechaResolucion: new Date().toISOString() }
        : s
    );
    localStorage.setItem('solicitudesReembolso', JSON.stringify(actualizadas));
    setSolicitudesReembolso(actualizadas);

    if (nuevoEstado === 'aprobado' && solicitud) {
      const savedBoletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const boletosActualizados = savedBoletos.map(b => 
        b.codigo === solicitud.boletoCodigo 
          ? { ...b, estadoPago: 'reembolsado', asientosArray: [], asientos: 'Reembolsado' } 
          : b
      );
      localStorage.setItem('misBoletos', JSON.stringify(boletosActualizados));
      setMisBoletos(boletosActualizados);
    }

    notifyChange();
  };

  const notifyChange = () => {
    const channel = new BroadcastChannel('sync-boletos');
    channel.postMessage({});
    channel.close();
  };

  // NUEVO: Helper para saber si el usuario actual es admin
  const isAdmin = user?.rol === 'admin';

  return (
    <UserContext.Provider value={{ 
      user, login, logout, 
      misBoletos, agregarBoleto,
      solicitudesReembolso, solicitarReembolso, actualizarSolicitud,
      isAdmin // ← NUEVO
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
