import { NavLink, useNavigate } from 'react-router-dom';
import '../App.css'; 

export default function Sidebar() {
  const navigate = useNavigate();

  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
  const userRol = usuario?.rol || 'Socio';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    navigate('/', { replace: true });
  };

  return (
    <aside className="sidebar">
      {/* 📌 FIJO EN LA PARTE SUPERIOR */}
      <div className="brand" style={{ flexShrink: 0 }}>
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="brand-title">MezcalPay</p>
          <small className="brand-subtitle">Panel principal</small>
        </div>
      </div>

      {/* 📜 ÁREA CON SCROLL INDEPENDIENTE */}
      <nav className="sidebar-nav">
        {/* DIVISOR 1: PRINCIPAL */}
        <div className="sidebar-divider">
          <span>Principal</span>
        </div>

        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          Inicio
        </NavLink>

        {userRol === 'Gestor' && (
          <NavLink
            to="/gestor/cooperativas"
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Mis cooperativas
          </NavLink>
        )}

        {/* DIVISOR 2: MIS MOVIMIENTOS */}
        <div className="sidebar-divider">
          <span>Mis Movimientos</span>
        </div>

        <NavLink 
          to="/mis-cajitas" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          Mis aportaciones
        </NavLink>

        {userRol === 'Socio' && (
          <>
            <NavLink to="/mi-historial" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
              Mi Historial
            </NavLink>
            <NavLink to="/mi-resumen-financiero" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Mi resumen financiero</NavLink>
            <NavLink to="/mis-comprobantes" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Mis comprobantes</NavLink>
          </>
        )}

        <NavLink 
          to="/mis-prestamos" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          Mis Préstamos
        </NavLink>

        {/* DIVISOR 3: Operacion de cooperativa */}
        {(userRol === 'Gestor' || userRol === 'Tesorero') && (
          <div className="sidebar-divider">
            <span>Gestión Comunidad</span>
          </div>
        )}

        {userRol === 'Tesorero' && (
          <>
            <NavLink to="/tesorero/aportaciones" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Aportaciones</NavLink>
            <NavLink to="/tesorero/prestamos" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Préstamos</NavLink>
            <NavLink to="/tesorero/resumen-financiero" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Resumen financiero</NavLink>
            <NavLink to="/tesorero/cierre" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Cierre del ciclo</NavLink>
          </>
        )}
        
        {(userRol === 'Gestor' || userRol === 'Tesorero') && (
          <NavLink 
            to="/admin/comunidad" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Comunidad
          </NavLink>
        )}

        {/* DIVISOR 4: MI INFORMACIÓN */}
        <div className="sidebar-divider">
          <span>Mi Información</span>
        </div>

        <NavLink 
          to="/mi-perfil" 
          className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
        >
          Mi Perfil
        </NavLink>

        {userRol === 'Socio' && (
          <NavLink to="/mi-cierre" className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>Cierre del ciclo</NavLink>
        )}
      </nav>

      {/* 📌 FIJO EN LA PARTE INFERIOR */}
      <div className="sidebar-card">
        <p className="eyebrow">{userRol}</p>
        <strong>{usuario?.nombre || 'Socio Cooperativa'}</strong>
        <button className="secondary-button" onClick={handleLogout} style={{ marginTop: '12px' }}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
