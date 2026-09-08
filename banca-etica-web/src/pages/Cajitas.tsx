// 1. Importamos useEffect
import { useState, useEffect } from 'react';
import { apiFetch } from '../services/api';
import Sidebar from '../components/Sidebar';
import ModalNuevaCaja from '../components/ModalNuevaCaja';
import ModalNuevoMovimiento from '../components/Admin/ModalNuevoMovimiento';
import '../App.css'; 

async function readApiResponse(response: Response) {
  const contentType = response.headers.get('content-type') || '';
  const raw = await response.text();

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(raw);
    } catch {
      return { mensaje: raw };
    }
  }

  return { mensaje: raw };
}

export default function Cajitas() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // 2. Creamos un estado para guardar nuestras cajas. Nace como un arreglo vacío [].
  const [cajitas, setCajitas] = useState<any[]>([]);

  const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
  const [cajaSeleccionada, setCajaSeleccionada] = useState<{id: string, nombre: string} | null>(null);

  // 3. Función para ir al backend a pedir la información
  const fetchCajitas = async () => {
    try {
      const response = await apiFetch('/api/cajita');
      if (!response.ok) {
        throw new Error('Error al cargar las cajas');
      }
      const data = await readApiResponse(response);
      
      // 4. Metemos los datos que llegaron de C# en nuestro estado de React
      setCajitas(data);
    } catch (error) {
      console.error("Hubo un problema con el fetch:", error);
    }
  };

  // 5. useEffect ejecuta la función automáticamente AL ENTRAR a la pantalla
  useEffect(() => {
    fetchCajitas();
  }, []); // Los corchetes vacíos le dicen a React: "Solo hazlo una vez al inicio"

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="main-shell">
        <header className="topbar">
          <div className="top-links">
            <button className="ghost-link active">Cajas de Ahorro</button>
            <button className="ghost-link">Directorio</button>
          </div>
          <div className="top-actions">
            <button className="primary-pill" onClick={() => setIsModalOpen(true)}>
              + Nueva Caja de Ahorro
            </button>
          </div>
        </header>

        <section className="preview-panel">
          <div className="preview-header">
            <div>
              <p className="hero-label">Comunidad</p>
              <h2>Cajas de Ahorros</h2>
              <span>Mira las cajas a las que tienes acceso.</span>
            </div>
          </div>

          <section className="panel soft">
            {/* 6. Hacemos un renderizado condicional con ".map" */}
            {cajitas.length === 0 ? (
              <p>Cargando cajas o aún no hay cajas registradas...</p>
            ) : (
              <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                
                {/* Iteramos sobre el arreglo para dibujar una tarjeta por cada caja */}
                {cajitas.map((caja) => (
                  <div key={caja.id} className="field-card" style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e1dcd5' }}>
                    <h3 style={{ margin: '0 0 8px 0', color: '#171717' }}>{caja.nombre}</h3>
                    <p style={{ margin: '0 0 4px 0', color: '#5f584f' }}>
                      <strong>Meta:</strong> ${caja.meta.toLocaleString()} MXN
                    </p>
                    <p style={{ margin: '0 0 12px 0', color: '#5f584f' }}>
                      <strong>Saldo Actual:</strong> ${caja.saldoActual.toLocaleString()} MXN
                    </p>
                    
                    {/* BOTÓN NUEVO */}
                    <button 
                      className="primary-pill" 
                      style={{ width: '100%', fontSize: '14px' }}
                      onClick={() => {
                        setCajaSeleccionada({ id: caja.id, nombre: caja.nombre });
                        setIsMovimientoOpen(true);
                      }}
                    >
                      Transacción
                    </button>
                  </div>
                ))}

              </div>
            )}
          </section>
        </section>
      </main>

      <ModalNuevaCaja 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          // Opcional: Refrescar la lista automáticamente después de crear una nueva
          fetchCajitas(); 
        }} 
      />

      <ModalNuevoMovimiento 
        isOpen={isMovimientoOpen}
        onClose={() => setIsMovimientoOpen(false)}
        cajitaId={cajaSeleccionada?.id || null}
        cajitaNombre={cajaSeleccionada?.nombre || ''}
        onSuccess={() => {
          fetchCajitas(); // Recargamos las cajas para ver el nuevo saldo
        }}
      />
      
    </div>
  );
}
