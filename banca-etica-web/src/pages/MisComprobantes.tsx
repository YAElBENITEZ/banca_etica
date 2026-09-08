import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { apiFetch } from '../services/api';
import '../App.css';

interface Comprobante { id: string; tipo: string; fecha: string; monto: number; concepto: string }
export default function MisComprobantes() {
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([]); const [mensaje, setMensaje] = useState('');
  useEffect(() => { void (async () => { const respuesta = await apiFetch('/api/socio/comprobantes'); const datos = await respuesta.json() as Comprobante[] & { mensaje?: string }; if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudieron cargar los comprobantes.'); return; } setComprobantes(datos.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())); })(); }, []);
  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel"><div className="preview-header"><div><p className="hero-label">Mis documentos</p><h2>Comprobantes</h2><span>Consulta el número de operación, fecha, concepto y monto de cada registro.</span></div></div>{mensaje && <p className="hero-label">{mensaje}</p>}<section className="panel"><div className="table-box">{comprobantes.length === 0 ? <p>No hay comprobantes disponibles.</p> : comprobantes.map((comprobante) => <div className="table-row" key={comprobante.id}><strong>{comprobante.tipo}</strong><span>{comprobante.concepto} · {new Date(comprobante.fecha).toLocaleDateString('es-MX')} · operación {comprobante.id.slice(0, 8).toUpperCase()}</span><strong>${comprobante.monto.toFixed(2)}</strong></div>)}</div></section></section></main></div>;
}
