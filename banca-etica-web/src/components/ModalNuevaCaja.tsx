import React, { useState } from 'react';
import { apiFetch } from '../services/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId?: string;
}

export default function ModalNuevaCaja({ isOpen, onClose, targetUserId }: ModalProps) {
  const [nombre, setNombre] = useState('');
  const [meta, setMontoObjetivo] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    try {
      const usuarioStored = localStorage.getItem('usuario');
      const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
      const activeUserId = targetUserId || usuario?.id;

      if (!activeUserId) {
        throw new Error('No se identificó el usuario para asociar la caja.');
      }

      const response = await apiFetch('/api/cajita', {
        method: 'POST',
        body: JSON.stringify({
          Nombre: nombre,
          Meta: parseFloat(meta),
          UsuarioId: activeUserId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al crear la caja');
      }

      alert(`¡Caja "${nombre}" creada exitosamente!`);
      setNombre('');
      setMontoObjetivo('');
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
        className="w-full max-w-lg rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl flex flex-col gap-4 border border-black/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
            Meta personal
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-brand-ink mt-0.5">
            Crear nueva caja de ahorro
          </h3>
          <p className="text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
            Define el nombre y el monto objetivo estimado para tu nueva meta.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Nombre de la Caja</span>
            <input
              type="text"
              placeholder="Ej. Insumos Primavera 2026"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              disabled={cargando}
              className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
          </label>

          <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Monto Objetivo Estimado ($ MXN)</span>
            <input
              type="number"
              step="any"
              min="1"
              placeholder="Ej. 15000"
              value={meta}
              onChange={(e) => setMontoObjetivo(e.target.value)}
              required
              disabled={cargando}
              className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
            />
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
              {cargando ? 'Creando...' : 'Crear Caja'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}