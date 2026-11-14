import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Solicitud {
  id: string;
  nombre: string;
  correo: string;
  fechaRegistro: string;
  ineUrl?: string;
  curpUrl?: string;
  comprobanteDomicilioUrl?: string;
}

export default function ValidacionDocumentos() {
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const respuesta = await apiFetch('/api/tesorero/documentos/pendientes');
      if (!respuesta.ok) throw new Error('El controlador de documentos aún no está disponible.');
      setSolicitudes((await respuesta.json()) as Solicitud[]);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudieron cargar solicitudes.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const decidir = async (id: string, accion: 'APROBADO' | 'RECHAZADO') => {
    const motivo =
      accion === 'RECHAZADO'
        ? window.prompt('Indica al Socio qué documento debe corregir:')
        : null;
    if (accion === 'RECHAZADO' && !motivo) return;

    try {
      const respuesta = await apiFetch(`/api/tesorero/documentos/${id}/validacion`, {
        method: 'POST',
        body: JSON.stringify({ estatus: accion, motivo }),
      });
      const datos = (await respuesta.json()) as { mensaje?: string };
      setMensaje(
        datos.mensaje ||
          (respuesta.ok ? 'Validación registrada.' : 'No se pudo registrar la validación.')
      );
      if (respuesta.ok) await cargar();
    } catch {
      setMensaje('Error de conexión al procesar validación.');
    }
  };

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Control de ingreso</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Validación de documentos</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Revisa INE, CURP y comprobante de domicilio antes de habilitar el acceso del Socio.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-[#755b25] bg-[#f5edda] p-3 rounded-2xl border border-brand-gold/20">
            {mensaje}
          </p>
        )}

        {/* Listado de Solicitudes Pendientes */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div className="pb-2 border-b border-black/5">
            <p className="text-base font-bold text-brand-ink">Solicitudes pendientes</p>
            <span className="text-xs text-brand-muted">
              La aprobación habilita el acceso completo a la cooperativa.
            </span>
          </div>

          {cargando ? (
            <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              Cargando expedientes pendientes…
            </div>
          ) : !solicitudes.length ? (
            <p className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              No hay solicitudes pendientes de validación.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {solicitudes.map((solicitud) => (
                <div
                  key={solicitud.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#f8f3ec] border border-black/5 hover:bg-[#efe7dc] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4 text-xs sm:text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <strong className="text-base font-bold text-brand-ink">{solicitud.nombre}</strong>
                    <span className="text-brand-muted text-xs">
                      {solicitud.correo} · Registrado:{' '}
                      {new Date(solicitud.fechaRegistro).toLocaleDateString('es-MX')}
                    </span>
                  </div>

                  {/* Enlaces de consulta documental */}
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={solicitud.ineUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-black/10 text-brand-ink hover:bg-brand-mist hover:text-brand-green transition-colors"
                    >
                      📄 INE
                    </a>
                    <a
                      href={solicitud.curpUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-black/10 text-brand-ink hover:bg-brand-mist hover:text-brand-green transition-colors"
                    >
                      📄 CURP
                    </a>
                    <a
                      href={solicitud.comprobanteDomicilioUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-black/10 text-brand-ink hover:bg-brand-mist hover:text-brand-green transition-colors"
                    >
                      📄 Domicilio
                    </a>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void decidir(solicitud.id, 'RECHAZADO')}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                    >
                      Solicitar corrección
                    </button>
                    <button
                      type="button"
                      onClick={() => void decidir(solicitud.id, 'APROBADO')}
                      className="px-4 py-1.5 rounded-full text-xs font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-sm"
                    >
                      Aprobar acceso
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}