import { useState, useEffect } from 'react';

// Hook que sincroniza el estado con localStorage en tiempo real
export function useSyncStorage(key, initialValue = []) {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error leyendo localStorage:', error);
      return initialValue;
    }
  });

  // Escuchar cambios en otras pestañas
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === key) {
        try {
          setValue(e.newValue ? JSON.parse(e.newValue) : initialValue);
        } catch (error) {
          console.error('Error parseando storage:', error);
        }
      }
    };

    // Escuchar cambios de otras pestañas
    window.addEventListener('storage', handleStorageChange);

    // Para cambios en la misma pestaña, usamos un canal de broadcast
    const channel = new BroadcastChannel(`sync-${key}`);
    channel.onmessage = (e) => {
      if (e.data?.key === key) {
        setValue(e.data.value);
      }
    };

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      channel.close();
    };
  }, [key, initialValue]);

  // Función para actualizar el valor (escribe en localStorage y notifica)
  const setSyncedValue = (newValue) => {
    setValue(newValue);
    localStorage.setItem(key, JSON.stringify(newValue));
    
    // Notificar a otras pestañas
    const channel = new BroadcastChannel(`sync-${key}`);
    channel.postMessage({ key, value: newValue });
    channel.close();
  };

  return [value, setSyncedValue];
}
