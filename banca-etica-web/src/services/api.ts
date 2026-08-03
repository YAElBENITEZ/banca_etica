// Helper centralizado para hacer peticiones HTTP con JWT
export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // 1. Recuperar el token guardado en el Login
  const token = localStorage.getItem('token');

  // 2. Definimos headers explícitamente como Record<string, string> para evitar la alerta en TS
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    // 🔑 Mantenemos la cabecera limpia
    headers['Authorization'] = `Bearer ${token}`;
  }

  // 3. Ejecutar el fetch nativo
  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 4. Manejo de sesión expirada
  if (response.status === 401) {
    console.warn('Sesión expirada o token no válido. Redirigiendo al login...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sesión no autorizada');
  }

  return response;
};