import { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import ModalNuevaCaja from '../../components/ModalNuevaCaja';

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return { mensaje: raw };
    }
  }

  return { mensaje: raw };
}

export default function Cajitas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cajitas, setCajitas] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const fetchCajitas = async () => {
    setCargando(true);
    setError('');
    try {
      const response = await apiFetch('/api/cajita');
      if (!response.ok) {
        throw new Error('Error al cargar las cajas');
      }
      const data = await readApiResponse(response);
      setCajitas(data);
    } catch (error) {
      console.error("Hubo un problema con el fetch:", error);
      setError('No pudimos cargar tus cajitas. Intenta de nuevo en unos momentos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    void fetchCajitas();
  }, []);

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col gap-6">
        {/* Topbar */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-brand-ink border-b-2 border-brand-green pb-1">
              Mis aportaciones
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
          >
            Crear caja de ahorro
          </button>
        </header>

        {/* Sección principal */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Ahorro personal</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Mis cajas de ahorro</h2>
            <span className="text-sm text-brand-muted">Organiza tus metas y consulta el avance de cada una.</span>
          </div>

          <section className="p-5 sm:p-6 rounded-[24px] bg-[#f8f3ec]/80 border border-[#367268]/15 shadow-sm">
            {cargando ? (
              <div className="min-h-[180px] flex items-center justify-center p-6 text-center rounded-2xl border border-dashed border-[#5b4e3d]/30 bg-white/50 text-sm text-brand-muted">
                Cargando tus cajitas…
              </div>
            ) : error ? (
              <div className="min-h-[180px] flex flex-col items-center justify-center gap-3 p-6 text-center rounded-2xl border border-dashed border-red-300 bg-red-50/50 text-sm text-red-600">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() => void fetchCajitas()}
                  className="px-4 py-2 rounded-full text-xs font-semibold bg-white border border-red-200 text-red-700 hover:bg-red-50 shadow-sm"
                >
                  Reintentar
                </button>
              </div>
            ) : cajitas.length === 0 ? (
              <div className="min-h-[220px] flex flex-col items-center justify-center gap-3 p-8 text-center rounded-2xl border border-dashed border-[#5b4e3d]/30 bg-white/45 text-brand-muted">
                <strong className="text-base text-brand-ink font-bold">Aún no tienes cajitas de ahorro.</strong>
                <p className="text-xs sm:text-sm max-w-sm">Crea una para separar una meta y seguir tu avance.</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="mt-1 py-2.5 px-5 rounded-full text-xs sm:text-sm font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md"
                >
                  Crear mi primera cajita
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cajitas.map((caja) => (
                  <article
                    key={caja.id}
                    className="p-5 rounded-[22px] bg-gradient-to-br from-[#fffdfa] to-[#f4ede2] border border-[#54402b]/15 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex flex-col gap-3 justify-between"
                  >
                    <div className="flex flex-col gap-2">
                      <span className="w-fit px-3 py-1 rounded-full text-[11px] font-bold bg-[#ebe4da] text-[#5d544a]">
                        Meta de ahorro
                      </span>
                      <h3 className="text-lg font-bold text-brand-ink">{caja.nombre}</h3>
                      <div className="text-xs sm:text-sm text-brand-ink/90 flex flex-col gap-1">
                        <p>
                          <span className="text-brand-muted font-medium">Meta: </span>
                          <strong className="font-bold">${caja.meta.toLocaleString()} MXN</strong>
                        </p>
                        <p>
                          <span className="text-brand-muted font-medium">Saldo Actual: </span>
                          <strong className="font-bold text-brand-green">${caja.saldoActual.toLocaleString()} MXN</strong>
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] text-brand-muted pt-2 border-t border-black/5">
                      Consulta los movimientos en tu historial financiero.
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </main>

      <ModalNuevaCaja 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          void fetchCajitas(); 
        }} 
      />
    </div>
  );
}