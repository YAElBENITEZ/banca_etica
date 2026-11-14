import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CooperativasGestor from './pages/Gestor/Cooperativas';
import DashboardGestor from './pages/Gestor/Dashboard';
import MiPerfil from './pages/MiPerfil';
import Cajitas from './pages/Socio/Cajitas';
import DashboardSocio from './pages/Socio/Dashboard';
import SocioEnEspera from './pages/Socio/EnEspera';
import MiCierre from './pages/Socio/MiCierre';
import MiHistorial from './pages/Socio/MiHistorial';
import MiResumenFinanciero from './pages/Socio/MiResumenFinanciero';
import MisComprobantes from './pages/Socio/MisComprobantes';
import MisPrestamos from './pages/Socio/Prestamos';
import AportacionesTesorero from './pages/Tesorero/Aportaciones';
import CierreCicloTesorero from './pages/Tesorero/CierreCiclo';
import ComunidadTesorero from './pages/Tesorero/Comunidad';
import DashboardTesorero from './pages/Tesorero/Dashboard';
import PrestamosTesorero from './pages/Tesorero/Prestamos';
import ResumenFinancieroTesorero from './pages/Tesorero/ResumenFinanciero';

export default function App() {
  return <BrowserRouter><Routes>
    <Route path="/" element={<Login />} />
    <Route path="/login" element={<Login />} />
    <Route path="/registro" element={<Register />} />
    <Route element={<PrivateRoute allowedRoles={['Socio']} allowedStatuses={['PENDIENTE']} />}>
      <Route path="/socio/en-espera" element={<SocioEnEspera />} />
    </Route>
    <Route element={<PrivateRoute allowedRoles={['Socio', 'Tesorero']} allowedStatuses={['ACTIVO']} />}>
      <Route path="/dashboard" element={<DashboardSocio />} />
      <Route path="/mis-cajitas" element={<Cajitas />} />
      <Route path="/mi-historial" element={<MiHistorial />} />
      <Route path="/mi-cierre" element={<MiCierre />} />
      <Route path="/mi-resumen-financiero" element={<MiResumenFinanciero />} />
      <Route path="/mis-comprobantes" element={<MisComprobantes />} />
      <Route path="/mis-prestamos" element={<MisPrestamos />} />
    </Route>
    <Route element={<PrivateRoute allowedStatuses={['ACTIVO']} />}><Route path="/mi-perfil" element={<MiPerfil />} /></Route>
    <Route element={<PrivateRoute allowedRoles={['Gestor']} allowedStatuses={['ACTIVO']} />}>
      {/* <Route path="/gestor/dashboard" element={<Navigate to="/gestor/cooperativas" replace />} /> */}
      <Route path="/gestor/dashboard" element={<DashboardGestor />} />
      <Route path="/gestor/cooperativas" element={<CooperativasGestor />} />
    </Route>
    <Route element={<PrivateRoute allowedRoles={['Tesorero']} allowedStatuses={['ACTIVO']} />}>
      <Route path="/tesorero/dashboard" element={<DashboardTesorero />} />
      <Route path="/tesorero/aportaciones" element={<AportacionesTesorero />} />
      <Route path="/tesorero/prestamos" element={<PrestamosTesorero />} />
      <Route path="/tesorero/cierre" element={<CierreCicloTesorero />} />
      <Route path="/tesorero/resumen-financiero" element={<ResumenFinancieroTesorero />} />
      <Route path="/tesorero/comunidad" element={<ComunidadTesorero />} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes></BrowserRouter>;
}
