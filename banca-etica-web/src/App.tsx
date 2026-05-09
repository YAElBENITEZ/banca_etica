import { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

type AppStage = 'landing' | 'auth' | 'onboarding' | 'workspace'
type AuthView = 'login' | 'register' | 'recovery' | 'verify'
type Surface = 'Web' | 'Movil'
type Category = 'Todos' | 'Acceso' | 'Finanzas' | 'Cobros' | 'Prestamos' | 'Comunidad' | 'Cuenta'

type Screen = {
  id: string
  title: string
  category: Exclude<Category, 'Todos'>
  surface: Surface
  badge: 'Nueva' | 'Base' | 'Lista'
  description: string
  tabs: string[]
  metrics: { label: string; value: string; hint: string }[]
}

type ActionEvent =
  | { type: 'screen'; screenId: string; note: string }
  | { type: 'modal'; modal: ModalState; note: string }
  | { type: 'toast'; note: string }

type ModalState =
  | null
  | { title: string; body: string; primary: string; secondary?: string }

const navItems = [
  { label: 'Inicio', category: 'Finanzas' as Category, screenId: 'dashboard' },
  { label: 'Cobros', category: 'Cobros' as Category, screenId: 'qrCreate' },
  { label: 'Prestamos', category: 'Prestamos' as Category, screenId: 'loansList' },
  { label: 'Comunidad', category: 'Comunidad' as Category, screenId: 'membersList' },
  { label: 'Cuenta', category: 'Cuenta' as Category, screenId: 'profile' },
]

const screens: Screen[] = [
  {
    id: 'dashboard',
    title: 'Inicio',
    category: 'Finanzas',
    surface: 'Web',
    badge: 'Base',
    description: 'Resumen diario con saldo, alertas y actividad reciente.',
    tabs: ['Resumen', 'Actividad', 'Alertas'],
    metrics: [
      { label: 'Saldo disponible', value: '$124,500', hint: 'Actualizado hace 2 min' },
      { label: 'Aportes del mes', value: '$28,400', hint: '+14% frente al mes pasado' },
      { label: 'Prestamos activos', value: '18', hint: '3 requieren seguimiento' },
    ],
  },
  {
    id: 'wallet',
    title: 'Billetera digital',
    category: 'Finanzas',
    surface: 'Movil',
    badge: 'Base',
    description: 'Saldo, cuentas guardadas, retiros y fondeo.',
    tabs: ['Saldo', 'Tarjetas', 'Limites'],
    metrics: [
      { label: 'Saldo principal', value: '$34,820', hint: 'Disponible para retiro' },
      { label: 'Fondo comunitario', value: '$270,000', hint: '81% de la meta cubierta' },
      { label: 'Movimientos del dia', value: '12', hint: '2 por confirmar' },
    ],
  },
  {
    id: 'movements',
    title: 'Movimientos',
    category: 'Finanzas',
    surface: 'Web',
    badge: 'Lista',
    description: 'Consulta general con filtros, conciliacion y exportacion.',
    tabs: ['Todos', 'Ingresos', 'Egresos'],
    metrics: [
      { label: 'Transacciones', value: '1,284', hint: 'Ultimos 30 dias' },
      { label: 'Conciliadas', value: '96%', hint: '52 siguen en revision' },
      { label: 'Monto total', value: '$1.9M', hint: 'Incluye ahorro y prestamos' },
    ],
  },
  {
    id: 'movementDetail',
    title: 'Detalle de movimiento',
    category: 'Finanzas',
    surface: 'Web',
    badge: 'Nueva',
    description: 'Informacion de una operacion, comprobante y trazabilidad.',
    tabs: ['Detalle', 'Comprobante', 'Seguimiento'],
    metrics: [
      { label: 'Monto', value: '$4,800', hint: 'Cobro QR confirmado' },
      { label: 'Referencia', value: 'MXP-2041', hint: 'Generada automaticamente' },
      { label: 'Estado', value: 'Confirmado', hint: 'Sin incidencias' },
    ],
  },
  {
    id: 'transferCreate',
    title: 'Nueva transferencia',
    category: 'Finanzas',
    surface: 'Web',
    badge: 'Nueva',
    description: 'Formulario para enviar dinero entre cuentas o socios.',
    tabs: ['Datos', 'Revision', 'Confirmacion'],
    metrics: [
      { label: 'Cuenta origen', value: 'Principal', hint: 'Saldo suficiente' },
      { label: 'Limite diario', value: '$50,000', hint: 'Disponible hoy' },
      { label: 'Comision', value: '$0', hint: 'Sin costo interno' },
    ],
  },
  {
    id: 'qrCreate',
    title: 'Cobro QR',
    category: 'Cobros',
    surface: 'Movil',
    badge: 'Base',
    description: 'Generacion de cobro con QR y vista de confirmacion.',
    tabs: ['Nuevo cobro', 'Compartir', 'Confirmacion'],
    metrics: [
      { label: 'Cobros de hoy', value: '$18,620', hint: '9 operaciones realizadas' },
      { label: 'Tiempo promedio', value: '42 seg', hint: 'Desde generar hasta cobrar' },
      { label: 'Pendientes', value: '3', hint: 'Caducan en 15 min' },
    ],
  },
  {
    id: 'qrHistory',
    title: 'Historial de cobros',
    category: 'Cobros',
    surface: 'Movil',
    badge: 'Lista',
    description: 'Cobros recientes, estatus y acciones de seguimiento.',
    tabs: ['Todos', 'Pendientes', 'Cancelados'],
    metrics: [
      { label: 'Confirmados', value: '28', hint: 'Ultima semana' },
      { label: 'Pendientes', value: '3', hint: 'Revisar hoy' },
      { label: 'Monto total', value: '$92,300', hint: 'Ultimos 7 dias' },
    ],
  },
  {
    id: 'savingsList',
    title: 'Ahorro cooperativo',
    category: 'Comunidad',
    surface: 'Web',
    badge: 'Base',
    description: 'Cajas de ahorro activas, reglas y avance de aportaciones.',
    tabs: ['Cajas', 'Aportaciones', 'Reglamento'],
    metrics: [
      { label: 'Cajas activas', value: '6', hint: '2 cierran esta semana' },
      { label: 'Monto reunido', value: '$418,000', hint: '63% de la meta anual' },
      { label: 'Socios al corriente', value: '87%', hint: '12 con atraso leve' },
    ],
  },
  {
    id: 'savingDetail',
    title: 'Detalle de caja',
    category: 'Comunidad',
    surface: 'Web',
    badge: 'Nueva',
    description: 'Calendario, socios, aportaciones y saldo de una caja.',
    tabs: ['Resumen', 'Socios', 'Historial'],
    metrics: [
      { label: 'Caja', value: 'Primavera', hint: '18 socios' },
      { label: 'Saldo', value: '$120,000', hint: 'Corte al dia' },
      { label: 'Siguiente cierre', value: '28 Mayo', hint: 'Faltan 20 dias' },
    ],
  },
  {
    id: 'membersList',
    title: 'Socios',
    category: 'Comunidad',
    surface: 'Web',
    badge: 'Base',
    description: 'Directorio, grupos, expedientes y documentos.',
    tabs: ['Directorio', 'Grupos', 'Documentos'],
    metrics: [
      { label: 'Socios activos', value: '146', hint: '8 siguen en registro' },
      { label: 'Documentos completos', value: '91%', hint: '13 siguen pendientes' },
      { label: 'Grupos rurales', value: '12', hint: 'Cobertura en 5 zonas' },
    ],
  },
  {
    id: 'memberProfile',
    title: 'Perfil del socio',
    category: 'Comunidad',
    surface: 'Web',
    badge: 'Nueva',
    description: 'Datos del socio, historial y documentos personales.',
    tabs: ['Perfil', 'Historial', 'Documentos'],
    metrics: [
      { label: 'Estado', value: 'Activo', hint: 'Sin bloqueos' },
      { label: 'Grupo', value: 'Sierra Mixteca', hint: 'Tesorero asignado' },
      { label: 'Aporte actual', value: '$650', hint: 'Registrado esta semana' },
    ],
  },
  {
    id: 'education',
    title: 'Educacion financiera',
    category: 'Comunidad',
    surface: 'Movil',
    badge: 'Lista',
    description: 'Cursos breves, progreso del socio y recordatorios.',
    tabs: ['Cursos', 'Evaluaciones', 'Certificados'],
    metrics: [
      { label: 'Lecciones activas', value: '24', hint: '3 nuevas este mes' },
      { label: 'Avance promedio', value: '68%', hint: 'Meta mensual 75%' },
      { label: 'Socios certificados', value: '54', hint: '11 esta semana' },
    ],
  },
  {
    id: 'loansList',
    title: 'Prestamos',
    category: 'Prestamos',
    surface: 'Web',
    badge: 'Base',
    description: 'Solicitudes, aprobaciones, mora y calendario de pago.',
    tabs: ['Solicitudes', 'Calendario', 'Mora'],
    metrics: [
      { label: 'Colocacion activa', value: '$812,000', hint: '34 expedientes vigentes' },
      { label: 'Mora temprana', value: '5.4%', hint: 'Bajo control' },
      { label: 'Por aprobar', value: '9', hint: '4 urgentes hoy' },
    ],
  },
  {
    id: 'loanRequest',
    title: 'Solicitud de prestamo',
    category: 'Prestamos',
    surface: 'Web',
    badge: 'Nueva',
    description: 'Captura de monto, motivo, plazo y evaluacion inicial.',
    tabs: ['Solicitud', 'Revision', 'Envio'],
    metrics: [
      { label: 'Monto sugerido', value: '$15,000', hint: 'Segun historial del socio' },
      { label: 'Plazo', value: '6 meses', hint: 'Con pagos quincenales' },
      { label: 'Decision estimada', value: '24 h', hint: 'Si la documentacion esta completa' },
    ],
  },
  {
    id: 'loanDetail',
    title: 'Detalle de prestamo',
    category: 'Prestamos',
    surface: 'Web',
    badge: 'Lista',
    description: 'Calendario de pagos, reprogramaciones y expediente.',
    tabs: ['Resumen', 'Pagos', 'Documentos'],
    metrics: [
      { label: 'Saldo pendiente', value: '$9,200', hint: '4 cuotas por pagar' },
      { label: 'Proximo pago', value: '14 Mayo', hint: '$1,150' },
      { label: 'Estado', value: 'Al corriente', hint: 'Sin atraso' },
    ],
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    category: 'Cuenta',
    surface: 'Movil',
    badge: 'Lista',
    description: 'Mensajes, recordatorios y canales de comunicacion.',
    tabs: ['Mensajes', 'Plantillas', 'Canales'],
    metrics: [
      { label: 'Sin leer', value: '14', hint: '5 requieren atencion' },
      { label: 'Entregadas', value: '98.2%', hint: 'Push, SMS y correo' },
      { label: 'Plantillas activas', value: '18', hint: '2 por actualizar' },
    ],
  },
  {
    id: 'profile',
    title: 'Perfil y ajustes',
    category: 'Cuenta',
    surface: 'Web',
    badge: 'Base',
    description: 'Datos del usuario, seguridad, permisos y sesiones.',
    tabs: ['Perfil', 'Seguridad', 'Permisos'],
    metrics: [
      { label: 'Roles activos', value: '3', hint: 'Operador, tesorero y admin' },
      { label: 'Dispositivos', value: '5', hint: '1 sin uso reciente' },
      { label: 'Ultimo acceso', value: '08:42', hint: 'Desde Puebla' },
    ],
  },
]

const chartData = [
  { name: 'Sem 1', ingresos: 18, egresos: 12 },
  { name: 'Sem 2', ingresos: 22, egresos: 15 },
  { name: 'Sem 3', ingresos: 20, egresos: 14 },
  { name: 'Sem 4', ingresos: 27, egresos: 19 },
]

const movementRows = [
  ['07 Mayo', 'Aporte semanal', '$1,250', 'Confirmado'],
  ['06 Mayo', 'Cobro QR lote azul', '$4,800', 'Pendiente'],
  ['05 Mayo', 'Pago de cuota', '$950', 'Confirmado'],
  ['04 Mayo', 'Prestamo temporada', '$15,000', 'Revision'],
]

const actionMap: Record<string, ActionEvent> = {
  'Ver saldo': { type: 'screen', screenId: 'wallet', note: 'Mostrando saldo y cuentas disponibles.' },
  'Registrar aporte': { type: 'screen', screenId: 'savingDetail', note: 'Listo para registrar una aportacion.' },
  'Generar cobro': { type: 'screen', screenId: 'qrCreate', note: 'Pantalla de cobro lista.' },
  'Ver movimientos': { type: 'screen', screenId: 'movements', note: 'Abriendo historial de movimientos.' },
  Filtrar: { type: 'modal', modal: { title: 'Filtros', body: 'Puedes filtrar por fecha, caja, zona o estado.', primary: 'Aplicar', secondary: 'Limpiar' }, note: 'Filtros disponibles.' },
  Exportar: { type: 'toast', note: 'Exportacion preparada para esta vista.' },
  Conciliar: { type: 'modal', modal: { title: 'Conciliar movimientos', body: 'Esta accion permite revisar operaciones pendientes y marcarlas como confirmadas.', primary: 'Continuar', secondary: 'Cancelar' }, note: 'Conciliacion abierta.' },
  'Marcar incidente': { type: 'modal', modal: { title: 'Reportar incidencia', body: 'Puedes registrar un detalle y asignarlo para revision.', primary: 'Crear reporte', secondary: 'Cerrar' }, note: 'Formulario de incidencia abierto.' },
  'Nueva solicitud': { type: 'screen', screenId: 'loanRequest', note: 'Formulario de solicitud abierto.' },
  Aprobar: { type: 'modal', modal: { title: 'Aprobar prestamo', body: 'Confirma las condiciones antes de aprobar el expediente.', primary: 'Aprobar', secondary: 'Volver' }, note: 'Revisando aprobacion.' },
  'Reprogramar pago': { type: 'screen', screenId: 'loanDetail', note: 'Calendario de pagos abierto.' },
  'Ver expediente': { type: 'screen', screenId: 'loanDetail', note: 'Expediente del prestamo abierto.' },
  'Crear caja': { type: 'modal', modal: { title: 'Crear caja', body: 'Define nombre, monto objetivo y fecha de cierre para la nueva caja.', primary: 'Continuar', secondary: 'Cancelar' }, note: 'Nueva caja lista para configurarse.' },
  'Registrar aportacion': { type: 'screen', screenId: 'savingDetail', note: 'Registro de aportacion abierto.' },
  'Asignar tesorero': { type: 'screen', screenId: 'membersList', note: 'Selecciona al tesorero desde el directorio.' },
  'Cerrar ciclo': { type: 'modal', modal: { title: 'Cerrar ciclo', body: 'Revisa el saldo final antes de cerrar esta caja de ahorro.', primary: 'Cerrar ciclo', secondary: 'Volver' }, note: 'Cierre de ciclo listo para revisarse.' },
  'Nuevo socio': { type: 'screen', screenId: 'memberProfile', note: 'Formulario del socio listo para completarse.' },
  'Asignar grupo': { type: 'screen', screenId: 'membersList', note: 'Selecciona un grupo comunitario.' },
  'Subir documento': { type: 'screen', screenId: 'memberProfile', note: 'Vista de documentos abierta.' },
  'Suspender acceso': { type: 'modal', modal: { title: 'Suspender acceso', body: 'Confirma si deseas bloquear temporalmente el acceso del socio.', primary: 'Suspender', secondary: 'Cancelar' }, note: 'Accion de bloqueo lista.' },
  'Editar perfil': { type: 'screen', screenId: 'profile', note: 'Vista de perfil abierta.' },
  'Cambiar PIN': { type: 'modal', modal: { title: 'Cambiar PIN', body: 'Ingresa un nuevo PIN de 6 digitos para esta cuenta.', primary: 'Guardar', secondary: 'Cancelar' }, note: 'Cambio de PIN abierto.' },
  'Gestionar roles': { type: 'screen', screenId: 'profile', note: 'Administracion de roles abierta.' },
  'Cerrar sesiones': { type: 'modal', modal: { title: 'Cerrar sesiones', body: 'Se cerraran otras sesiones activas de esta cuenta.', primary: 'Cerrar sesiones', secondary: 'Cancelar' }, note: 'Confirmacion solicitada.' },
}

function App() {
  const [stage, setStage] = useState<AppStage>('landing')
  const [authView, setAuthView] = useState<AuthView>('login')
  const [category, setCategory] = useState<Category>('Todos')
  const [surface, setSurface] = useState<Surface>('Web')
  const [search, setSearch] = useState('')
  const [activeScreenId, setActiveScreenId] = useState('dashboard')
  const [activeNav, setActiveNav] = useState('Inicio')
  const [toast, setToast] = useState('') 
  const [modal, setModal] = useState<ModalState>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [authForm, setAuthForm] = useState({
    name: 'Yael Torres',
    email: 'equipo@mezcalpay.mx',
    password: '123456',
    code: '458921',
  })
  const [onboardingStep, setOnboardingStep] = useState(0)
  const [channels, setChannels] = useState<string[]>(['Push', 'Correo', 'SMS'])
  const [securityOptions, setSecurityOptions] = useState<string[]>([
    '2FA',
    'PIN de 6 digitos',
    'Alertas de acceso',
  ])
  const [activeTabs, setActiveTabs] = useState<Record<string, string>>(
    Object.fromEntries(screens.map((screen) => [screen.id, screen.tabs[0]])),
  )

  const visibleScreens = useMemo(() => {
    const query = search.trim().toLowerCase()
    return screens.filter((screen) => {
      const categoryMatch = category === 'Todos' || screen.category === category
      const surfaceMatch = screen.surface === surface
      const searchMatch =
        query.length === 0 ||
        screen.title.toLowerCase().includes(query) ||
        screen.description.toLowerCase().includes(query)
      return categoryMatch && surfaceMatch && searchMatch
    })
  }, [category, search, surface])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!visibleScreens.some((screen) => screen.id === activeScreenId) && visibleScreens[0]) {
      setActiveScreenId(visibleScreens[0].id)
    }
  }, [activeScreenId, visibleScreens])

  const activeScreen =
    visibleScreens.find((screen) => screen.id === activeScreenId) ??
    screens.find((screen) => screen.id === activeScreenId) ??
    screens[0]

  const notify = (message: string) => setToast(message)

  const handleAction = (label: string) => {
    const mapped = actionMap[label]
    if (!mapped) {
      notify(`${label} listo.`)
      return
    }

    if (mapped.type === 'screen') {
      const nextScreen = screens.find((screen) => screen.id === mapped.screenId)
      if (nextScreen) {
        setSurface(nextScreen.surface)
        setCategory(nextScreen.category)
        setActiveScreenId(nextScreen.id)
        setActiveNav(resolveNav(nextScreen.category))
      }
      notify(mapped.note)
      return
    }

    if (mapped.type === 'modal') {
      setModal(mapped.modal)
      notify(mapped.note)
      return
    }

    notify(mapped.note)
  }

  const selectScreen = (screen: Screen) => {
    setActiveScreenId(screen.id)
    setActiveNav(resolveNav(screen.category))
    notify(`Ahora estas viendo ${screen.title}.`)
  }

  const selectNav = (label: string, nextCategory: Category, screenId: string) => {
    setActiveNav(label)
    setCategory(nextCategory)
    const nextScreen = screens.find((screen) => screen.id === screenId)
    if (nextScreen) {
      setSurface(nextScreen.surface)
      setActiveScreenId(nextScreen.id)
    }
    notify(`Entraste a ${label}.`)
  }

  const toggleChannel = (channel: string) => {
    setChannels((current) =>
      current.includes(channel)
        ? current.filter((item) => item !== channel)
        : [...current, channel],
    )
    notify(`Canal actualizado: ${channel}.`)
  }

  const toggleSecurity = (item: string) => {
    setSecurityOptions((current) =>
      current.includes(item)
        ? current.filter((entry) => entry !== item)
        : [...current, item],
    )
    notify(`Seguridad actualizada: ${item}.`)
  }

  const renderStage = () => {
    switch (stage) {
      case 'landing':
        return (
          <div className="landing-shell">
            <section className="landing-panel">
              <header className="landing-topbar">
                <Brand subtitle="Banca cooperativa para productores" />
                <div className="landing-links">
                  <button onClick={() => notify('Conoce los beneficios principales.')}>Beneficios</button>
                  <button onClick={() => notify('Explora los modulos disponibles.')}>Modulos</button>
                  <button onClick={() => setStage('auth')}>Ingresar</button>
                </div>
              </header>

              <div className="landing-content">
                <div className="landing-copy">
                  <span className="soft-badge">Banca simple para trabajo comunitario</span>
                  <h1>Administra ahorro, cobros y prestamos desde una sola experiencia.</h1>
                  <p>
                    MezcalPay organiza la operacion diaria de tu comunidad financiera con
                    pantallas claras para socios, tesoreria y seguimiento de pagos.
                  </p>
                  <div className="landing-actions">
                    <button className="primary-button" onClick={() => { setAuthView('register'); setStage('auth') }}>
                      Registrarse
                    </button>
                    <button className="secondary-button" onClick={() => { setAuthView('login'); setStage('auth') }}>
                      Iniciar sesion
                    </button>
                  </div>
                  <div className="landing-metrics">
                    <StatCard value="16" label="Pantallas base" />
                    <StatCard value="4" label="Recorridos principales" />
                    <StatCard value="2" label="Experiencias: web y movil" />
                  </div>
                </div>

                <div className="landing-preview-card">
                  <div className="preview-mini-card dark">
                    <small>Saldo comunitario</small>
                    <strong>$270,000</strong>
                    <span>Meta anual 81%</span>
                  </div>
                  <div className="preview-mini-grid">
                    <button className="preview-tile" onClick={() => notify('Vista de cobros lista.')}>
                      Cobro QR
                    </button>
                    <button className="preview-tile" onClick={() => notify('Vista de ahorro lista.')}>
                      Ahorro
                    </button>
                    <button className="preview-tile" onClick={() => notify('Vista de prestamos lista.')}>
                      Prestamos
                    </button>
                    <button className="preview-tile" onClick={() => notify('Vista de socios lista.')}>
                      Socios
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )

      case 'auth':
        return (
          <div className="landing-shell">
            <section className="landing-panel auth-stage">
              <header className="landing-topbar">
                <Brand subtitle="Acceso seguro" />
                <button className="secondary-button" onClick={() => setStage('landing')}>
                  Volver
                </button>
              </header>
              <div className="auth-layout">
                <div className="auth-copy">
                  <span className="soft-badge">Acceso protegido</span>
                  <h2>
                    {authView === 'login' && 'Ingresa a tu cuenta'}
                    {authView === 'register' && 'Crea tu cuenta'}
                    {authView === 'recovery' && 'Recupera tu acceso'}
                    {authView === 'verify' && 'Verifica tu identidad'}
                  </h2>
                  <p>
                    Usa este flujo como base para conectar el acceso real cuando el backend
                    este listo.
                  </p>
                </div>
                <div className="auth-card">
                  <div className="auth-tabs">
                    {['login', 'register', 'recovery'].map((view) => (
                      <button
                        key={view}
                        className={authView === view ? 'active' : ''}
                        onClick={() => setAuthView(view as AuthView)}
                      >
                        {view === 'login' ? 'Iniciar sesion' : view === 'register' ? 'Registrarse' : 'Recuperar'}
                      </button>
                    ))}
                  </div>

                  <div className="auth-fields">
                    {authView === 'register' ? (
                      <Field
                        label="Nombre completo"
                        value={authForm.name}
                        onChange={(value) => setAuthForm((current) => ({ ...current, name: value }))}
                      />
                    ) : null}
                    <Field
                      label="Correo"
                      value={authForm.email}
                      onChange={(value) => setAuthForm((current) => ({ ...current, email: value }))}
                    />
                    {authView !== 'recovery' ? (
                      <Field
                        label="Contrasena"
                        type="password"
                        value={authForm.password}
                        onChange={(value) => setAuthForm((current) => ({ ...current, password: value }))}
                      />
                    ) : null}
                    {authView === 'verify' ? (
                      <Field
                        label="Codigo"
                        value={authForm.code}
                        onChange={(value) => setAuthForm((current) => ({ ...current, code: value }))}
                      />
                    ) : null}
                  </div>

                  <button
                    className="primary-button wide"
                    onClick={() => {
                      if (authView === 'login') {
                        setAuthView('verify')
                        notify('Codigo enviado para verificar acceso.')
                        return
                      }
                      if (authView === 'register') {
                        setStage('onboarding')
                        notify('Cuenta creada. Completa tu registro.')
                        return
                      }
                      if (authView === 'recovery') {
                        setAuthView('verify')
                        notify('Te enviamos un codigo de recuperacion.')
                        return
                      }
                      setStage('workspace')
                      notify('Sesion iniciada correctamente.')
                    }}
                  >
                    {authView === 'login' && 'Continuar'}
                    {authView === 'register' && 'Crear cuenta'}
                    {authView === 'recovery' && 'Enviar codigo'}
                    {authView === 'verify' && 'Entrar'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )

      case 'onboarding':
        return (
          <div className="landing-shell">
            <section className="landing-panel onboarding-stage">
              <header className="landing-topbar">
                <Brand subtitle="Configuracion inicial" />
                <span className="soft-badge">Paso {onboardingStep + 1} de 4</span>
              </header>
              <div className="onboarding-card">
                {renderOnboardingStep(onboardingStep)}
                <div className="onboarding-actions">
                  <button
                    className="secondary-button"
                    onClick={() => {
                      if (onboardingStep === 0) {
                        setStage('auth')
                        return
                      }
                      setOnboardingStep((current) => current - 1)
                    }}
                  >
                    Volver
                  </button>
                  <button
                    className="primary-button"
                    onClick={() => {
                      if (onboardingStep === 3) {
                        setStage('workspace')
                        notify('Registro completado correctamente.')
                        return
                      }
                      setOnboardingStep((current) => current + 1)
                    }}
                  >
                    {onboardingStep === 3 ? 'Entrar al panel' : 'Continuar'}
                  </button>
                </div>
              </div>
            </section>
          </div>
        )

      default:
        return (
          <div className="app-shell">
            <aside className="sidebar">
              <Brand subtitle="Panel principal" />
              <nav className="sidebar-nav">
                {navItems.map((item) => (
                  <button
                    key={item.label}
                    className={item.label === activeNav ? 'active' : ''}
                    onClick={() => selectNav(item.label, item.category, item.screenId)}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
              <div className="sidebar-card">
                <p className="eyebrow">Accesos principales</p>
                <strong>Navega por el flujo completo</strong>
                <span>Explora acceso, ahorro, cobros, prestamos y cuenta sin salir del front.</span>
                <button className="secondary-button" onClick={() => setStage('landing')}>
                  Ir a inicio
                </button>
              </div>
            </aside>

            <main className="main-shell">
              <header className="topbar">
                <div className="top-links">
                  <button className="ghost-link active" onClick={() => notify('Resumen principal listo.')}>
                    Resumen
                  </button>
                  <button className="ghost-link" onClick={() => notify('Accesos rapidos listos.')}>
                    Accesos rapidos
                  </button>
                </div>
                <label className="searchbar">
                  <span>Buscar opcion</span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Ej. saldo, ahorro, perfil"
                  />
                </label>
                <div className="top-actions">
                  <button className="icon-button" onClick={() => setActiveScreenId('notifications')}>
                    Alertas
                  </button>
                  <button className="icon-button" onClick={() => setModal({ title: 'Ayuda', body: 'Aqui podras conectar preguntas frecuentes, soporte o tutoriales.', primary: 'Entendido' })}>
                    Ayuda
                  </button>
                  <button className="primary-pill" onClick={() => setModal({ title: 'Contactar soporte', body: 'Aqui puedes pedir ayuda para tu cuenta, movimientos o seguridad.', primary: 'Continuar', secondary: 'Cerrar' })}>
                    Contactar soporte
                  </button>
                  <button className="user-pill" onClick={() => setActiveScreenId('profile')}>
                    YT
                  </button>
                </div>
              </header>

              <section className="catalog-toolbar">
                <div className="device-toggle">
                  {(['Movil', 'Web'] as Surface[]).map((item) => (
                    <button
                      key={item}
                      className={surface === item ? 'active' : ''}
                      onClick={() => {
                        setSurface(item)
                        notify(`Vista ${item.toLowerCase()} activada.`)
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="segment-tabs">
                  {(['Todos', 'Finanzas', 'Cobros', 'Prestamos', 'Comunidad', 'Cuenta'] as Category[]).map((item) => (
                    <button
                      key={item}
                      className={category === item ? 'active' : ''}
                      onClick={() => {
                        setCategory(item)
                        notify(item === 'Todos' ? 'Mostrando todas las categorias.' : `Mostrando ${item}.`)
                      }}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <button
                  className={`filter-button ${filtersOpen ? 'active' : ''}`}
                  onClick={() => setFiltersOpen((current) => !current)}
                >
                  {filtersOpen ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>
              </section>

              {filtersOpen ? (
                <section className="inline-filter-panel">
                  {['Zona', 'Fecha', 'Estado', 'Grupo', 'Responsable'].map((filter) => (
                    <button key={filter} className="filter-chip" onClick={() => notify(`Filtro por ${filter} listo.`)}>
                      {filter}
                    </button>
                  ))}
                </section>
              ) : null}

              <section className="content-grid">
                <div className="screen-gallery">
                  {visibleScreens.length > 0 ? (
                    visibleScreens.map((screen) => (
                      <button
                        key={screen.id}
                        className={`screen-card ${screen.id === activeScreen.id ? 'selected' : ''}`}
                        onClick={() => selectScreen(screen)}
                      >
                        <span className="status-pill">{screen.badge}</span>
                        <div className="screen-card-body">
                          <p className="card-kicker">
                            {screen.category} . {screen.surface}
                          </p>
                          <h3>{screen.title}</h3>
                          <p>{screen.description}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="screen-card empty-state">
                      <span className="status-pill">Sin resultados</span>
                      <div className="screen-card-body">
                        <h3>No encontramos pantallas con ese filtro</h3>
                        <p>Prueba con otra palabra o cambia de categoria.</p>
                      </div>
                    </div>
                  )}
                </div>

                <section className="preview-panel">
                  <div className="preview-header">
                    <div>
                      <p className="hero-label">Pantalla activa</p>
                      <h2>{activeScreen.title}</h2>
                      <span>{activeScreen.description}</span>
                    </div>
                    <div className="preview-actions">
                      <button className="secondary-button" onClick={() => notify(`Recorrido de ${activeScreen.title} abierto.`)}>
                        Ver recorrido
                      </button>
                      <button className="primary-button" onClick={() => notify(`Detalle de ${activeScreen.title} listo.`)}>
                        Abrir detalle
                      </button>
                    </div>
                  </div>

                  <div className="preview-tabs">
                    {activeScreen.tabs.map((tab) => (
                      <button
                        key={tab}
                        className={activeTabs[activeScreen.id] === tab ? 'active' : ''}
                        onClick={() => {
                          setActiveTabs((current) => ({ ...current, [activeScreen.id]: tab }))
                          notify(`Seccion activa: ${tab}.`)
                        }}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <div className="metrics-row">
                    {activeScreen.metrics.map((metric) => (
                      <button key={metric.label} className="metric-card" onClick={() => notify(metric.label)}>
                        <span>{metric.label}</span>
                        <strong>{metric.value}</strong>
                        <small>{metric.hint}</small>
                      </button>
                    ))}
                  </div>

                  <ScreenView
                    screenId={activeScreen.id}
                    selectedTab={activeTabs[activeScreen.id]}
                    onAction={handleAction}
                    channels={channels}
                    securityOptions={securityOptions}
                    onToggleChannel={toggleChannel}
                    onToggleSecurity={toggleSecurity}
                  />
                </section>
              </section>
            </main>
          </div>
        )
    }
  }

  return (
    <>
      {renderStage()}
      {modal ? (
        <Modal
          modal={modal}
          onClose={() => setModal(null)}
          onPrimary={() => {
            notify(`${modal.primary} listo.`)
            setModal(null)
          }}
        />
      ) : null}
      {toast ? <div className="toast">{toast}</div> : null}
    </>
  )
}

function ScreenView({
  screenId,
  selectedTab,
  onAction,
  channels,
  securityOptions,
  onToggleChannel,
  onToggleSecurity,
}: {
  screenId: string
  selectedTab: string
  onAction: (label: string) => void
  channels: string[]
  securityOptions: string[]
  onToggleChannel: (channel: string) => void
  onToggleSecurity: (item: string) => void
}) {
  if (screenId === 'dashboard') {
    return (
      <div className="preview-layout">
        <div className="stack-column">
          <section className="panel soft">
            <div className="panel-header">
              <div>
                <p className="panel-title">Resumen semanal</p>
                <span>{selectedTab}</span>
              </div>
              <button className="chip-button" onClick={() => onAction('Exportar')}>Descargar</button>
            </div>
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="income" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#18181b" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#18181b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#ece7df" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area dataKey="ingresos" stroke="#18181b" fill="url(#income)" strokeWidth={2} />
                  <Area dataKey="egresos" stroke="#9f8f7d" fillOpacity={0} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="panel-title">Actividad reciente</p>
                <span>Movimientos del dia</span>
              </div>
              <button className="chip-button" onClick={() => onAction('Ver movimientos')}>Ver todo</button>
            </div>
            <div className="table-box">
              {movementRows.map((row) => (
                <button key={row.join('-')} className="table-row" onClick={() => onAction('Ver movimientos')}>
                  <span>{row[0]}</span>
                  <strong>{row[1]}</strong>
                  <span>{row[2]}</span>
                  <span className={`table-tag ${row[3] === 'Confirmado' ? 'ok' : 'warn'}`}>{row[3]}</span>
                </button>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          <p className="panel-title">Acciones rapidas</p>
          <div className="quick-actions">
            {['Ver saldo', 'Registrar aporte', 'Generar cobro', 'Nueva solicitud'].map((action) => (
              <button key={action} className="action-tile" onClick={() => onAction(action)}>
                {action}
              </button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (screenId === 'wallet' || screenId === 'qrCreate' || screenId === 'qrHistory' || screenId === 'education' || screenId === 'notifications') {
    return (
      <div className="mobile-frame">
        <div className="phone-screen">
          {screenId === 'wallet' ? (
            <>
              <div className="hero-mobile-card">
                <small>Billetera principal</small>
                <strong>$34,820.00</strong>
                <span>{selectedTab}</span>
              </div>
              <div className="mini-button-row">
                {['Agregar dinero', 'Retirar', 'Compartir cuenta'].map((action) => (
                  <button key={action} onClick={() => onAction(action)}>{action}</button>
                ))}
              </div>
              <ListCard
                title="Cuentas guardadas"
                items={['BBVA terminacion 4421', 'Caja de ahorro local', 'Retiro programado']}
                onClick={onAction}
              />
            </>
          ) : null}

          {screenId === 'qrCreate' ? (
            <>
              <div className="hero-mobile-card dark">
                <div className="qr-box"><span>QR CoDi</span></div>
                <strong>$2,500.00</strong>
                <span>{selectedTab}</span>
              </div>
              <div className="mini-button-row">
                {['Compartir', 'Cancelar cobro', 'Ver detalle'].map((action) => (
                  <button key={action} onClick={() => onAction(action)}>{action}</button>
                ))}
              </div>
              <button className="primary-button wide" onClick={() => onAction('Historial de cobros')}>
                Ver historial
              </button>
            </>
          ) : null}

          {screenId === 'qrHistory' ? (
            <ListCard
              title="Cobros recientes"
              items={['Orden #2041 - Confirmada', 'Orden #2040 - Pendiente', 'Orden #2038 - Cancelada']}
              onClick={onAction}
            />
          ) : null}

          {screenId === 'education' ? (
            <>
              <div className="hero-mobile-card">
                <small>Ruta de aprendizaje</small>
                <strong>Ahorro sin friccion</strong>
                <span>{selectedTab}</span>
              </div>
              <div className="course-list column">
                {['Como usar tu billetera', 'Reglas de la caja', 'Prestamos responsables'].map((item) => (
                  <article key={item} className="course-card">
                    <p>{item}</p>
                    <button className="chip-button" onClick={() => onAction(item)}>Continuar</button>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {screenId === 'notifications' ? (
            <>
              <ListCard
                title="Mensajes"
                items={['Pago proximo', 'Cambio de PIN', 'Aporte faltante']}
                onClick={onAction}
              />
              <section className="panel soft compact">
                <p className="panel-title">Canales</p>
                <div className="toggle-list">
                  {['Push', 'Correo', 'SMS', 'WhatsApp interno'].map((item) => (
                    <div key={item} className="toggle-row">
                      <span>{item}</span>
                      <button
                        className={`toggle ${channels.includes(item) ? 'on' : ''}`}
                        onClick={() => onToggleChannel(item)}
                      >
                        {channels.includes(item) ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : null}
        </div>
      </div>
    )
  }

  if (screenId === 'movements' || screenId === 'movementDetail' || screenId === 'transferCreate') {
    return (
      <div className="preview-layout single">
        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">{screenId === 'transferCreate' ? 'Formulario' : 'Tabla de movimientos'}</p>
              <span>{selectedTab}</span>
            </div>
            <div className="inline-actions">
              {screenId === 'transferCreate'
                ? ['Revisar', 'Confirmar']
                : ['Filtrar', 'Exportar', 'Conciliar'].map((action) => (
                    <button key={action} className="chip-button" onClick={() => onAction(action)}>
                      {action}
                    </button>
                  ))}
            </div>
          </div>

          {screenId === 'transferCreate' ? (
            <div className="form-grid">
              {['Socio destinatario', 'Monto', 'Motivo', 'Fecha programada'].map((field) => (
                <label key={field} className="field-card">
                  <span>{field}</span>
                  <input value="" placeholder={`Captura ${field.toLowerCase()}`} readOnly />
                </label>
              ))}
              <button className="primary-button" onClick={() => onAction('Confirmar transferencia')}>
                Confirmar transferencia
              </button>
            </div>
          ) : (
            <div className="table-box">
              {movementRows.map((row) => (
                <button
                  key={row.join('-')}
                  className="table-row"
                  onClick={() => onAction('Detalle de movimiento')}
                >
                  <span>{row[0]}</span>
                  <strong>{row[1]}</strong>
                  <span>{row[2]}</span>
                  <span className={`table-tag ${row[3] === 'Confirmado' ? 'ok' : 'warn'}`}>{row[3]}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    )
  }

  if (screenId === 'savingsList' || screenId === 'savingDetail' || screenId === 'membersList' || screenId === 'memberProfile') {
    return (
      <div className="preview-layout">
        <section className="panel soft">
          <div className="panel-header">
            <div>
              <p className="panel-title">
                {screenId === 'membersList'
                  ? 'Directorio de socios'
                  : screenId === 'memberProfile'
                    ? 'Datos del socio'
                    : screenId === 'savingDetail'
                      ? 'Resumen de caja'
                      : 'Cajas activas'}
              </p>
              <span>{selectedTab}</span>
            </div>
            <div className="inline-actions">
              {(screenId === 'membersList'
                ? ['Nuevo socio', 'Asignar grupo']
                : screenId === 'memberProfile'
                  ? ['Subir documento', 'Suspender acceso']
                  : ['Crear caja', 'Registrar aportacion']
              ).map((action) => (
                <button key={action} className="chip-button" onClick={() => onAction(action)}>
                  {action}
                </button>
              ))}
            </div>
          </div>
          <div className="saving-grid">
            {(screenId === 'membersList'
              ? ['Maria Perez', 'Juan Ortega', 'Alicia Ramos']
              : screenId === 'memberProfile'
                ? ['INE vigente', 'Comprobante de domicilio', 'Reglamento firmado']
                : ['Caja Primavera', 'Caja Emergencias', 'Caja Cosecha']
            ).map((item) => (
              <article key={item} className="saving-card">
                <p>{item}</p>
                <strong>{screenId === 'memberProfile' ? 'Disponible' : '$120,000'}</strong>
                <button className="secondary-button" onClick={() => onAction(item)}>
                  Abrir
                </button>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <p className="panel-title">Acciones</p>
          <div className="task-grid">
            {(screenId === 'memberProfile'
              ? ['Ver historial', 'Actualizar datos', 'Agregar nota']
              : ['Ver detalle', 'Historial', 'Documentos']
            ).map((item) => (
              <button key={item} className="task-chip" onClick={() => onAction(item)}>
                {item}
              </button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  if (screenId === 'loansList' || screenId === 'loanRequest' || screenId === 'loanDetail') {
    return (
      <div className="preview-layout">
        <section className="panel soft">
          <div className="panel-header">
            <div>
              <p className="panel-title">
                {screenId === 'loanRequest' ? 'Formulario de solicitud' : 'Solicitudes por estado'}
              </p>
              <span>{selectedTab}</span>
            </div>
            <div className="inline-actions">
              {(screenId === 'loanRequest'
                ? ['Guardar borrador', 'Enviar']
                : ['Nueva solicitud', 'Aprobar', 'Reprogramar pago']
              ).map((action) => (
                <button key={action} className="chip-button" onClick={() => onAction(action)}>
                  {action}
                </button>
              ))}
            </div>
          </div>

          {screenId === 'loanRequest' ? (
            <div className="form-grid">
              {['Monto solicitado', 'Motivo', 'Plazo', 'Garantia'].map((field) => (
                <label key={field} className="field-card">
                  <span>{field}</span>
                  <input value="" placeholder={`Captura ${field.toLowerCase()}`} readOnly />
                </label>
              ))}
            </div>
          ) : (
            <div className="kanban">
              {[
                { title: 'Por revisar', items: ['Maria P.', 'Jose A.', 'Colectivo Norte'] },
                { title: 'Aprobadas', items: ['Adela C.', 'Grupo Xopan'] },
                { title: 'Con incidencia', items: ['Rocio M.'] },
              ].map((column) => (
                <div key={column.title} className="kanban-column">
                  <strong>{column.title}</strong>
                  {column.items.map((item) => (
                    <button key={item} className="kanban-card" onClick={() => onAction('Ver expediente')}>
                      <span>{item}</span>
                      <small>Ver expediente</small>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="panel-title">Calendario de pago</p>
              <span>Proximos vencimientos</span>
            </div>
          </div>
          <div className="timeline-list">
            {['10 Mayo - Grupo Norte', '14 Mayo - Caja Primavera', '18 Mayo - Maria Perez'].map((item) => (
              <button key={item} className="timeline-item" onClick={() => onAction('Reprogramar pago')}>
                <span className="timeline-dot" />
                <strong>{item}</strong>
                <small>Gestionar</small>
              </button>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="preview-layout single">
      <section className="panel">
        <p className="panel-title">Vista en construccion</p>
        <span>Esta pantalla ya tiene estructura base lista para completar.</span>
      </section>
    </div>
  )
}

function renderOnboardingStep(step: number) {
  const steps = [
    {
      title: 'Define tu tipo de cuenta',
      body: 'Selecciona si esta cuenta sera para tesoreria, operacion o administracion general.',
      options: ['Tesoreria', 'Operacion', 'Administracion'],
    },
    {
      title: 'Completa tu perfil',
      body: 'Agrega nombre, telefono y zona de trabajo para personalizar la experiencia.',
      options: ['Nombre del equipo', 'Telefono principal', 'Zona de trabajo'],
    },
    {
      title: 'Verifica identidad',
      body: 'Confirma correo, numero de telefono y metodo de recuperacion.',
      options: ['Correo verificado', 'Telefono verificado', 'Metodo de respaldo'],
    },
    {
      title: 'Acepta el reglamento',
      body: 'Revisa las reglas de operacion y activa la cuenta para comenzar.',
      options: ['Reglamento leido', 'Politica de privacidad', 'Terminos aceptados'],
    },
  ]

  const current = steps[step]

  return (
    <>
      <div className="onboarding-copy">
        <span className="soft-badge">Configuracion inicial</span>
        <h2>{current.title}</h2>
        <p>{current.body}</p>
      </div>
      <div className="onboarding-options">
        {current.options.map((option) => (
          <button key={option} className="option-card">
            {option}
          </button>
        ))}
      </div>
    </>
  )
}

function Modal({
  modal,
  onClose,
  onPrimary,
}: {
  modal: NonNullable<ModalState>
  onClose: () => void
  onPrimary: () => void
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <h3>{modal.title}</h3>
        <p>{modal.body}</p>
        <div className="modal-actions">
          {modal.secondary ? (
            <button className="secondary-button" onClick={onClose}>
              {modal.secondary}
            </button>
          ) : null}
          <button className="primary-button" onClick={onPrimary}>
            {modal.primary}
          </button>
        </div>
      </div>
    </div>
  )
}

function Brand({ subtitle }: { subtitle: string }) {
  return (
    <div className="brand">
      <div className="brand-mark">
        <span />
        <span />
        <span />
      </div>
      <div>
        <p>MezcalPay</p>
        <small>{subtitle}</small>
      </div>
    </div>
  )
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <article>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  type?: string
}) {
  return (
    <label>
      <span>{label}</span>
      <input type={type} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  )
}

function ListCard({
  title,
  items,
  onClick,
}: {
  title: string
  items: string[]
  onClick: (label: string) => void
}) {
  return (
    <div className="list-card">
      <div className="panel-header">
        <p className="panel-title">{title}</p>
      </div>
      {items.map((item) => (
        <button key={item} className="list-row" onClick={() => onClick(item)}>
          <strong>{item}</strong>
          <span>Ver</span>
        </button>
      ))}
    </div>
  )
}

function resolveNav(category: Exclude<Category, 'Todos'>) {
  switch (category) {
    case 'Cobros':
      return 'Cobros'
    case 'Prestamos':
      return 'Prestamos'
    case 'Comunidad':
      return 'Comunidad'
    case 'Cuenta':
      return 'Cuenta'
    default:
      return 'Inicio'
  }
}

export default App
