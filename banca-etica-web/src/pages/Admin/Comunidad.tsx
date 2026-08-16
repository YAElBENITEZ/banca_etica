import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import ModalNuevoSocio from '../../components/Admin/ModalNuevoSocio';
import ModalDetalleSocio from '../../components/Admin/ModalDetalleSocio';
import '../../App.css'; 

// DTO/Interfaz alineada a la respuesta del ObtenerUsuarios en C#
interface Usuario {
  id: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  estatusMembresia: string;
  consentimientosArco: boolean;
  umbralAlertaSaldo: number;
  rolId: string;
}

export default function Comunidad() {
  const [isModalSocioOpen, setIsModalSocioOpen] = useState(false);
  const [isModalDetalleOpen, setIsModalDetalleOpen] = useState(false);
  const [socioSeleccionado, setSocioSeleccionado] = useState<Usuario | null>(null);
  
  // Estado para la lista real traída del Backend
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Estado para filtrado/búsqueda en la UI
  const [busqueda, setBusqueda] = useState('');

  // 1. Obtener la lista de usuarios desde C# (.NET)
  const fetchUsuarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiFetch('http://localhost:5026/api/admin/usuario');
      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status})`);
      }
      
      const data: Usuario[] = await response.json();
      setUsuarios(data);
    } catch (err: any) {
      console.error("Hubo un problema al cargar la comunidad:", err);
      setError("No se pudieron cargar los socios de la cooperativa.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Cargar al montar el componente
  useEffect(() => {
    fetchUsuarios();
  }, []);

  // 3. Filtrar usuarios según la búsqueda
  const usuariosFiltrados = usuarios.filter(u => 
    u.nombreCompleto?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.correo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    u.telefono?.includes(busqueda)
  );

  // Métricas calculadas sobre datos reales
  const activos = usuarios.filter(u => u.estatusMembresia === 'Activo').length;
  const enRevision = usuarios.filter(u => u.estatusMembresia === 'En revisión' || u.estatusMembresia === 'Pendiente').length;

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Directorio de Socios</button>
            <button className="ghost-link">Mesa Directiva</button>
            <button className="ghost-link">Solicitudes</button>
          </div>
          <div className="top-actions">
            <button className="primary-pill" onClick={() => setIsModalSocioOpen(true)}>
              + Registrar Socio
            </button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <p className="hero-label">Cooperativa Local</p>
              <h2>Gestión de la Comunidad</h2>
              <span>Administra los miembros de tu red ética y consulta sus estatus.</span>
            </div>
          </div>

          {/* SECCIÓN 1: Tarjetas de Resumen Dinámicas */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="field-card" style={{ backgroundColor: '#171717', color: '#f8f5ef' }}>
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.8 }}>Comunidad Total</p>
              <h2 style={{ margin: '0', fontSize: '28px' }}>{usuarios.length} Socios</h2>
            </div>
            <div className="field-card">
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f584f' }}>Membresías Activas</p>
              <h2 style={{ margin: '0', fontSize: '24px', color: '#171717' }}>{activos}</h2>
              <span style={{ fontSize: '12px', color: '#155724', fontWeight: 'bold' }}>En regla</span>
            </div>
            <div className="field-card">
              <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#5f584f' }}>Por Validar / Pendientes</p>
              <h2 style={{ margin: '0', fontSize: '24px', color: '#171717' }}>{enRevision}</h2>
              <span style={{ fontSize: '12px', color: '#856404', fontWeight: 'bold' }}>Requieren revisión</span>
            </div>
          </div>

          {/* SECCIÓN 2: Buscador */}
          <div style={{ marginBottom: '16px' }}>
            <input 
              type="text"
              placeholder="Buscar por nombre, correo o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #e1dcd5',
                fontSize: '14px',
                backgroundColor: '#fff'
              }}
            />
          </div>

          {/* SECCIÓN 3: Directorio de Usuarios */}
          <section className="panel soft">
            {loading ? (
              <p style={{ textAlign: 'center', color: '#5f584f', padding: '24px' }}>Cargando socios de la cooperativa...</p>
            ) : error ? (
              <div style={{ color: '#721c24', backgroundColor: '#f8d7da', padding: '16px', borderRadius: '8px' }}>
                {error}
              </div>
            ) : usuariosFiltrados.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#5f584f', padding: '24px' }}>
                {busqueda ? 'No se encontraron socios con ese criterio.' : 'No hay socios registrados en esta comunidad aún.'}
              </p>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {usuariosFiltrados.map((usuario) => (
                  <div key={usuario.id} className="field-card" style={{ backgroundColor: '#fff', border: '1px solid #e1dcd5', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    
                    {/* Encabezado del Socio */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', color: '#171717' }}>{usuario.nombreCompleto}</h3>
                        
                        <div style={{ fontSize: '13px', color: '#5f584f', marginBottom: '8px' }}>
                          {usuario.correo} • Tel: <strong>{usuario.telefono}</strong>
                        </div>

                        <span style={{ 
                          fontSize: '12px', 
                          padding: '4px 8px', 
                          borderRadius: '999px', 
                          backgroundColor: usuario.estatusMembresia === 'Activo' ? '#d4edda' : usuario.estatusMembresia === 'En revisión' ? '#cce5ff' : '#fff3cd',
                          color: usuario.estatusMembresia === 'Activo' ? '#155724' : usuario.estatusMembresia === 'En revisión' ? '#004085' : '#856404',
                          fontWeight: 'bold'
                        }}>
                          {usuario.estatusMembresia}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '11px', color: '#5f584f', display: 'block' }}>ID Socio</span>
                        <code style={{ fontSize: '11px', color: '#171717' }}>{usuario.id.substring(0, 8)}...</code>
                      </div>
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '4px 0' }} />

                    {/* Fila de detalles adicionales y botón de acción */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'center' }}>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#5f584f' }}>Alertas de Saldo</p>
                        <strong style={{ fontSize: '13px', color: '#171717' }}>
                          ${usuario.umbralAlertaSaldo ? usuario.umbralAlertaSaldo.toLocaleString() : '0'} MXN
                        </strong>
                      </div>
                      <div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#5f584f' }}>Derechos ARCO</p>
                        <strong style={{ fontSize: '13px', color: usuario.consentimientosArco ? '#155724' : '#721c24' }}>
                          {usuario.consentimientosArco ? '✓ Vigentes' : '✕ Sin Aceptar'}
                        </strong>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <button 
                          className="secondary-button" 
                          style={{ fontSize: '12px', padding: '6px 12px' }}
                          onClick={() => {
                            setSocioSeleccionado(usuario);
                            setIsModalDetalleOpen(true);
                          }}
                        >
                          Ver Detalle
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>

        </section>
      </main>

      {/* Modal para alta conectada */}
      <ModalNuevoSocio 
        isOpen={isModalSocioOpen}
        onClose={() => setIsModalSocioOpen(false)}
        onSuccess={() => {
           fetchUsuarios(); // Recarga la lista automáticamente tras guardar exitosamente
        }}
      />

      {/* Modal para ver detalle rápido del objeto */}
      <ModalDetalleSocio 
        isOpen={isModalDetalleOpen}
        onClose={() => setIsModalDetalleOpen(false)}
        socio={socioSeleccionado}
      />
    </div>
  );
}