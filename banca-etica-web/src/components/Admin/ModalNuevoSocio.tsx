import React, { useState } from 'react';
import { apiFetch } from '../../services/api'; // 1. Importamos apiFetch

interface ModalNuevoSocioProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Opciones de roles con sus GUIDs fijos
const ROLES_COOPERATIVA = [
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Socio' },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Tesorero' },
  { id: '44444444-4444-4444-4444-444444444444', nombre: 'Consejo' },
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Admin' },
];

export default function ModalNuevoSocio({ isOpen, onClose, onSuccess }: ModalNuevoSocioProps) {
  // Estados para cada campo del formulario
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState<number | ''>('');
  const [password, setPassword] = useState('');
  const [estatusMembresia, setEstatusMembresia] = useState('Activo');
  const [rolId, setRolId] = useState('22222222-2222-2222-2222-222222222222'); // Socio por defecto
  
  // Estados para UI y feedback
  const [loading, setLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMensaje(null);

    // Payload emparejado con UsuarioRequest en C#
    const payload = {
      nombreCompleto,
      correo,
      telefono: String(telefono),
      passwordHash: password,     // Texto plano que el backend encripta con BCrypt
      estatusMembresia,
      consentimientosArco: true,  // Booleano requerido por el DTO en C#
      umbralAlertaSaldo: 500,
      rolId
    };

    try {
      const response = await apiFetch('http://localhost:5026/api/admin/usuario', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      // Lectura segura para evitar 'Unexpected end of JSON input'
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        if (data.errors) {
          console.table(data.errors);
        }
        throw new Error(data.mensaje || `Error al guardar socio (${response.status})`);
      }

      // Limpieza y cierre
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error en el registro:', err);
      setErrorMensaje(err.message || 'Ocurrió un error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNombreCompleto('');
    setCorreo('');
    setTelefono('');
    setPassword('');
    setEstatusMembresia('Activo');
    setRolId('22222222-2222-2222-2222-222222222222');
    setErrorMensaje(null);
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={{ margin: 0 }}>Registrar Nuevo Socio</h3>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {errorMensaje && (
            <div style={styles.errorBanner}>
              {errorMensaje}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Nombre Completo *</label>
            <input 
              type="text" 
              required
              style={styles.input} 
              value={nombreCompleto}
              onChange={(e) => setNombreCompleto(e.target.value)}
              placeholder="Ej. Juan Pérez" 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Correo Electrónico *</label>
            <input 
              type="email" 
              required
              style={styles.input} 
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="juan@ejemplo.com" 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Teléfono *</label>
            <input 
              type="number" 
              required
              min="1"
              style={styles.input} 
              value={telefono}
              onChange={(e) => setTelefono(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Ej. 2721234567" 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña *</label>
            <input 
              type="password" 
              required
              style={styles.input} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Rol en la Cooperativa *</label>
            <select 
              style={styles.input} 
              value={rolId} 
              onChange={(e) => setRolId(e.target.value)}
            >
              {ROLES_COOPERATIVA.map((rol) => (
                <option key={rol.id} value={rol.id}>
                  {rol.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Estatus de Membresía *</label>
            <select 
              style={styles.input} 
              value={estatusMembresia} 
              onChange={(e) => setEstatusMembresia(e.target.value)}
            >
              <option value="Activo">Activo</option>
              <option value="En revisión">En revisión</option>
              <option value="Pendiente">Pendiente</option>
            </select>
          </div>

          <div style={styles.footer}>
            <button 
              type="button" 
              className="ghost-link" 
              onClick={onClose} 
              disabled={loading}
              style={{ cursor: 'pointer' }}
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className="primary-pill" 
              disabled={loading}
              style={{ cursor: loading ? 'not-allowed' : 'pointer', padding: '8px 16px', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Guardando...' : 'Guardar Socio'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '450px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  header: {
    padding: '20px',
    borderBottom: '1px solid #e1dcd5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f5ef',
  },
  closeButton: {
    background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#5f584f'
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
  },
  inputGroup: {
    display: 'flex', flexDirection: 'column' as const, gap: '4px'
  },
  label: {
    fontSize: '13px', color: '#5f584f', fontWeight: 'bold'
  },
  input: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e1dcd5',
    fontSize: '14px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '10px'
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #f5c6cb'
  }
};