import { createContext, useState, useEffect, useContext } from 'react';

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [misBoletos, setMisBoletos] = useState([]);

  // Al iniciar, revisamos si hay un usuario y boletos guardados
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedTickets = localStorage.getItem('misBoletos');
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTickets) setMisBoletos(JSON.parse(savedTickets));
  }, []);

  const login = (email, nombre) => {
    const newUser = { email, nombre };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const agregarBoleto = (boleto) => {
    const nuevosBoletos = [boleto, ...misBoletos];
    setMisBoletos(nuevosBoletos);
    localStorage.setItem('misBoletos', JSON.stringify(nuevosBoletos));
  };

  return (
    <UserContext.Provider value={{ user, login, logout, misBoletos, agregarBoleto }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
