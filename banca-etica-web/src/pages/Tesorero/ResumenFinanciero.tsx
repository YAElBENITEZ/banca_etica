import { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';
import '../../App.css';

interface Resumen { totalAportaciones: number; totalPrestamosOtorgados: number; totalPagosRecibidos: number; interesesCobrados: number; multasCobradas: number; saldoPrestamosPendiente: number; totalRecaudado: number; ultimoRendimientoGenerado: number; fechaUltimoCierre: string | null; mensaje?: string }
const moneda = (valor: number) => `$${valor.toFixed(2)}`;
export default function ResumenFinanciero() {
  const [resumen, setResumen] = useState<Resumen | null>(null); const [mensaje, setMensaje] = useState('');
  useEffect(() => { void (async () => { const respuesta = await apiFetch('/api/tesorero/resumen-financiero'); const datos = await respuesta.json() as Resumen; if (!respuesta.ok) { setMensaje(datos.mensaje || 'No se pudo cargar el resumen.'); return; } setResumen(datos); })(); }, []);
  const tarjetas = resumen ? [['Aportaciones recaudadas', resumen.totalAportaciones], ['Préstamos otorgados', resumen.totalPrestamosOtorgados], ['Pagos recibidos', resumen.totalPagosRecibidos], ['Saldo de préstamos', resumen.saldoPrestamosPendiente], ['Intereses cobrados', resumen.interesesCobrados], ['Multas cobradas', resumen.multasCobradas], ['Total recaudado', resumen.totalRecaudado], ['Rendimiento del último cierre', resumen.ultimoRendimientoGenerado]] : [];
  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel"><div className="preview-header"><div><p className="hero-label">Estado de la cooperativa</p><h2>Resumen financiero</h2><span>Concentrado de las operaciones registradas hasta este momento.</span></div></div>{mensaje && <p className="hero-label">{mensaje}</p>}{resumen && <><div className="preview-layout">{tarjetas.map(([titulo, monto]) => <section className="stat-card" key={titulo as string}><p>{titulo as string}</p><strong>{moneda(monto as number)}</strong></section>)}</div>{resumen.fechaUltimoCierre && <p className="hero-label">Último cierre: {new Date(resumen.fechaUltimoCierre).toLocaleDateString('es-MX')}</p>}</>}</section></main></div>;
}
