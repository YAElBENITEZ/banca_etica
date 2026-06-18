import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../App.css'; 

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Aquí después limpiaremos tokens del LocalStorage
    navigate('/');
  };

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p>MezcalPay</p>
          <small>Panel principal</small>
        </div>
      </div>

      <nav className="sidebar-nav">
        {/* Más adelante cambiaremos estos botones por <NavLink> de react-router-dom */}
        <NavLink 
          to="/dashboard" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Inicio
        </NavLink>

        <NavLink 
          to="/cajitas" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Cajitas
        </NavLink>
        <NavLink 
          to="/prestamos" 
          className={({ isActive }) => isActive ? "active" : ""}
        >
          Prestamos
        </NavLink>
        <button>Comunidad</button>
        <button>Cuenta</button>
      </nav>

      <div className="sidebar-card">
        <p className="eyebrow">Sesión Activa</p>
        <strong>Tu banca cooperativa</strong>
        <span>Explora ahorro, cobros y préstamos desde aquí.</span>
        <button className="secondary-button" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}