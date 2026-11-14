import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Periodo {
  inicio: string;
  etiqueta: string;
}

interface Socio {
  id: string;
  nombre: string;
  monto: number | null;
}

interface Bitacora {
  socios: Socio[];
  totalRecaudado: number;
  registrados: number;
  pendientes: number;
}

const moneda = (valor: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(valor);

export default function AportacionesTesorero() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodo, setPeriodo] = useState('');
  const [bitacora, setBitacora] = useState<Bitacora | null>(null);
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarBitacora = async (inicio: string) => {
    if (!inicio) return;
    setCargando(true);
    try {
      const response = await apiFetch(`/api/tesorero/aportaciones/bitacora?inicio=${encodeURIComponent(inicio)}`);
      const data = (await response.json()) as Bitacora & { mensaje?: string };
      if (!response.ok) {
        setMensaje(data.mensaje || 'No se pudo cargar la bitácora.');
        return;
      }
      setBitacora(data);
      setMontos(Object.fromEntries(data.socios.map((socio) => [socio.id, socio.monto?.toString() || ''])));
    } catch {
      setMensaje('Error de conexión al cargar la bitácora.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void (async () => {
      try {
        const response = await apiFetch('/api/tesorero/aportaciones/periodos');
        const data = (await response.json()) as Periodo[] & { mensaje?: string };
        if (!response.ok) {
          setMensaje(data.mensaje || 'No se pudieron cargar los periodos.');
          return;
        }
        setPeriodos(data);
        if (data.length) {
          setPeriodo(data[0].inicio);
          await cargarBitacora(data[0].inicio);
        }
      } catch {
        setMensaje('Error al obtener la lista de periodos.');
      }
    })();
  }, []);

  const registrar = async (event: FormEvent, socioId: string) => {
    event.preventDefault();
    const monto = Number(montos[socioId]);
    if (isNaN(monto) || monto <= 0) {
      setMensaje('Ingresa un monto válido.');
      return;
    }
    const response = await apiFetch('/api/tesorero/aportaciones', {
      method: 'POST',
      body: JSON.stringify({ socioId, inicioPeriodo: periodo, monto }),
    });
    const data = (await response.json()) as { mensaje?: string };
    setMensaje(data.mensaje || (response.ok ? 'Aportación registrada.' : 'No se pudo registrar.'));
    if (response.ok) await cargarBitacora(periodo);
  };

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Cabecera */}
        <div className="flex flex-col gap-1 pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Operación diaria</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Aportaciones</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Registra las aportaciones reales de cada Socio para el periodo seleccionado.
          </span>
        </div>

        {/* Selector de Periodo */}
        <div className="w-full max-w-md">
          <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
            <span className="text-xs font-medium text-brand-muted">Periodo operativo</span>
            <select
              value={periodo}
              onChange={(event) => {
                setPeriodo(event.target.value);
                void cargarBitacora(event.target.value);
              }}
              className="w-full bg-transparent border-0 p-0 text-sm sm:text-base font-semibold text-brand-ink focus:outline-none focus:ring-0"
            >
              <option value="">Selecciona un periodo</option>
              {periodos.map((item) => (
                <option key={item.inicio} value={item.inicio}>
                  {item.etiqueta}
                </option>
              ))}
            </select>
          </label>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-[#755b25] bg-[#f5edda] p-3 rounded-2xl border border-brand-gold/20">
            {mensaje}
          </p>
        )}

        {/* Resumen numérico y bitácora */}
        {bitacora && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Total recaudado</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-green my-1">
                  {moneda(bitacora.totalRecaudado)}
                </strong>
                <small className="text-[11px] text-brand-muted">Aportaciones del periodo</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-muted">Socios registrados</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-ink my-1">
                  {bitacora.registrados}
                </strong>
                <small className="text-[11px] text-brand-muted">Cuotas pagadas</small>
              </section>

              <section className="p-5 rounded-[22px] bg-gradient-to-b from-[#f8f3ec]/90 to-white/90 border border-[#367268]/15 shadow-sm flex flex-col justify-between">
                <span className="text-xs font-semibold text-brand-gold">Pendientes</span>
                <strong className="text-2xl sm:text-3xl font-extrabold text-brand-gold my-1">
                  {bitacora.pendientes}
                </strong>
                <small className="text-[11px] text-brand-muted">Por cumplir en el periodo</small>
              </section>
            </div>

            {/* Listado Bitácora */}
            <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-base font-bold text-brand-ink">Bitácora del periodo</p>
                  <span className="text-xs text-brand-muted">
                    Una aportación por Socio. Las reglas de monto se validan al guardar.
                  </span>
                </div>
                {cargando && <span className="text-xs text-brand-muted animate-pulse">Actualizando...</span>}
              </div>

              <div className="flex flex-col gap-2.5">
                {bitacora.socios.map((socio) => (
                  <form
                    key={socio.id}
                    onSubmit={(event) => void registrar(event, socio.id)}
                    className="p-3.5 sm:p-4 rounded-2xl bg-[#f8f3ec] border border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                  >
                    <strong className="text-brand-ink font-bold text-sm sm:text-base">
                      {socio.nombre}
                    </strong>

                    {socio.monto !== null ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-brand-mist text-brand-green">
                        ✓ {moneda(socio.monto)} registrado
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder="Monto ($)"
                          value={montos[socio.id] || ''}
                          onChange={(event) =>
                            setMontos({ ...montos, [socio.id]: event.target.value })
                          }
                          className="w-32 px-3 py-1.5 rounded-xl bg-white border border-black/10 text-xs sm:text-sm text-brand-ink focus:outline-none focus:border-brand-teal"
                        />
                        <button
                          type="submit"
                          className="py-1.5 px-4 rounded-full text-xs font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-sm"
                        >
                          Registrar
                        </button>
                      </div>
                    )}
                  </form>
                ))}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}