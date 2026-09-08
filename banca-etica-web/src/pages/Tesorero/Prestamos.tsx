import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';
import '../../App.css';

interface Socio { id: string; nombre: string }
interface Prestamo { id: string; socio: string; nombre: string; montoOriginal: number; tasa: number; plazoMeses: number; fechaDesembolso: string; estado: string; saldoPendiente: number }
interface Parcialidad { id: string; numero: number; vencimiento: string; capital: number; interes: number; multa: number; montoPagado: number | null; tipoPago: string; fechaPago: string | null; estado: string }
interface Detalle extends Omit<Prestamo, 'nombre' | 'fechaDesembolso' | 'saldoPendiente'> { pagos: Parcialidad[] }

const hoy = new Date().toISOString().slice(0, 10);
const moneda = (valor: number) => `$${valor.toFixed(2)}`;

export default function PrestamosTesorero() {
  const [socios, setSocios] = useState<Socio[]>([]);
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [socioId, setSocioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [monto, setMonto] = useState('');
  const [plazoMeses, setPlazoMeses] = useState('');
  const [fechaDesembolso, setFechaDesembolso] = useState(hoy);
  const [mensaje, setMensaje] = useState('');

  const leer = async <T,>(respuesta: Response): Promise<T & { mensaje?: string }> => respuesta.json() as Promise<T & { mensaje?: string }>;

  const cargar = async () => {
    const [sociosRespuesta, prestamosRespuesta] = await Promise.all([
      apiFetch('/api/tesorero/prestamos/socios'),
      apiFetch('/api/tesorero/prestamos'),
    ]);
    const sociosDatos = await leer<Socio[]>(sociosRespuesta);
    const prestamosDatos = await leer<Prestamo[]>(prestamosRespuesta);
    if (!sociosRespuesta.ok || !prestamosRespuesta.ok) { setMensaje(sociosDatos.mensaje || prestamosDatos.mensaje || 'No se pudo cargar la información.'); return; }
    setSocios(sociosDatos);
    setPrestamos(prestamosDatos);
    if (!socioId && sociosDatos.length) setSocioId(sociosDatos[0].id);
  };

  useEffect(() => { void cargar(); }, []);

  const abrirDetalle = async (id: string) => {
    const respuesta = await apiFetch(`/api/tesorero/prestamos/${id}`);
    const datos = await leer<Detalle>(respuesta);
    if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudo consultar el préstamo.'); return; }
    setDetalle(datos);
  };

  const crear = async (evento: FormEvent) => {
    evento.preventDefault();
    const respuesta = await apiFetch('/api/tesorero/prestamos', {
      method: 'POST',
      body: JSON.stringify({ socioId, nombre, monto: Number(monto), plazoMeses: Number(plazoMeses), fechaDesembolso: new Date(fechaDesembolso).toISOString() }),
    });
    const datos = await leer<{ id: string }>(respuesta);
    setMensaje(datos.mensaje || (respuesta.ok ? 'Préstamo registrado.' : 'No se pudo registrar el préstamo.'));
    if (respuesta.ok) { setNombre(''); setMonto(''); setPlazoMeses(''); await cargar(); }
  };

  const pagar = async (parcialidadId: string, tipoPago: 'Normal' | 'Moroso') => {
    const respuesta = await apiFetch('/api/tesorero/prestamos/pagos', { method: 'POST', body: JSON.stringify({ parcialidadId, tipoPago }) });
    const datos = await leer<{ monto: number; multa: number }>(respuesta);
    setMensaje(datos.mensaje || (respuesta.ok ? 'Pago registrado.' : 'No se pudo registrar el pago.'));
    if (respuesta.ok && detalle) { await cargar(); await abrirDetalle(detalle.id); }
  };

  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel">
    <div className="preview-header"><div><p className="hero-label">Operación diaria</p><h2>Préstamos de la cooperativa</h2><span>Registra préstamos aprobados fuera del sistema y cobra cada parcialidad.</span></div></div>
    {mensaje && <p className="hero-label">{mensaje}</p>}
    <section className="panel soft"><div className="panel-header"><div><p className="panel-title">Registrar préstamo aprobado</p><span>El sistema crea automáticamente las parcialidades mensuales con la tasa configurada.</span></div></div>
      <form onSubmit={(evento) => void crear(evento)} className="form-grid">
        <label className="field-card"><span>Socio</span><select required value={socioId} onChange={(evento) => setSocioId(evento.target.value)}><option value="">Selecciona un Socio</option>{socios.map((socio) => <option key={socio.id} value={socio.id}>{socio.nombre}</option>)}</select></label>
        <label className="field-card"><span>Nombre o propósito</span><input required value={nombre} onChange={(evento) => setNombre(evento.target.value)} /></label>
        <label className="field-card"><span>Monto aprobado</span><input required type="number" min="0.01" step="0.01" value={monto} onChange={(evento) => setMonto(evento.target.value)} /></label>
        <label className="field-card"><span>Plazo (meses)</span><input required type="number" min="1" step="1" value={plazoMeses} onChange={(evento) => setPlazoMeses(evento.target.value)} /></label>
        <label className="field-card"><span>Fecha de desembolso</span><input required type="date" value={fechaDesembolso} onChange={(evento) => setFechaDesembolso(evento.target.value)} /></label>
        <button className="primary-pill" type="submit">Registrar préstamo</button>
      </form>
    </section>
    <section className="panel" style={{ marginTop: 20 }}><div className="panel-header"><div><p className="panel-title">Préstamos registrados</p><span>Selecciona uno para consultar y cobrar sus parcialidades.</span></div></div><div className="table-box">
      {prestamos.length === 0 ? <p>No hay préstamos registrados.</p> : prestamos.map((prestamo) => <div className="table-row" key={prestamo.id}><strong>{prestamo.socio}: {prestamo.nombre}</strong><span>{moneda(prestamo.montoOriginal)} · saldo {moneda(prestamo.saldoPendiente)} · {prestamo.estado}</span><button className="secondary-button" onClick={() => void abrirDetalle(prestamo.id)}>Ver pagos</button></div>)}
    </div></section>
    {detalle && <section className="panel" style={{ marginTop: 20 }}><div className="panel-header"><div><p className="panel-title">Calendario de {detalle.socio}</p><span>{detalle.plazoMeses} parcialidades · tasa {detalle.tasa}%</span></div><button className="secondary-button" onClick={() => setDetalle(null)}>Cerrar</button></div><div className="table-box">
      {detalle.pagos.map((pago) => <div className="table-row" key={pago.id}><strong>#{pago.numero} · vence {new Date(pago.vencimiento).toLocaleDateString('es-MX')}</strong>{pago.estado === 'Pagado' ? <span>Pagado: {moneda(pago.montoPagado || 0)} {pago.tipoPago === 'Moroso' && `(incluye multa ${moneda(pago.multa)})`}</span> : <><span>Capital {moneda(pago.capital)} + interés {moneda(pago.interes)}</span><div><button className="secondary-button" onClick={() => void pagar(pago.id, 'Normal')}>Pago normal</button>{' '}<button className="primary-pill" onClick={() => void pagar(pago.id, 'Moroso')}>Pago moroso</button></div></>}</div>)}
    </div></section>}
  </section></main></div>;
}
