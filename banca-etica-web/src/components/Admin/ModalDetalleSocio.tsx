import React from 'react';

// Interfaz que coincide con la estructura de Usuario que devuelve tu backend en C#
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

interface ModalDetalleSocioProps {
  isOpen: boolean;
  onClose: () => void;
  socio: Usuario | null;
}

// Mapa para mostrar el nombre legible del Rol según su GUID
const MAPA_ROLES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Administrador',
  '22222222-2222-2222-2222-222222222222': 'Socio',
  '33333333-3333-3333-3333-333333333333': 'Tesorero',
  '44444444-4444-4444-4444-444444444444': 'Consejo / Directiva'
};

export default function ModalDetalleSocio({ isOpen, onClose, socio }: ModalDetalleSocioProps) {
  if (!isOpen || !socio) return null;

  // Traducimos el GUID de rol a un texto comprensible (o mostramos el GUID si es diferente)
  const nombreRol = MAPA_ROLES[socio.rolId] || `Rol: ${socio.rolId.substring(0, 8)}...`;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Cabecera */}
        <div style={styles.header}>
          <div>
            <span style={{ fontSize: '11px', color: '#5f584f', fontWeight: 'bold', textTransform: 'uppercase' }}>
              Expediente Digital
            </span>
            <h3 style={{ margin: 0, color: '#171717' }}>Perfil de la Comunidad</h3>
          </div>
          <button style={styles.closeButton} onClick={onClose}>&times;</button>
        </div>

        {/* Contenido principal */}
        <div style={{ padding: '24px' }}>
          
          {/* Avatar e Identificación Principal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
            <div style={{ 
              width: '52px', height: '52px', 
              backgroundColor: '#171717', color: '#f8f5ef', 
              borderRadius: '50%', display: 'flex', 
              justifyContent: 'center', alignItems: 'center', 
              fontSize: '22px', fontWeight: 'bold' 
            }}>
              {socio.nombreCompleto ? socio.nombreCompleto.charAt(0).toUpperCase() : 'S'}
            </div>
            <div>
              <h2 style={{ margin: '0 0 2px 0', fontSize: '18px', color: '#171717' }}>{socio.nombreCompleto}</h2>
              <span style={{ fontSize: '12px', color: '#5f584f' }}>ID BD: {socio.id}</span>
            </div>
          </div>

          {/* Cuadrícula de Datos Clave */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            
            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Correo Electrónico</span>
              <strong style={styles.infoValue}>{socio.correo}</strong>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Teléfono</span>
              <strong style={styles.infoValue}>{socio.telefono}</strong>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Rol en Cooperativa</span>
              <strong style={styles.infoValue}>{nombreRol}</strong>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Estatus Membresía</span>
              <strong style={{
                ...styles.infoValue,
                color: socio.estatusMembresia === 'Activo' ? '#155724' : socio.estatusMembresia === 'En revisión' ? '#004085' : '#856404'
              }}>
                {socio.estatusMembresia}
              </strong>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Umbral Alerta Saldo</span>
              <strong style={styles.infoValue}>
                ${socio.umbralAlertaSaldo ? socio.umbralAlertaSaldo.toLocaleString() : '0'} MXN
              </strong>
            </div>

            <div style={styles.infoBox}>
              <span style={styles.infoLabel}>Consentimiento ARCO</span>
              <strong style={{
                ...styles.infoValue,
                color: socio.consentimientosArco ? '#155724' : '#721c24'
              }}>
                {socio.consentimientosArco ? '✓ Aceptado / Vigente' : '✕ Sin Aceptar'}
              </strong>
            </div>

          </div>

          {/* Footer y Acciones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button className="primary-pill" onClick={onClose} style={{ padding: '8px 20px', cursor: 'pointer' }}>
              Cerrar
            </button>
          </div>

        </div>
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
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    overflow: 'hidden',
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid #e1dcd5',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8f5ef',
  },
  closeButton: {
    background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#5f584f'
  },
  infoBox: {
    display: 'flex', 
    flexDirection: 'column' as const, 
    gap: '4px',
    backgroundColor: '#fdfbf7', 
    padding: '10px 12px', 
    borderRadius: '8px', 
    border: '1px solid #e1dcd5'
  },
  infoLabel: {
    fontSize: '11px', color: '#5f584f', textTransform: 'uppercase' as const, fontWeight: 'bold'
  },
  infoValue: {
    fontSize: '13px', color: '#171717', wordBreak: 'break-word' as const
  }
};