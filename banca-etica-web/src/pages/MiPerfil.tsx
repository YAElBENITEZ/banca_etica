import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import '../App.css';

interface MiPerfilData {
  id: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  estatusMembresia: string;
  consentimientosArco: boolean;
  umbralAlertaSaldo: number;
  rolId: string;
}

const MAPA_ROLES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Administrador',
  '22222222-2222-2222-2222-222222222222': 'Socio',
  '33333333-3333-3333-3333-333333333333': 'Tesorero',
  '44444444-4444-4444-4444-444444444444': 'Consejo / Directiva'
};

export default function MiPerfil() {
  const [perfil, setPerfil] = useState<MiPerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Estados editables por el socio
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [umbralAlertaSaldo, setUmbralAlertaSaldo] = useState<number>(0);
  const [consentimientosArco, setConsentimientosArco] = useState(true);
  const [nuevaPassword, setNuevaPassword] = useState('');

  // 1. Cargar el perfil activo al montar
  const fetchMiPerfil = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token'); // <-- Verifica el nombre exacto de la llave

      const response = await fetch('/api/perfil/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        console.error("Detalle del error en Backend:", response.status, data);
        throw new Error(data.mensaje || `Error en el servidor (${response.status})`);
      }

      setPerfil(data);

      // Llenar formulario editable
      setCorreo(data.correo || '');
      setTelefono(data.telefono || '');
      setUmbralAlertaSaldo(data.umbralAlertaSaldo || 0);
      setConsentimientosArco(data.consentimientosArco ?? true);
    } catch (err: any) {
      setMensajeError(err.message || 'No se pudo cargar tu perfil.');
    } finally {
      setLoading(false);
    }
};

  useEffect(() => {
    fetchMiPerfil();
  }, []);

  // 2. Guardar cambios del usuario activo
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMensajeExito(null);
    setMensajeError(null);

    const payload = {
      correo,
      telefono: String(telefono),
      umbralAlertaSaldo: Number(umbralAlertaSaldo),
      consentimientosArco,
      nuevaPassword: nuevaPassword.trim() === '' ? null : nuevaPassword
    };

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/perfil/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al guardar los cambios.');
      }

      setMensajeExito('Tu información se actualizó correctamente.');
      setNuevaPassword(''); // Limpiar campo de clave
    } catch (err: any) {
      setMensajeError(err.message || 'Ocurrió un problema al actualizar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="main-shell" style={{ padding: '40px', color: '#5f584f' }}>
          Cargando expediente personal...
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Mi Perfil</button>
            <button className="ghost-link">Seguridad y Sesión</button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header" style={{ marginBottom: '24px' }}>
            <div>
              <p className="hero-label">Cuenta de Usuario</p>
              <h2>{perfil?.nombreCompleto}</h2>
              <span>Configura tus datos de contacto, alertas y seguridad en la cooperativa.</span>
            </div>
          </div>

          {mensajeExito && (
            <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {mensajeExito}
            </div>
          )}

          {mensajeError && (
            <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              {mensajeError}
            </div>
          )}

          {/* SECCIÓN 1: Datos Informativos Protegidos (Solo Lectura) */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <div className="field-card" style={{ backgroundColor: '#171717', color: '#f8f5ef' }}>
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', opacity: 0.8 }}>Rol en Cooperativa</p>
              <h3 style={{ margin: 0, fontSize: '18px' }}>
                {perfil ? (MAPA_ROLES[perfil.rolId] || 'Socio') : 'Socio'}
              </h3>
            </div>

            <div className="field-card">
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#5f584f' }}>Estatus de Membresía</p>
              <strong style={{ fontSize: '16px', color: perfil?.estatusMembresia === 'Activo' ? '#155724' : '#856404' }}>
                {perfil?.estatusMembresia}
              </strong>
            </div>

            <div className="field-card">
              <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#5f584f' }}>Identificador de Socio</p>
              <code style={{ fontSize: '12px', color: '#171717' }}>{perfil?.id}</code>
            </div>
          </div>

          {/* SECCIÓN 2: Formulario Editable por el Usuario */}
          <section className="panel soft" style={{ backgroundColor: '#fff', border: '1px solid #e1dcd5', padding: '24px', borderRadius: '12px' }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#171717' }}>Información Modificable</h3>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#5f584f', fontWeight: 'bold' }}>Correo Electrónico</label>
                  <input 
                    type="email" required
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e1dcd5', fontSize: '14px' }}
                    value={correo} onChange={(e) => setCorreo(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#5f584f', fontWeight: 'bold' }}>Teléfono Móvil</label>
                  <input 
                    type="text" required
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e1dcd5', fontSize: '14px' }}
                    value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#5f584f', fontWeight: 'bold' }}>Umbral Alerta Saldo (MXN)</label>
                  <input 
                    type="number"
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e1dcd5', fontSize: '14px' }}
                    value={umbralAlertaSaldo} onChange={(e) => setUmbralAlertaSaldo(Number(e.target.value))}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', color: '#5f584f', fontWeight: 'bold' }}>Consentimiento Derechos ARCO</label>
                  <select 
                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e1dcd5', fontSize: '14px' }}
                    value={consentimientosArco ? 'true' : 'false'}
                    onChange={(e) => setConsentimientosArco(e.target.value === 'true')}
                  >
                    <option value="true">Aceptado / Aprobado</option>
                    <option value="false">Revocado / No Aceptado</option>
                  </select>
                </div>
              </div>

              <hr style={{ border: 'none', borderTop: '1px solid #f0f0f0', margin: '8px 0' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: '#5f584f', fontWeight: 'bold' }}>Actualizar Contraseña</label>
                <input 
                  type="password"
                  placeholder="Escribe tu nueva contraseña si deseas cambiarla..."
                  style={{ padding: '10px', borderRadius: '6px', border: '1px solid #e1dcd5', fontSize: '14px' }}
                  value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button 
                  type="submit" 
                  className="primary-pill" 
                  disabled={saving}
                  style={{ padding: '10px 24px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'Guardando Cambios...' : 'Actualizar Mi Perfil'}
                </button>
              </div>

            </form>
          </section>

        </section>
      </main>
    </div>
  );
}