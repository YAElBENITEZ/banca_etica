import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { apiFetch } from '../services/api';
import '../App.css';

interface Pago { numero: number; vencimiento: string; capital: number; interes: number; montoPagado: number; multa: number; tipoPago: string; estado: string }
interface Prestamo { id: string; proposito: string; montoOriginal: number; tasa: number; plazoMeses: number; tipoInteres: string; estado: string; fechaDesembolso: string; cajitaNombre: string; saldoPendiente: number; pagos: Pago[] }
const moneda = (valor: number) => `$${valor.toFixed(2)}`;

export default function Prestamos() {
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');
  const cargar = async () => {
    const respuesta = await apiFetch('/api/prestamo');
    const datos = await respuesta.json() as Prestamo[] & { mensaje?: string };
    if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudieron cargar tus préstamos.'); return; }
    setPrestamos(datos);
  };
  useEffect(() => { void cargar(); }, []);
  const deudaTotal = prestamos.reduce((total, prestamo) => total + prestamo.saldoPendiente, 0);

  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel">
    <div className="preview-header"><div><p className="hero-label">Financiamiento</p><h2>Mis préstamos</h2><span>Consulta préstamos y pagos registrados por la Tesorería. La aprobación ocurre fuera del sistema.</span></div></div>
    {mensaje && <p className="hero-label">{mensaje}</p>}
    <div className="preview-layout"><section className="stat-card"><p>Saldo pendiente</p><strong>{moneda(deudaTotal)}</strong></section><section className="stat-card"><p>Préstamos activos</p><strong>{prestamos.filter((prestamo) => prestamo.estado !== 'Liquidado').length}</strong></section></div>
    <section className="panel" style={{ marginTop: 20 }}><div className="panel-header"><div><p className="panel-title">Historial de financiamientos</p><span>Selecciona un préstamo para consultar su tabla de pagos.</span></div></div><div className="table-box">
      {prestamos.length === 0 ? <p>No tienes préstamos registrados.</p> : prestamos.map((prestamo) => <div key={prestamo.id} className="table-row"><strong>{prestamo.proposito}</strong><span>{moneda(prestamo.montoOriginal)} · saldo {moneda(prestamo.saldoPendiente)} · {prestamo.estado}</span><button className="secondary-button" onClick={() => setSeleccionado(seleccionado === prestamo.id ? null : prestamo.id)}>{seleccionado === prestamo.id ? 'Ocultar pagos' : 'Ver pagos'}</button>{seleccionado === prestamo.id && <div className="table-box" style={{ gridColumn: '1 / -1' }}>{prestamo.pagos.map((pago) => <div className="table-row" key={pago.numero}><strong>#{pago.numero} · {new Date(pago.vencimiento).toLocaleDateString('es-MX')}</strong><span>{pago.estado === 'Pagado' ? `Pagado ${moneda(pago.montoPagado)}${pago.tipoPago === 'Moroso' ? ` (multa ${moneda(pago.multa)})` : ''}` : `Capital ${moneda(pago.capital)} + interés ${moneda(pago.interes)}`}</span></div>)}</div>}</div>)}
    </div></section>
  </section></main></div>;
}
