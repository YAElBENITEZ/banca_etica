import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Importamos nuestras pantallas
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Cajitas from './pages/Cajitas';
import Prestamos from './pages/Prestamos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        <Route path="/cajitas" element={<Cajitas />} />
        <Route path="/prestamos" element={<Prestamos />} /> 

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}