import React, { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Sidebar from '../components/Sidebar';
import ModalNuevoPrestamo from '../components/ModalNuevoPrestamo';
import ModalTablaPagosPrestamo from '../components/Admin/ModalTablaPagosPrestamo';
import '../App.css'; 

export default function Prestamos() {
  const [isModalPrestamoOpen, setIsModalPrestamoOpen] = useState(false);
  const [isModalPagosOpen, setIsModalPagosOpen] = useState(false);
  const [prestamoSeleccionado, setPrestamoSeleccionado] = useState<any>(null);
  
  // 1. Estado para guardar los préstamos reales de C#
  const [prestamos, setPrestamos] = useState<any[]>([]);

  // 2. Función para ir por los datos
  const fetchPrestamos = async () => {
    try {
      const response = await apiFetch('http://localhost:5026/api/prestamo');
      if (!response.ok) throw new Error('Error al cargar los préstamos');
      
      const data = await response.json();
      setPrestamos(data);
    } catch (error) {
      console.error("Hubo un problema con el fetch:", error);
    }
  };

  // 3. Ejecutar automáticamente al abrir la pantalla
  useEffect(() => {
    fetchPrestamos();
  }, []);

  // Calculamos la deuda total pendiente sumando los montos (por ahora todo, porque no hay pagos aún)
  const deudaTotal = prestamos.reduce((suma, p) => suma + p.montoOriginal, 0);

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
            <button className="primary-pill" onClick={() => setIsModalPrestamoOpen(true)}>
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

          {/* SECCIÓN 1: Resumen General Dinámico */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="field-card" style={{ backgroundColor: '#171717', color: '#f8f5ef' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Deuda Total Aprobada</p>
              <h2 style={{ margin: '0', fontSize: '28px' }}>${deudaTotal.toLocaleString()} MXN</h2>
            </div>
            <div className="field-card">
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f584f' }}>Préstamos Activos</p>
              <h2 style={{ margin: '0', fontSize: '24px', color: '#171717' }}>{prestamos.length}</h2>
              <span style={{ fontSize: '12px', color: '#d97706', fontWeight: 'bold' }}>En curso</span>
            </div>
          </div>

          {/* SECCIÓN 2: Lista de Préstamos */}
          <section className="panel soft">
            {prestamos.length === 0 ? (
              <p>No hay préstamos registrados aún.</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {prestamos.map((prestamo) => (
                  <div key={prestamo.id} className="field-card" style={{ backgroundColor: '#fff', border: '1px solid #e1dcd5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Cabecera de la tarjeta del préstamo */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#171717' }}>{prestamo.proposito}</h3>
                        
                        {/* AQUÍ MOSTRAMOS LA CAJITA CORRESPONDIENTE */}
                        <div style={{ fontSize: '13px', color: '#5f584f', marginBottom: '8px' }}>
                          Fondeado por: <strong>{prestamo.cajitaNombre}</strong>
                        </div>

                        <span style={{ 
                          fontSize: '12px', 
                          padding: '4px 8px', 
                          borderRadius: '999px', 
                          backgroundColor: prestamo.estado === 'Liquidado' ? '#d4edda' : prestamo.estado === 'Aprobado' ? '#cce5ff' : '#fff3cd',
                          color: prestamo.estado === 'Liquidado' ? '#155724' : prestamo.estado === 'Aprobado' ? '#004085' : '#856404',
                          fontWeight: 'bold'
                        }}>
                          {prestamo.estado}
                        </span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: '0', fontSize: '14px', color: '#5f584f' }}>Monto Aprobado</p>
                        <strong style={{ fontSize: '16px' }}>${prestamo.montoOriginal.toLocaleString()}</strong>
                      </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />

                    {/* Detalles financieros */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#5f584f' }}>Tasa de Interés</p>
                        <strong style={{ fontSize: '16px', color: '#dc3545' }}>
                          {prestamo.tasa}% Mensual
                        </strong>
                      </div>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#5f584f' }}>Fecha de Desembolso</p>
                        <strong style={{ fontSize: '14px' }}>
                          {new Date(prestamo.fechaDesembolso).toLocaleDateString('es-MX')}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <button 
                          className="secondary-button" 
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => {
                            setPrestamoSeleccionado(prestamo);
                            setIsModalPagosOpen(true);
                          }}
                        >
                          Ver Tabla de Pagos
                        </button>
                      </div>
                    </div>

                    {/* Barra de progreso temporal (En 0% porque aún no tenemos lógica de pagos) */}
                    <div style={{ width: '100%', backgroundColor: '#f0f0f0', height: '6px', borderRadius: '999px', overflow: 'hidden', marginTop: '4px' }}>
                      <div style={{ width: '0%', backgroundColor: '#171717', height: '100%' }}></div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>

        </section>
      </main>

      <ModalNuevoPrestamo 
          isOpen={isModalPrestamoOpen}
          onClose={() => setIsModalPrestamoOpen(false)}
          onSuccess={() => {
             // 4. ¡Magia! Cuando el modal termine, le decimos que vuelva a cargar los datos
             fetchPrestamos();
          }}
        />
      <ModalTablaPagosPrestamo 
        isOpen={isModalPagosOpen}
        onClose={() => setIsModalPagosOpen(false)}
        prestamo={prestamoSeleccionado}
      />
    </div>
  );
}