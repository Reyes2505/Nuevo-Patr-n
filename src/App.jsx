import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './context/UserContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Booking from './pages/Booking';
import MyTrips from './pages/MyTrips';
import Profile from './pages/Profile';
import ValidarBoleto from './pages/ValidarBoleto';

import AdminLayout from './pages/admin/AdminLayout';
import AdminGuard from './components/AdminGuard';

import Dashboard from './pages/admin/Dashboard';
import Cobros from './pages/admin/Cobros';
import Dispatch from './pages/admin/Dispatch';
import Flota from './pages/admin/Flota';
import POS from './pages/admin/POS';
import Reembolsos from './pages/admin/Reembolsos';
import Tributario from './pages/admin/Tributario';
import Monitoreo from './pages/admin/Monitoreo';
import ScannerQR from './pages/admin/ScannerQR';

import Manifest from './pages/Manifest';

export default function App() {
  return (
    <UserProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/mis-viajes" element={<MyTrips />} />
          <Route path="/perfil" element={<Profile />} />
          <Route path="/validar/:codigo" element={<ValidarBoleto />} />

          <Route path="/admin" element={
            <AdminGuard>
              <AdminLayout />
            </AdminGuard>
          }>
            <Route index element={<Dashboard />} />
            <Route path="cobros" element={<Cobros />} />
            <Route path="dispatch" element={<Dispatch />} />
            <Route path="flota" element={<Flota />} />
            <Route path="pos" element={<POS />} />
            <Route path="reembolsos" element={<Reembolsos />} />
            <Route path="tributario" element={<Tributario />} />
            <Route path="monitoreo" element={<Monitoreo />} />
          </Route>

          <Route path="/admin/scanner" element={
            <AdminGuard>
              <ScannerQR />
            </AdminGuard>
          } />

          <Route path="/admin/manifest" element={<Manifest />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </UserProvider>
  );
}
