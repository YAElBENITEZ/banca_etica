import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import Sidebar from '../../components/Sidebar';
import { apiFetch } from '../../services/api';
import '../../App.css';

interface Periodo { inicio: string; etiqueta: string }
interface Socio { id: string; nombre: string; monto: number | null }
interface Bitacora { socios: Socio[]; totalRecaudado: number; registrados: number; pendientes: number }

export default function AportacionesTesorero() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodo, setPeriodo] = useState('');
  const [bitacora, setBitacora] = useState<Bitacora | null>(null);
  const [montos, setMontos] = useState<Record<string, string>>({});
  const [mensaje, setMensaje] = useState('');

  const cargarBitacora = async (inicio: string) => {
    if (!inicio) return;
    const response = await apiFetch(`/api/tesorero/aportaciones/bitacora?inicio=${encodeURIComponent(inicio)}`);
    const data = await response.json() as Bitacora & { mensaje?: string };
    if (!response.ok) { setMensaje(data.mensaje || 'No se pudo cargar la bitácora.'); return; }
    setBitacora(data);
    setMontos(Object.fromEntries(data.socios.map((socio) => [socio.id, socio.monto?.toString() || ''])));
  };

  useEffect(() => { void (async () => {
    const response = await apiFetch('/api/tesorero/aportaciones/periodos');
    const data = await response.json() as Periodo[] & { mensaje?: string };
    if (!response.ok) { setMensaje(data.mensaje || 'No se pudieron cargar los periodos.'); return; }
    setPeriodos(data);
    if (data.length) { setPeriodo(data[0].inicio); await cargarBitacora(data[0].inicio); }
  })(); }, []);

  const registrar = async (event: FormEvent, socioId: string) => {
    event.preventDefault();
    const monto = Number(montos[socioId]);
    const response = await apiFetch('/api/tesorero/aportaciones', { method: 'POST', body: JSON.stringify({ socioId, inicioPeriodo: periodo, monto }) });
    const data = await response.json() as { mensaje?: string };
    setMensaje(data.mensaje || (response.ok ? 'Aportación registrada.' : 'No se pudo registrar.'));
    if (response.ok) await cargarBitacora(periodo);
  };

  return <div className="app-shell"><Sidebar /><main className="main-shell"><section className="preview-panel">
    <div className="preview-header"><div><p className="hero-label">Operación diaria</p><h2>Aportaciones</h2><span>Registra las aportaciones reales de cada Socio para el periodo seleccionado.</span></div></div>
    <label className="field-card" style={{ maxWidth: 440 }}><span>Periodo</span><select value={periodo} onChange={(event) => { setPeriodo(event.target.value); void cargarBitacora(event.target.value); }}><option value="">Selecciona un periodo</option>{periodos.map((item) => <option key={item.inicio} value={item.inicio}>{item.etiqueta}</option>)}</select></label>
    {mensaje && <p className="hero-label">{mensaje}</p>}
    {bitacora && <><div className="preview-layout"><section className="stat-card"><p>Total recaudado</p><strong>${bitacora.totalRecaudado.toFixed(2)}</strong></section><section className="stat-card"><p>Socios registrados</p><strong>{bitacora.registrados}</strong></section><section className="stat-card"><p>Pendientes</p><strong>{bitacora.pendientes}</strong></section></div>
    <section className="panel" style={{ marginTop: 20 }}><div className="panel-header"><div><p className="panel-title">Bitácora del periodo</p><span>Una aportación por Socio. Las reglas de monto se validan al guardar.</span></div></div><div className="table-box">{bitacora.socios.map((socio) => <form className="table-row" key={socio.id} onSubmit={(event) => void registrar(event, socio.id)}><strong>{socio.nombre}</strong>{socio.monto !== null ? <span>${socio.monto.toFixed(2)} registrado</span> : <><input type="number" min="0.01" step="0.01" placeholder="Monto" value={montos[socio.id] || ''} onChange={(event) => setMontos({ ...montos, [socio.id]: event.target.value })} /><button className="primary-pill" type="submit">Registrar</button></>}</form>)}</div></section></>}
  </section></main></div>;
}
