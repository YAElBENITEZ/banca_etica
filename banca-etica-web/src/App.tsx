import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Cajitas from './pages/Admin/Cajitas';
import Prestamos from './pages/Admin/Prestamos';
import Comunidad from './pages/Admin/Comunidad';
import MisCajitas from './pages/Cajitas';
import MisPrestamos from './pages/Prestamos';
import MiPerfil from './pages/MiPerfil';
import PrivateRoute from './components/PrivateRoute';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 RUTA PÚBLICA */}
        <Route path="/" element={<Login />} />

        {/* 🔒 RUTAS PROTEGIDAS GENERALES (Cualquier socio autenticado) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mis-cajitas" element={<MisCajitas />} />
          <Route path="/mis-prestamos" element={<MisPrestamos />} />
          <Route path="/admin/cajitas" element={<Cajitas />} />
          <Route path="/admin/prestamos" element={<Prestamos />} />
          <Route path="/mi-perfil" element={<MiPerfil />} />
        </Route>

        {/* 🔒 RUTA PROTEGIDA POR ROLE RESTRINGIDO (Solo Admin/Mesa Directiva) */}
        <Route element={<PrivateRoute allowedRoles={['Admin', 'Tesorero', 'Consejo']} />}>
          <Route path="/admin/comunidad" element={<Comunidad />} />
        </Route>

        {/* Redirección por defecto para URLs inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}