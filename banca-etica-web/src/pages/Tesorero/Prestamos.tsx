import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Socio {
  id: string;
  nombre: string;
}

interface Prestamo {
  id: string;
  socio: string;
  nombre: string;
  montoOriginal: number;
  tasa: number;
  plazoMeses: number;
  fechaDesembolso: string;
  estado: string;
  saldoPendiente: number;
}

interface Parcialidad {
  id: string;
  numero: number;
  vencimiento: string;
  capital: number;
  interes: number;
  multa: number;
  montoPagado: number | null;
  tipoPago: string;
  fechaPago: string | null;
  estado: string;
}

interface Detalle extends Omit<Prestamo, 'nombre' | 'fechaDesembolso' | 'saldoPendiente'> {
  pagos: Parcialidad[];
}

interface SolicitudEmergencia {
  id: string;
  socioId: string;
  socio: string;
  numeroSocio?: string;
  monto: number;
  contacto: string;
  descripcion: string;
  estatus: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA';
  fechaSolicitud: string;
  fechaResolucion?: string;
}

const hoy = new Date().toISOString().slice(0, 10);
const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function PrestamosTesorero() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudEmergencia[]>([]);
  const [detalle, setDetalle] = useState<Detalle | null>(null);

  // Formulario de registro de préstamo
  const [socioId, setSocioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [fechaDesembolso, setFechaDesembolso] = useState(hoy);
  const [esUrgente, setEsUrgente] = useState(false);
  const [formaEntrega, setFormaEntrega] = useState('EFECTIVO');
  const [solicitudVinculadaId, setSolicitudVinculadaId] = useState<string | null>(null);

  const [mensaje, setMensaje] = useState('');
  const [filtroSolicitudes, setFiltroSolicitudes] = useState<'PENDIENTE' | 'TODAS'>('PENDIENTE');

  const leer = async <T,>(respuesta: Response): Promise<T & { mensaje?: string }> =>
    respuesta.json() as Promise<T & { mensaje?: string }>;

  const cargar = async () => {
    try {
      const [sociosRespuesta, prestamosRespuesta, solicitudesRespuesta] = await Promise.all([
        apiFetch('/api/tesorero/prestamos/socios'),
        apiFetch('/api/tesorero/prestamos'),
        apiFetch('/api/tesorero/prestamos/solicitudes'),
      ]);

      const sociosDatos = await leer<Socio[]>(sociosRespuesta);
      const prestamosDatos = await leer<Prestamo[]>(prestamosRespuesta);
      const solicitudesDatos = await leer<SolicitudEmergencia[]>(solicitudesRespuesta);

      if (!sociosRespuesta.ok || !prestamosRespuesta.ok || !solicitudesRespuesta.ok) {
        setMensaje(
          sociosDatos.mensaje ||
            prestamosDatos.mensaje ||
            solicitudesDatos.mensaje ||
            'No se pudo cargar la información.'
        );
        return;
      }

      setSocios(sociosDatos);
      setPrestamos(prestamosDatos);
      setSolicitudes(solicitudesDatos);

      if (!socioId && sociosDatos.length) setSocioId(sociosDatos[0].id);
    } catch {
      setMensaje('Error de conexión al cargar datos.');
    }
  };

  useEffect(() => {
    void cargar();
  }, []);

  const abrirDetalle = async (id: string) => {
    const respuesta = await apiFetch(`/api/tesorero/prestamos/${id}`);
    const datos = await leer<Detalle>(respuesta);
    if (!respuesta.ok) {
      setMensaje(datos.mensaje || 'No se pudo consultar el préstamo.');
      return;
    }
    setDetalle(datos);
  };

  const atenderSolicitud = (sol: SolicitudEmergencia) => {
    setSocioId(sol.socioId);
    setNombre(`Préstamo de Emergencia - ${sol.socio}`);
    setMonto(sol.monto.toString());
    setEsUrgente(true);
    setSolicitudVinculadaId(sol.id);
    setMensaje(`Formulario prellenado para solicitud de: ${sol.socio}. Ajusta el plazo y confirma.`);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const rechazarSolicitud = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas rechazar esta solicitud de emergencia?')) return;
    try {
      const respuesta = await apiFetch(`/api/tesorero/prestamos/solicitudes/${id}/rechazar`, {
        method: 'PATCH',
      });
      const datos = await leer<{ mensaje: string }>(respuesta);
      if (!respuesta.ok) {
        setMensaje(datos.mensaje || 'Error al rechazar la solicitud.');
        return;
      }
      setMensaje('Solicitud rechazada correctamente.');
      await cargar();
    } catch {
      setMensaje('Error de conexión al rechazar solicitud.');
    }
  };

  const crear = async (evento: FormEvent) => {
    evento.preventDefault();
    const respuesta = await apiFetch('/api/tesorero/prestamos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        socioId,
        nombre,
        monto: Number(monto),
        plazoMeses: Number(plazoMeses),
        fechaDesembolso: new Date(fechaDesembolso).toISOString(),
        esUrgente,
        formaEntrega,
        solicitudId: solicitudVinculadaId,
      }),
    });
    const datos = await leer<{ id: string }>(respuesta);
    setMensaje(datos.mensaje || (respuesta.ok ? 'Préstamo registrado.' : 'No se pudo registrar el préstamo.'));
    if (respuesta.ok) {
      setNombre('');
      setMonto('');
      setPlazoMeses('');
      setEsUrgente(false);
      setFormaEntrega('EFECTIVO');
      setSolicitudVinculadaId(null);
      await cargar();
    }
  };

  const pagar = async (parcialidadId: string, tipoPago: 'Normal' | 'Moroso') => {
    const respuesta = await apiFetch('/api/tesorero/prestamos/pagos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ parcialidadId, tipoPago }),
    });
    const datos = await leer<{ monto: number; multa: number }>(respuesta);
    setMensaje(datos.mensaje || (respuesta.ok ? 'Pago registrado.' : 'No se pudo registrar el pago.'));
    if (respuesta.ok && detalle) {
      await cargar();
      await abrirDetalle(detalle.id);
    }
  };

  const solicitudesFiltradas = solicitudes.filter((s) =>
    filtroSolicitudes === 'PENDIENTE' ? s.estatus === 'PENDIENTE' : true
  );

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Operación diaria</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Préstamos de la cooperativa</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Gestiona solicitudes de emergencia, registra desembolsos y administra parcialidades.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-[#755b25] bg-[#f5edda] p-3 rounded-2xl border border-brand-gold/20">
            {mensaje}
          </p>
        )}

        {/* 1. SECCIÓN DE BANDEJA DE SOLICITUDES DE EMERGENCIA */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-[#fffaf5] border border-orange-200/80 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-orange-100">
            <div>
              <p className="text-base font-bold text-[#755b25] flex items-center gap-1.5">
                <span>🚨</span> Solicitudes de Préstamo de Emergencia
              </p>
              <span className="text-xs text-brand-muted">
                Revisa peticiones enviadas directamente por los socios en su portal.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFiltroSolicitudes('PENDIENTE')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filtroSolicitudes === 'PENDIENTE'
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Pendientes ({solicitudes.filter((s) => s.estatus === 'PENDIENTE').length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroSolicitudes('TODAS')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  filtroSolicitudes === 'TODAS'
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Historial completo ({solicitudes.length})
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            {solicitudesFiltradas.length === 0 ? (
              <p className="text-center py-6 text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
                No hay solicitudes en esta vista.
              </p>
            ) : (
              solicitudesFiltradas.map((sol) => (
                <div
                  key={sol.id}
                  className={`p-4 rounded-2xl bg-white border border-black/5 shadow-sm flex flex-col gap-2.5 transition-all ${
                    sol.estatus === 'PENDIENTE'
                      ? 'border-l-4 border-l-brand-gold'
                      : 'border-l-4 border-l-gray-400'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <strong className="text-base font-bold text-brand-ink">{sol.socio}</strong>
                      {sol.numeroSocio && (
                        <span className="text-[11px] bg-gray-200 text-gray-800 px-2 py-0.5 rounded font-bold">
                          {sol.numeroSocio}
                        </span>
                      )}
                      <span className="text-sm font-bold text-brand-green ml-1">{moneda(sol.monto)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          sol.estatus === 'PENDIENTE'
                            ? 'bg-[#f5edda] text-[#755b25]'
                            : sol.estatus === 'APROBADA'
                            ? 'bg-brand-mist text-brand-green'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {sol.estatus}
                      </span>

                      {sol.estatus === 'PENDIENTE' && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => atenderSolicitud(sol)}
                            className="px-3 py-1 rounded-full text-xs font-semibold bg-brand-green text-white hover:bg-brand-teal transition-all shadow-sm"
                          >
                            Aprobar y Prellenar
                          </button>
                          <button
                            type="button"
                            onClick={() => void rechazarSolicitud(sol.id)}
                            className="px-3 py-1 rounded-full text-xs font-semibold border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    <strong className="text-brand-ink font-semibold">Motivo: </strong>
                    {sol.descripcion}
                  </p>

                  <div className="flex flex-wrap gap-4 text-xs text-gray-400 pt-1 border-t border-black/5">
                    <span>
                      📞 Contacto directo: <strong className="text-brand-ink">{sol.contacto}</strong>
                    </span>
                    <span>📅 Solicitado: {new Date(sol.fechaSolicitud).toLocaleString('es-MX')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 2. REGISTRAR PRÉSTAMO APROBADO */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-[#f8f3ec]/90 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5">
            <div>
              <p className="text-base sm:text-lg font-bold text-brand-ink">
                {solicitudVinculadaId ? 'Formalizar Préstamo de Emergencia' : 'Registrar Préstamo Aprobado'}
              </p>
              <span className="text-xs text-brand-muted">
                El sistema crea automáticamente las parcialidades mensuales con la tasa configurada.
              </span>
            </div>
            {solicitudVinculadaId && (
              <button
                type="button"
                onClick={() => {
                  setSolicitudVinculadaId(null);
                  setNombre('');
                  setMonto('');
                }}
                className="px-3 py-1 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cancelar vinculación
              </button>
            )}
          </div>

          <form onSubmit={(evento) => void crear(evento)} className="flex flex-col gap-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted font-medium">Socio</span>
                <select
                  required
                  value={socioId}
                  onChange={(evento) => setSocioId(evento.target.value)}
                  className="bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-brand-ink focus:outline-none"
                >
                  <option value="">Selecciona un Socio</option>
                  {socios.map((socio) => (
                    <option key={socio.id} value={socio.id}>
                      {socio.nombre}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted font-medium">Nombre o propósito</span>
                <input
                  required
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  placeholder="Ej. Insumos Agrícolas"
                  className="bg-transparent border-0 p-0 text-xs sm:text-sm text-brand-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted font-medium">Monto aprobado ($)</span>
                <input
                  required
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={monto}
                  onChange={(evento) => setMonto(evento.target.value)}
                  placeholder="0.00"
                  className="bg-transparent border-0 p-0 text-xs sm:text-sm text-brand-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted font-medium">Plazo (meses)</span>
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={plazoMeses}
                  onChange={(evento) => setPlazoMeses(evento.target.value)}
                  placeholder="Ej. 6"
                  className="bg-transparent border-0 p-0 text-xs sm:text-sm text-brand-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted font-medium">Fecha de desembolso</span>
                <input
                  required
                  type="date"
                  value={fechaDesembolso}
                  onChange={(evento) => setFechaDesembolso(evento.target.value)}
                  className="bg-transparent border-0 p-0 text-xs sm:text-sm text-brand-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted font-medium">Forma de entrega</span>
                <select
                  value={formaEntrega}
                  onChange={(evento) => setFormaEntrega(evento.target.value)}
                  className="bg-transparent border-0 p-0 text-xs sm:text-sm font-semibold text-brand-ink focus:outline-none"
                >
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="DEPOSITO">Depósito</option>
                </select>
              </label>
            </div>

            <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#f3f8f6] cursor-pointer">
              <input
                type="checkbox"
                checked={esUrgente}
                onChange={(evento) => setEsUrgente(evento.target.checked)}
                className="rounded border-gray-300 text-brand-green focus:ring-brand-teal"
              />
              <span className="text-xs sm:text-sm text-brand-ink">
                Solicitud urgente (Socio ausente de asamblea)
              </span>
            </label>

            <button
              type="submit"
              className="w-full sm:w-auto self-end py-2.5 px-6 rounded-full font-semibold text-xs sm:text-sm text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              {solicitudVinculadaId ? 'Aprobar y Desembolsar' : 'Registrar préstamo'}
            </button>
          </form>
        </section>

        {/* 3. HISTORIAL DE PRÉSTAMOS REGISTRADOS */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div>
            <p className="text-base font-bold text-brand-ink">Préstamos Registrados y Activos</p>
            <span className="text-xs text-brand-muted">Selecciona uno para consultar y cobrar sus parcialidades.</span>
          </div>

          <div className="flex flex-col gap-2.5">
            {prestamos.length === 0 ? (
              <p className="py-6 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
                No hay préstamos registrados.
              </p>
            ) : (
              prestamos.map((prestamo) => (
                <div
                  key={prestamo.id}
                  className="p-4 rounded-2xl bg-[#f8f3ec] border border-black/5 hover:bg-[#efe7dc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div>
                    <strong className="block text-brand-ink font-bold text-sm sm:text-base">
                      {prestamo.socio}: {prestamo.nombre}
                    </strong>
                    <span className="text-brand-muted text-xs">
                      Monto: <strong className="text-brand-ink">{moneda(prestamo.montoOriginal)}</strong> · Saldo:{' '}
                      <strong className="text-brand-green">{moneda(prestamo.saldoPendiente)}</strong> · Estado:{' '}
                      <span className="font-semibold text-brand-ink">{prestamo.estado}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => void abrirDetalle(prestamo.id)}
                    className="w-fit px-4 py-2 rounded-full text-xs font-semibold bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-colors"
                  >
                    Ver pagos
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* 4. CALENDARIO DE AMORTIZACIÓN Y PAGOS */}
        {detalle && (
          <section className="p-5 sm:p-6 rounded-[24px] bg-[#f8f3ec]/90 border border-[#367268]/20 shadow-md flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-black/5">
              <div>
                <p className="text-base font-bold text-brand-ink">Calendario de {detalle.socio}</p>
                <span className="text-xs text-brand-muted">
                  {detalle.plazoMeses} parcialidades · tasa {detalle.tasa}%
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetalle(null)}
                className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Cerrar
              </button>
            </div>

            <div className="flex flex-col gap-2">
              {detalle.pagos.map((pago) => (
                <div
                  key={pago.id}
                  className="p-3.5 rounded-2xl bg-white border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <strong className="text-brand-ink font-semibold">
                    #{pago.numero} · Vence: {new Date(pago.vencimiento).toLocaleDateString('es-MX')}
                  </strong>

                  {pago.estado === 'Pagado' ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-mist text-brand-green">
                      ✓ Pagado: {moneda(pago.montoPagado || 0)}{' '}
                      {pago.tipoPago === 'Moroso' && `(multa ${moneda(pago.multa)})`}
                    </span>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <span className="text-brand-muted text-xs">
                        Capital {moneda(pago.capital)} + Interés {moneda(pago.interes)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void pagar(pago.id, 'Normal')}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-colors"
                        >
                          Pago normal
                        </button>
                        <button
                          type="button"
                          onClick={() => void pagar(pago.id, 'Moroso')}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-brand-gold hover:bg-[#7a5e27] transition-all shadow-sm"
                        >
                          Pago moroso
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}