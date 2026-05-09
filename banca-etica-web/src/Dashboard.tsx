import { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface Transaction {
  id: number;
  date: string;
  type: 'Recibido' | 'Enviado';
  description: string;
  amount: number;
}

const initialTransactions: Transaction[] = [
  { id: 1, date: '2026-04-15', type: 'Recibido', description: 'Deposito a mi ahorro cooperativo', amount: 23950.0 },
  { id: 2, date: '2026-04-14', type: 'Enviado', description: 'Pago con QR en tienda local', amount: 8500.0 },
  { id: 3, date: '2026-04-12', type: 'Enviado', description: 'Abono a mi prestamo', amount: 1200.0 },
];

const quickSections = [
  {
    title: 'Que puedes hacer',
    items: ['Ver saldo', 'Ver movimientos', 'Enviar dinero', 'Recibir dinero', 'Pagar con QR'],
  },
  {
    title: 'Ahorro y prestamos',
    items: ['Mis ahorros', 'Solicitar prestamo', 'Estado de mi prestamo', 'Aportes programados'],
  },
  {
    title: 'Mi cuenta',
    items: ['Mi perfil', 'Notificaciones', 'Seguridad', 'Configuracion'],
  },
  {
    title: 'Comunidad y ayuda',
    items: ['Socios', 'Beneficios', 'Contacto', 'Ayuda'],
  },
];

export default function Dashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [formMonto, setFormMonto] = useState<string>('');
  const [formTipo, setFormTipo] = useState<'Recibido' | 'Enviado'>('Recibido');
  const [formDesc, setFormDesc] = useState<string>('');

  const totals = useMemo(() => {
    let recibido = 0;
    let enviado = 0;

    transactions.forEach((tx) => {
      if (tx.type === 'Recibido') recibido += tx.amount;
      else enviado += tx.amount;
    });

    return {
      balance: recibido - enviado,
      chartData: [
        { name: 'Recibido', value: recibido },
        { name: 'Enviado', value: enviado },
      ],
    };
  }, [transactions]);

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(formMonto);

    if (isNaN(montoNum) || montoNum <= 0 || !formDesc.trim()) {
      alert('Completa un monto valido y una descripcion.');
      return;
    }

    const newTx: Transaction = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      type: formTipo,
      description: formDesc.trim(),
      amount: montoNum,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setFormMonto('');
    setFormDesc('');
  };

  const colors = {
    sidebarBg: '#004d40',
    sidebarText: '#b2dfdb',
    activeNav: '#e0f2f1',
    activeText: '#00695c',
    teal: '#00796b',
    tealDark: '#004d40',
    textMain: '#374151',
    bgMain: '#f9fafb',
  };

  const s = {
    layout: { display: 'flex', minHeight: '100vh', width: '100%', fontFamily: 'system-ui, -apple-system, sans-serif' },
    sidebar: { width: '260px', background: colors.sidebarBg, color: colors.sidebarText, display: 'flex', flexDirection: 'column', padding: '1.5rem 1rem' },
    logo: { fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: '12px' },
    navItem: (active = false) => ({
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '0.85rem 1rem',
      borderRadius: '8px',
      cursor: 'pointer',
      background: active ? colors.activeNav : 'transparent',
      color: active ? colors.activeText : colors.sidebarText,
      fontWeight: active ? '600' : '400',
      textDecoration: 'none',
      marginBottom: '0.5rem',
      transition: 'all 0.2s',
    }),
    icon: { width: '24px', textAlign: 'center', fontSize: '1.1rem' },
    main: { flex: 1, background: colors.bgMain, padding: '2rem 3rem', overflowY: 'auto' },
    header: { marginBottom: '2rem' },
    cardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' },
    widgetCard: { background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    cardTitle: { fontSize: '1rem', color: colors.textMain, margin: '0 0 1rem 0', fontWeight: '600' },
    balanceVal: { fontSize: '2.5rem', fontWeight: 'bold', color: '#111827', margin: 0 },
    chartContainer: { height: '300px', width: '100%' },
    form: { display: 'flex', flexDirection: 'column', gap: '1rem' },
    input: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem' },
    select: { padding: '0.75rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '1rem', background: 'white' },
    button: { background: colors.teal, color: 'white', padding: '0.75rem', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
    sectionGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '2rem', marginBottom: '0.25rem' },
    sectionTitle: { fontSize: '1rem', color: '#6b7280', margin: '0 0 0.75rem 0', fontWeight: '500' },
    sectionList: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' },
    sectionItem: { color: '#111827', fontSize: '1rem', fontWeight: '500' },
    table: { width: '100%', borderCollapse: 'collapse', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' },
    th: { textAlign: 'left', padding: '1rem', borderBottom: '2px solid #e5e7eb', color: '#6b7280', fontSize: '0.875rem' },
    td: { padding: '1rem', borderBottom: '1px solid #f3f4f6', color: colors.textMain },
  };

  return (
    <div style={s.layout as any}>
      <aside style={s.sidebar as any}>
        <div style={s.logo}>
          <i className="fa-solid fa-leaf" style={{ fontSize: '1.5rem' }}></i> Banca Etica
        </div>
        <nav>
          <a href="#" style={s.navItem(true)}>
            <i className="fa-solid fa-house" style={s.icon as any}></i> Inicio
          </a>
          <a href="#" style={s.navItem(false)}>
            <i className="fa-solid fa-money-bill-transfer" style={s.icon as any}></i> Enviar dinero
          </a>
          <a href="#" style={s.navItem(false)}>
            <i className="fa-solid fa-wallet" style={s.icon as any}></i> Mis ahorros
          </a>
          <a href="#" style={s.navItem(false)}>
            <i className="fa-solid fa-file-invoice-dollar" style={s.icon as any}></i> Mi prestamo
          </a>
          <a href="#" style={s.navItem(false)}>
            <i className="fa-solid fa-user" style={s.icon as any}></i> Mi cuenta
          </a>
        </nav>
        <div style={{ marginTop: 'auto', textAlign: 'center', fontSize: '0.8rem', opacity: 0.7 }}>
          Tu banca cooperativa
        </div>
      </aside>

      <main style={s.main as any}>
        <header style={s.header}>
          <h2 style={{ margin: 0, color: '#111827' }}>Hola, Yael</h2>
          <p style={{ margin: 0, color: '#6b7280' }}>Aqui puedes revisar tu dinero y hacer tus movimientos del dia.</p>
        </header>

        <section style={s.widgetCard}>
          <div style={s.sectionGrid as any}>
            {quickSections.map((section) => (
              <div key={section.title}>
                <h3 style={s.sectionTitle}>{section.title}</h3>
                <ul style={s.sectionList as any}>
                  {section.items.map((item) => (
                    <li key={item} style={s.sectionItem}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <div style={s.cardGrid}>
          <div style={s.widgetCard}>
            <h3 style={s.cardTitle}>Mi saldo disponible</h3>
            <p style={s.balanceVal}>${totals.balance.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>

        <div style={{ ...s.cardGrid, gridTemplateColumns: '2fr 1fr' }}>
          <div style={s.widgetCard}>
            <h3 style={s.cardTitle}>Resumen de mis movimientos</h3>
            <div style={s.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={totals.chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} hide />
                  <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {totals.chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? colors.teal : colors.tealDark} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div style={s.widgetCard}>
            <h3 style={s.cardTitle}>Registrar movimiento</h3>
            <form style={s.form as any} onSubmit={handleSimulate}>
              <input type="number" placeholder="Monto" value={formMonto} onChange={(e) => setFormMonto(e.target.value)} style={s.input} />
              <select value={formTipo} onChange={(e) => setFormTipo(e.target.value as 'Recibido' | 'Enviado')} style={s.select}>
                <option value="Recibido">Dinero que recibi</option>
                <option value="Enviado">Dinero que envie</option>
              </select>
              <input type="text" placeholder="Descripcion" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} style={s.input} />
              <button type="submit" style={s.button}>
                <i className="fa-solid fa-paper-plane" style={{ marginRight: '8px' }}></i>
                Guardar movimiento
              </button>
            </form>
          </div>
        </div>

        <h3 style={{ ...s.cardTitle, marginTop: '2rem' }}>Mis ultimos movimientos</h3>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Fecha</th>
              <th style={s.th}>Tipo</th>
              <th style={s.th}>Descripcion</th>
              <th style={s.th}>Monto</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id}>
                <td style={s.td}>{tx.date}</td>
                <td style={s.td}>
                  <span
                    style={{
                      background: tx.type === 'Recibido' ? '#ecfdf5' : '#fef2f2',
                      color: tx.type === 'Recibido' ? '#065f46' : '#991b1b',
                      padding: '0.35rem 0.6rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                    }}
                  >
                    <i className={tx.type === 'Recibido' ? 'fa-solid fa-arrow-down' : 'fa-solid fa-arrow-up'} style={{ marginRight: '6px' }}></i>
                    {tx.type}
                  </span>
                </td>
                <td style={s.td}>{tx.description}</td>
                <td style={{ ...s.td, fontWeight: '600' }}>
                  {tx.type === 'Enviado' ? '-' : ''}${tx.amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </main>
    </div>
  );
}
