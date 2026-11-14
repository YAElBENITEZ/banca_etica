import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Distribucion {
  id: string;
  socio: string;
  aportaciones: number;
  bruto: number;
  saldoPrestamo: number;
  descuentoPrestamo: number;
  entregable: number;
  estado: string;
  fechaPago: string | null;
}

interface Cierre {
  id: string;
  inicioCiclo: string;
  finCiclo: string;
  periodosRendimiento: number;
  totalAportaciones: number;
  rendimientos: number;
  totalDisponible: number;
  totalEntregado: number;
  pendiente: number;
  distribuciones: Distribucion[];
}

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function CierreCicloTesorero() {
  const [cierre, setCierre] = useState<Cierre | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  const cargar = async () => {
    setCargando(true);
    try {
      const respuesta = await apiFetch('/api/tesorero/cierre');
      const datos = (await respuesta.json()) as Cierre & { cierre?: null; mensaje?: string };
      if (!respuesta.ok) {
        setMensaje(datos.mensaje || 'No se pudo consultar el cierre.');
        return;
      }
      setCierre(datos.cierre === null ? null : datos);
    } catch {
      setMensaje('Error al consultar el cierre de ciclo.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const finalizar = async () => {
    if (!window.confirm('¿Confirmas que deseas finalizar el ciclo operativo y calcular distribuciones?')) return;
    try {
      const respuesta = await apiFetch('/api/tesorero/cierre/finalizar', { method: 'POST' });
      const datos = (await respuesta.json()) as Cierre & { mensaje?: string };
      if (!respuesta.ok) {
        setMensaje(datos.mensaje || 'No se pudo finalizar el ciclo.');
        return;
      }
      setCierre(datos);
      setMensaje('Ciclo finalizado y distribución generada con éxito.');
    } catch {
      setMensaje('Error de conexión al finalizar ciclo.');
    }
  };

  const pagar = async (id: string) => {
    try {
      const respuesta = await apiFetch(`/api/tesorero/cierre/distribuciones/${id}/marcar-pagado`, {
        method: 'POST',
      });
      const datos = (await respuesta.json()) as { mensaje?: string };
      setMensaje(datos.mensaje || (respuesta.ok ? 'Entrega registrada.' : 'No se pudo registrar la entrega.'));
      if (respuesta.ok) await cargar();
    } catch {
      setMensaje('Error al registrar pago de distribución.');
    }
  };

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Cierre financiero</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Distribución del ciclo</h2>
            <span className="text-xs sm:text-sm text-brand-muted">
              El rendimiento se calcula por cada periodo configurado y se reparte proporcionalmente a las aportaciones.
            </span>
          </div>
          {!cierre && !cargando && (
            <button
              type="button"
              onClick={() => void finalizar()}
              className="py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              Finalizar ciclo
            </button>
          )}
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-[#755b25] bg-[#f5edda] p-3 rounded-2xl border border-brand-gold/20">
            {mensaje}
          </p>
        )}

        {cargando ? (
          <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
            Consultando estado del ciclo actual...
          </div>
        ) : !cierre ? (
          <section className="p-8 text-center rounded-[24px] bg-[#f8f3ec]/80 border border-[#367268]/15 shadow-sm flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">⏳</span>
            <p className="text-sm sm:text-base font-semibold text-brand-ink">
              Aún no existe un cierre para esta cooperativa.
            </p>
            <span className="text-xs text-brand-muted max-w-md">
              Solo puede finalizarse una vez que llegue la fecha final configurada del ciclo.
            </span>
          </section>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Grid de 4 Métricas de Distribución */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Aportaciones</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                  {moneda(cierre.totalAportaciones)}
                </strong>
                <small className="text-[11px] text-brand-muted">Fondo base ahorrado</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Rendimientos</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-green my-1">
                  {moneda(cierre.rendimientos)}
                </strong>
                <small className="text-[11px] text-brand-muted">Generados por el ciclo</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Disponible</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                  {moneda(cierre.totalDisponible)}
                </strong>
                <small className="text-[11px] text-brand-muted">Fondo total a repartir</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-brand-gold/30 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-gold">Pendiente de entregar</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-gold my-1">
                  {moneda(cierre.pendiente)}
                </strong>
                <small className="text-[11px] text-brand-muted">Por liquidar a socios</small>
              </section>
            </div>

            {/* Listado de Distribuciones por Socio */}
            <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-base font-bold text-brand-ink">Distribución por Socio</p>
                  <span className="text-xs text-brand-muted">
                    {cierre.periodosRendimiento} periodos de rendimiento aplicados.
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                {cierre.distribuciones.map((distribucion) => (
                  <div
                    key={distribucion.id}
                    className="p-4 rounded-2xl bg-[#f8f3ec] border border-black/5 hover:bg-[#efe7dc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <div className="flex flex-col gap-1">
                      <strong className="text-brand-ink font-bold text-sm sm:text-base">
                        {distribucion.socio}
                      </strong>
                      <span className="text-brand-muted text-xs">
                        Bruto: <strong className="text-brand-ink">{moneda(distribucion.bruto)}</strong> · Descuento préstamo:{' '}
                        <span className="text-red-600 font-semibold">-{moneda(distribucion.descuentoPrestamo)}</span> · Entregable:{' '}
                        <strong className="text-brand-green">{moneda(distribucion.entregable)}</strong>
                      </span>
                    </div>

                    <div>
                      {distribucion.estado === 'Pagado' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-mist text-brand-green">
                          ✓ Pagado {distribucion.fechaPago && `(${new Date(distribucion.fechaPago).toLocaleDateString('es-MX')})`}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void pagar(distribucion.id)}
                          className="py-1.5 px-4 rounded-full text-xs font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-sm"
                        >
                          Marcar pagado
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}