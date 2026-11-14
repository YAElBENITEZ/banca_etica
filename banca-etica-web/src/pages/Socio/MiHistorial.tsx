import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Operacion {
  tipo: string;
  fecha: string;
  monto: number;
  detalle: string;
}

const moneda = (monto: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

export default function MiHistorial() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [filtro, setFiltro] = useState('Todas');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      setCargando(true);
      try {
        const respuesta = await apiFetch('/api/socio/historial');
        const datos = (await respuesta.json()) as Operacion[] & { mensaje?: string };
        if (!respuesta.ok) {
          setMensaje(datos.mensaje || 'No se pudo cargar tu historial.');
          return;
        }
        setOperaciones(Array.isArray(datos) ? datos : []);
      } catch {
        setMensaje('Error de conexión al obtener tu historial.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const visibles = useMemo(
    () => (filtro === 'Todas' ? operaciones : operaciones.filter((operacion) => operacion.tipo === filtro)),
    [filtro, operaciones]
  );

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Mi cooperativa</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Mi historial financiero</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Consulta las operaciones registradas por Tesorería.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {mensaje}
          </p>
        )}

        {/* Barra de Filtros */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs sm:text-sm">
          {['Todas', 'Aportación', 'Préstamo', 'Pago'].map((tipo) => {
            const etiqueta = tipo === 'Todas' ? 'Todas' : `${tipo}s`;
            const activo = filtro === tipo;
            return (
              <button
                key={tipo}
                type="button"
                onClick={() => setFiltro(tipo)}
                className={`px-4 py-2 rounded-full font-medium transition-all ${
                  activo
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'bg-[#f5f0e8] text-[#8a8073] hover:text-brand-ink hover:bg-[#eadecc]'
                }`}
              >
                {etiqueta}
              </button>
            );
          })}
        </div>

        {/* Listado de Operaciones */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-3">
          {cargando ? (
            <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              Cargando historial de movimientos...
            </div>
          ) : visibles.length === 0 ? (
            <p className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              No hay operaciones registradas para este filtro.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {visibles.map((operacion, indice) => (
                <div
                  key={`${operacion.tipo}-${operacion.fecha}-${indice}`}
                  className="p-4 rounded-2xl bg-[#f8f3ec] border border-black/5 hover:bg-[#efe7dc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs sm:text-sm"
                >
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-brand-ink font-bold">{operacion.tipo}</strong>
                    <span className="text-brand-muted">
                      {operacion.detalle} · {new Date(operacion.fecha).toLocaleDateString('es-MX')}
                    </span>
                  </div>
                  <strong className="text-brand-green font-bold text-sm sm:text-base">
                    {moneda(operacion.monto)}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}