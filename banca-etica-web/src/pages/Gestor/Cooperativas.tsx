import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';

const TESORERO_ROL_ID = '22222222-2222-2222-2222-222222222222';
const SOCIO_ROL_ID = '33333333-3333-3333-3333-333333333333';

interface Cooperativa {
  id: string;
  nombre: string;
  codigo: string;
  imagenUrl?: string | null;
  fechaCreacion: string;
  activa: boolean;
  tesorero: string | null;
  totalSocios: number;
}

interface Socio {
  id: string;
  nombre: string;
  correo: string;
}

interface Configuracion {
  manejaAportaciones: boolean;
  periodicidadAportacion: string;
  montoMinimoAportacion: number;
  montoMaximoAportacion: number;
  montoAportacionFijo: boolean;
  generaRendimientos: boolean;
  porcentajeRendimiento: number;
  periodicidadRendimiento: string;
  distribucionRendimiento: string;
  manejaPrestamos: boolean;
  montoMinimoPrestamo: number;
  montoMaximoPrestamo: number;
  factorMaximoPrestamo: number;
  tasaInteres: number;
  periodoInteres: string;
  frecuenciaPago: string;
  plazoMaximoMeses: number;
  multaMorosidad: number;
  inicioCiclo: string;
  finCiclo: string;
  duracionCicloMeses: number;
}

const configuracionInicial: Configuracion = {
  manejaAportaciones: true,
  periodicidadAportacion: 'Mensual',
  montoMinimoAportacion: 0,
  montoMaximoAportacion: 0,
  montoAportacionFijo: false,
  generaRendimientos: false,
  porcentajeRendimiento: 0,
  periodicidadRendimiento: 'Mensual',
  distribucionRendimiento: '',
  manejaPrestamos: false,
  montoMinimoPrestamo: 0,
  montoMaximoPrestamo: 0,
  factorMaximoPrestamo: 0,
  tasaInteres: 0,
  periodoInteres: '',
  frecuenciaPago: '',
  plazoMaximoMeses: 0,
  multaMorosidad: 0,
  inicioCiclo: '',
  finCiclo: '',
  duracionCicloMeses: 0,
};

const usuarioVacio = {
  rolId: SOCIO_ROL_ID,
  nombres: '',
  apellidoPaterno: '',
  apellidoMaterno: '',
  numeroSocio: '',
  correo: '',
  password: '',
  telefono: '',
};

async function leerRespuesta(response: Response) {
  const texto = await response.text();
  try {
    return texto ? (JSON.parse(texto) as { mensaje?: string }) : {};
  } catch {
    return { mensaje: texto };
  }
}

export default function CooperativasGestor() {
  const [cooperativas, setCooperativas] = useState<Cooperativa[]>([]);
  const [seleccionada, setSeleccionada] = useState<Cooperativa | null>(null);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [configuracion, setConfiguracion] = useState(configuracionInicial);
  const [nombre, setNombre] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [socioTesoreroId, setSocioTesoreroId] = useState('');
  const [correoTesorero, setCorreoTesorero] = useState('');
  const [passwordTesorero, setPasswordTesorero] = useState('');
  const [mostrarPasswordTesorero, setMostrarPasswordTesorero] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const [modalUsuarioAbierto, setModalUsuarioAbierto] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState(usuarioVacio);
  const [mostrarPasswordModal, setMostrarPasswordModal] = useState(false);
  const [errorModal, setErrorModal] = useState('');

  const cargarCooperativas = async () => {
    const response = await apiFetch('/api/gestor/cooperativas');
    if (response.ok) setCooperativas((await response.json()) as Cooperativa[]);
  };

  useEffect(() => {
    void cargarCooperativas();
  }, []);

  const crearCooperativa = async (event: FormEvent) => {
    event.preventDefault();
    if (!nombre.trim()) return;
    setCargando(true);
    setMensaje('');
    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      if (imagen) {
        formData.append('imagen', imagen);
      }

      const response = await apiFetch('/api/gestor/cooperativas', {
        method: 'POST',
        body: formData,
      });

      const data = await leerRespuesta(response);
      if (!response.ok) throw new Error(data.mensaje || 'No se pudo crear la cooperativa.');
      
      setNombre('');
      setImagen(null);
      setMensaje('Cooperativa creada correctamente.');
      await cargarCooperativas();
    } catch (error) {
      setMensaje(error instanceof Error ? error.message : 'Ocurrió un error.');
    } finally {
      setCargando(false);
    }
  };

  const abrirCooperativa = async (cooperativa: Cooperativa) => {
    setSeleccionada(cooperativa);
    const [detalle, sociosResponse] = await Promise.all([
      apiFetch(`/api/gestor/cooperativas/${cooperativa.id}`),
      apiFetch(`/api/gestor/cooperativas/${cooperativa.id}/socios`),
    ]);
    if (detalle.ok) {
      const data = (await detalle.json()) as { codigo?: string; configuracion?: Partial<Configuracion> };
      if (data.codigo) setSeleccionada({ ...cooperativa, codigo: data.codigo });
      setConfiguracion({ ...configuracionInicial, ...data.configuracion });
    }
    if (sociosResponse.ok) setSocios((await sociosResponse.json()) as Socio[]);
  };

  // const guardarConfiguracion = async (event: FormEvent) => {
  //   event.preventDefault();
  //   if (!seleccionada) return;
  //   const response = await apiFetch(`/api/gestor/cooperativas/${seleccionada.id}/configuracion`, {
  //     method: 'PUT',
  //     body: JSON.stringify(configuracion),
  //   });
  //   const data = await leerRespuesta(response);
  //   setMensaje(response.ok ? 'Configuración guardada correctamente.' : data.mensaje || 'No se pudo guardar la configuración.');
  // };

  const guardarConfiguracion = async (event: FormEvent) => {
    event.preventDefault();
    if (!seleccionada) return;
    
    const payload = {
      ...configuracion,
      inicioCiclo: configuracion.inicioCiclo ? configuracion.inicioCiclo : null,
      finCiclo: configuracion.finCiclo ? configuracion.finCiclo : null,
      // Asegurar que si no maneja préstamos o aportaciones no mande montos incoherentes
      montoMaximoAportacion: configuracion.manejaAportaciones ? configuracion.montoMaximoAportacion : 0,
      montoMaximoPrestamo: configuracion.manejaPrestamos ? configuracion.montoMaximoPrestamo : 0,
    };
  
    const response = await apiFetch(`/api/gestor/cooperativas/${seleccionada.id}/configuracion`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  
    const data = await leerRespuesta(response);
    setMensaje(response.ok ? 'Configuración guardada correctamente.' : data.mensaje || 'No se pudo guardar la configuración.');
  };

  const crearCuentaTesorero = async (event: FormEvent) => {
    event.preventDefault();
    if (!seleccionada || !socioTesoreroId || !correoTesorero || !passwordTesorero) {
      setMensaje('Selecciona un Socio y captura el correo y contraseña de su cuenta de Tesorero.');
      return;
    }

    const response = await apiFetch(`/api/gestor/cooperativas/${seleccionada.id}/tesorero`, {
      method: 'POST',
      body: JSON.stringify({ socioId: socioTesoreroId, correo: correoTesorero, password: passwordTesorero }),
    });
    const data = await leerRespuesta(response);
    if (!response.ok) {
      setMensaje(data.mensaje || 'No se pudo crear la cuenta de Tesorero.');
      return;
    }

    setSocioTesoreroId('');
    setCorreoTesorero('');
    setPasswordTesorero('');
    setMostrarPasswordTesorero(false);
    setMensaje('Cuenta de Tesorero creada y asignada correctamente.');
    await cargarCooperativas();
    await abrirCooperativa(seleccionada);
  };

  const handleCrearUsuario = async (event: FormEvent) => {
    event.preventDefault();
    if (!seleccionada) return;
    setCargando(true);
    setErrorModal('');

    try {
      const response = await apiFetch(`/api/gestor/cooperativas/${seleccionada.id}/usuarios`, {
        method: 'POST',
        body: JSON.stringify(nuevoUsuario),
      });
      const data = await leerRespuesta(response);
      if (!response.ok) throw new Error(data.mensaje || 'Error al registrar usuario.');

      setModalUsuarioAbierto(false);
      setNuevoUsuario(usuarioVacio);
      setMostrarPasswordModal(false);
      setMensaje('Usuario inicial registrado exitosamente.');
      await cargarCooperativas();
      await abrirCooperativa(seleccionada);
    } catch (error) {
      setErrorModal(error instanceof Error ? error.message : 'Error al registrar usuario.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="h-screen w-screen p-3 sm:p-4 md:p-5 flex flex-col md:grid md:grid-cols-[260px_minmax(0,1fr)] gap-4 overflow-hidden">
      <Sidebar />
      <main className="h-full overflow-y-auto p-4 sm:p-6 rounded-[28px] bg-white/80 backdrop-blur-xl border border-black/5 shadow-2xl">
        <section className="flex flex-col gap-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-brand-gold">Gestor de cooperativas</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-ink">Cooperativas</h2>
              <span className="text-sm text-brand-muted">Crea cooperativas y define las reglas que utilizará el Tesorero.</span>
            </div>
          </div>

          {/* Form Crear Cooperativa */}
          <form
            onSubmit={crearCooperativa}
            className="p-5 sm:p-6 rounded-[24px] bg-gradient-to-b from-[#f8f3ec]/95 to-white/85 border border-[#367268]/15 shadow-sm flex flex-col gap-4"
          >
            <div>
              <p className="text-lg font-bold text-brand-ink">Crear cooperativa</p>
              <span className="text-xs text-brand-muted">La cooperativa debe existir antes de asociar socios.</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Nombre</span>
                <input
                  value={nombre}
                  onChange={(event) => setNombre(event.target.value)}
                  placeholder="Ej. Cooperativa San Miguel"
                  className="w-full bg-transparent border-0 p-0 text-sm text-brand-ink placeholder:text-gray-400 focus:outline-none focus:ring-0"
                />
              </label>

              <label className="flex flex-col gap-1.5 p-3.5 rounded-2xl bg-[#f3f8f6] border border-transparent focus-within:border-brand-teal transition-colors">
                <span className="text-xs font-medium text-brand-muted">Logotipo / Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    if (event.target.files && event.target.files[0]) {
                      setImagen(event.target.files[0]);
                    } else {
                      setImagen(null);
                    }
                  }}
                  className="text-xs text-brand-ink file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-brand-mist file:text-brand-ink hover:file:bg-[#d2e5e1] file:cursor-pointer"
                />
              </label>

              <button
                type="submit"
                disabled={cargando}
                className="py-3 px-6 rounded-full font-semibold text-sm text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {cargando ? 'Creando...' : 'Crear cooperativa'}
              </button>
            </div>
          </form>

          {mensaje && (
            <p className="text-sm font-semibold text-brand-gold px-1">{mensaje}</p>
          )}

          {/* Grid de 2 columnas: Lista y Detalle */}
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,1.5fr)] gap-5">
            {/* Lista Cooperativas */}
            <section className="p-5 rounded-[24px] bg-white/70 border border-[#367268]/15 shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <p className="text-base font-bold text-brand-ink">Mis cooperativas</p>
                <span className="text-xs text-brand-muted">{cooperativas.length} registradas</span>
              </div>

              <div className="flex flex-col gap-2.5">
                {cooperativas.map((cooperativa) => (
                  <button
                    key={cooperativa.id}
                    type="button"
                    onClick={() => void abrirCooperativa(cooperativa)}
                    className="w-full text-left p-4 rounded-2xl bg-[#f8f3ec] hover:bg-[#efe7dc] border border-black/5 transition-all hover:-translate-y-0.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <strong className="block text-sm sm:text-base text-brand-ink font-bold">{cooperativa.nombre}</strong>
                      <span className="text-xs text-brand-muted">Código: {cooperativa.codigo}</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="block text-xs font-semibold text-brand-green">{cooperativa.totalSocios} socios</span>
                      <span className="text-xs text-brand-muted">{cooperativa.tesorero || 'Sin tesorero'}</span>
                    </div>
                  </button>
                ))}

                {!cooperativas.length && (
                  <p className="py-8 text-center text-sm text-brand-muted border border-dashed border-[#5b4e3d]/30 rounded-2xl bg-white/40">
                    Todavía no tienes cooperativas registradas.
                  </p>
                )}
              </div>
            </section>

            {/* Detalle y Configuración de Cooperativa */}
            {seleccionada && (
              <section className="p-5 sm:p-6 rounded-[24px] bg-[#f8f3ec]/90 border border-[#367268]/20 shadow-md flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/5 pb-4">
                  <div>
                    <p className="text-lg font-bold text-brand-ink">{seleccionada.nombre}</p>
                    <span className="text-xs text-brand-muted">
                      Comparte el código <strong className="text-brand-green">{seleccionada.codigo}</strong> con los Socios para que se registren.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorModal('');
                      setModalUsuarioAbierto(true);
                    }}
                    className="shrink-0 px-4 py-2 rounded-full text-xs font-bold bg-brand-green text-white hover:bg-brand-teal transition-all shadow-sm"
                  >
                    + Registrar Usuario
                  </button>
                </div>

                {/* Formulario de Configuración de Ciclos y Parámetros */}
                <form className="flex flex-col gap-3" onSubmit={guardarConfiguracion}>
                  <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#f3f8f6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracion.manejaAportaciones}
                      onChange={(event) =>
                        setConfiguracion({ ...configuracion, manejaAportaciones: event.target.checked })
                      }
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-teal"
                    />
                    <span className="text-xs font-medium text-brand-ink">La cooperativa maneja aportaciones</span>
                  </label>

                  {configuracion.manejaAportaciones && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pl-2 border-l-2 border-brand-green/30">
                      <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                        <span className="text-xs text-brand-muted">Periodicidad</span>
                        <select
                          value={configuracion.periodicidadAportacion}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, periodicidadAportacion: event.target.value })
                          }
                          className="bg-transparent border-0 p-0 text-xs font-medium text-brand-ink focus:outline-none"
                        >
                          <option>Mensual</option>
                          <option>Quincenal</option>
                          <option>Semanal</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                        <span className="text-xs text-brand-muted">Monto mínimo</span>
                        <input
                          type="number"
                          min="0"
                          value={configuracion.montoMinimoAportacion}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, montoMinimoAportacion: Number(event.target.value) })
                          }
                          className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                        <span className="text-xs text-brand-muted">Monto máximo</span>
                        <input
                          type="number"
                          min="0"
                          value={configuracion.montoMaximoAportacion}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, montoMaximoAportacion: Number(event.target.value) })
                          }
                          className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                        />
                      </label>
                      <label className="flex items-center gap-2 p-3 rounded-xl bg-[#f3f8f6] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={configuracion.montoAportacionFijo}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, montoAportacionFijo: event.target.checked })
                          }
                          className="rounded border-gray-300 text-brand-green focus:ring-brand-teal"
                        />
                        <span className="text-xs text-brand-ink">Monto fijo</span>
                      </label>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#f3f8f6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracion.generaRendimientos}
                      onChange={(event) =>
                        setConfiguracion({ ...configuracion, generaRendimientos: event.target.checked })
                      }
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-teal"
                    />
                    <span className="text-xs font-medium text-brand-ink">La cooperativa genera rendimientos</span>
                  </label>

                  {configuracion.generaRendimientos && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pl-2 border-l-2 border-brand-green/30">
                      <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                        <span className="text-xs text-brand-muted">% Rendimiento</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={configuracion.porcentajeRendimiento}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, porcentajeRendimiento: Number(event.target.value) })
                          }
                          className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                        />
                      </label>
                      <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                        <span className="text-xs text-brand-muted">Periodicidad</span>
                        <select
                          value={configuracion.periodicidadRendimiento}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, periodicidadRendimiento: event.target.value })
                          }
                          className="bg-transparent border-0 p-0 text-xs font-medium text-brand-ink focus:outline-none"
                        >
                          <option value="Mensual">Mensual</option>
                          <option value="Quincenal">Quincenal</option>
                          <option value="Semanal">Semanal</option>
                        </select>
                      </label>
                      <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                        <span className="text-xs text-brand-muted">Distribución</span>
                        <input
                          value={configuracion.distribucionRendimiento}
                          onChange={(event) =>
                            setConfiguracion({ ...configuracion, distribucionRendimiento: event.target.value })
                          }
                          className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                        />
                      </label>
                    </div>
                  )}

                  <label className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-[#f3f8f6] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={configuracion.manejaPrestamos}
                      onChange={(event) =>
                        setConfiguracion({ ...configuracion, manejaPrestamos: event.target.checked })
                      }
                      className="rounded border-gray-300 text-brand-green focus:ring-brand-teal"
                    />
                    <span className="text-xs font-medium text-brand-ink">La cooperativa maneja préstamos</span>
                  </label>

                  {configuracion.manejaPrestamos && (
                    <div className="flex flex-col gap-2.5 pl-2 border-l-2 border-brand-green/30">
                      {/* Alerta de tasa fija */}
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-brand-ink/90 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-[11px] leading-tight text-amber-950 font-medium">
                          Los préstamos están sobre tipo de interés fijo.
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Monto mínimo</span>
                          <input
                            type="number"
                            min="0"
                            value={configuracion.montoMinimoPrestamo}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, montoMinimoPrestamo: Number(event.target.value) })
                            }
                            className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Monto máximo</span>
                          <input
                            type="number"
                            min="0"
                            value={configuracion.montoMaximoPrestamo}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, montoMaximoPrestamo: Number(event.target.value) })
                            }
                            className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Factor máximo</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={configuracion.factorMaximoPrestamo}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, factorMaximoPrestamo: Number(event.target.value) })
                            }
                            className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Tasa de interés (%)</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={configuracion.tasaInteres}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, tasaInteres: Number(event.target.value) })
                            }
                            className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                          />
                        </label>

                        {/* Selector de Periodo de Interés */}
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Periodo interés</span>
                          <select
                            value={configuracion.periodoInteres || 'Mensual'}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, periodoInteres: event.target.value })
                            }
                            className="bg-transparent border-0 p-0 text-xs font-medium text-brand-ink focus:outline-none"
                          >
                            <option value="Mensual">Mensual</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Semanal">Semanal</option>
                            <option value="Anual">Anual</option>
                          </select>
                        </label>

                        {/* Selector de Frecuencia de Pago */}
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Frecuencia de pago</span>
                          <select
                            value={configuracion.frecuenciaPago || 'Mensual'}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, frecuenciaPago: event.target.value })
                            }
                            className="bg-transparent border-0 p-0 text-xs font-medium text-brand-ink focus:outline-none"
                          >
                            <option value="Mensual">Mensual</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Semanal">Semanal</option>
                            <option value="Catorcenal">Catorcenal</option>
                          </select>
                        </label>

                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Plazo máx. (meses)</span>
                          <input
                            type="number"
                            min="1"
                            value={configuracion.plazoMaximoMeses}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, plazoMaximoMeses: Number(event.target.value) })
                            }
                            className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                          />
                        </label>
                        <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                          <span className="text-xs text-brand-muted">Multa morosidad</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={configuracion.multaMorosidad}
                            onChange={(event) =>
                              setConfiguracion({ ...configuracion, multaMorosidad: Number(event.target.value) })
                            }
                            className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                          />
                        </label>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                      <span className="text-xs text-brand-muted">Inicio de ciclo</span>
                      <input
                        type="date"
                        value={configuracion.inicioCiclo ? configuracion.inicioCiclo.slice(0, 10) : ''}
                        onChange={(event) => setConfiguracion({ ...configuracion, inicioCiclo: event.target.value })}
                        className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                      <span className="text-xs text-brand-muted">Fin de ciclo</span>
                      <input
                        type="date"
                        value={configuracion.finCiclo ? configuracion.finCiclo.slice(0, 10) : ''}
                        onChange={(event) => setConfiguracion({ ...configuracion, finCiclo: event.target.value })}
                        className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                      />
                    </label>
                    <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                      <span className="text-xs text-brand-muted">Duración (meses)</span>
                      <input
                        type="number"
                        min="1"
                        value={configuracion.duracionCicloMeses}
                        onChange={(event) =>
                          setConfiguracion({ ...configuracion, duracionCicloMeses: Number(event.target.value) })
                        }
                        className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-2 py-3 px-5 rounded-full font-semibold text-xs sm:text-sm text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Guardar configuración
                  </button>
                </form>

                {/* Lista de Socios */}
                <div className="pt-3 border-t border-black/5">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-brand-ink">Socios</p>
                    <span className="text-xs text-brand-muted">{socios.length} asociados</span>
                  </div>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                    {socios.map((socio) => (
                      <div
                        key={socio.id}
                        className="p-3 rounded-xl bg-[#f8f3ec] border border-black/5 flex justify-between items-center text-xs"
                      >
                        <strong className="text-brand-ink">{socio.nombre}</strong>
                        <span className="text-brand-muted">{socio.correo}</span>
                      </div>
                    ))}
                    {!socios.length && (
                      <p className="text-center py-3 text-xs text-brand-muted">Aún no hay socios asociados.</p>
                    )}
                  </div>
                </div>

                {/* Crear cuenta de Tesorero */}
                <form className="flex flex-col gap-3 pt-3 border-t border-black/5" onSubmit={crearCuentaTesorero}>
                  <div className="flex flex-col gap-1.5">
                    <div>
                      <p className="text-sm font-bold text-brand-ink">Cuenta de Tesorero</p>
                      <span className="text-xs text-brand-muted">Se crea un acceso independiente para el Socio seleccionado.
                      Los tesoreros ya cuentan con una cuenta como socio. Solo crear aqui acceso alternos en caso de necesidad.</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-brand-ink/90 flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                        <svg className="w-4 h-4 shrink-0 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Nota sobre roles y accesos</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-amber-950/80">
                        Por defecto, un usuario con permisos puede <strong>alternar de vista entre Socio y Tesorero</strong> dentro de su misma sesión. Utiliza este formulario <strong>únicamente si requiere credenciales y cuentas de acceso completamente independientes</strong> (por ejemplo, correos o contraseñas separadas para la administración).
                      </p>
                    </div>
                  </div>

                  <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                    <span className="text-xs text-brand-muted">Socio a vincular</span>
                    <select
                      value={socioTesoreroId}
                      onChange={(event) => setSocioTesoreroId(event.target.value)}
                      className="bg-transparent border-0 p-0 text-xs font-medium text-brand-ink focus:outline-none"
                    >
                      <option value="">Selecciona un Socio</option>
                      {socios.map((socio) => (
                        <option key={socio.id} value={socio.id}>
                          {socio.nombre}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                    <span className="text-xs text-brand-muted">Correo de la cuenta de Tesorero</span>
                    <input
                      type="email"
                      value={correoTesorero}
                      onChange={(event) => setCorreoTesorero(event.target.value)}
                      placeholder="tesorero@cooperativa.com"
                      className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                    />
                  </label>

                  {/* Campo de contraseña Tesorero con botón de visibilidad */}
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#f3f8f6]">
                    <span className="text-xs text-brand-muted">Contraseña de la cuenta de Tesorero</span>
                    <div className="flex items-center gap-2">
                      <input
                        type={mostrarPasswordTesorero ? 'text' : 'password'}
                        minLength={8}
                        value={passwordTesorero}
                        onChange={(event) => setPasswordTesorero(event.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setMostrarPasswordTesorero((prev) => !prev)}
                        className="p-0.5 text-brand-muted hover:text-brand-ink transition-colors focus:outline-none"
                        tabIndex={-1}
                        title={mostrarPasswordTesorero ? 'Ocultar contraseña' : 'Ver contraseña'}
                      >
                        {mostrarPasswordTesorero ? (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-1 py-3 px-5 rounded-full font-semibold text-xs sm:text-sm text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md hover:-translate-y-0.5 active:translate-y-0"
                  >
                    Crear y designar Tesorero
                  </button>
                </form>
              </section>
            )}
          </div>
        </section>
      </main>

      {/* MODAL PARA CREAR USUARIO */}
      {modalUsuarioAbierto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setModalUsuarioAbierto(false)}
        >
          <div
            className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px] bg-white p-6 shadow-2xl flex flex-col gap-4 border border-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-lg font-bold text-brand-ink">Registrar Usuario Inicial</p>
                <span className="text-xs text-brand-muted">
                  Crea un usuario para <strong>{seleccionada?.nombre}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={() => setModalUsuarioAbierto(false)}
                className="text-gray-400 hover:text-brand-ink text-2xl leading-none transition-colors"
              >
                &times;
              </button>
            </div>

            {errorModal && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
                {errorModal}
              </p>
            )}

            <form className="flex flex-col gap-3" onSubmit={handleCrearUsuario}>
              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted">Rol asignado</span>
                <select
                  value={nuevoUsuario.rolId}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, rolId: e.target.value })}
                  className="bg-transparent border-0 p-0 text-xs font-semibold text-brand-ink focus:outline-none"
                >
                  <option value={SOCIO_ROL_ID}>Socio</option>
                  <option value={TESORERO_ROL_ID}>Tesorero</option>
                </select>
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted">Nombres</span>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Carlos"
                  value={nuevoUsuario.nombres}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombres: e.target.value })}
                  className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                  <span className="text-xs text-brand-muted">Apellido Paterno</span>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Pérez"
                    value={nuevoUsuario.apellidoPaterno}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellidoPaterno: e.target.value })}
                    className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                  />
                </label>
                <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                  <span className="text-xs text-brand-muted">Apellido Materno</span>
                  <input
                    type="text"
                    placeholder="Ej. López"
                    value={nuevoUsuario.apellidoMaterno}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, apellidoMaterno: e.target.value })}
                    className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted">Número de Socio (opcional)</span>
                <input
                  type="text"
                  placeholder="Ej. SOC-001"
                  value={nuevoUsuario.numeroSocio}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, numeroSocio: e.target.value })}
                  className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted">Teléfono (opcional)</span>
                <input
                  type="tel"
                  placeholder="Ej. 2721234567"
                  value={nuevoUsuario.telefono}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, telefono: e.target.value })}
                  className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                />
              </label>

              <label className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted">Correo Electrónico</span>
                <input
                  type="email"
                  required
                  placeholder="ejemplo@correo.com"
                  value={nuevoUsuario.correo}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                  className="bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                />
              </label>

              {/* Campo de contraseña Modal con botón de visibilidad */}
              <div className="flex flex-col gap-1 p-3 rounded-2xl bg-[#f3f8f6]">
                <span className="text-xs text-brand-muted">Contraseña</span>
                <div className="flex items-center gap-2">
                  <input
                    type={mostrarPasswordModal ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                    value={nuevoUsuario.password}
                    onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                    className="w-full bg-transparent border-0 p-0 text-xs text-brand-ink focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarPasswordModal((prev) => !prev)}
                    className="p-0.5 text-brand-muted hover:text-brand-ink transition-colors focus:outline-none"
                    tabIndex={-1}
                    title={mostrarPasswordModal ? 'Ocultar contraseña' : 'Ver contraseña'}
                  >
                    {mostrarPasswordModal ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-3">
                <button
                  type="button"
                  onClick={() => setModalUsuarioAbierto(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargando}
                  className="flex-[2] py-2.5 rounded-full text-xs font-semibold text-white bg-brand-green hover:bg-brand-teal transition-all shadow-md disabled:opacity-50"
                >
                  {cargando ? 'Guardando...' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}