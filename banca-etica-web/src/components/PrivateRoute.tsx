import { Navigate, Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  allowedRoles?: string[];
  allowedStatuses?: string[];
}

export default function PrivateRoute({ allowedRoles, allowedStatuses }: PrivateRouteProps) {
  const token = localStorage.getItem('token');
  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;

  if (!token || !usuario) {
    return <Navigate to="/" replace />;
  }

  const userRol = usuario.rol || 'Socio';
  const userStatus = (usuario.estatus || usuario.status || 'ACTIVO').toUpperCase();

  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(userRol)) {
      const inicioPorRol: Record<string, string> = {
        Gestor: '/gestor/dashboard',
        Tesorero: '/tesorero/dashboard',
        Socio: '/dashboard',
      };
      return <Navigate to={inicioPorRol[userRol] || '/'} replace />;
    }
  }

  if (allowedStatuses && allowedStatuses.length > 0) {
    const normalizedAllowedStatuses = allowedStatuses.map((s) => s.toUpperCase());

    if (!normalizedAllowedStatuses.includes(userStatus)) {
      if (userStatus === 'PENDIENTE') {
        return <Navigate to="/socio/en-espera" replace />;
      }

      if (userStatus === 'ACTIVO') {
        return <Navigate to="/dashboard" replace />;
      }

      return <Navigate to="/" replace />;
    }
  }

  return <Outlet />;
}