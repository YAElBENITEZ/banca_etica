import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { apiFetch } from '../services/api'; 
import 'react-datepicker/dist/react-datepicker.css';
import '../App.css';

interface ModalMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; 
  targetUserId?: string;
}

export default function ModalNuevoPrestamo({ isOpen, onClose, onSuccess, targetUserId }: ModalMovimientoProps) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState('');
  const [cajita, setCajita] = useState('');
  const [montoAprobado, setMontoAprobado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [tipoInteres, setTipoInteres] = useState('saldosInsolutos');
  const [estado, setEstado] = useState('En Revisión');
  const [fechaDesembolso, setFechaDesembolso] = useState<Date | null>(null);

  const [cajitasDisponibles, setCajitasDisponibles] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen) {
      const fetchCajitas = async () => {
        try {
          const res = await apiFetch('/api/cajita');
          
          if (!res.ok) {
            throw new Error(`Error ${res.status}: No se pudieron cargar las cajitas`);
          }

          const data = await res.json();
          setCajitasDisponibles(data);
          
          if (data.length > 0) {
            setCajita(data[0].id);
          }
        } catch (error: any) {
          console.error("Error al cargar cajitas:", error.message);
        }
      };
      fetchCajitas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fechaDesembolso) {
      alert("Por favor selecciona una fecha de desembolso.");
      return;
    }

    try {
      const usuarioStored = localStorage.getItem('usuario');
      const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
      
      const activeUserId = targetUserId || usuario?.id;

      if (!activeUserId) {
        throw new Error('No se identificó el usuario para asociar el préstamo.');
      }

      const response = await apiFetch('/api/prestamo', {
        method: 'POST',
        body: JSON.stringify({
          Nombre: nombre,
          Tipo: tipo,
          UsuarioId: activeUserId,
          MontoAprobado: parseFloat(montoAprobado),
          TasaInteresAplicada: parseFloat(tasaInteres),
          PlazoMeses: parseInt(plazoMeses),
          Estado: estado,
          TipoInteres: tipoInteres,
          EsColectivo: false,
          FechaDesembolso: fechaDesembolso.toISOString(), 
          CajitaId: cajita
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al procesar el préstamo');
      }

      alert(`¡Préstamo registrado exitosamente!`);
      
      setNombre('');
      setMontoAprobado('');
      setTasaInteres('');
      setPlazoMeses('');
      setTipoInteres('saldosInsolutos');
      setFechaDesembolso(null);
      
      onSuccess(); 
      onClose();   

    } catch (error: any) {
      alert("Hubo un error: " + error.message);
    }
  };

  return (
    <div className="modal-backdrop"> 
      {/* Se agregan estilos inline para restringir la altura y permitir scroll */}
      <div 
        className="modal-card" 
        style={{ 
          maxHeight: '90vh', 
          overflowY: 'auto',
          boxSizing: 'border-box'
        }}
      >
        <h3>Nuevo Préstamo</h3>
        <p>Estás registrando un nuevo crédito para un productor.</p>
        
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
          
          <label className="field-card">
            <span>Nombre / Propósito del Préstamo</span>
            <input 
              type="text" 
              placeholder="Ej. Compra Semilla de Agave" 
              value={nombre} 
              onChange={(e) => setNombre(e.target.value)}
              required 
            />
          </label>

          <label className="field-card">
            <span>¿A qué Caja de Ahorro corresponde el dinero?</span>
            <select  
              value={cajita} 
              onChange={(e) => setCajita(e.target.value)}
              required
            >
              {cajitasDisponibles.length === 0 ? (
                <option value="">No hay cajitas disponibles</option>
              ) : (
                cajitasDisponibles.map((caja) => (
                  <option key={caja.id} value={caja.id}>
                    {caja.nombre} (Meta: ${caja.meta})
                  </option>
                ))
              )}
            </select>
          </label>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label className="field-card">
              <span>Monto ($ MXN)</span>
              <input 
                type="number" 
                placeholder="Ej. 15000" 
                value={montoAprobado} 
                onChange={(e) => setMontoAprobado(e.target.value)}
                required min="1"
              />
            </label>

            <label className="field-card">
              <span>Tasa Mensual (%)</span>
              <input 
                type="number" 
                placeholder="Ej. 1.5" 
                value={tasaInteres} 
                onChange={(e) => setTasaInteres(e.target.value)}
                required min="0" step="0.1"
              />
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <label className="field-card">
              <span>Plazo (Meses)</span>
              <input 
                type="number" 
                placeholder="Ej. 12" 
                value={plazoMeses} 
                onChange={(e) => setPlazoMeses(e.target.value)}
                required min="1"
              />
            </label>

            <label className="field-card">
              <span>Estado</span>
              <select  
                value={estado} 
                onChange={(e) => setEstado(e.target.value)}
                required
              >
                <option value="En Revisión">En Revisión</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Liquidado">Liquidado</option>
              </select>
            </label>
          </div>

          <label className="field-card">
            <span>Tipo</span>
            <select  
              value={tipo} 
              onChange={(e) => setTipo(e.target.value)}
              required
            >
                <option value="entrada">Entrada</option>
                <option value="salida">Salida</option>
            </select>
          </label>

          <label className="field-card">
            <span>Tipo de Interés</span>
            <select  
              value={tipoInteres} 
              onChange={(e) => setTipoInteres(e.target.value)}
              required
            >
              <option value="saldosInsolutos">Sobre Saldos Insolutos</option>
              <option value="compuesto">Compuesto</option>
            </select>
          </label>

          <label className="field-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <span>Fecha de Desembolso Estimada</span>
            <div style={{ width: '100%', marginTop: '4px' }}>
              <DatePicker 
                selected={fechaDesembolso} 
                onChange={(date: Date | null) => setFechaDesembolso(date)} 
                dateFormat="dd/MM/yyyy" 
                placeholderText="Selecciona una fecha..."
                className="custom-datepicker"
                wrapperClassName="date-picker-wrapper"
              />
            </div>
          </label>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Confirmar Crédito
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}