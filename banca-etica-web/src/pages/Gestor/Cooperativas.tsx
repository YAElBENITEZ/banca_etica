import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { apiFetch } from '../../services/api';
import Sidebar from '../../components/Sidebar';
import '../../App.css';

interface Cooperativa {
  id: string;
  nombre: string;
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

async function leerRespuesta(response: Response) {
  const texto = await response.text();
  try {
    return texto ? JSON.parse(texto) as { mensaje?: string } : {};
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
  const [socioTesoreroId, setSocioTesoreroId] = useState('');
  const [correoTesorero, setCorreoTesorero] = useState('');
  const [passwordTesorero, setPasswordTesorero] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  const cargarCooperativas = async () => {
    const response = await apiFetch('/api/gestor/cooperativas');
    if (response.ok) setCooperativas(await response.json() as Cooperativa[]);
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
      const response = await apiFetch('/api/gestor/cooperativas', {
        method: 'POST',
        body: JSON.stringify({ nombre }),
      });
      const data = await leerRespuesta(response);
      if (!response.ok) throw new Error(data.mensaje || 'No se pudo crear la cooperativa.');
      setNombre('');
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
      const data = await detalle.json() as { configuracion?: Partial<Configuracion> };
      setConfiguracion({ ...configuracionInicial, ...data.configuracion });
    }
    if (sociosResponse.ok) setSocios(await sociosResponse.json() as Socio[]);
  };

  const guardarConfiguracion = async (event: FormEvent) => {
    event.preventDefault();
    if (!seleccionada) return;
    const response = await apiFetch(`/api/gestor/cooperativas/${seleccionada.id}/configuracion`, {
      method: 'PUT',
      body: JSON.stringify(configuracion),
    });
    const data = await leerRespuesta(response);
    setMensaje(response.ok ? 'Configuración guardada correctamente.' : (data.mensaje || 'No se pudo guardar la configuración.'));
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
    setMensaje('Cuenta de Tesorero creada y asignada correctamente.');
    await cargarCooperativas();
    await abrirCooperativa(seleccionada);
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="main-shell">
        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <p className="hero-label">Gestor de cooperativas</p>
              <h2>Cooperativas</h2>
              <span>Crea cooperativas y define las reglas que utilizará el Tesorero.</span>
            </div>
          </div>

          <form className="panel soft" onSubmit={crearCooperativa}>
            <div className="panel-header">
              <div><p className="panel-title">Crear cooperativa</p><span>La cooperativa debe existir antes de asociar socios.</span></div>
            </div>
            <div className="form-grid">
              <label className="field-card"><span>Nombre</span><input value={nombre} onChange={(event) => setNombre(event.target.value)} placeholder="Ej. Cooperativa San Miguel" /></label>
              <button className="primary-pill" type="submit" disabled={cargando}>{cargando ? 'Creando...' : 'Crear cooperativa'}</button>
            </div>
          </form>

          {mensaje && <p className="hero-label">{mensaje}</p>}

          <div className="preview-layout">
            <section className="panel">
              <div className="panel-header"><div><p className="panel-title">Mis cooperativas</p><span>{cooperativas.length} registradas</span></div></div>
              <div className="table-box">
                {cooperativas.map((cooperativa) => (
                  <button className="table-row" key={cooperativa.id} type="button" onClick={() => void abrirCooperativa(cooperativa)}>
                    <strong>{cooperativa.nombre}</strong><span>{cooperativa.totalSocios} socios</span><span>{cooperativa.tesorero || 'Sin tesorero'}</span>
                  </button>
                ))}
                {!cooperativas.length && <p className="empty-state">Todavía no tienes cooperativas registradas.</p>}
              </div>
            </section>

            {seleccionada && (
              <section className="panel soft">
                <div className="panel-header"><div><p className="panel-title">{seleccionada.nombre}</p><span>Define las reglas que utilizará el Tesorero. Las fórmulas de cierre siguen pendientes de definición.</span></div></div>
                <form className="auth-fields" onSubmit={guardarConfiguracion}>
                  <label className="field-card"><span><input type="checkbox" checked={configuracion.manejaAportaciones} onChange={(event) => setConfiguracion({ ...configuracion, manejaAportaciones: event.target.checked })} /> La cooperativa maneja aportaciones</span></label>
                  {configuracion.manejaAportaciones && <>
                    <label className="field-card"><span>Periodicidad de aportaciones</span><select value={configuracion.periodicidadAportacion} onChange={(event) => setConfiguracion({ ...configuracion, periodicidadAportacion: event.target.value })}><option>Mensual</option><option>Quincenal</option><option>Semanal</option></select></label>
                    <label className="field-card"><span>Monto mínimo de aportación</span><input type="number" min="0" value={configuracion.montoMinimoAportacion} onChange={(event) => setConfiguracion({ ...configuracion, montoMinimoAportacion: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Monto máximo de aportación</span><input type="number" min="0" value={configuracion.montoMaximoAportacion} onChange={(event) => setConfiguracion({ ...configuracion, montoMaximoAportacion: Number(event.target.value) })} /></label>
                    <label className="field-card"><span><input type="checkbox" checked={configuracion.montoAportacionFijo} onChange={(event) => setConfiguracion({ ...configuracion, montoAportacionFijo: event.target.checked })} /> Monto fijo (mínimo y máximo iguales)</span></label>
                  </>}
                  <label className="field-card"><span><input type="checkbox" checked={configuracion.generaRendimientos} onChange={(event) => setConfiguracion({ ...configuracion, generaRendimientos: event.target.checked })} /> La cooperativa genera rendimientos</span></label>
                  {configuracion.generaRendimientos && <>
                    <label className="field-card"><span>Porcentaje de rendimiento</span><input type="number" min="0" step="0.01" value={configuracion.porcentajeRendimiento} onChange={(event) => setConfiguracion({ ...configuracion, porcentajeRendimiento: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Periodicidad del rendimiento</span><select value={configuracion.periodicidadRendimiento} onChange={(event) => setConfiguracion({ ...configuracion, periodicidadRendimiento: event.target.value })}><option value="Mensual">Mensual</option><option value="Quincenal">Quincenal</option><option value="Semanal">Semanal</option></select></label>
                    <label className="field-card"><span>Forma de distribución</span><input value={configuracion.distribucionRendimiento} onChange={(event) => setConfiguracion({ ...configuracion, distribucionRendimiento: event.target.value })} /></label>
                  </>}
                  <label className="field-card"><span><input type="checkbox" checked={configuracion.manejaPrestamos} onChange={(event) => setConfiguracion({ ...configuracion, manejaPrestamos: event.target.checked })} /> La cooperativa maneja préstamos</span></label>
                  {configuracion.manejaPrestamos && <>
                    <label className="field-card"><span>Monto mínimo de préstamo</span><input type="number" min="0" value={configuracion.montoMinimoPrestamo} onChange={(event) => setConfiguracion({ ...configuracion, montoMinimoPrestamo: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Monto máximo de préstamo</span><input type="number" min="0" value={configuracion.montoMaximoPrestamo} onChange={(event) => setConfiguracion({ ...configuracion, montoMaximoPrestamo: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Factor máximo de préstamo</span><input type="number" min="0" step="0.01" value={configuracion.factorMaximoPrestamo} onChange={(event) => setConfiguracion({ ...configuracion, factorMaximoPrestamo: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Tasa de interés</span><input type="number" min="0" step="0.01" value={configuracion.tasaInteres} onChange={(event) => setConfiguracion({ ...configuracion, tasaInteres: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Periodo de interés</span><input value={configuracion.periodoInteres} onChange={(event) => setConfiguracion({ ...configuracion, periodoInteres: event.target.value })} /></label>
                    <label className="field-card"><span>Frecuencia de pago</span><input value={configuracion.frecuenciaPago} onChange={(event) => setConfiguracion({ ...configuracion, frecuenciaPago: event.target.value })} /></label>
                    <label className="field-card"><span>Plazo máximo (meses)</span><input type="number" min="1" value={configuracion.plazoMaximoMeses} onChange={(event) => setConfiguracion({ ...configuracion, plazoMaximoMeses: Number(event.target.value) })} /></label>
                    <label className="field-card"><span>Multa por morosidad</span><input type="number" min="0" step="0.01" value={configuracion.multaMorosidad} onChange={(event) => setConfiguracion({ ...configuracion, multaMorosidad: Number(event.target.value) })} /></label>
                  </>}
                  <label className="field-card"><span>Inicio del ciclo</span><input type="date" value={configuracion.inicioCiclo ? configuracion.inicioCiclo.slice(0, 10) : ''} onChange={(event) => setConfiguracion({ ...configuracion, inicioCiclo: event.target.value })} /></label>
                  <label className="field-card"><span>Fin del ciclo</span><input type="date" value={configuracion.finCiclo ? configuracion.finCiclo.slice(0, 10) : ''} onChange={(event) => setConfiguracion({ ...configuracion, finCiclo: event.target.value })} /></label>
                  <label className="field-card"><span>Duración del ciclo (meses)</span><input type="number" min="1" value={configuracion.duracionCicloMeses} onChange={(event) => setConfiguracion({ ...configuracion, duracionCicloMeses: Number(event.target.value) })} /></label>
                  <button className="primary-button wide" type="submit">Guardar configuración</button>
                </form>
                <div className="panel-header" style={{ marginTop: '20px' }}><div><p className="panel-title">Socios</p><span>{socios.length} asociados</span></div></div>
                {socios.map((socio) => <div className="table-row" key={socio.id}><strong>{socio.nombre}</strong><span>{socio.correo}</span></div>)}
                <form className="auth-fields" style={{ marginTop: '20px' }} onSubmit={crearCuentaTesorero}>
                  <div className="panel-header"><div><p className="panel-title">Cuenta de Tesorero</p><span>Se crea un segundo acceso para el Socio seleccionado; sus permisos permanecen separados.</span></div></div>
                  <label className="field-card"><span>Socio a vincular</span><select value={socioTesoreroId} onChange={(event) => setSocioTesoreroId(event.target.value)}><option value="">Selecciona un Socio</option>{socios.map((socio) => <option key={socio.id} value={socio.id}>{socio.nombre}</option>)}</select></label>
                  <label className="field-card"><span>Correo de la cuenta de Tesorero</span><input type="email" value={correoTesorero} onChange={(event) => setCorreoTesorero(event.target.value)} /></label>
                  <label className="field-card"><span>Contraseña de la cuenta de Tesorero</span><input type="password" minLength={8} value={passwordTesorero} onChange={(event) => setPasswordTesorero(event.target.value)} /></label>
                  <button className="primary-button wide" type="submit">Crear y designar Tesorero</button>
                </form>
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
