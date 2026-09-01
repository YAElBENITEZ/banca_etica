import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard';
import SuperAdminComunidades from './pages/SuperAdmin/Comunidades';
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
        <Route path="/register" element={<Register />} />

        {/* 🔒 RUTAS PROTEGIDAS GENERALES (Cualquier socio autenticado) */}
        <Route element={<PrivateRoute allowedRoles={['Admin', 'Tesorero', 'Consejo', 'Socio']} />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mis-cajitas" element={<MisCajitas />} />
          <Route path="/mis-prestamos" element={<MisPrestamos />} />
          <Route path="/admin/cajitas" element={<Cajitas />} />
          <Route path="/admin/prestamos" element={<Prestamos />} />
        </Route>

        <Route element={<PrivateRoute/>}>
          <Route path="/mi-perfil" element={<MiPerfil />} />
        </Route>

        {/* 🔒 RUTA PROTEGIDA POR ROLE RESTRINGIDO (Solo Admin/Mesa Directiva) */}
        <Route element={<PrivateRoute allowedRoles={['Admin', 'Tesorero', 'Consejo']} />}>
          <Route path="/admin/comunidad" element={<Comunidad />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={['SuperAdmin']} />}>
          <Route path="/s-admin/dashboard" element={<SuperAdminDashboard />} />
          <Route path="/s-admin/comunidades" element={<SuperAdminComunidades />} />
        </Route>

        {/* Redirección por defecto para URLs inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}