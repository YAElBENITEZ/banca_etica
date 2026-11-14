import { useEffect, useState } from 'react';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';

interface DocumentoSocio {
  id: string;
  tipo: 'INE' | 'CURP' | 'COMPROBANTE_DOMICILIO' | string;
  url: string;
}

interface SocioData {
  id: string;
  numeroSocio?: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  correo: string;
  telefono: string;
  estatus: 'PENDIENTE' | 'ACTIVO' | 'INACTIVO';
  fechaRegistro: string;
  documentos: DocumentoSocio[];
}

type TabTipo = 'PENDIENTE' | 'ACTIVO' | 'INACTIVO';

export default function Comunidad() {
  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
  const nombreCooperativa = usuario?.cooperativaNombre || 'Cooperativa';

  const [socios, setSocios] = useState<SocioData[]>([]);
  const [tabActual, setTabActual] = useState<TabTipo>('PENDIENTE');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal para previsualización de documento descargado de Google Drive
  const [docModal, setDocModal] = useState<{ url: string; tipo: string } | null>(null);
  const [cargandoDocId, setCargandoDocId] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<string | null>(null);

  const cargarSocios = async () => {
    setCargando(true);
    setError(null);
    try {
      const response = await apiFetch('/api/tesorero/comunidad');
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.mensaje || 'Error al obtener la lista de socios.');
      }
      const data: SocioData[] = await response.json();
      setSocios(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar socios.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarSocios();
  }, []);

  const abrirDocumento = async (docId: string, tipo: string) => {
    setCargandoDocId(docId);
    setError(null);
    try {
      const response = await apiFetch(`/api/tesorero/comunidad/documentos/${docId}/ver`);
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.mensaje || 'No se pudo obtener el archivo desde Google Drive.');
      }

      const blob = await response.blob();
      const urlTemporal = URL.createObjectURL(blob);
      setDocModal({ url: urlTemporal, tipo });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar el archivo.');
    } finally {
      setCargandoDocId(null);
    }
  };

  const cerrarModalDoc = () => {
    if (docModal?.url) {
      URL.revokeObjectURL(docModal.url);
    }
    setDocModal(null);
  };

  const actualizarEstatusSocio = async (id: string, nuevoEstatus: 'ACTIVO' | 'INACTIVO') => {
    setProcesandoId(id);
    setError(null);
    setMensajeExito(null);
    try {
      const response = await apiFetch(`/api/tesorero/comunidad/${id}/estatus`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus: nuevoEstatus }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.mensaje || 'Error al actualizar el estatus del socio.');
      }

      setMensajeExito(
        nuevoEstatus === 'ACTIVO'
          ? 'Socio aprobado y activado correctamente.'
          : 'El estatus del socio ha sido actualizado.'
      );

      setSocios((prev) =>
        prev.map((s) => (s.id === id ? { ...s, estatus: nuevoEstatus } : s))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud.');
    } finally {
      setProcesandoId(null);
    }
  };

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TR';

  const sociosFiltrados = socios.filter((s) => s.estatus === tabActual);
  const totalPendientes = socios.filter((s) => s.estatus === 'PENDIENTE').length;
  const totalActivos = socios.filter((s) => s.estatus === 'ACTIVO').length;
  const totalInactivos = socios.filter((s) => s.estatus === 'INACTIVO').length;

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Topbar superior */}
        <header className="flex items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-ink">Gestión de Socios</h1>
            <span className="text-xs text-brand-muted">
              Administración &gt; <strong className="text-brand-green">Socios</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {iniciales}
            </div>
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-semibold text-brand-ink">
                {usuario?.nombre || 'Usuario'}
              </p>
              <small className="text-xs text-brand-muted">{nombreCooperativa}</small>
            </div>
          </div>
        </header>

        {/* Encabezado Principal */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-ink">
            Directorio y Validación de Socios
          </h2>
          <span className="text-sm text-brand-muted">
            Revisa los expedientes de registro, aprueba nuevos ingresos y gestiona a los integrantes de la cooperativa.
          </span>
        </div>

        {/* Notificaciones */}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {mensajeExito && (
          <div className="p-4 bg-[#e3efed] text-brand-green border border-brand-green/20 rounded-2xl text-xs sm:text-sm font-semibold">
            {mensajeExito}
          </div>
        )}

        {/* Tarjetas de Métricas / Pestañas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            onClick={() => setTabActual('PENDIENTE')}
            className={`p-5 rounded-[22px] cursor-pointer transition-all shadow-sm flex flex-col justify-between ${
              tabActual === 'PENDIENTE'
                ? 'bg-[#fffbeb] border-2 border-brand-gold shadow-md'
                : 'bg-white/90 border border-black/5 hover:bg-black/[0.02]'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              Solicitudes Pendientes
            </span>
            <div className="text-3xl font-extrabold text-brand-gold my-1">
              {cargando ? '...' : totalPendientes}
            </div>
            <span className="text-xs text-brand-muted">Requieren revisión de documentos</span>
          </div>

          <div
            onClick={() => setTabActual('ACTIVO')}
            className={`p-5 rounded-[22px] cursor-pointer transition-all shadow-sm flex flex-col justify-between ${
              tabActual === 'ACTIVO'
                ? 'bg-[#e3efed] border-2 border-brand-green shadow-md'
                : 'bg-white/90 border border-black/5 hover:bg-black/[0.02]'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-green">
              Socios Activos
            </span>
            <div className="text-3xl font-extrabold text-brand-ink my-1">
              {cargando ? '...' : totalActivos}
            </div>
            <span className="text-xs text-brand-muted">Habilitados para aportar y pedir préstamos</span>
          </div>

          <div
            onClick={() => setTabActual('INACTIVO')}
            className={`p-5 rounded-[22px] cursor-pointer transition-all shadow-sm flex flex-col justify-between ${
              tabActual === 'INACTIVO'
                ? 'bg-gray-100 border-2 border-gray-500 shadow-md'
                : 'bg-white/90 border border-black/5 hover:bg-black/[0.02]'
            }`}
          >
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-600">
              Socios Inactivos
            </span>
            <div className="text-3xl font-extrabold text-gray-700 my-1">
              {cargando ? '...' : totalInactivos}
            </div>
            <span className="text-xs text-brand-muted">Cuentas suspendidas o rechazadas</span>
          </div>
        </div>

        {/* Listado Principal de Socios */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center pb-2 border-b border-black/5">
            <p className="text-base sm:text-lg font-serif font-bold text-brand-ink">
              {tabActual === 'PENDIENTE' && 'Expedientes por revisar'}
              {tabActual === 'ACTIVO' && 'Padrón de socios activos'}
              {tabActual === 'INACTIVO' && 'Historial de socios inactivos'}
            </p>
            <span className="text-xs text-brand-muted">
              Mostrando {sociosFiltrados.length} registro(s)
            </span>
          </div>

          {cargando ? (
            <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              Cargando expedientes...
            </div>
          ) : sociosFiltrados.length === 0 ? (
            <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              No hay socios en esta categoría.
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {sociosFiltrados.map((s) => {
                const nombreCompleto = `${s.nombres} ${s.apellidoPaterno} ${s.apellidoMaterno || ''}`.trim();
                return (
                  <div
                    key={s.id}
                    className="p-4 sm:p-5 rounded-2xl bg-[#f8f3ec]/90 border border-black/5 shadow-sm flex flex-col gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-base font-bold text-brand-ink">{nombreCompleto}</strong>
                          {s.numeroSocio && (
                            <span className="text-[11px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold">
                              {s.numeroSocio}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-brand-muted">
                          <span>Correo: <strong className="text-brand-ink">{s.correo}</strong></span>
                          <span>Teléfono: <strong className="text-brand-ink">{s.telefono}</strong></span>
                          <span>Registrado: {new Date(s.fechaRegistro).toLocaleDateString('es-MX')}</span>
                        </div>
                      </div>

                      {/* Botones de acción según pestaña */}
                      <div className="flex items-center gap-2">
                        {tabActual === 'PENDIENTE' && (
                          <>
                            <button
                              type="button"
                              disabled={procesandoId === s.id}
                              onClick={() => actualizarEstatusSocio(s.id, 'INACTIVO')}
                              className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                            <button
                              type="button"
                              disabled={procesandoId === s.id}
                              onClick={() => actualizarEstatusSocio(s.id, 'ACTIVO')}
                              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-brand-green text-white hover:bg-brand-teal transition-all shadow-sm disabled:opacity-50"
                            >
                              {procesandoId === s.id ? 'Aprobando...' : 'Aprobar Socio'}
                            </button>
                          </>
                        )}

                        {tabActual === 'ACTIVO' && (
                          <button
                            type="button"
                            disabled={procesandoId === s.id}
                            onClick={() => actualizarEstatusSocio(s.id, 'INACTIVO')}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-brand-gold text-brand-gold hover:bg-[#fffbeb] transition-colors disabled:opacity-50"
                          >
                            Dar de baja
                          </button>
                        )}

                        {tabActual === 'INACTIVO' && (
                          <button
                            type="button"
                            disabled={procesandoId === s.id}
                            onClick={() => actualizarEstatusSocio(s.id, 'ACTIVO')}
                            className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-brand-green text-brand-green hover:bg-brand-mist transition-colors disabled:opacity-50"
                          >
                            Reactivar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Fila de Documentos adjuntos */}
                    <div className="p-3 sm:p-3.5 rounded-xl bg-white/90 border border-black/5 flex flex-col gap-2">
                      <span className="text-[11px] font-bold text-brand-muted uppercase tracking-wider">
                        Expediente digital adjunto
                      </span>
                      {s.documentos && s.documentos.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {s.documentos.map((doc) => {
                            const estaCargando = cargandoDocId === doc.id;
                            return (
                              <button
                                key={doc.id}
                                type="button"
                                disabled={estaCargando}
                                onClick={() => void abrirDocumento(doc.id, doc.tipo)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-[#f8f3ec] hover:bg-[#efe7dc] text-xs text-brand-ink transition-colors disabled:opacity-50"
                              >
                                <span>📄</span>
                                <strong className="font-semibold">
                                  {doc.tipo === 'INE' && 'Identificación (INE)'}
                                  {doc.tipo === 'CURP' && 'CURP'}
                                  {doc.tipo === 'COMPROBANTE_DOMICILIO' && 'Comp. Domicilio'}
                                  {!['INE', 'CURP', 'COMPROBANTE_DOMICILIO'].includes(doc.tipo) && doc.tipo}
                                </strong>
                                <span className="text-brand-green underline ml-1 font-semibold">
                                  {estaCargando ? 'Cargando...' : 'Inspeccionar'}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">
                          No hay documentos adjuntos en este registro.
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* MODAL DE PREVISUALIZACIÓN DE DOCUMENTO */}
      {docModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={cerrarModalDoc}
        >
          <div
            className="w-full max-w-4xl h-[80vh] rounded-[24px] bg-white shadow-2xl flex flex-col overflow-hidden border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center px-5 py-3.5 border-b border-gray-200">
              <h3 className="text-base font-bold text-brand-ink">
                Visualizando: {docModal.tipo}
              </h3>
              <div className="flex items-center gap-3">
                <a
                  href={docModal.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-colors"
                >
                  Abrir en pestaña nueva
                </a>
                <button
                  type="button"
                  onClick={cerrarModalDoc}
                  className="text-gray-400 hover:text-brand-ink text-2xl leading-none transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-gray-100 p-3">
              <iframe
                src={docModal.url}
                title="Vista previa del documento"
                className="w-full h-full rounded-xl border border-gray-200 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}