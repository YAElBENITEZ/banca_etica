import React, { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import Sidebar from '../components/Sidebar'; // <-- Importamos nuestro nuevo componente
import '../App.css';

const chartData = [
  { name: 'Sem 1', ingresos: 18, egresos: 12 },
  { name: 'Sem 2', ingresos: 22, egresos: 15 },
  { name: 'Sem 3', ingresos: 20, egresos: 14 },
  { name: 'Sem 4', ingresos: 27, egresos: 19 },
];

const movementRows = [
  ['07 Mayo', 'Aporte semanal', '$1,250', 'Confirmado'],
  ['06 Mayo', 'Cobro QR lote azul', '$4,800', 'Pendiente'],
  ['05 Mayo', 'Pago de cuota', '$950', 'Confirmado'],
  ['04 Mayo', 'Préstamo temporada', '$15,000', 'Revisión'],
];

export default function Dashboard() {
  const [search, setSearch] = useState('');

  return (
    <div className="app-shell">
      
      {/* ¡Mira qué limpio queda! Solo llamamos a la etiqueta Sidebar */}
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Resumen</button>
            <button className="ghost-link">Accesos rápidos</button>
          </div>
          
          <label className="searchbar">
            <span>Buscar opción</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ej. saldo, ahorro, perfil"
            />
          </label>
          
          <div className="top-actions">
            <button className="icon-button">Alertas</button>
            <button className="icon-button">Ayuda</button>
            <button className="primary-pill">Contactar soporte</button>
            <button className="user-pill">YT</button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <p className="hero-label">Pantalla activa</p>
              <h2>Inicio</h2>
              <span>Resumen diario con saldo, alertas y actividad reciente.</span>
            </div>
          </div>

          <div className="metrics-row">
            <button className="metric-card">
              <span>Saldo disponible</span>
              <strong>$124,500</strong>
              <small>Actualizado hace 2 min</small>
            </button>
            <button className="metric-card">
              <span>Aportes del mes</span>
              <strong>$28,400</strong>
              <small>+14% frente al mes pasado</small>
            </button>
            <button className="metric-card">
              <span>Préstamos activos</span>
              <strong>18</strong>
              <small>3 requieren seguimiento</small>
            </button>
          </div>

          <div className="preview-layout">
            <div className="stack-column">
              <section className="panel soft">
                <div className="panel-header">
                  <div>
                    <p className="panel-title">Resumen semanal</p>
                    <span>Ingresos vs Egresos</span>
                  </div>
                  <button className="chip-button">Descargar</button>
                </div>
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#18181b" stopOpacity={0.22} />
                          <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#ece7df" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Area dataKey="ingresos" stroke="#18181b" fill="url(#income)" strokeWidth={2} />
                      <Area dataKey="egresos" stroke="#9f8f7d" fillOpacity={0} strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <p className="panel-title">Actividad reciente</p>
                    <span>Movimientos del día</span>
                  </div>
                  <button className="chip-button">Ver todo</button>
                </div>
                <div className="table-box">
                  {movementRows.map((row) => (
                    <button key={row.join('-')} className="table-row">
                      <span>{row[0]}</span>
                      <strong>{row[1]}</strong>
                      <span>{row[2]}</span>
                      <span className={`table-tag ${row[3] === 'Confirmado' ? 'ok' : 'warn'}`}>
                        {row[3]}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <section className="panel">
              <p className="panel-title">Acciones rápidas</p>
              <div className="quick-actions">
                {['Ver saldo', 'Registrar aporte', 'Generar cobro', 'Nueva solicitud'].map((action) => (
                  <button key={action} className="action-tile">
                    {action}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}