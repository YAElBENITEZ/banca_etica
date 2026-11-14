import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Resumen {
  totalAportado: number;
  numeroAportaciones: number;
  totalPrestamosOtorgados: number;
  totalPagadoPrestamos: number;
  saldoPrestamosPendiente: number;
  interesesPagados: number;
  multasPagadas: number;
  mensaje?: string;
}

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function MiResumenFinanciero() {
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      setCargando(true);
      try {
        const respuesta = await apiFetch('/api/socio/resumen-financiero');
        const datos = (await respuesta.json()) as Resumen;
        if (!respuesta.ok) {
          setMensaje(datos.mensaje || 'No se pudo cargar tu resumen.');
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

  const tarjetas: [string, number, boolean?][] = resumen
    ? [
        ['Total aportado', resumen.totalAportado],
        ['Aportaciones registradas', resumen.numeroAportaciones, true],
        ['Préstamos otorgados', resumen.totalPrestamosOtorgados],
        ['Total pagado', resumen.totalPagadoPrestamos],
        ['Saldo pendiente', resumen.saldoPrestamosPendiente],
        ['Intereses pagados', resumen.interesesPagados],
        ['Multas pagadas', resumen.multasPagadas],
      ]
    : [];

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Mi situación financiera</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Mi resumen financiero</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Información consolidada de tus operaciones registradas.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {mensaje}
          </p>
        )}

        {cargando ? (
          <div className="min-h-[200px] flex items-center justify-center p-6 text-center rounded-2xl border border-dashed border-[#5b4e3d]/30 bg-white/50 text-sm text-brand-muted">
            Cargando indicadores financieros...
          </div>
        ) : !resumen ? (
          <p className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
            No se encontró información disponible.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tarjetas.map(([titulo, valor, entero]) => (
              <section
                key={titulo}
                className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between"
              >
                <p className="text-xs font-semibold text-brand-muted">{titulo}</p>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                  {entero ? valor : moneda(valor)}
                </strong>
                <small className="text-[11px] text-brand-muted">Registro consolidado</small>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}