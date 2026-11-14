import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Resumen {
  totalAportado: number;
  numeroAportaciones: number;
  saldoPrestamosPendiente: number;
}

interface Movimiento {
  tipo: string;
  fecha: string;
  monto: number;
  detalle: string;
}

interface RegistroComplementario {
  curp: string;
  rfc: string;
  nombreBeneficiario: string;
  tipoSocio: string;
  completo: boolean;
}

const moneda = (monto: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

export default function DashboardSocio() {
  const navigate = useNavigate();
  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [registroComplementario, setRegistroComplementario] = useState<RegistroComplementario | null>(null);
  const [guardandoRegistro, setGuardandoRegistro] = useState(false);
  const [mensajeRegistro, setMensajeRegistro] = useState('');

  useEffect(() => {
    void (async () => {
      try {
        const [respuestaResumen, respuestaHistorial, respuestaRegistro] = await Promise.all([
          apiFetch('/api/socio/resumen-financiero'),
          apiFetch('/api/socio/historial'),
          apiFetch('/api/socio/registro-complementario'),
        ]);
        if (!respuestaResumen.ok || !respuestaHistorial.ok) {
          throw new Error('No se pudo cargar tu información financiera.');
        }
        setResumen((await respuestaResumen.json()) as Resumen);
        setMovimientos(((await respuestaHistorial.json()) as Movimiento[]).slice(0, 4));
        if (respuestaRegistro.ok) setRegistroComplementario((await respuestaRegistro.json()) as RegistroComplementario);
      } catch (error) {
        setMensaje(error instanceof Error ? error.message : 'No se pudo cargar tu información.');
      }
    })();
  }, []);

  const guardarRegistroComplementario = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!registroComplementario) return;
    setGuardandoRegistro(true);
    setMensajeRegistro('');
    try {
      const respuesta = await apiFetch('/api/socio/registro-complementario', {
        method: 'PUT',
        body: JSON.stringify({
          curp: registroComplementario.curp,
          rfc: registroComplementario.rfc,
          nombreBeneficiario: registroComplementario.nombreBeneficiario,
          tipoSocio: registroComplementario.tipoSocio,
        }),
      });
      const datos = (await respuesta.json().catch(() => ({}))) as { mensaje?: string; registro?: RegistroComplementario };
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo guardar el registro complementario.');
      setRegistroComplementario(datos.registro || { ...registroComplementario, completo: true });
      setMensajeRegistro(datos.mensaje || 'Registro complementario guardado correctamente.');
    } catch (error) {
      setMensajeRegistro(error instanceof Error ? error.message : 'No se pudo guardar el registro complementario.');
    } finally {
      setGuardandoRegistro(false);
    }
  };

  const acciones = [
    ['Mis aportaciones', 'Consulta tu ahorro y metas.', '/mis-cajitas'],
    ['Mis préstamos', 'Revisa saldos y pagos registrados.', '/mis-prestamos'],
    ['Mi historial', 'Ve todas tus operaciones.', '/mi-historial'],
    ['Cierre del ciclo', 'Consulta tu entrega final.', '/mi-cierre'],
  ];

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Mi cooperativa</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">
              Hola, {usuario?.nombre || 'Socio'}
            </h2>
            <span className="text-xs sm:text-sm text-brand-muted">
              Consulta el estado de tus aportaciones, préstamos y movimientos.
            </span>
          </div>
          <button
            type="button"
            onClick={() => navigate('/mi-perfil')}
            className="px-4 py-2 rounded-full text-xs sm:text-sm font-semibold bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-all"
          >
            Ver mi perfil
          </button>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {mensaje}
          </p>
        )}

        {registroComplementario && !registroComplementario.completo && (
          <section className="p-5 sm:p-6 rounded-[24px] bg-[#fff8e9] border border-brand-gold/30 shadow-sm">
            <div className="flex flex-col gap-1 mb-5">
              <p className="text-base sm:text-lg font-bold text-brand-ink">Completa tu registro</p>
              <span className="text-xs sm:text-sm text-brand-muted">Tu solicitud ya fue aceptada. Completa estos datos personales para finalizar tu expediente como socio.</span>
            </div>
            <form onSubmit={guardarRegistroComplementario} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/80 border border-brand-gold/15">
                <span className="text-xs font-semibold text-brand-muted">CURP</span>
                <input
                  value={registroComplementario.curp}
                  maxLength={18}
                  onChange={(event) => setRegistroComplementario({ ...registroComplementario, curp: event.target.value.toUpperCase() })}
                  placeholder="18 caracteres"
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink uppercase placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/80 border border-brand-gold/15">
                <span className="text-xs font-semibold text-brand-muted">RFC</span>
                <input
                  value={registroComplementario.rfc}
                  maxLength={13}
                  onChange={(event) => setRegistroComplementario({ ...registroComplementario, rfc: event.target.value.toUpperCase() })}
                  placeholder="12 o 13 caracteres"
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink uppercase placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/80 border border-brand-gold/15">
                <span className="text-xs font-semibold text-brand-muted">Nombre de beneficiario(a)</span>
                <input
                  value={registroComplementario.nombreBeneficiario}
                  onChange={(event) => setRegistroComplementario({ ...registroComplementario, nombreBeneficiario: event.target.value })}
                  placeholder="Nombre completo"
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-white/80 border border-brand-gold/15">
                <span className="text-xs font-semibold text-brand-muted">Tipo de socio</span>
                <select
                  value={registroComplementario.tipoSocio}
                  onChange={(event) => setRegistroComplementario({ ...registroComplementario, tipoSocio: event.target.value })}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink focus:outline-none focus:ring-0"
                >
                  <option value="">Selecciona una opción</option>
                  <option value="PRIMARIO">Socio primario</option>
                  <option value="SECUNDARIO">Socio secundario</option>
                </select>
              </label>
              <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                {mensajeRegistro && <p className={`text-xs font-semibold ${mensajeRegistro.includes('correctamente') ? 'text-brand-green' : 'text-red-600'}`}>{mensajeRegistro}</p>}
                <button type="submit" disabled={guardandoRegistro} className="sm:ml-auto px-5 py-3 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all disabled:opacity-50">
                  {guardandoRegistro ? 'Guardando...' : 'Concluir registro'}
                </button>
              </div>
            </form>
          </section>
        )}

        {/* Métricas / KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <article className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted">Total aportado</span>
            <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {resumen ? moneda(resumen.totalAportado) : '—'}
            </strong>
            <small className="text-[11px] text-brand-muted">Acumulado en la cooperativa</small>
          </article>

          <article className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted">Aportaciones registradas</span>
            <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {resumen ? resumen.numeroAportaciones : '—'}
            </strong>
            <small className="text-[11px] text-brand-muted">Movimientos confirmados</small>
          </article>

          <article className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted">Saldo de préstamo</span>
            <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {resumen ? moneda(resumen.saldoPrestamosPendiente) : '—'}
            </strong>
            <small className="text-[11px] text-brand-muted">Saldo pendiente por cubrir</small>
          </article>
        </section>

        {/* Layout inferior de 2 columnas */}
        <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.9fr)] gap-5">
          {/* Actividad reciente */}
          <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-base font-bold text-brand-ink">Actividad reciente</p>
                <span className="text-xs text-brand-muted">Últimos movimientos registrados por Tesorería.</span>
              </div>
              <button
                type="button"
                onClick={() => navigate('/mi-historial')}
                className="text-xs font-semibold text-brand-green hover:text-brand-teal transition-colors"
              >
                Ver historial &rarr;
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              {movimientos.length ? (
                movimientos.map((movimiento, indice) => (
                  <div
                    key={`${movimiento.fecha}-${indice}`}
                    className="p-3.5 rounded-2xl bg-[#f8f3ec] border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <strong className="block text-sm text-brand-ink font-semibold">{movimiento.tipo}</strong>
                      <span className="text-brand-muted">{movimiento.detalle}</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="block text-brand-muted">{new Date(movimiento.fecha).toLocaleDateString('es-MX')}</span>
                      <strong className="text-brand-green font-bold text-sm">{moneda(movimiento.monto)}</strong>
                    </div>
                  </div>
                ))
              ) : (
                <p className="py-8 text-center text-xs text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
                  Aún no hay movimientos registrados.
                </p>
              )}
            </div>
          </section>

          {/* Acciones Rápidas */}
          <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
            <p className="text-base font-bold text-brand-ink">Acciones disponibles</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2.5">
              {acciones.map(([titulo, descripcion, ruta]) => (
                <button
                  key={ruta}
                  type="button"
                  onClick={() => navigate(ruta)}
                  className="text-left p-3.5 rounded-2xl bg-[#f3eee6] hover:bg-[#e7ddd0] border border-[#e4dbd0] transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex flex-col gap-1"
                >
                  <strong className="text-xs sm:text-sm font-bold text-brand-ink">{titulo}</strong>
                  <span className="text-[11px] text-brand-muted leading-tight">{descripcion}</span>
                </button>
              ))}
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
