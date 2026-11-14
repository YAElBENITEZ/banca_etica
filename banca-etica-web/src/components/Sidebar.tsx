import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoApp from '../assets/LOGO-APP.png';
import logoUnionPrueba from '../assets/LOGO  UNIONSMSF.png';

function obtenerRutaDashboard(rolEfectivo: string): string {
  switch (rolEfectivo) {
    case 'Gestor':
      return '/gestor/dashboard';
    case 'Tesorero':
      return '/tesorero/dashboard';
    case 'Socio':
    default:
      return '/dashboard';
  }
}

export default function Sidebar() {
  const navigate = useNavigate();

  const usuarioStored = localStorage.getItem('usuario');
  const usuario = usuarioStored ? JSON.parse(usuarioStored) : null;
  const userRolOriginal = usuario?.rol || 'Socio';
  const estatusSocio = (usuario?.estatus || 'ACTIVO').toUpperCase();

  const [rolActivo, setRolActivo] = useState<string>(() => {
    return localStorage.getItem('rolActivo') || userRolOriginal;
  });

  const [menuAbierto, setMenuAbierto] = useState(false);

  const tieneCooperativa = Boolean(usuario?.tieneCooperativa && usuario?.cooperativaId);
  const nombreCooperativa = usuario?.cooperativaNombre || '';

  const imagenCooperativaUrl = usuario?.cooperativaImagen
    ? `https://lh3.googleusercontent.com/d/${usuario.cooperativaImagen}`
    : logoUnionPrueba;

  const toggleModoTesorero = () => {
    const nuevoRol = rolActivo === 'Tesorero' ? 'Socio' : 'Tesorero';
    setRolActivo(nuevoRol);
    localStorage.setItem('rolActivo', nuevoRol);

    const nuevaRuta = nuevoRol === 'Tesorero' ? '/tesorero/dashboard' : '/dashboard';
    navigate(nuevaRuta);
    setMenuAbierto(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('rolActivo');
    navigate('/', { replace: true });
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block px-3.5 py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
      isActive
        ? 'bg-brand-green text-white shadow-sm translate-x-0.5'
        : 'text-[#5f584f] hover:bg-black/5 hover:text-brand-ink hover:translate-x-0.5'
    }`;

  return (
    <>
      {/* Botón flotante para dispositivos móviles */}
      <button
        type="button"
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuAbierto}
        onClick={() => setMenuAbierto((abierto) => !abierto)}
        className="md:hidden fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/95 border border-black/10 shadow-lg text-xs font-bold text-brand-ink"
      >
        <span className="flex flex-col gap-1 w-4">
          <span className="block h-0.5 bg-brand-ink rounded-full" />
          <span className="block h-0.5 bg-brand-ink rounded-full" />
          <span className="block h-0.5 bg-brand-ink rounded-full" />
        </span>
        Menú
      </button>

      {/* Backdrop en dispositivos móviles */}
      {menuAbierto && (
        <div
          role="button"
          aria-label="Cerrar menú"
          onClick={() => setMenuAbierto(false)}
          className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-xs"
        />
      )}

      {/* Panel lateral / Drawer */}
      <aside
        className={`fixed md:static top-0 bottom-0 left-0 z-45 md:z-auto w-[82vw] max-w-[320px] md:w-full h-full p-4 sm:p-5 rounded-r-[28px] md:rounded-[28px] bg-[#faf8f4] md:bg-white/80 md:backdrop-blur-xl border-r md:border border-black/5 shadow-2xl md:shadow-xl flex flex-col justify-between overflow-hidden transition-transform duration-300 ease-in-out ${
          menuAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col gap-4 overflow-hidden">
          {/* Marcas / Logos */}
          <div className="flex flex-col items-center justify-center gap-2 pt-10 md:pt-2 pb-2 shrink-0 border-b border-black/5">
            <div className="w-full flex justify-center py-1">
              <img src={logoApp} alt="Tándem" className="w-full max-w-[170px] h-auto object-contain" />
            </div>

            {tieneCooperativa && (
              <div className="w-full flex justify-center py-1">
                <img
                  src={imagenCooperativaUrl}
                  alt={nombreCooperativa || 'Cooperativa'}
                  className="w-full max-w-[150px] h-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = logoUnionPrueba;
                  }}
                />
              </div>
            )}
          </div>

          {/* Menú de Navegación con scroll propio */}
          <nav
            onClick={() => setMenuAbierto(false)}
            className="flex flex-col gap-1.5 overflow-y-auto pr-1"
          >
            {/* {rolActivo !== 'Gestor' && estatusSocio === 'ACTIVO' && ( */}
            {estatusSocio === 'ACTIVO' && (
              <>
                <div className="flex items-center gap-2 my-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                  <span className="w-2 h-px bg-brand-gold/40" />
                  <span>Principal</span>
                  <span className="flex-1 h-px bg-brand-gold/20" />
                </div>
                <NavLink to={obtenerRutaDashboard(rolActivo)} className={navLinkClass}>
                  Inicio
                </NavLink>
              </>
            )}

            {rolActivo === 'Gestor' && (
              <>
                <div className="flex items-center gap-2 my-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                  <span className="w-2 h-px bg-brand-gold/40" />
                  <span>Gestión</span>
                  <span className="flex-1 h-px bg-brand-gold/20" />
                </div>
                <NavLink to="/gestor/cooperativas" className={navLinkClass}>
                  Cooperativas
                </NavLink>
              </>
            )}

            {rolActivo === 'Socio' && estatusSocio === 'ACTIVO' && (
              <>
                <div className="flex items-center gap-2 my-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                  <span className="w-2 h-px bg-brand-gold/40" />
                  <span>Mis Movimientos</span>
                  <span className="flex-1 h-px bg-brand-gold/20" />
                </div>
                <NavLink to="/mis-prestamos" className={navLinkClass}>
                  Mis Préstamos
                </NavLink>
                <NavLink to="/mi-historial" className={navLinkClass}>
                  Mi Historial
                </NavLink>
                <NavLink to="/mi-resumen-financiero" className={navLinkClass}>
                  Mi resumen financiero
                </NavLink>
                <NavLink to="/mis-comprobantes" className={navLinkClass}>
                  Mis comprobantes
                </NavLink>
                <NavLink to="/mi-cierre" className={navLinkClass}>
                  Cierre del ciclo
                </NavLink>
              </>
            )}

            {rolActivo === 'Tesorero' && (
              <>
                <div className="flex items-center gap-2 my-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                  <span className="w-2 h-px bg-brand-gold/40" />
                  <span>Gestión Comunidad</span>
                  <span className="flex-1 h-px bg-brand-gold/20" />
                </div>
                <NavLink to="/tesorero/aportaciones" className={navLinkClass}>
                  Aportaciones
                </NavLink>
                <NavLink to="/tesorero/prestamos" className={navLinkClass}>
                  Préstamos
                </NavLink>
                <NavLink to="/tesorero/resumen-financiero" className={navLinkClass}>
                  Resumen financiero
                </NavLink>
                <NavLink to="/tesorero/cierre" className={navLinkClass}>
                  Cierre del ciclo
                </NavLink>
                <NavLink to="/tesorero/comunidad" className={navLinkClass}>
                  Comunidad
                </NavLink>
              </>
            )}

            <div className="flex items-center gap-2 my-2 text-[10px] font-bold uppercase tracking-wider text-brand-gold">
              <span className="w-2 h-px bg-brand-gold/40" />
              <span>Mi Información</span>
              <span className="flex-1 h-px bg-brand-gold/20" />
            </div>
            <NavLink to="/mi-perfil" className={navLinkClass}>
              Mi Perfil
            </NavLink>
          </nav>
        </div>

        {/* Tarjeta inferior con rol, conmutador y logout */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-b from-[#1f1f1f] to-[#0f0f0f] text-[#f8f5ef] shadow-md flex flex-col gap-2 shrink-0 mt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">
              {userRolOriginal === 'Tesorero' ? `Modo: ${rolActivo}` : userRolOriginal}
            </p>
            <strong className="text-xs sm:text-sm font-semibold text-white block truncate">
              {usuario?.nombre || 'Usuario'}
            </strong>
          </div>

          {userRolOriginal === 'Tesorero' && (
            <button
              type="button"
              onClick={toggleModoTesorero}
              className={`w-full py-1.5 px-3 rounded-full text-xs font-semibold border transition-all ${
                rolActivo === 'Socio'
                  ? 'bg-brand-green border-brand-green text-white hover:bg-brand-teal'
                  : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
              }`}
            >
              {rolActivo === 'Tesorero' ? '🔄 Cambiar a Modo Socio' : '🔄 Volver a Modo Tesorero'}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMenuAbierto(false);
              handleLogout();
            }}
            className="w-full py-1.5 px-3 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  );
}