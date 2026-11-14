import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';

interface DashboardTesoreroData {
  socios: number;
  aportacionesPeriodo: number;
  codigoCooperativa: string;
  mesPeriodo: string;
  prestamosActivos: number;
  totalRecaudado: number;
  rendimientosGenerados: number;
  cicloActual: string;
  estadoCiclo: string;
  proximoPeriodoAportacion: string;
  aportacionesPendientes: number;
  prestamosPendientesPago: number;
}

const datosIniciales: DashboardTesoreroData = {
  socios: 0,
  aportacionesPeriodo: 0,
  codigoCooperativa: '',
  mesPeriodo: '',
  prestamosActivos: 0,
  totalRecaudado: 0,
  rendimientosGenerados: 0,
  cicloActual: '---',
  estadoCiclo: '---',
  proximoPeriodoAportacion: '---',
  aportacionesPendientes: 0,
  prestamosPendientesPago: 0,
};

function formatearMoneda(monto: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(monto);
}

export default function TesoreroDashboard() {
  const navigate = useNavigate();

  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
  const nombreCooperativa = usuario?.cooperativaNombre || 'Cooperativa';

  const [datos, setDatos] = useState<DashboardTesoreroData>(datosIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarMetricas = async () => {
      setCargando(true);
      setError(null);
      try {
        const response = await apiFetch('/api/tesorero/dashboard');

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.mensaje || 'Error al obtener los datos del dashboard.');
        }

        const resultado = (await response.json()) as DashboardTesoreroData;
        setDatos(resultado);
      } catch (err) {
        console.error('Error al conectar con /api/tesorero/dashboard:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido al cargar las métricas.');
      } finally {
        setCargando(false);
      }
    };

    void cargarMetricas();
  }, []);

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'TR';

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Topbar superior */}
        <header className="flex items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-ink">Dashboard</h1>
            <span className="text-xs text-brand-muted">
              Tesorero &gt; <strong className="text-brand-green">Dashboard</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {iniciales}
            </div>
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-semibold text-brand-ink">
                {usuario?.nombre || 'Tesorero'}
              </p>
              <small className="text-xs text-brand-muted">
                Tesorero · {nombreCooperativa}
              </small>
            </div>
          </div>
        </header>

        {/* Encabezados informativos */}
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-ink">
            Panel del tesorero
          </h2>
          <span className="text-sm text-brand-muted">
            Situación operativa de {nombreCooperativa}.
          </span>
        </div>

        {/* Banner Código Cooperativa */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#e3efed]/70 border border-brand-green/20 flex flex-col gap-0.5">
          <h3 className="text-base sm:text-lg font-serif font-bold text-brand-green">
            Código Cooperativa: <span className="font-mono">{datos.codigoCooperativa || '---'}</span>
          </h3>
          <span className="text-xs text-brand-muted">
            Comparte este código con tus socios para que puedan registrarse en tu cooperativa.
          </span>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-2xl text-xs sm:text-sm font-medium">
            {error}
          </div>
        )}

        {/* Bloque de 5 Tarjetas de Métricas (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Socios
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {cargando ? '...' : datos.socios}
            </div>
            <span className="text-[11px] text-brand-muted">Padrón total</span>
          </div>

          <div className="p-4 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Aportaciones Periodo
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-green my-1">
              {cargando ? '...' : formatearMoneda(datos.aportacionesPeriodo)}
            </div>
            <span className="text-[11px] text-brand-muted truncate">
              {cargando ? 'Cargando...' : datos.mesPeriodo || 'Sin periodo'}
            </span>
          </div>

          <div className="p-4 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Préstamos Activos
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {cargando ? '...' : datos.prestamosActivos}
            </div>
            <span className="text-[11px] text-brand-muted">En amortización</span>
          </div>

          <div className="p-4 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Total Recaudado
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
              {cargando ? '...' : formatearMoneda(datos.totalRecaudado)}
            </div>
            <span className="text-[11px] text-brand-muted">Fondo acumulado</span>
          </div>

          <div className="p-4 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Rendimientos
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-gold my-1">
              {cargando ? '...' : formatearMoneda(datos.rendimientosGenerados)}
            </div>
            <span className="text-[11px] text-brand-muted">Generados del ciclo</span>
          </div>
        </div>

        {/* Sección Dividida: Estado del Ciclo y Accesos Rápidos */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5 items-start">
          {/* Tarjeta: Estado del ciclo */}
          <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
            <div className="pb-2 border-b border-black/5">
              <p className="text-base sm:text-lg font-serif font-bold text-brand-ink">
                Estado del ciclo
              </p>
            </div>

            <div className="flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-black/10">
                <span className="text-brand-muted">Ciclo actual</span>
                <strong className="text-brand-ink">{cargando ? '...' : datos.cicloActual}</strong>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-black/10">
                <span className="text-brand-muted">Estado</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    datos.estadoCiclo === 'ACTIVO'
                      ? 'bg-brand-mist text-brand-green'
                      : 'bg-brand-sand text-[#6d5520]'
                  }`}
                >
                  {cargando ? '...' : datos.estadoCiclo}
                </span>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-black/10">
                <span className="text-brand-muted">Próximo periodo de aportación</span>
                <strong className="text-brand-ink">{cargando ? '...' : datos.proximoPeriodoAportacion}</strong>
              </div>

              <div className="flex justify-between items-center pb-2.5 border-b border-dashed border-black/10">
                <span className="text-brand-muted">Aportaciones pendientes</span>
                <strong className="text-brand-gold">
                  {cargando ? '...' : `${datos.aportacionesPendientes} socios`}
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-brand-muted">Préstamos pendientes de pago</span>
                <strong className="text-brand-ink">{cargando ? '...' : datos.prestamosPendientesPago}</strong>
              </div>
            </div>
          </section>

          {/* Tarjeta: Accesos rápidos */}
          <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
            <div className="pb-2 border-b border-black/5">
              <p className="text-base sm:text-lg font-serif font-bold text-brand-ink">
                Accesos rápidos
              </p>
            </div>

            <div className="flex flex-col gap-2.5 text-xs sm:text-sm">
              <button
                type="button"
                onClick={() => navigate('/tesorero/aportaciones')}
                className="w-full text-left p-3.5 rounded-2xl bg-[#f3eee6] hover:bg-[#e7ddd0] border border-[#e4dbd0] text-brand-ink font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-between"
              >
                <span>Registrar aportaciones</span>
                <span className="text-brand-muted">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/tesorero/prestamos')}
                className="w-full text-left p-3.5 rounded-2xl bg-[#f3eee6] hover:bg-[#e7ddd0] border border-[#e4dbd0] text-brand-ink font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-between"
              >
                <span>Gestionar préstamos y pagos</span>
                <span className="text-brand-muted">&rarr;</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/tesorero/cierre')}
                className="w-full text-left p-3.5 rounded-2xl bg-[#f3eee6] hover:bg-[#e7ddd0] border border-[#e4dbd0] text-brand-ink font-semibold transition-all hover:-translate-y-0.5 active:translate-y-0 shadow-sm flex items-center justify-between"
              >
                <span>Consultar cierre del ciclo</span>
                <span className="text-brand-muted">&rarr;</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}