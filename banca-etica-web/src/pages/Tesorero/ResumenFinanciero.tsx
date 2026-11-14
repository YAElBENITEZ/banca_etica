import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Resumen {
  totalAportaciones: number;
  totalPrestamosOtorgados: number;
  totalPagosRecibidos: number;
  interesesCobrados: number;
  multasCobradas: number;
  saldoPrestamosPendiente: number;
  totalRecaudado: number;
  ultimoRendimientoGenerado: number;
  fechaUltimoCierre: string | null;
  mensaje?: string;
}

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function ResumenFinanciero() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      setCargando(true);
      try {
        const respuesta = await apiFetch('/api/tesorero/resumen-financiero');
        const datos = (await respuesta.json()) as Resumen;
        if (!respuesta.ok) {
          setMensaje(datos.mensaje || 'No se pudo cargar el resumen.');
          return;
        }
        setResumen(datos);
      } catch {
        setMensaje('Error de conexión al cargar el resumen.');
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const tarjetas: [string, number][] = resumen
    ? [
        ['Aportaciones recaudadas', resumen.totalAportaciones],
        ['Préstamos otorgados', resumen.totalPrestamosOtorgados],
        ['Pagos recibidos', resumen.totalPagosRecibidos],
        ['Saldo de préstamos', resumen.saldoPrestamosPendiente],
        ['Intereses cobrados', resumen.interesesCobrados],
        ['Multas cobradas', resumen.multasCobradas],
        ['Total recaudado', resumen.totalRecaudado],
        ['Rendimiento del último cierre', resumen.ultimoRendimientoGenerado],
      ]
    : [];

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Estado de la cooperativa</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Resumen financiero</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Concentrado de las operaciones registradas hasta este momento.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {mensaje}
          </p>
        )}

        {cargando ? (
          <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
            Cargando indicadores financieros...
          </div>
        ) : !resumen ? (
          <p className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
            No se encontró información disponible.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tarjetas.map(([titulo, monto]) => (
                <section
                  key={titulo}
                  className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between"
                >
                  <p className="text-xs font-semibold text-brand-muted">{titulo}</p>
                  <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                    {moneda(monto)}
                  </strong>
                  <small className="text-[11px] text-brand-muted">Registro consolidado</small>
                </section>
              ))}
            </div>

            {resumen.fechaUltimoCierre && (
              <div className="p-4 rounded-2xl bg-brand-sand/50 border border-brand-gold/20 flex items-center gap-2">
                <span className="text-xs font-bold text-brand-gold uppercase tracking-wider">
                  Último cierre registrado:
                </span>
                <span className="text-xs font-semibold text-[#6d5520]">
                  {new Date(resumen.fechaUltimoCierre).toLocaleDateString('es-MX')}
                </span>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}