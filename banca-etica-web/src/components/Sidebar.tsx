import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../App.css'; 

export default function Sidebar() {
  const navigate = useNavigate();

  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
  const userRol = usuario?.rol || 'Socio';
  const userComunidad = usuario?.comunidadNombre || 'Sin asignar';

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
          <br />
        </div>
      </div>
      <small className="comunidad-name">{( userComunidad )}</small>
      {/* 📜 ÁREA CON SCROLL INDEPENDIENTE */}
      <nav className="sidebar-nav">
        {/* DIVISOR 1: PRINCIPAL */}
        <div className="sidebar-divider">
          <span>Principal</span>
        </div>

        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo' || userRol === 'Socio') && (
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Inicio
          </NavLink>
        )}

        {/*Divisor SuperAdmin*/} 
        {(userRol === 'SuperAdmin') && (
          <NavLink 
            to="/s-admin/dashboard" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Inicio
          </NavLink>
        )}
        {(userRol === 'SuperAdmin') && (
          <NavLink 
            to="/s-admin/comunidades" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Comunidades
          </NavLink>
        )}

        {/* DIVISOR 2: MIS MOVIMIENTOS */}
        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo' || userRol === 'Socio') && (
          <div className="sidebar-divider">
            <span>Mis Movimientos</span>
          </div>
        )}

        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo' || userRol === 'Socio') && (
          <NavLink 
            to="/mis-cajitas" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Mis Cajitas
          </NavLink>
        )}

        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo' || userRol === 'Socio') && (
          <NavLink 
            to="/mis-prestamos" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Mis Préstamos
          </NavLink>
        )}

        {/* DIVISOR 3: Admin */}
        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo') && (
          <div className="sidebar-divider">
            <span>Gestión Comunidad</span>
          </div>
        )}
        
        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo') && (
          <NavLink 
            to="/admin/cajitas" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Cajitas
          </NavLink>
        )}

        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo') && (
          <NavLink 
            to="/admin/prestamos" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Préstamos
          </NavLink>
        )}

        {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo') && (
          <NavLink 
            to="/admin/comunidad" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Comunidad
          </NavLink>
        )}

        {/* DIVISOR 4: MI INFORMACIÓN */}
        {/* {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo' || userRol === 'Socio') && ( */}
          <div className="sidebar-divider">
            <span>Mi Información</span>
          </div>
        {/* )} */}

        {/* {(userRol === 'Admin' || userRol === 'Tesorero' || userRol === 'Consejo' || userRol === 'Socio') && ( */}
          <NavLink 
            to="/mi-perfil" 
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            Mi Perfil
          </NavLink>
        {/* )} */}
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