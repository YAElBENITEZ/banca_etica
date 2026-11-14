import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import { apiFetch } from '../services/api';

interface MiPerfilData {
  id: string;
  nombreCompleto: string;
  telefono: string;
  correo: string;
  estatusMembresia: string;
  consentimientosArco: boolean;
  rolId: string;
}

const MAPA_ROLES: Record<string, string> = {
  '11111111-1111-1111-1111-111111111111': 'Gestor',
  '22222222-2222-2222-2222-222222222222': 'Tesorero',
  '33333333-3333-3333-3333-333333333333': 'Socio',
};

export default function MiPerfil() {
  const [perfil, setPerfil] = useState<MiPerfilData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Campos editables por el usuario
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [consentimientosArco, setConsentimientosArco] = useState(true);
  const [nuevaPassword, setNuevaPassword] = useState('');

  const fetchMiPerfil = async () => {
    setLoading(true);
    setMensajeError(null);
    try {
      const response = await apiFetch('/api/perfil/me');
      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        console.error('Detalle del error en Backend:', response.status, data);
        throw new Error(data.mensaje || `Error en el servidor (${response.status})`);
      }

      setPerfil(data);
      setCorreo(data.correo || '');
      setTelefono(data.telefono || '');
      setConsentimientosArco(data.consentimientosArco ?? true);
    } catch (err: any) {
      setMensajeError(err.message || 'No se pudo cargar tu perfil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMiPerfil();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMensajeExito(null);
    setMensajeError(null);

    const payload = {
      correo,
      telefono: String(telefono),
      consentimientosArco,
      nuevaPassword: nuevaPassword.trim() === '' ? null : nuevaPassword,
    };

    try {
      const response = await apiFetch('/api/perfil/me', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      const data = text ? JSON.parse(text) : {};

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al guardar los cambios.');
      }

      setMensajeExito('Tu información se actualizó correctamente.');
      setNuevaPassword('');
    } catch (err: any) {
      setMensajeError(err.message || 'Ocurrió un problema al actualizar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
        <Sidebar />
        <main className="h-full overflow-y-auto p-8 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex items-center justify-center text-sm text-brand-muted">
          Cargando expediente personal...
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Cuenta de Usuario</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">{perfil?.nombreCompleto}</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Configura tus datos de contacto y seguridad en la cooperativa.
          </span>
        </div>

        {mensajeExito && (
          <div className="p-4 bg-[#e3efed] text-brand-green border border-brand-green/20 rounded-2xl text-xs sm:text-sm font-semibold">
            {mensajeExito}
          </div>
        )}

        {mensajeError && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs sm:text-sm font-medium">
            {mensajeError}
          </div>
        )}

        {/* SECCIÓN 1: Tarjetas de Información Protegida (Solo Lectura) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] text-[#f8f5ef] shadow-sm flex flex-col justify-between">
            <span className="text-xs text-white/60 font-medium">Rol en Cooperativa</span>
            <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
              {perfil ? MAPA_ROLES[perfil.rolId] || 'Socio' : 'Socio'}
            </h3>
          </div>

          <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-brand-muted font-medium">Estatus de Membresía</span>
            <strong
              className={`text-lg sm:text-xl font-bold mt-1 ${
                perfil?.estatusMembresia === 'Activo' ? 'text-brand-green' : 'text-brand-gold'
              }`}
            >
              {perfil?.estatusMembresia}
            </strong>
          </div>

          <div className="p-4 sm:p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs text-brand-muted font-medium">Identificador de Usuario</span>
            <code className="text-xs text-brand-ink font-mono font-bold mt-1 truncate">
              {perfil?.id}
            </code>
          </div>
        </div>

        {/* SECCIÓN 2: Formulario Editable */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div className="pb-2 border-b border-black/5">
            <p className="text-base font-bold text-brand-ink">Información Modificable</p>
            <span className="text-xs text-brand-muted">
              Mantén actualizados tus medios de contacto ante el comité.
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Correo electrónico</span>
                <input
                  type="email"
                  required
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>

              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Teléfono móvil</span>
                <input
                  type="tel"
                  required
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] opacity-80 cursor-not-allowed">
              <span className="text-xs font-medium text-brand-muted">Consentimiento Derechos ARCO</span>
              <select
                disabled
                value={consentimientosArco ? 'true' : 'false'}
                onChange={(e) => setConsentimientosArco(e.target.value === 'true')}
                className="w-full bg-transparent border-0 p-0 text-sm font-semibold text-brand-ink focus:outline-none cursor-not-allowed"
              >
                <option value="true">Aceptado / Aprobado</option>
                <option value="false">Revocado / No Aceptado</option>
              </select>
            </label>

            <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
              <span className="text-xs font-medium text-brand-muted">Actualizar contraseña</span>
              <input
                type="password"
                placeholder="Escribe tu nueva contraseña si deseas cambiarla..."
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
              />
            </label>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto py-2.5 px-6 rounded-full font-semibold text-xs sm:text-sm text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {saving ? 'Guardando Cambios...' : 'Actualizar Mi Perfil'}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}