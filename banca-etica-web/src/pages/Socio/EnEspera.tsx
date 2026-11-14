import Sidebar from '../../components/Sidebar';

export default function EnEspera() {
  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />

      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl flex flex-col justify-between">
        <header className="pb-4 border-b border-black/5">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Estado de afiliación</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-brand-ink">En espera</h1>
        </header>

        {/* Tarjeta central informativa */}
        <section className="my-auto mx-auto w-full max-w-lg p-6 sm:p-8 rounded-[28px] bg-[#f8f3ec]/90 border border-[#367268]/20 shadow-lg text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-brand-sand text-brand-gold flex items-center justify-center text-2xl font-bold shadow-inner">
            ⏳
          </div>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-ink">
              Tu cuenta está en revisión
            </h2>
            <p className="text-xs sm:text-sm text-brand-muted leading-relaxed">
              El Tesorero de tu cooperativa está validando tus documentos de registro. Te notificaremos en cuanto el acceso a tus aportaciones y préstamos quede autorizado.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f5edda] text-[#755b25]">
            <span className="w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
            Pendiente de validación documental
          </span>
        </section>

        <footer className="text-center text-xs text-brand-muted py-2 border-t border-black/5">
          Si requieres agilizar el proceso, contacta directamente al comité de tu cooperativa.
        </footer>
      </main>
    </div>
  );
}