import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import ModalNuevaComunidad, { type ComunidadData } from '../../components/SuperAdmin/ModalNuevaComunidad';
import ModalNuevoUsuarioComunidad from '../../components/SuperAdmin/ModalNuevoUsuarioComunidad';
import { apiFetch } from '../../services/api';
import '../../App.css';

interface ComunidadItem {
  id: string;
  nombre: string;
  descripcion: string;
  municipio: string;
  estado: string;
  totalUsuarios: number;
}

export default function Comunidades() {
  const [search, setSearch] = useState('');
  const [comunidades, setComunidades] = useState<ComunidadItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para el Modal de Comunidad (Crear / Editar)
  const [isComunidadModalOpen, setIsComunidadModalOpen] = useState(false);
  const [comunidadSelected, setComunidadSelected] = useState<ComunidadData | null>(null);

  // Estados para el Modal de Agregar Usuario
  const [isUsuarioModalOpen, setIsUsuarioModalOpen] = useState(false);
  const [targetComunidad, setTargetComunidad] = useState<{ id: string; nombre: string } | null>(null);

  const fetchComunidades = async () => {
    try {
      setLoading(true);
      const res = await apiFetch('http://localhost:5026/api/superadmin/comunidad');
      if (res.ok) {
        const data = await res.json();
        setComunidades(data);
      }
    } catch (err) {
      console.error('Error al cargar comunidades:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComunidades();
  }, []);

  const handleOpenCrear = () => {
    setComunidadSelected(null);
    setIsComunidadModalOpen(true);
  };

  const handleOpenEditar = (comunidad: ComunidadItem) => {
    setComunidadSelected(comunidad);
    setIsComunidadModalOpen(true);
  };

  const handleOpenNuevoUsuario = (comunidad: ComunidadItem) => {
    setTargetComunidad({ id: comunidad.id, nombre: comunidad.nombre });
    setIsUsuarioModalOpen(true);
  };

  const comunidadesFiltradas = comunidades.filter((c) =>
    c.nombre.toLowerCase().includes(search.toLowerCase()) ||
    c.municipio.toLowerCase().includes(search.toLowerCase()) ||
    c.estado.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Comunidades</button>
          </div>
          
          <label className="searchbar">
            <span>Buscar opción</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar por nombre, municipio o estado..."
            />
          </label>
          
          <div className="top-actions">
            <button className="icon-button">Alertas</button>
            <button className="icon-button">Ayuda</button>
            <button className="primary-pill" onClick={handleOpenCrear}>
              + Nueva Comunidad
            </button>
            <button className="user-pill">SA</button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="hero-label">Gestión Territorial</p>
              <h2>Comunidades Registradas</h2>
              <span>Administración global de comunidades, socios y accesos.</span>
            </div>
            <button className="primary-button" onClick={handleOpenCrear}>
              + Crear Comunidad
            </button>
          </div>

          <div style={{ marginTop: '20px' }}>
            {loading ? (
              <p>Cargando comunidades...</p>
            ) : comunidadesFiltradas.length === 0 ? (
              <p>No se encontraron comunidades registradas.</p>
            ) : (
              <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px' }}>Nombre</th>
                    <th style={{ padding: '12px' }}>Ubicación</th>
                    <th style={{ padding: '12px' }}>Descripción</th>
                    <th style={{ padding: '12px' }}>Miembros</th>
                    <th style={{ padding: '12px', textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {comunidadesFiltradas.map((c) => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.nombre}</td>
                      <td style={{ padding: '12px' }}>{c.municipio}, {c.estado}</td>
                      <td style={{ padding: '12px', color: '#64748b' }}>{c.descripcion || 'Sin notas'}</td>
                      <td style={{ padding: '12px' }}>{c.totalUsuarios} socios</td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          
                          {/* Botón 1: Agregar Usuario / Administrador */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Agregar Socio / Administrador a esta comunidad"
                            onClick={() => handleOpenNuevoUsuario(c)}
                            style={{ padding: '6px 10px', fontSize: '1rem', cursor: 'pointer' }}
                          >
                            👤⁺
                          </button>

                          {/* Botón 2: Editar Comunidad */}
                          <button
                            type="button"
                            className="icon-button"
                            title="Editar Comunidad"
                            onClick={() => handleOpenEditar(c)}
                            style={{ padding: '6px 10px', fontSize: '1rem', cursor: 'pointer' }}
                          >
                            ✏️
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>

      {/* Modal Reutilizable: Crear / Editar Comunidad */}
      <ModalNuevaComunidad
        isOpen={isComunidadModalOpen}
        onClose={() => setIsComunidadModalOpen(false)}
        onSuccess={fetchComunidades}
        comunidadToEdit={comunidadSelected}
      />

      {/* Modal: Crear Usuario vinculado al UUID de la comunidad */}
      {targetComunidad && (
        <ModalNuevoUsuarioComunidad
          isOpen={isUsuarioModalOpen}
          onClose={() => {
            setIsUsuarioModalOpen(false);
            setTargetComunidad(null);
          }}
          onSuccess={fetchComunidades}
          comunidadId={targetComunidad.id}
          comunidadNombre={targetComunidad.nombre}
        />
      )}
    </div>
  );
}