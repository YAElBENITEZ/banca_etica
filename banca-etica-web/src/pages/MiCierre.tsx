import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { apiFetch } from '../services/api';
import '../App.css';

interface Cierre { inicioCiclo: string; finCiclo: string; aportaciones: number; montoBruto: number; saldoPrestamo: number; descuentoPrestamo: number; montoEntregable: number; estado: string; fechaPago: string | null; montoEntregado: number | null; cierre?: null; mensaje?: string }
const moneda = (valor: number) => `$${valor.toFixed(2)}`;
export default function MiCierre() {
  const [cierre, setCierre] = useState<Cierre | null>(null); const [mensaje, setMensaje] = useState('');
  useEffect(() => { void (async () => { const respuesta = await apiFetch('/api/socio/cierre'); const datos = await respuesta.json() as Cierre; if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudo consultar el cierre.'); return; } setCierre(datos.cierre === null ? null : datos); })(); }, []);
  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel"><div className="preview-header"><div><p className="hero-label">Mi cooperativa</p><h2>Cierre del ciclo</h2><span>Tu resultado aparece cuando la Tesorería finaliza el ciclo.</span></div></div>{mensaje && <p className="hero-label">{mensaje}</p>}{!cierre ? <section className="panel"><p>El ciclo continúa activo o todavía no se ha generado tu distribución.</p></section> : <><div className="preview-layout"><section className="stat-card"><p>Mis aportaciones</p><strong>{moneda(cierre.aportaciones)}</strong></section><section className="stat-card"><p>Total correspondiente</p><strong>{moneda(cierre.montoBruto)}</strong></section><section className="stat-card"><p>Descuento por préstamo</p><strong>{moneda(cierre.descuentoPrestamo)}</strong></section><section className="stat-card"><p>Monto a recibir</p><strong>{moneda(cierre.montoEntregable)}</strong></section></div><section className="panel" style={{ marginTop: 20 }}><p><strong>Estado: {cierre.estado}</strong>{cierre.fechaPago && ` · Entregado el ${new Date(cierre.fechaPago).toLocaleDateString('es-MX')}`}</p></section></>}</section></main></div>;
}
