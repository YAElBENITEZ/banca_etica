import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { apiFetch } from '../services/api';
import 'react-datepicker/dist/react-datepicker.css';

interface ModalMovimientoProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetUserId?: string;
}

export default function ModalNuevoPrestamo({
  isOpen,
  onClose,
  onSuccess,
  targetUserId,
}: ModalMovimientoProps) {
  const [nombre, setNombre] = useState('');
  const [cajita, setCajita] = useState('');
  const [montoAprobado, setMontoAprobado] = useState('');
  const [tasaInteres, setTasaInteres] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [tipoInteres, setTipoInteres] = useState('saldosInsolutos');
  const [estado, setEstado] = useState('En Revisión');
  const [fechaDesembolso, setFechaDesembolso] = useState<Date | null>(null);
  const [cargando, setCargando] = useState(false);

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
          console.error('Error al cargar cajitas:', error.message);
        }
      };
      void fetchCajitas();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fechaDesembolso) {
      alert('Por favor selecciona una fecha de desembolso.');
      return;
    }

    setCargando(true);
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
          UsuarioId: activeUserId,
          MontoAprobado: parseFloat(montoAprobado),
          TasaInteresAplicada: parseFloat(tasaInteres),
          PlazoMeses: parseInt(plazoMeses, 10),
          Estado: estado,
          TipoInteres: tipoInteres,
          EsColectivo: false,
          FechaDesembolso: fechaDesembolso.toISOString(),
          CajitaId: cajita,
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
      alert('Hubo un error: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl flex flex-col gap-4 border border-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Crédito y financiamiento
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-brand-ink mt-0.5">
            Nuevo Préstamo
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
            Registra un nuevo crédito para un socio o productor.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Propósito del Préstamo</span>
            <input
              type="text"
              placeholder="Ej. Compra de Fertilizante"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={cargando}
              className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </label>

          <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Caja de Ahorro de origen</span>
            <select
              value={cajita}
              onChange={(e) => setCajita(e.target.value)}
              required
              disabled={cargando}
              className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-brand-ink focus:outline-none disabled:opacity-50"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
              <span className="text-xs font-medium text-brand-muted">Monto ($ MXN)</span>
              <input
                type="number"
                min="1"
                step="any"
                placeholder="Ej. 15000"
                value={montoAprobado}
                onChange={(e) => setMontoAprobado(e.target.value)}
                required
                disabled={cargando}
                className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
              <span className="text-xs font-medium text-brand-muted">Tasa Mensual (%)</span>
              <input
                type="number"
                min="0"
                step="0.1"
                placeholder="Ej. 1.5"
                value={tasaInteres}
                onChange={(e) => setTasaInteres(e.target.value)}
                required
                disabled={cargando}
                className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
              <span className="text-xs font-medium text-brand-muted">Plazo (Meses)</span>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="Ej. 12"
                value={plazoMeses}
                onChange={(e) => setPlazoMeses(e.target.value)}
                required
                disabled={cargando}
                className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
              />
            </label>

            <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
              <span className="text-xs font-medium text-brand-muted">Estado del crédito</span>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                required
                disabled={cargando}
                className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-brand-ink focus:outline-none disabled:opacity-50"
              >
                <option value="En Revisión">En Revisión</option>
                <option value="Aprobado">Aprobado</option>
                <option value="Liquidado">Liquidado</option>
              </select>
            </label>
          </div>

          <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Tipo de Interés</span>
            <select
              value={tipoInteres}
              onChange={(e) => setTipoInteres(e.target.value)}
              required
              disabled={cargando}
              className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-brand-ink focus:outline-none disabled:opacity-50"
            >
              <option value="saldosInsolutos">Sobre Saldos Insolutos</option>
              <option value="compuesto">Compuesto</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Fecha de Desembolso Estimada</span>
            <div className="w-full mt-1">
              <DatePicker
                selected={fechaDesembolso}
                onChange={(date: Date | null) => setFechaDesembolso(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Selecciona una fecha..."
                disabled={cargando}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-brand-ink focus:outline-none focus:border-brand-teal disabled:opacity-50"
                wrapperClassName="w-full"
              />
            </div>
          </label>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={cargando}
              className="py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="py-2.5 px-6 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              {cargando ? 'Procesando...' : 'Confirmar Crédito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}