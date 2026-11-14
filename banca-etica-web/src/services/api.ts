// Forzado directamente a la URL pública de producción
const API_BASE_URL = 'https://tandem.api.unionmixteca.mx';

export const apiFetch = async (url: string, options: RequestInit = {}) => {
  // Si la url ya trae http/https la respeta; si no, le antepone la base
  const finalUrl = url.startsWith('http')
    ? url
    : `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;

  const token = localStorage.getItem('token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(options.headers as Record<string, string> || {}),
  };

  if (isFormData && headers['Content-Type']) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(finalUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    console.warn('Sesión expirada o token no válido. Redirigiendo al login...');
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
    throw new Error('Sesión no autorizada');
  }

  return response;
};