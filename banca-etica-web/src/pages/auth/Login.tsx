import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const response = await fetch('http://localhost:5026/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          correo: email, 
          password: password 
        }),
      });

      const data = await readApiResponse(response);

      if (!response.ok) {
        throw new Error(data.mensaje || 'Error al iniciar sesión');
      }

      // 🔑 GUARDAMOS EL TOKEN Y DATOS DE SESIÓN
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));

      console.log('Usuario autenticado:', data);
      
      // Navegación original a tu Dashboard
      navigate('/dashboard');

    } catch (error: any) {
      setErrorMensaje(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="landing-shell">
      <section className="landing-panel auth-stage">
        
        {/* Header superior */}
        <header className="landing-topbar">
          <div className="brand">
            <div className="brand-mark">
              <span /><span /><span />
            </div>
            <div>
              <p>MezcalPay</p>
              <small>Acceso seguro</small>
            </div>
          </div>
          <button className="secondary-button" type="button" onClick={() => navigate('/')}>
            Volver
          </button>
        </header>

        <div className="auth-layout">
          {/* Columna Izquierda: Mensajes */}
          <div className="auth-copy">
            <span className="soft-badge">Acceso protegido</span>
            <h2 className="auth-title">Ingresa a tu cuenta</h2>
            <p className="auth-description">
              Bienvenido de vuelta a tu cooperativa. Ingresa tus credenciales para administrar tus finanzas.
            </p>
          </div>

          {/* Columna Derecha: Tarjeta del Formulario */}
          <div className="auth-card">
            <div className="auth-tabs">
              <button className="active" type="button">Iniciar sesión</button>
            </div>

            <form className="auth-fields" onSubmit={handleLoginSubmit}>
              
              <label className="field-card">
                <span>Correo electrónico</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@mezcalpay.mx"
                  disabled={isLoading}
                  required
                />
              </label>

              <label className="field-card" style={{ marginTop: '12px' }}>
                <span>Contraseña</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  required
                />
              </label>

              {/* Mensaje de error condicional */}
              {errorMensaje && (
                <span style={{ color: '#dc2626', fontSize: '0.86rem', marginTop: '8px' }}>
                  {errorMensaje}
                </span>
              )}

              <button 
                type="submit" 
                className="primary-button wide" 
                style={{ marginTop: '24px' }}
                disabled={isLoading}
              >
                {isLoading ? 'Verificando...' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>

      </section>
    </div>
  );
}
