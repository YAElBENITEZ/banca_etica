import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import '../../App.css';

export interface ComunidadData {
  id?: string;
  nombre: string;
  descripcion: string;
  municipio: string;
  estado: string;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  comunidadToEdit?: ComunidadData | null; // Si viene con datos, es modo Edición
}

export default function ModalNuevaComunidad({ isOpen, onClose, onSuccess, comunidadToEdit }: ModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [municipio, setMunicipio] = useState('');
  const [estado, setEstado] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const esEdicion = Boolean(comunidadToEdit?.id);

  useEffect(() => {
    if (comunidadToEdit) {
      setNombre(comunidadToEdit.nombre || '');
      setDescripcion(comunidadToEdit.descripcion || '');
      setMunicipio(comunidadToEdit.municipio || '');
      setEstado(comunidadToEdit.estado || '');
    } else {
      setNombre('');
      setDescripcion('');
      setMunicipio('');
      setEstado('');
    }
  }, [comunidadToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const url = esEdicion 
      ? `http://localhost:5026/api/superadmin/comunidad/${comunidadToEdit?.id}` 
      : 'http://localhost:5026/api/superadmin/comunidad';

    const method = esEdicion ? 'PUT' : 'POST';

    try {
      const response = await apiFetch(url, {
        method,
        body: JSON.stringify({
          Nombre: nombre,
          Descripcion: descripcion,
          Municipio: municipio,
          Estado: estado
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al guardar la comunidad');
      }

      alert(esEdicion ? '¡Comunidad actualizada!' : `¡Comunidad "${nombre}" creada exitosamente!`);
      
      if (onSuccess) onSuccess();
      onClose();

    } catch (error: any) {
      alert("Hubo un error: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-backdrop"> 
      <div className="modal-card">
        <h3>{esEdicion ? 'Editar Comunidad' : 'Crear nueva comunidad'}</h3>
        <p>{esEdicion ? 'Modifica los datos de la comunidad seleccionada.' : 'Define los datos territoriales para la nueva comunidad cooperativa.'}</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '12px' }}>
          
          <label className="field-card">
            <span>Nombre de la Comunidad</span>
            <input 
              type="text" 
              placeholder="Ej. Comunidad Tecali" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              required 
              disabled={isLoading}
            />
          </label>

          <label className="field-card">
            <span>Descripción / Notas</span>
            <input 
              type="text" 
              placeholder="Ej. Comunidad productora en la zona centro..." 
              value={descripcion} 
              onChange={(e) => setDescripcion(e.target.value)}
              disabled={isLoading}
            />
          </label>

          <label className="field-card">
            <span>Municipio</span>
            <input 
              type="text" 
              placeholder="Ej. Tecali de Herrera" 
              value={municipio} 
              onChange={(e) => setMunicipio(e.target.value)}
              required 
              disabled={isLoading}
            />
          </label>

          <label className="field-card">
            <span>Estado</span>
            <input 
              type="text" 
              placeholder="Ej. Puebla" 
              value={estado} 
              onChange={(e) => setEstado(e.target.value)}
              required 
              disabled={isLoading}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={isLoading}>
              Cancelar
            </button>
            <button type="submit" className="primary-button" disabled={isLoading}>
              {isLoading ? 'Guardando...' : (esEdicion ? 'Actualizar' : 'Crear Comunidad')}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}