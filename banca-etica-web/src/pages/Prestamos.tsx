import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ModalNuevoPrestamo from '../components/ModalNuevoPrestamo';
import '../App.css'; 

export default function Prestamos() {

    const [isModalOpen, setIsModalOpen] = useState(false);
  // MOCK DATA: Datos simulados para visualizar la interfaz completa
  const mockPrestamos = [
    {
      id: "1",
      proposito: "Compra de Semilla de Agave",
      montoOriginal: 50000,
      saldoPendiente: 35000,
      tasa: "1.5% mensual",
      estado: "Al corriente",
      proximoPagoFecha: "2026-07-01",
      proximoPagoMonto: 5000,
      progreso: 30 // Porcentaje pagado
    },
    {
      id: "2",
      proposito: "Reparación de Alambique",
      montoOriginal: 15000,
      saldoPendiente: 0,
      tasa: "1.0% mensual",
      estado: "Liquidado",
      proximoPagoFecha: "-",
      proximoPagoMonto: 0,
      progreso: 100
    }
  ];

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Mis Préstamos</button>
            <button className="ghost-link">Historial</button>
            <button className="ghost-link">Avales</button>
          </div>
          <div className="top-actions">
            <button className="primary-pill" onClick={() => setIsModalOpen(true)}>
              + Registrar Préstamo
            </button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <p className="hero-label">Financiamiento</p>
              <h2>Préstamos Activos</h2>
              <span>Gestiona tus créditos, consulta tus tablas de amortización y próximos pagos.</span>
            </div>
          </div>

          {/* SECCIÓN 1: Resumen General (Tarjetas de métricas) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="field-card" style={{ backgroundColor: '#171717', color: '#f8f5ef' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Deuda Total Pendiente</p>
              <h2 style={{ margin: '0', fontSize: '28px' }}>$35,000.00</h2>
            </div>
            <div className="field-card">
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f584f' }}>Próximo Pago</p>
              <h2 style={{ margin: '0', fontSize: '24px', color: '#171717' }}>$5,000.00</h2>
              <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>Vence el 01 Jul 2026</span>
            </div>
            <div className="field-card">
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f584f' }}>Línea de Crédito Disponible</p>
              <h2 style={{ margin: '0', fontSize: '24px', color: '#171717' }}>$15,000.00</h2>
              <span style={{ fontSize: '12px', color: '#28a745' }}>Buen historial</span>
            </div>
          </div>

          {/* SECCIÓN 2: Lista de Préstamos */}
          <section className="panel soft">
            <div style={{ display: 'grid', gap: '16px' }}>
              {mockPrestamos.map((prestamo) => (
                <div key={prestamo.id} className="field-card" style={{ backgroundColor: '#fff', border: '1px solid #e1dcd5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  
                  {/* Cabecera de la tarjeta del préstamo */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px 0', color: '#171717' }}>{prestamo.proposito}</h3>
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '4px 8px', 
                        borderRadius: '999px', 
                        backgroundColor: prestamo.estado === 'Liquidado' ? '#d4edda' : '#fff3cd',
                        color: prestamo.estado === 'Liquidado' ? '#155724' : '#856404',
                        fontWeight: 'bold'
                      }}>
                        {prestamo.estado}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ margin: '0', fontSize: '14px', color: '#5f584f' }}>Monto Original</p>
                      <strong style={{ fontSize: '16px' }}>${prestamo.montoOriginal.toLocaleString()}</strong>
                    </div>
                  </div>

                  <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />

                  {/* Detalles financieros */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#5f584f' }}>Saldo Pendiente</p>
                      <strong style={{ fontSize: '16px', color: prestamo.saldoPendiente > 0 ? '#dc3545' : '#28a745' }}>
                        ${prestamo.saldoPendiente.toLocaleString()}
                      </strong>
                    </div>
                    <div>
                      <p style={{ margin: '0', fontSize: '12px', color: '#5f584f' }}>Próximo Pago</p>
                      <strong style={{ fontSize: '14px' }}>${prestamo.proximoPagoMonto.toLocaleString()}</strong>
                      <div style={{ fontSize: '11px', color: '#5f584f' }}>{prestamo.proximoPagoFecha}</div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <button className="secondary-button" style={{ fontSize: '12px', padding: '6px 12px' }}>
                        Ver Detalles
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div style={{ width: '100%', backgroundColor: '#f0f0f0', height: '6px', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                    <div style={{ width: `${prestamo.progreso}%`, backgroundColor: prestamo.progreso === 100 ? '#28a745' : '#171717', height: '100%' }}></div>
                  </div>

                </div>
              ))}
            </div>
          </section>

        </section>
      </main>

      <ModalNuevoPrestamo 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
             // Recargamos las cajas para ver el nuevo saldo
          }}
        />
    </div>
  );
}