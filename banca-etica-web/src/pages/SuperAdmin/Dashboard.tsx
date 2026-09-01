import React, { useState } from 'react';
import Sidebar from '../../components/Sidebar';
import '../../App.css'; // <-- Corregido a 2 niveles

export default function SuperAdminDashboard() {
  const [search, setSearch] = useState('');

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Vista Global</button>
            <button className="ghost-link">Accesos rápidos</button>
          </div>
          
          <label className="searchbar">
            <span>Buscar opción</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej. comunidad, administrador..."
            />
          </label>
          
          <div className="top-actions">
            <button className="icon-button">Alertas</button>
            <button className="icon-button">Ayuda</button>
            <button className="primary-pill">Contactar soporte</button>
            <button className="user-pill">SA</button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <p className="hero-label">Panel Maestro</p>
              <h2>SuperAdmin</h2>
              <span>Gestión global de comunidades, administradores y métricas.</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}