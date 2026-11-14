import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoPrincipal from '../../assets/LOGO-APP.png';
import logoUnionMixteca from '../../assets/LOGO  UNIONSMSF.png';
import { apiFetch } from '../../services/api';

type ApiResponse = { mensaje?: string; id?: string; nombre?: string };

async function leerRespuesta(response: Response): Promise<ApiResponse> {
  const texto = await response.text();
  try {
    return texto ? (JSON.parse(texto) as ApiResponse) : {};
  } catch {
    return { mensaje: texto };
  }
}

export default function Register() {
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [celular, setCelular] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');
  const [cooperativa, setCooperativa] = useState<{ id: string; nombre: string } | null>(null);
  const [validandoCodigo, setValidandoCodigo] = useState(false);
  const [consentimientoArco, setConsentimientoArco] = useState(false);
  const [ine, setIne] = useState<File | null>(null);
  const [curp, setCurp] = useState<File | null>(null);
  const [comprobanteDomicilio, setComprobanteDomicilio] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const codigoNormalizado = codigo.trim().toUpperCase();
    if (!codigoNormalizado) {
      setCooperativa(null);
      return;
    }
    setValidandoCodigo(true);
    const espera = window.setTimeout(async () => {
      try {
        const respuesta = await apiFetch(`/api/auth/validar-codigo/${encodeURIComponent(codigoNormalizado)}`);
        const datos = await leerRespuesta(respuesta);
        setCooperativa(respuesta.ok && datos.id && datos.nombre ? { id: datos.id, nombre: datos.nombre } : null);
      } catch {
        setCooperativa(null);
      } finally {
        setValidandoCodigo(false);
      }
    }, 500);
    return () => window.clearTimeout(espera);
  }, [codigo]);

  const registrar = async (event: React.FormEvent) => {
    event.preventDefault();
    setMensaje('');
    if (!cooperativa || !consentimientoArco) {
      setMensaje('Verifica el código de cooperativa y acepta el consentimiento ARCO.');
      return;
    }
    if (!ine || !curp || !comprobanteDomicilio) {
      setMensaje('Adjunta INE, CURP y comprobante de domicilio para continuar.');
      return;
    }
    setCargando(true);
    try {
      const datosRegistro = new FormData();
      datosRegistro.append('nombreCompleto', nombreCompleto);
      datosRegistro.append('telefono', telefono);
      datosRegistro.append('celular', celular);
      datosRegistro.append('correo', correo);
      datosRegistro.append('password', password);
      datosRegistro.append('codigoCooperativa', codigo.trim().toUpperCase());
      datosRegistro.append('consentimientoArco', String(consentimientoArco));
      datosRegistro.append('ine', ine);
      datosRegistro.append('curp', curp);
      datosRegistro.append('comprobanteDomicilio', comprobanteDomicilio);

      const respuesta = await apiFetch('/api/auth/register', {
        method: 'POST',
        body: datosRegistro,
      });

      const datos = await leerRespuesta(respuesta);
      if (!respuesta.ok) throw new Error(datos.mensaje || 'No se pudo crear la cuenta.');
      setMensaje('Solicitud enviada. Tu cuenta quedará disponible cuando el Tesorero valide tus documentos.');
      window.setTimeout(() => navigate('/'), 2400);
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally {
      setCargando(false);
    }
  };

  const estadoCodigo = validandoCodigo
    ? 'Verificando código…'
    : cooperativa
    ? `✓ ${cooperativa.nombre}`
    : codigo
    ? 'Código no válido.'
    : '';

  return (
    <div className="auth-page">
      <div className="auth-logo-splash" aria-hidden="true">
        <img src={logoPrincipal} alt="" />
      </div>
      <main className="auth-layout auth-layout--register">
        <aside className="auth-brand-panel">
          <img src={logoPrincipal} alt="Tándem, Banca Ética" className="auth-brand-logo" />
          <img src={logoUnionMixteca} alt="Unión Mixteca" className="auth-partner-logo" />
          <span className="auth-gold-rule" />
          <p className="auth-brand-message">El valor de lo que<br /><em>construimos juntos.</em></p>
          <p className="auth-brand-copy">Tu solicitud será revisada por la tesorería antes de habilitar tu acceso.</p>
        </aside>

        <section className="auth-form-column auth-form-column--register" aria-labelledby="register-title">
          <p className="auth-eyebrow">Tu registro empieza aquí</p>
          <h1 id="register-title" className="auth-title">Únete a tu cooperativa</h1>
          <p className="auth-subtitle">Ingresa tus datos, el código de tu cooperativa y los documentos para solicitar tu acceso.</p>
          <div className="auth-card">
            {/* Tabs */}
            <div className="flex items-center p-1 rounded-full bg-[#f5f0e8] text-xs sm:text-sm">
              <Link
                to="/"
                className="flex-1 text-center py-2 sm:py-2.5 rounded-full font-medium text-[#8a8073] hover:text-brand-ink transition-colors"
              >
                Iniciar sesión
              </Link>
              <button
                type="button"
                className="flex-1 py-2 sm:py-2.5 rounded-full font-medium transition-colors bg-brand-green text-white shadow-sm"
              >
                Crear cuenta
              </button>
            </div>

            <form className="flex flex-col gap-3.5" onSubmit={registrar}>
              {/* Código Cooperativa */}
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Código de cooperativa</span>
                <input
                  value={codigo}
                  onChange={(event) => setCodigo(event.target.value.toUpperCase())}
                  placeholder="Ej. COOP-DAW12V"
                  disabled={cargando}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink uppercase placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
                {estadoCodigo && (
                  <span
                    className={`text-xs font-semibold mt-1 ${
                      validandoCodigo
                        ? 'text-gray-500'
                        : cooperativa
                        ? 'text-brand-green'
                        : 'text-red-600'
                    }`}
                  >
                    {estadoCodigo}
                  </span>
                )}
              </label>

              {/* Nombre Completo */}
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Nombre completo</span>
                <input
                  value={nombreCompleto}
                  onChange={(event) => setNombreCompleto(event.target.value)}
                  disabled={cargando}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              {/* Teléfono */}
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Teléfono</span>
                <input
                  type="tel"
                  value={telefono}
                  onChange={(event) => setTelefono(event.target.value)}
                  disabled={cargando}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              {/* Correo Electrónico */}
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Celular</span>
                <input
                  type="tel"
                  value={celular}
                  onChange={(event) => setCelular(event.target.value)}
                  disabled={cargando}
                  required
                  placeholder="Ej. 2221234567"
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              {/* Correo Electrónico */}
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Correo electrónico</span>
                <input
                  type="email"
                  value={correo}
                  onChange={(event) => setCorreo(event.target.value)}
                  disabled={cargando}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              {/* Contraseña */}
              <label className="flex flex-col gap-1.5 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Contraseña</span>
                <input
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={cargando}
                  required
                  className="w-full bg-transparent border-0 p-0 text-sm sm:text-base text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0 disabled:opacity-50"
                />
              </label>

              {/* Documentos Requeridos */}
              <div className="flex flex-col gap-3 p-3.5 sm:p-4 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs font-semibold text-brand-ink">Documentos requeridos (PDF o imagen)</span>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-brand-muted font-medium">INE</span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(event) => setIne(event.target.files?.[0] ?? null)}
                    disabled={cargando}
                    required
                    className="text-xs text-brand-ink file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-mist file:text-brand-ink hover:file:bg-[#d2e5e1] file:cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-brand-muted font-medium">CURP</span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(event) => setCurp(event.target.files?.[0] ?? null)}
                    disabled={cargando}
                    required
                    className="text-xs text-brand-ink file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-mist file:text-brand-ink hover:file:bg-[#d2e5e1] file:cursor-pointer"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs text-brand-muted font-medium">Comprobante de domicilio</span>
                  <input
                    type="file"
                    accept=".pdf,image/png,image/jpeg"
                    onChange={(event) => setComprobanteDomicilio(event.target.files?.[0] ?? null)}
                    disabled={cargando}
                    required
                    className="text-xs text-brand-ink file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-mist file:text-brand-ink hover:file:bg-[#d2e5e1] file:cursor-pointer"
                  />
                </label>
              </div>

              {/* Checkbox ARCO */}
              <label className="flex items-start gap-2.5 mt-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={consentimientoArco}
                  onChange={(event) => setConsentimientoArco(event.target.checked)}
                  disabled={cargando}
                  required
                  className="mt-0.5 rounded border-gray-300 text-brand-green focus:ring-brand-teal"
                />
                <span className="text-xs text-brand-ink font-medium leading-relaxed">
                  Acepto el tratamiento de mis datos personales (Derechos ARCO).
                </span>
              </label>

              {mensaje && (
                <p
                  className={`text-xs sm:text-sm font-medium px-1 ${
                    mensaje.startsWith('Solicitud') ? 'text-brand-green' : 'text-red-600'
                  }`}
                >
                  {mensaje}
                </p>
              )}

              <button
                type="submit"
                disabled={cargando || !cooperativa}
                className="auth-primary-button w-full mt-3 py-3 px-5 rounded-full font-semibold text-white transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {cargando ? 'Enviando solicitud…' : 'Enviar solicitud'}
              </button>
            </form>
          </div>
          <p className="auth-help-text">¿Ya tienes una cuenta? <Link to="/">Inicia sesión</Link></p>
        </section>
      </main>
    </div>
  );
}
