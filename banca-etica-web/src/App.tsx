import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Comunidad from './pages/Admin/Comunidad';
import MisPrestamos from './pages/Prestamos';
import MiPerfil from './pages/MiPerfil';
import PrivateRoute from './components/PrivateRoute';
import CooperativasGestor from './pages/Gestor/Cooperativas';
import AportacionesTesorero from './pages/Tesorero/Aportaciones';
import PrestamosTesorero from './pages/Tesorero/Prestamos';
import MiHistorial from './pages/MiHistorial';
import MiCierre from './pages/MiCierre';
import CierreCicloTesorero from './pages/Tesorero/CierreCiclo';
import ResumenFinancieroTesorero from './pages/Tesorero/ResumenFinanciero';
import MiResumenFinanciero from './pages/MiResumenFinanciero';
import MisComprobantes from './pages/MisComprobantes';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 🔓 RUTA PÚBLICA */}
        <Route path="/" element={<Login />} />
        <Route path="/registro" element={<Register />} />

        {/* 🔒 RUTAS PROTEGIDAS GENERALES (Cualquier socio autenticado) */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mis-cajitas" element={<MiResumenFinanciero />} />
          <Route path="/mi-historial" element={<MiHistorial />} />
          <Route path="/mi-cierre" element={<MiCierre />} />
          <Route path="/mi-resumen-financiero" element={<MiResumenFinanciero />} />
          <Route path="/mis-comprobantes" element={<MisComprobantes />} />
          <Route path="/mis-prestamos" element={<MisPrestamos />} />
          <Route path="/mi-perfil" element={<MiPerfil />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={['Gestor']} />}>
          <Route path="/gestor/cooperativas" element={<CooperativasGestor />} />
        </Route>

        <Route element={<PrivateRoute allowedRoles={['Tesorero']} />}>
          <Route path="/tesorero/aportaciones" element={<AportacionesTesorero />} />
          <Route path="/tesorero/prestamos" element={<PrestamosTesorero />} />
          <Route path="/tesorero/cierre" element={<CierreCicloTesorero />} />
          <Route path="/tesorero/resumen-financiero" element={<ResumenFinancieroTesorero />} />
        </Route>

        {/* 🔒 RUTA PROTEGIDA POR ROL RESTRINGIDO */}
        <Route element={<PrivateRoute allowedRoles={['Gestor', 'Tesorero']} />}>
          <Route path="/admin/comunidad" element={<Comunidad />} />
        </Route>

        {/* Redirección por defecto para URLs inexistentes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
