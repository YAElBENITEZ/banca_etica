import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../App.css';

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

export default function Register() {
  // 1. Estados que coinciden exactamente con nuestro DTO en C#
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  
  const [cooperativas, setCooperativas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [cooperativaId, setCooperativaId] = useState('');

  // Estados de interfaz
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const cargarCooperativas = async () => {
      try {
        const response = await fetch('/api/auth/cooperativas');
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.mensaje || 'No se pudieron cargar las cooperativas.');
        setCooperativas(data as Array<{ id: string; nombre: string }>);
      } catch (error) {
        setErrorMensaje(error instanceof Error ? error.message : 'No se pudieron cargar las cooperativas.');
      }
    };

    void cargarCooperativas();
  }, []);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');

    // Validación básica front-end
    if (!nombreCompleto || !telefono || !correo || !password || !cooperativaId) {
      setErrorMensaje('Todos los campos y la cooperativa son obligatorios.');
      return;
    }

    setIsLoading(true);

    try {
      // 2. Apuntamos al endpoint que acabas de crear en C#
      // Recuerda verificar si tu puerto es el 7100 u otro
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombreCompleto,
          telefono,
          correo,
          password,
          cooperativaId
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al registrar el usuario');
      }

      // 3. ¡Éxito! Mandamos al usuario a iniciar sesión
      console.log('Usuario y Cajita creados:', data);
      alert('Registro exitoso. Tu cajita de ahorro ha sido creada.');
      navigate('/'); // Lo regresamos al login

    } catch (error) {
      setErrorMensaje(error instanceof Error ? error.message : 'No se pudo crear la cuenta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-shell">
      <section className="landing-panel auth-stage">
        
        <header className="landing-topbar">
          <div className="brand">
            <div className="brand-mark"><span /><span /><span /></div>
            <div>
              <p>MezcalPay</p>
              <small>Registro de comunidad</small>
            </div>
          </div>
        </header>

        <div className="auth-layout">
          <div className="auth-copy">
            <span className="soft-badge">Nuevo Ingreso</span>
            <h2 className="auth-title">Únete a la cooperativa</h2>
            <p className="auth-description">
              Crea tu perfil. Al registrarte, el sistema generará automáticamente tu cajita de ahorro individual para que comiences a operar.
            </p>
          </div>

          <div className="auth-card">
            <div className="auth-tabs">
              {/* Usamos Link de React Router para navegar sin recargar la página */}
              <Link to="/" className="ghost-link" style={{ padding: '10px 14px', textDecoration: 'none' }}>Iniciar sesión</Link>
              <button className="active" type="button">Registrarse</button>
            </div>

            <form className="auth-fields" onSubmit={handleRegisterSubmit}>
              
              <label className="field-card">
                <span>Nombre completo</span>
                <input 
                  type="text" 
                  value={nombreCompleto} onChange={(e) => setNombreCompleto(e.target.value)}
                  placeholder="Ej. Francisco Pérez" required disabled={isLoading}
                />
              </label>

              <label className="field-card" style={{ marginTop: '12px' }}>
                <span>Teléfono</span>
                <input 
                  type="tel" 
                  value={telefono} onChange={(e) => setTelefono(e.target.value)}
                  placeholder="222 123 4567" required disabled={isLoading}
                />
              </label>

              <label className="field-card" style={{ marginTop: '12px' }}>
                <span>Correo electrónico</span>
                <input 
                  type="email" 
                  value={correo} onChange={(e) => setCorreo(e.target.value)}
                  placeholder="ejemplo@mezcalpay.mx" required disabled={isLoading}
                />
              </label>

              <label className="field-card" style={{ marginTop: '12px' }}>
                <span>Contraseña</span>
                <input 
                  type="password" 
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required disabled={isLoading}
                />
              </label>

              <label className="field-card" style={{ marginTop: '12px' }}>
                <span>Cooperativa</span>
                <select 
                  value={cooperativaId}
                  onChange={(e) => setCooperativaId(e.target.value)}
                  disabled={isLoading}
                  style={{ border: 'none', background: 'transparent', outline: 'none', font: 'inherit', width: '100%' }}
                >
                  <option value="">Selecciona una cooperativa</option>
                  {cooperativas.map((cooperativa) => (
                    <option key={cooperativa.id} value={cooperativa.id}>{cooperativa.nombre}</option>
                  ))}
                </select>
              </label>

              {errorMensaje && (
                <span style={{ color: '#dc2626', fontSize: '0.86rem', marginTop: '12px' }}>
                  {errorMensaje}
                </span>
              )}

              <button type="submit" className="primary-button wide" style={{ marginTop: '24px' }} disabled={isLoading}>
                {isLoading ? 'Registrando...' : 'Crear cuenta'}
              </button>
            </form>
          </div>
        </div>

      </section>
    </div>
  );
}
