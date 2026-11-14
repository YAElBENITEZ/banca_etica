import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoPrincipal from '../../assets/LOGO-APP.png';
import logoUnionMixteca from '../../assets/LOGO  UNIONSMSF.png';
import { apiFetch } from '../../services/api';

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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');

  const navigate = useNavigate();

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');

    if (!email || !password) {
      setErrorMensaje('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          correo: email,
          password: password,
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem(
        'usuario',
        JSON.stringify({
          id: data.usuario.id,
          nombre: data.usuario.nombre,
          correo: data.usuario.correo,
          rol: data.usuario.rol,
          estatus: data.usuario.estatus,
          tieneCooperativa: Boolean(data.usuario.tieneCooperativa),
          cooperativaId: data.usuario.cooperativaId || null,
          cooperativaNombre: data.usuario.cooperativaNombre || null,
          cooperativaImagen: data.usuario.cooperativaImagen || null,
        })
      );

      if (data.usuario.rol === 'Gestor') {
        navigate('/gestor/cooperativas', { replace: true });
      } else if (data.usuario.rol === 'Tesorero') {
        navigate('/tesorero/dashboard', { replace: true });
      } else if (data.usuario.rol === 'Socio') {
        if (data.usuario.estatus === 'PENDIENTE') {
          navigate('/socio/en-espera', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setErrorMensaje('Rol de usuario no reconocido.');
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
      }
    } catch (error: any) {
      setErrorMensaje(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-logo-splash" aria-hidden="true">
        <img src={logoPrincipal} alt="" />
      </div>
      <main className="auth-layout">
        <aside className="auth-brand-panel">
          <img src={logoPrincipal} alt="Tándem, Banca Ética" className="auth-brand-logo" />
          <img src={logoUnionMixteca} alt="Unión Mixteca" className="auth-partner-logo" />
          <span className="auth-gold-rule" />
          <p className="auth-brand-message">El valor de lo que<br /><em>construimos juntos.</em></p>
          <p className="auth-brand-copy">Una herramienta clara y segura para fortalecer el trabajo de las cooperativas.</p>
        </aside>

        <section className="auth-form-column" aria-labelledby="login-title">
          <p className="auth-eyebrow">Bienvenido a Tándem</p>
          <h1 id="login-title" className="auth-title">Acceso a tu cooperativa</h1>
          <p className="auth-subtitle">Consulta tus movimientos, registros y la información de tu cooperativa en un mismo lugar.</p>
          <div className="auth-card">
            {/* Tabs */}
            <div className="flex items-center p-1 rounded-full bg-[#f5f0e8] text-xs sm:text-sm">
              <button
                type="button"
                className="flex-1 py-2 sm:py-2.5 rounded-full font-medium transition-colors bg-brand-green text-white shadow-sm"
              >
                Iniciar sesión
              </button>
              <Link
                to="/registro"
                className="flex-1 text-center py-2 sm:py-2.5 rounded-full font-medium text-[#8a8073] hover:text-brand-ink transition-colors"
              >
                Crear cuenta de socio
              </Link>
            </div>

            <form className="flex flex-col gap-3.5" onSubmit={handleLoginSubmit}>
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Correo electrónico</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="gestor@bancaetica.com"
                  disabled={isLoading}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Contraseña</span>
                <div className="flex items-center gap-2">
                  <input
                    type={mostrarPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={isLoading}
                    required
                    className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPassword((visible) => !visible)}
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="shrink-0 px-2 py-1 rounded-md text-xs font-bold text-[#50473e] hover:bg-[#e8ded2] transition-colors"
                  >
                    {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </label>

              {errorMensaje && (
                <div className="text-xs sm:text-sm text-red-600 font-medium px-1">
                  {errorMensaje}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="auth-primary-button w-full mt-3 py-3 px-5 rounded-full font-semibold text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
          <p className="auth-help-text">¿Aún no tienes cuenta? <Link to="/registro">Regístrate como socio</Link></p>
        </section>
      </main>
    </div>
  );
}
