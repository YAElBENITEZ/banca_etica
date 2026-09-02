import React, { useState } from 'react';
import { apiFetch } from '../../services/api'; // 1. Importamos apiFetch
import '../../App.css';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Opcional: si el modal crea la caja para un socio específico, le pasas su userId por props
  targetUserId?: string; 
}

export default function ModalNuevaCaja({ isOpen, onClose, targetUserId }: ModalProps) {
  const [nombre, setNombre] = useState('');
  const [meta, setMontoObjetivo] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Extraemos el usuario autenticado del localStorage si no viene por props
      const usuarioStored = localStorage.getItem('usuario');
      const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
      
      // Asignamos el ID del destinatario o del usuario actual
      const activeUserId = targetUserId || usuario?.id;

      if (!activeUserId) {
        throw new Error('No se identificó el usuario para asociar la caja.');
      }

      // 2. Reemplazamos fetch por apiFetch (que adjunta el Bearer Token automáticamente)
      const response = await apiFetch('/api/admin/cajita', {
        method: 'POST',
        body: JSON.stringify({
          Nombre: nombre,
          Meta: parseFloat(meta),
          EsColectiva: true,
          UsuarioId: activeUserId // Utiliza el ID real de la sesión
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al crear la caja');
      }

      alert(`¡Caja "${nombre}" creada exitosamente!`);
      
      setNombre('');
      setMontoObjetivo('');
      setFechaCierre('');
      onClose(); 

    } catch (error: any) {
      alert("Hubo un error: " + error.message);
    }
  };

  return (
    <div className="modal-backdrop"> 
      <div className="modal-card">
        <h3>Crear nueva caja de ahorro</h3>
        <p>Define nombre, monto objetivo y fecha de cierre para la nueva caja.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
          
          <label className="field-card">
            <span>Nombre de la Caja</span>
            <input 
              type="text" 
              placeholder="Ej. Caja Primavera 2026" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              required 
            />
          </label>

          <label className="field-card">
            <span>Monto Objetivo Estimado</span>
            <input 
              type="number" 
              placeholder="Ej. 150000" 
              value={meta} 
              onChange={(e) => setMontoObjetivo(e.target.value)}
              required 
            />
          </label>
          <span>Esta Caja será creada para la Comunidad</span>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Crear Caja
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}