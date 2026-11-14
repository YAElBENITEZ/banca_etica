import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';

interface Comprobante {
  id: string;
  tipo: string;
  fecha: string;
  monto: number;
  concepto: string;
}

const moneda = (monto: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);

export default function MisComprobantes() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    void (async () => {
      setCargando(true);
      try {
        const respuesta = await apiFetch('/api/socio/comprobantes');
        const datos = (await respuesta.json()) as Comprobante[] & { mensaje?: string };
        if (!respuesta.ok) {
          setMensaje(datos.mensaje || 'No se pudieron cargar los comprobantes.');
          return;
        }
        setComprobantes(
          Array.isArray(datos)
            ? datos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            : []
        );
      } catch {
        setMensaje('Error de conexión al cargar tus comprobantes.');
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
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Mis documentos</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Comprobantes</h2>
          <span className="text-xs sm:text-sm text-brand-muted">
            Consulta el número de operación, fecha, concepto y monto de cada registro.
          </span>
        </div>

        {mensaje && (
          <p className="text-xs sm:text-sm font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
            {mensaje}
          </p>
        )}

        {/* Listado de Comprobantes */}
        <section className="p-5 sm:p-6 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-3">
          {cargando ? (
            <div className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              Cargando comprobantes emitidos...
            </div>
          ) : comprobantes.length === 0 ? (
            <p className="py-8 text-center text-xs sm:text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
              No hay comprobantes disponibles.
            </p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {comprobantes.map((comprobante) => (
                <div
                  key={comprobante.id}
                  className="p-4 rounded-2xl bg-[#f8f3ec] border border-black/5 hover:bg-[#efe7dc] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-brand-mist text-brand-ink">
                        {comprobante.tipo}
                      </span>
                      <strong className="text-brand-ink font-semibold">{comprobante.concepto}</strong>
                    </div>
                    <span className="text-brand-muted text-xs">
                      {new Date(comprobante.fecha).toLocaleDateString('es-MX')} · Operación{' '}
                      <code className="font-mono text-brand-ink font-bold">
                        {comprobante.id.slice(0, 8).toUpperCase()}
                      </code>
                    </span>
                  </div>

                  <strong className="text-brand-green font-bold text-sm sm:text-base self-start sm:self-center">
                    {moneda(comprobante.monto)}
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