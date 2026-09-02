import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import '../../App.css';

export default function Register() {
  // 1. Estados que coinciden exactamente con nuestro DTO en C#
  const [nombreCompleto, setNombreCompleto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  
  // Por defecto, seleccionamos el ID del rol "Socio" que sembramos en Postgres
  const [rolId, setRolId] = useState('00000000-0000-0000-0000-000000000001'); 

  // Estados de interfaz
  const [isLoading, setIsLoading] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState('');
  const navigate = useNavigate();

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMensaje('');

    // Validación básica front-end
    if (!nombreCompleto || !telefono || !correo || !password) {
      setErrorMensaje('Todos los campos son obligatorios.');
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
          rolId 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al registrar el usuario');
      }

      // 3. ¡Éxito! Mandamos al usuario a iniciar sesión
      console.log('Usuario y Cajita creados:', data);
      alert('Registro exitoso. Tu cajita de ahorro ha sido creada.');
      navigate('/'); // Lo regresamos al login

    } catch (error: any) {
      setErrorMensaje(error.message);
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
                <span>Rol en la Cooperativa</span>
                <select 
                  value={rolId} 
                  onChange={(e) => setRolId(e.target.value)}
                  disabled={isLoading}
                  style={{ border: 'none', background: 'transparent', outline: 'none', font: 'inherit', width: '100%' }}
                >
                  <option value="22222222-2222-2222-2222-222222222222">Socio Productor</option>
                  <option value="33333333-3333-3333-3333-333333333333">Tesorero</option>
                  <option value="44444444-4444-4444-4444-444444444444">Miembro del Consejo</option>
                  <option value="11111111-1111-1111-1111-111111111111">Administrador</option>
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