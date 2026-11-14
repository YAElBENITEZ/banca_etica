import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';

interface CooperativaResumen {
  id: string;
  nombre: string;
  fechaCreacion: string;
  activa: boolean;
  tesorero: string | null;
  totalSocios: number;
  tieneCicloConfigurado: boolean;
}

interface MetricasDashboard {
  cooperativasTotales: number;
  usuariosCooperativasTotales: number;
  usuariosTesorerosTotales: number;
  cooperativasConfCompletas: number;
  cooperativasConfPend: number;
}

interface DashboardResponse {
  metricas: MetricasDashboard;
  paginacion: {
    paginaActual: number;
    tamanoPagina: number;
    totalRegistros: number;
    totalPaginas: number;
    datos: CooperativaResumen[];
  };
}

export default function GestorDashboard() {
  const navigate = useNavigate();
  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;

  const [metricas, setMetricas] = useState<MetricasDashboard>({
    cooperativasTotales: 0,
    usuariosCooperativasTotales: 0,
    usuariosTesorerosTotales: 0,
    cooperativasConfCompletas: 0,
    cooperativasConfPend: 0,
  });

  const [cooperativas, setCooperativas] = useState<CooperativaResumen[]>([]);
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [cargando, setCargando] = useState(true);

  const cargarDashboard = async (pagina = 1) => {
    setCargando(true);
    try {
      const response = await apiFetch(`/api/gestor/dashboard?pagina=${pagina}&tamano=10`);
      if (response.ok) {
        const data = (await response.json()) as DashboardResponse;
        setMetricas(data.metricas);
        setCooperativas(data.paginacion.datos);
        setPaginaActual(data.paginacion.paginaActual);
        setTotalPaginas(data.paginacion.totalPaginas);
      }
    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void cargarDashboard(1);
  }, []);

  const iniciales = usuario?.nombre
    ? usuario.nombre
        .split(' ')
        .map((p: string) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'GC';

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Topbar del Dashboard */}
        <header className="flex items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-brand-ink">Dashboard</h1>
            <span className="text-xs text-brand-muted">
              Gestor &gt; <strong className="text-brand-green">Dashboard</strong>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-green text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm">
              {iniciales}
            </div>
            <div className="text-right leading-tight hidden sm:block">
              <p className="text-sm font-semibold text-brand-ink">
                {usuario?.nombre || 'Gestor de Cooperativas'}
              </p>
              <small className="text-xs text-brand-muted">Gestor de Cooperativas</small>
            </div>
          </div>
        </header>

        {/* Título y subtítulo */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-brand-ink">
            Panel general
          </h2>
          <span className="text-sm text-brand-muted">
            Vista consolidada de las cooperativas que administras.
          </span>
        </div>

        {/* Tarjetas de Métricas (KPIs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Cooperativas
            </span>
            <div className="text-3xl font-extrabold text-brand-ink my-1">
              {metricas.cooperativasTotales}
            </div>
            <span className="text-xs text-brand-muted">
              {metricas.cooperativasConfCompletas} configuradas
            </span>
          </div>

          <div className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Socios Registrados
            </span>
            <div className="text-3xl font-extrabold text-brand-ink my-1">
              {metricas.usuariosCooperativasTotales}
            </div>
            <span className="text-xs text-brand-muted">En todas las cooperativas</span>
          </div>

          <div className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-muted">
              Tesoreros Designados
            </span>
            <div className="text-3xl font-extrabold text-brand-ink my-1">
              {metricas.usuariosTesorerosTotales}
            </div>
            <span className="text-xs text-brand-muted">
              De {metricas.cooperativasTotales} cooperativas
            </span>
          </div>

          <div className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-brand-gold">
              Pendientes de Configuración
            </span>
            <div className="text-3xl font-extrabold text-brand-gold my-1">
              {metricas.cooperativasConfPend}
            </div>
            <span className="text-xs font-semibold text-brand-gold">
              {metricas.cooperativasConfPend > 0 ? 'Requiere atención' : 'Al día'}
            </span>
          </div>
        </div>

        {/* Tabla Paginada */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-serif font-bold text-brand-ink">
              Cooperativas recientes
            </h3>
            <Link
              to="/gestor/cooperativas"
              className="text-xs sm:text-sm font-semibold text-brand-green hover:text-brand-teal transition-colors"
            >
              Ver todas &rarr;
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-black/5 text-[11px] uppercase tracking-wider text-brand-muted">
                  <th className="py-3 px-3 font-bold">Cooperativa</th>
                  <th className="py-3 px-3 font-bold">Socios</th>
                  <th className="py-3 px-3 font-bold">Tesorero</th>
                  <th className="py-3 px-3 font-bold">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {cargando ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-brand-muted">
                      Cargando información consolidada...
                    </td>
                  </tr>
                ) : cooperativas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-sm text-brand-muted">
                      No tienes cooperativas registradas todavía.
                    </td>
                  </tr>
                ) : (
                  cooperativas.map((coop) => (
                    <tr
                      key={coop.id}
                      onClick={() => navigate('/gestor/cooperativas')}
                      className="cursor-pointer hover:bg-black/[0.02] transition-colors"
                    >
                      <td className="py-3.5 px-3 font-semibold text-brand-ink">{coop.nombre}</td>
                      <td className="py-3.5 px-3 text-brand-muted">{coop.totalSocios}</td>
                      <td className="py-3.5 px-3 text-brand-muted">{coop.tesorero || 'Pendiente'}</td>
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                            coop.tieneCicloConfigurado
                              ? 'bg-brand-mist text-brand-green'
                              : 'bg-brand-sand text-[#6d5520]'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              coop.tieneCicloConfigurado ? 'bg-brand-green' : 'bg-brand-gold'
                            }`}
                          />
                          {coop.tieneCicloConfigurado ? 'CONFIGURADA' : 'PENDIENTE'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Barra de Paginación */}
          {totalPaginas > 1 && (
            <div className="flex justify-end items-center gap-3 pt-3 border-t border-black/5 text-xs sm:text-sm">
              <button
                type="button"
                disabled={paginaActual <= 1 || cargando}
                onClick={() => void cargarDashboard(paginaActual - 1)}
                className="px-3.5 py-1.5 rounded-full font-medium bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Anterior
              </button>
              <span className="text-brand-muted">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                type="button"
                disabled={paginaActual >= totalPaginas || cargando}
                onClick={() => void cargarDashboard(paginaActual + 1)}
                className="px-3.5 py-1.5 rounded-full font-medium bg-brand-mist text-brand-ink hover:bg-[#d2e5e1] transition-all disabled:opacity-40 disabled:pointer-events-none"
              >
                Siguiente
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}