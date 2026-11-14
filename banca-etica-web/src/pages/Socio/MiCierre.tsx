import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Cierre {
  inicioCiclo: string;
  finCiclo: string;
  aportaciones: number;
  montoBruto: number;
  saldoPrestamo: number;
  descuentoPrestamo: number;
  montoEntregable: number;
  estado: string;
  fechaPago: string | null;
  montoEntregado: number | null;
  cierre?: null;
  mensaje?: string;
}

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function MiCierre() {
  const [cierre, setCierre] = useState<Cierre | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      setCargando(true);
      try {
        const respuesta = await apiFetch('/api/socio/cierre');
        const datos = (await respuesta.json()) as Cierre;
        if (!respuesta.ok) {
          setMensaje(datos.mensaje || 'No se pudo consultar el cierre.');
          return;
        }
        setCierre(datos.cierre === null ? null : datos);
      } catch (error) {
        setMensaje('Error de comunicación con el servidor.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Mi cooperativa</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Cierre del ciclo</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Tu resultado aparece cuando la Tesorería finaliza el ciclo operativo.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {mensaje}
          </p>
        )}

        {cargando ? (
          <div className="min-h-[200px] flex items-center justify-center p-6 text-center rounded-2xl border border-dashed border-[#5b4e3d]/30 bg-white/50 text-sm text-brand-muted">
            Consultando datos de liquidación final...
          </div>
        ) : !cierre ? (
          <section className="p-8 text-center rounded-[24px] bg-[#f8f3ec]/80 border border-[#367268]/15 shadow-sm flex flex-col items-center justify-center gap-2">
            <span className="text-2xl">🌱</span>
            <p className="text-sm sm:text-base font-semibold text-brand-ink">
              El ciclo continúa activo o todavía no se ha generado tu distribución.
            </p>
            <span className="text-xs text-brand-muted max-w-md">
              Cuando el comité tesorero ejecute el balance final del periodo, verás reflejados aquí tus rendimientos, descuentos de préstamo y monto entregable.
            </span>
          </section>
        ) : (
          <section className="flex flex-col gap-5">
            {/* Grid de 4 tarjetas de resultados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Mis aportaciones</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                  {moneda(cierre.aportaciones)}
                </strong>
                <small className="text-[11px] text-brand-muted">Ahorro base acumulado</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Total correspondiente</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-green my-1">
                  {moneda(cierre.montoBruto)}
                </strong>
                <small className="text-[11px] text-brand-muted">Aportaciones + rendimientos</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Descuento por préstamo</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-red-600 my-1">
                  -{moneda(cierre.descuentoPrestamo)}
                </strong>
                <small className="text-[11px] text-brand-muted">Retención de deuda pendiente</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-brand-gold/30 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-gold">Monto a recibir</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                  {moneda(cierre.montoEntregable)}
                </strong>
                <small className="text-[11px] text-brand-muted">Saldo líquido a entregar</small>
              </section>
            </div>

            {/* Panel de Estado y Fecha de Entrega */}
            <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                    cierre.estado === 'Entregado' || cierre.estado === 'PAGADO'
                      ? 'bg-brand-mist text-brand-green'
                      : 'bg-brand-sand text-[#6d5520]'
                  }`}
                >
                  {cierre.estado}
                </span>
                {cierre.fechaPago && (
                  <span className="text-xs sm:text-sm text-brand-muted">
                    Entregado el {new Date(cierre.fechaPago).toLocaleDateString('es-MX')}
                  </span>
                )}
              </div>

              {cierre.montoEntregado !== null && (
                <div className="text-xs sm:text-sm text-brand-ink">
                  Total cobrado: <strong className="font-bold text-brand-green">{moneda(cierre.montoEntregado)}</strong>
                </div>
              )}
            </section>
          </section>
        )}
      </main>
    </div>
  );
}