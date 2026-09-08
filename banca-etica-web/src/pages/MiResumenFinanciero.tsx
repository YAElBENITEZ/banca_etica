import { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import { apiFetch } from '../services/api';
import '../App.css';

interface Resumen { totalAportado: number; numeroAportaciones: number; totalPrestamosOtorgados: number; totalPagadoPrestamos: number; saldoPrestamosPendiente: number; interesesPagados: number; multasPagadas: number; mensaje?: string }
const moneda = (valor: number) => `$${valor.toFixed(2)}`;
export default function MiResumenFinanciero() {
  const [resumen, setResumen] = useState<Resumen | null>(null); const [mensaje, setMensaje] = useState('');
  useEffect(() => { void (async () => { const respuesta = await apiFetch('/api/socio/resumen-financiero'); const datos = await respuesta.json() as Resumen; if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudo cargar tu resumen.'); return; } setResumen(datos); })(); }, []);
  const tarjetas = resumen ? [['Total aportado', resumen.totalAportado], ['Aportaciones registradas', resumen.numeroAportaciones, true], ['Préstamos otorgados', resumen.totalPrestamosOtorgados], ['Total pagado', resumen.totalPagadoPrestamos], ['Saldo pendiente', resumen.saldoPrestamosPendiente], ['Intereses pagados', resumen.interesesPagados], ['Multas pagadas', resumen.multasPagadas]] : [];
  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel"><div className="preview-header"><div><p className="hero-label">Mi situación financiera</p><h2>Mi resumen financiero</h2><span>Información consolidada de tus operaciones registradas.</span></div></div>{mensaje && <p className="hero-label">{mensaje}</p>}{resumen && <div className="preview-layout">{tarjetas.map(([titulo, valor, entero]) => <section className="stat-card" key={titulo as string}><p>{titulo as string}</p><strong>{entero ? valor as number : moneda(valor as number)}</strong></section>)}</div>}</section></main></div>;
}
