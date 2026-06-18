import React, { useState } from 'react';
import '../App.css';

// Definimos las "Props" (propiedades) que este componente va a recibir desde afuera
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ModalNuevaCaja({ isOpen, onClose }: ModalProps) {
  // Estados internos del formulario
  const [nombre, setNombre] = useState('');
  const [meta, setMontoObjetivo] = useState('');
  const [fechaCierre, setFechaCierre] = useState('');

  // Si isOpen es falso, no renderizamos absolutamente nada
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Hacemos la petición a nuestra nueva API
      const response = await fetch('http://localhost:5026/api/cajita', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          Nombre: nombre, // <- Forzamos la N mayúscula
          Meta: parseFloat(meta), // <- Forzamos la M y O mayúsculas
          UsuarioId: "75df6c4b-6cdb-4918-a622-68d75e059bce" // <- Forzamos la U e I mayúsculas
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al crear la caja');
      }

      alert(`¡Caja "${nombre}" creada exitosamente en la base de datos!`);
      
      // Limpiamos el formulario y cerramos el modal
      setNombre('');
      setMontoObjetivo('');
      setFechaCierre('');
      onClose(); 

    } catch (error: any) {
      alert("Hubo un error: " + error.message);
    }
  };

  return (
    // modal-backdrop oscurece el fondo
    <div className="modal-backdrop"> 
      {/* modal-card es la tarjetita blanca */}
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

          {/* <label className="field-card">
            <span>Fecha de Cierre</span>
            <input 
              type="date" 
              value={fechaCierre} 
              onChange={(e) => setFechaCierre(e.target.value)}
              required 
            />
          </label> */}

          <div className="modal-actions">
            {/* El botón de cancelar dispara la función onClose que le pasaremos desde afuera */}
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