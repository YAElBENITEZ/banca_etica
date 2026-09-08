import { useEffect, useMemo, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { apiFetch } from '../services/api';
import '../App.css';

interface Operacion { tipo: string; fecha: string; monto: number; detalle: string }

export default function MiHistorial() {
  const [operaciones, setOperaciones] = useState<Operacion[]>([]);
  const [filtro, setFiltro] = useState('Todas');
  const [mensaje, setMensaje] = useState('');
  useEffect(() => { void (async () => { const respuesta = await apiFetch('/api/socio/historial'); const datos = await respuesta.json() as Operacion[] & { mensaje?: string }; if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudo cargar tu historial.'); return; } setOperaciones(datos); })(); }, []);
  const visibles = useMemo(() => filtro === 'Todas' ? operaciones : operaciones.filter((operacion) => operacion.tipo === filtro), [filtro, operaciones]);
  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel"><div className="preview-header"><div><p className="hero-label">Mi cooperativa</p><h2>Mi historial financiero</h2><span>Consulta las operaciones registradas por Tesorería.</span></div></div>{mensaje && <p className="hero-label">{mensaje}</p>}<div className="top-links">{['Todas', 'Aportación', 'Préstamo', 'Pago'].map((tipo) => <button key={tipo} className={`ghost-link ${filtro === tipo ? 'active' : ''}`} onClick={() => setFiltro(tipo)}>{tipo === 'Todas' ? 'Todas' : `${tipo}s`}</button>)}</div><section className="panel" style={{ marginTop: 20 }}><div className="table-box">{visibles.length === 0 ? <p>No hay operaciones para mostrar.</p> : visibles.map((operacion, indice) => <div className="table-row" key={`${operacion.tipo}-${operacion.fecha}-${indice}`}><strong>{operacion.tipo}</strong><span>{operacion.detalle} · {new Date(operacion.fecha).toLocaleDateString('es-MX')}</span><strong>${operacion.monto.toFixed(2)}</strong></div>)}</div></section></section></main></div>;
}
