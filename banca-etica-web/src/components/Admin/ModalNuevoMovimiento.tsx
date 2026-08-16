import React, { useState } from 'react';
import '../../App.css';

interface ModalMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  cajitaId: string | null;
  cajitaNombre: string;
  onSuccess: () => void; // Función para avisarle a Cajitas.tsx que recargue los saldos
}

export default function ModalNuevoMovimiento({ isOpen, onClose, cajitaId, cajitaNombre, onSuccess }: ModalMovimientoProps) {
  const [tipoMovimiento, setTipoMovimiento] = useState('Abono');
  const [monto, setMonto] = useState('');
  const [firmaTesorero, setFirmaTesorero] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 1. Hacemos la petición POST a la ruta de tu nuevo controlador independiente
      const response = await fetch('http://localhost:5026/api/admin/historialcuadernillo', {
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
      }

      // 3. Si todo sale bien, notificamos al usuario
      alert(`¡Movimiento registrado exitosamente!`);
      
      // 4. Limpiamos los campos sensibles del formulario
      setMonto('');
      setFirmaTesorero('');
      
      // 5. ¡La magia de React! 
      onSuccess(); // Ejecuta fetchCajitas() en el padre para traer los saldos nuevos de PostgreSQL
      onClose();   // Cerramos el modal flotante

    } catch (error: any) {
      // Atrapamos errores de red (Failed to fetch) o los mensajes de BadRequest de C#
      alert("Hubo un error: " + error.message);
    }
  };

  return (
    <div className="modal-backdrop"> 
      <div className="modal-card">
        <h3>Registrar Movimiento</h3>
        <p>Estás operando sobre la cuenta: <strong>{cajitaNombre}</strong></p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
          
          <label className="field-card">
            <span>Tipo de Operación</span>
            <select 
              value={tipoMovimiento} 
              onChange={(e) => setTipoMovimiento(e.target.value)}
              style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '6px', border: '1px solid #ccc' }}
            >
              <option value="Abono">Abono (Ingreso)</option>
              <option value="Retiro">Retiro (Egreso)</option>
            </select>
          </label>

          <label className="field-card">
            <span>Monto ($ MXN)</span>
            <input 
              type="number" 
              placeholder="Ej. 500" 
              value={monto} 
              onChange={(e) => setMonto(e.target.value)}
              required 
              min="1"
            />
          </label>

          <label className="field-card"style={{textAlign: 'center'}}>
            <span>Firma Tesorero</span>
            <input 
              type="password" 
              placeholder="••••" 
              // Cambia 'concepto' por tu nuevo estado de la firma si lo creaste
              value={firmaTesorero} 
              inputMode="numeric"
              maxLength={4}
              onChange={(e) => {
                // Magia pura: Esta regla busca todo lo que NO sea un número (\D) y lo borra ('')
                const soloNumeros = e.target.value.replace(/\D/g, '');
                
                // Guardamos la versión limpia y purificada
                setFirmaTesorero(soloNumeros);
              }}
              style={{
                textAlign: 'center',
                letterSpacing: '15px'
              }}
            />
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              // Cambiamos el color del botón dependiendo de si es ingreso o egreso para dar feedback visual
              style={{ 
                backgroundColor: tipoMovimiento === 'Abono' ? '#28a745' : '#dc3545', 
                color: 'white', 
                border: 'none', 
                padding: '8px 16px', 
                borderRadius: '999px',
                cursor: 'pointer'
              }}
            >
              Confirmar {tipoMovimiento}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}