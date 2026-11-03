import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import Home from './pages/Home';
import Booking from './pages/Booking';
import Login from './pages/Login';
import MyTrips from './pages/MyTrips';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/reserva" element={<Booking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/mis-viajes" element={<MyTrips />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
