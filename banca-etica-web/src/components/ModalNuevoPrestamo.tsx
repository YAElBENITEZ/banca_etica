import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import '../App.css';

interface ModalMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // Función para avisarle a Cajitas.tsx que recargue los saldos
}

export default function ModalNuevoPrestamo({ isOpen, onClose, onSuccess }: ModalMovimientoProps) {
  const [nombre, setNombre] = useState('');
  const [montoAprobado, setMontoAprobado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaDesembolso, setFechaDesembolso] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    /*try {
      // 1. Hacemos la petición POST a la ruta de tu nuevo controlador independiente
      const response = await fetch('http://localhost:5026/api/historialcuadernillo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          TipoMovimiento: tipoMovimiento, // "Abono" o "Retiro"
          Monto: parseFloat(monto),       // Convertimos el string del input a número decimal para C#
          FirmaTesorero: firmaTesorero,   // El PIN de 4 números purificado que guardamos en el estado
          CajitaId: cajitaId              // El ID de la cajita que recibimos por props desde la tarjeta
        }),
      });

      const data = await response.json();

      // 2. Si el backend arroja un error (ej. Status 400 de Fondos Insuficientes o datos inválidos)
      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al procesar la transacción');
      }*/

      // 3. Si todo sale bien, notificamos al usuario
      alert(`¡Prestamo Simulado!`);
      
      // 4. Limpiamos los campos sensibles del formulario
      setMontoAprobado('');
      setTasaInteres('');
      
      // 5. ¡La magia de React! 
      onSuccess(); // Ejecuta fetchCajitas() en el padre para traer los saldos nuevos de PostgreSQL
      onClose();   // Cerramos el modal flotante

    /*} catch (error: any) {
      // Atrapamos errores de red (Failed to fetch) o los mensajes de BadRequest de C#
      alert("Hubo un error: " + error.message);
    }*/
  };

  return (
    <div className="modal-backdrop"> 
      <div className="modal-card">
        <h3>Nuevo Préstamo</h3>
        <p>Estas registrando un nuevo préstamo</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
          
          <label className="field-card">
            <span>Nombre del Préstamo</span>
            <input 
              type="text" 
              placeholder="Ej. Préstamo Compra Camión" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              required 
            />
          </label>

          <label className="field-card">
            <span>Monto ($ MXN)</span>
            <input 
              type="number" 
              placeholder="Ej. 500" 
              value={montoAprobado} 
              onChange={(e) => setMontoAprobado(e.target.value)}
              required 
              min="1"
            />
          </label>

          <label className="field-card">
            <span>Tasa de Interes Mensual Aplicada (%)</span>
            <input 
              type="number" 
              placeholder="Ej. 10%" 
              value={tasaInteres} 
              onChange={(e) => setTasaInteres(e.target.value)}
              required 
              min="1"
            />
          </label>

          <label className="field-card">
            <span>Plazo Meses</span>
            <input 
              type="number" 
              placeholder="Ej. 5" 
              value={plazoMeses} 
              onChange={(e) => setPlazoMeses(e.target.value)}
              required 
              min="1"
            />
          </label>

          <label className="field-card">
            <span>Estado</span>
            <select  
              value={estado} 
              onChange={(e) => setEstado(e.target.value)}
              required
             
            >
                <option value="revision">En Revisión</option>
                <option value="aprobado">Aprobado</option>
                <option value="liquidado">Liquidado</option>
            </select>
          </label>

          <label className="field-card">Ingresa Fecha Desembolso: 
            <DatePicker 
              selected={fechaDesembolso} 
              onChange={(e) => setFechaDesembolso(e.target.value)}
              dateFormat="dd/MM/yyyy" // Formato personalizado
              placeholderText="Haz clic para elegir..."
            />
            </label>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Confirmar
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}