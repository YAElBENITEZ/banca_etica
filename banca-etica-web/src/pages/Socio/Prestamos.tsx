import { useEffect, useState, type FormEvent } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Pago {
  numero: number;
  vencimiento: string;
  capital: number;
  interes: number;
  montoPagado: number;
  multa: number;
  tipoPago: string;
  estado: string;
}

interface Prestamo {
  id: string;
  proposito: string;
  montoOriginal: number;
  tasa: number;
  plazoMeses: number;
  tipoInteres: string;
  estado: string;
  fechaDesembolso: string;
  cajitaNombre: string;
  saldoPendiente: number;
  pagos: Pago[];
}

interface SolicitudSocio {
  id: string;
  monto: number;
  contacto: string;
  descripcion: string;
  estatus: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaSolicitud: string;
  fechaResolucion?: string;
}

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudSocio[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  // Modal de solicitud de emergencia
  const [modalAbierto, setModalAbierto] = useState(false);
  const [monto, setMonto] = useState('');
  const [contacto, setContacto] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [mensajeModal, setMensajeModal] = useState('');

  const cargar = async () => {
    setCargando(true);
    setMensaje('');
    try {
      const [resPrestamos, resSolicitudes] = await Promise.allSettled([
        apiFetch('/api/prestamo'),
        apiFetch('/api/prestamo/solicitudes'),
      ]);

      if (resPrestamos.status === 'fulfilled' && resPrestamos.value.ok) {
        const datos = (await resPrestamos.value.json()) as Prestamo[];
        setPrestamos(Array.isArray(datos) ? datos : []);
      } else if (resPrestamos.status === 'fulfilled' && !resPrestamos.value.ok) {
        const err = await resPrestamos.value.json().catch(() => ({}));
        setMensaje(err.mensaje || 'Aviso al consultar historial de préstamos.');
      }

      if (resSolicitudes.status === 'fulfilled' && resSolicitudes.value.ok) {
        const datosSol = (await resSolicitudes.value.json()) as SolicitudSocio[];
        setSolicitudes(Array.isArray(datosSol) ? datosSol : []);
      }
    } catch {
      setMensaje('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const deudaTotal = prestamos.reduce((total, p) => total + (p.saldoPendiente || 0), 0);

  const abrirModal = () => {
    setMonto('');
    setContacto('');
    setDescripcion('');
    setMensajeModal('');
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    if (enviando) return;
    setModalAbierto(false);
  };

  const handleSolicitarEmergencia = async (e: FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeModal('');

    try {
      const respuesta = await apiFetch('/api/prestamo/emergencia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: Number(monto),
          numeroContacto: contacto.trim(),
          descripcion: descripcion.trim(),
        }),
      });

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        setMensajeModal(data.mensaje || 'Error al procesar la solicitud.');
        return;
      }

      window.alert(
        '¡Solicitud registrada con éxito!\n\nEn este momento se notificará por WhatsApp al comité de la cooperativa.'
      );
      setModalAbierto(false);
      await cargar();
    } catch {
      setMensajeModal('Error de conexión al enviar la solicitud.');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Financiamiento</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Mis préstamos</h2>
            <span className="text-xs sm:text-sm text-brand-muted">
              Consulta tus financiamientos vigentes y el estado de tus solicitudes extraordinarias.
            </span>
          </div>
          <button
            type="button"
            onClick={abrirModal}
            className="py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            Solicitar préstamo de emergencia
          </button>
        </header>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-[#755b25] bg-[#f5edda] p-3 rounded-2xl border border-brand-gold/20">
            {mensaje}
          </p>
        )}

        {/* Tarjetas de Resumen (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted">Saldo pendiente</span>
            <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {moneda(deudaTotal)}
            </strong>
            <small className="text-[11px] text-brand-muted">Total a liquidar</small>
          </section>

          <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted">Préstamos activos</span>
            <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {prestamos.filter((p) => p.estado !== 'Liquidado').length}
            </strong>
            <small className="text-[11px] text-brand-muted">En periodo de amortización</small>
          </section>

          <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted">Solicitudes enviadas</span>
            <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {solicitudes.length}
            </strong>
            <small className="text-[11px] text-brand-muted">Historial de peticiones</small>
          </section>
        </div>

        {/* 1. SECCIÓN: ESTADO DE SOLICITUDES DE EMERGENCIA */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-base font-bold text-brand-ink">Estado de mis solicitudes de emergencia</p>
            <span className="text-xs text-brand-muted">Seguimiento de peticiones evaluadas o pendientes por la Tesorería.</span>
          </div>

          <div className="flex flex-col gap-3">
            {cargando ? (
              <p className="text-xs sm:text-sm text-brand-muted py-4 text-center">Cargando solicitudes...</p>
            ) : solicitudes.length === 0 ? (
              <p className="py-6 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
                No tienes solicitudes de emergencia registradas.
              </p>
            ) : (
              solicitudes.map((sol) => {
                const esPendiente = sol.estatus === 'PENDIENTE';
                const esAprobada = sol.estatus === 'APROBADA';
                return (
                  <div
                    key={sol.id}
                    className={`p-4 rounded-2xl bg-white border border-black/5 shadow-sm flex flex-col gap-2.5 transition-all ${
                      esPendiente
                        ? 'border-l-4 border-l-brand-gold'
                        : esAprobada
                        ? 'border-l-4 border-l-brand-green'
                        : 'border-l-4 border-l-red-600'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-base font-bold text-brand-ink">{moneda(sol.monto)}</strong>
                        <span className="text-xs text-brand-muted">
                          Fecha: {new Date(sol.fechaSolicitud).toLocaleDateString('es-MX')}
                        </span>
                      </div>
                      <span
                        className={`w-fit px-3 py-1 rounded-full text-[11px] font-bold ${
                          esPendiente
                            ? 'bg-[#f5edda] text-[#755b25]'
                            : esAprobada
                            ? 'bg-brand-mist text-brand-green'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sol.estatus}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                      <strong className="text-brand-ink font-semibold">Motivo: </strong>
                      {sol.descripcion}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-black/5">
                      <span>Teléfono: {sol.contacto}</span>
                      {sol.fechaResolucion && (
                        <span>Resolución: {new Date(sol.fechaResolucion).toLocaleDateString('es-MX')}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* 2. SECCIÓN: HISTORIAL DE PRÉSTAMOS */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-base font-bold text-brand-ink">Historial de financiamientos</p>
            <span className="text-xs text-brand-muted">
              Selecciona un préstamo para consultar su tabla de pagos y amortización.
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {cargando ? (
              <p className="text-xs sm:text-sm text-brand-muted py-4 text-center">Cargando préstamos...</p>
            ) : prestamos.length === 0 ? (
              <p className="py-6 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
                No tienes préstamos otorgados en este momento.
              </p>
            ) : (
              prestamos.map((prestamo) => (
                <div
                  key={prestamo.id}
                  className="p-4 rounded-2xl bg-[#f8f3ec] border border-black/5 flex flex-col gap-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <strong className="text-sm sm:text-base font-bold text-brand-ink">{prestamo.proposito}</strong>
                      <div className="text-xs text-brand-muted mt-0.5">
                        Monto: <strong className="text-brand-ink">{moneda(prestamo.montoOriginal)}</strong> · Saldo:{' '}
                        <strong className="text-brand-green">{moneda(prestamo.saldoPendiente)}</strong> · Estado:{' '}
                        <span className="font-semibold text-brand-ink">{prestamo.estado}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSeleccionado(seleccionado === prestamo.id ? null : prestamo.id)}
                      className="w-fit px-4 py-2 rounded-full text-xs font-semibold bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-colors"
                    >
                      {seleccionado === prestamo.id ? 'Ocultar pagos' : 'Ver pagos'}
                    </button>
                  </div>

                  {seleccionado === prestamo.id && (
                    <div className="p-3 rounded-xl bg-white/90 border border-black/5 flex flex-col gap-2 mt-1">
                      {prestamo.pagos && prestamo.pagos.length > 0 ? (
                        prestamo.pagos.map((pago) => (
                          <div
                            key={pago.numero}
                            className="p-2.5 rounded-lg bg-[#f8f3ec]/60 border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs"
                          >
                            <strong className="text-brand-ink font-semibold">
                              #{pago.numero} · Vence: {new Date(pago.vencimiento).toLocaleDateString('es-MX')}
                            </strong>
                            <span className="text-brand-muted">
                              {pago.estado === 'Pagado' ? (
                                <span className="text-brand-green font-bold">
                                  Pagado: {moneda(pago.montoPagado)}
                                  {pago.tipoPago === 'Moroso' ? ` (multa ${moneda(pago.multa)})` : ''}
                                </span>
                              ) : (
                                `Capital: ${moneda(pago.capital)} + Interés: ${moneda(pago.interes)}`
                              )}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-2 text-xs text-brand-muted">Sin parcialidades registradas.</p>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Modal de Solicitud de Emergencia */}
      {modalAbierto && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={cerrarModal}
        >
          <div
            className="w-full max-w-lg rounded-[28px] bg-white p-6 sm:p-7 shadow-2xl flex flex-col gap-4 border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
                Solicitud extraordinaria
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-brand-ink mt-0.5">
                Préstamo de Emergencia
              </h3>
              <p className="text-xs sm:text-sm text-brand-muted mt-1 leading-relaxed">
                Envía tus requerimientos para revisión directa por el comité de la cooperativa.
              </p>
            </div>

            {mensajeModal && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-700 font-medium">
                {mensajeModal}
              </div>
            )}

            <form onSubmit={handleSolicitarEmergencia} className="flex flex-col gap-3.5">
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Monto requerido ($)</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  placeholder="Ej. 5000"
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>

              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Número de contacto inmediato</span>
                <input
                  type="tel"
                  required
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Ej. 222 123 4567"
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>

              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Descripción de la solicitud</span>
                <textarea
                  rows={3}
                  required
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe el motivo o destino de la emergencia..."
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 resize-y"
                />
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={enviando}
                  className="py-2.5 px-5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando}
                  className="py-2.5 px-6 rounded-full text-xs font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md disabled:opacity-50"
                >
                  {enviando ? 'Enviando...' : 'Enviar Solicitud'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}