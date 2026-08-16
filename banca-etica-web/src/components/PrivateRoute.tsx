import { Navigate, Outlet } from 'react-router-dom';

interface PrivateRouteProps {
  allowedRoles?: string[];
}

export default function PrivateRoute({ allowedRoles }: PrivateRouteProps) {
  const token = localStorage.getItem('token');
  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;

  // 1. Si no hay token de sesión, va directo al Login
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // 2. Si la ruta requiere roles específicos y el usuario no los tiene, redirige a su dashboard
  if (allowedRoles && allowedRoles.length > 0) {
    const userRol = usuario?.rol || 'Socio';
    if (!allowedRoles.includes(userRol)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 3. Todo en orden, renderiza la vista solicitada
  return <Outlet />;
}