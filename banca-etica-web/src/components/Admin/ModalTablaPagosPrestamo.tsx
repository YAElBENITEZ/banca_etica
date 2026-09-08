import { useMemo } from 'react';
import '../../App.css';

// 1. Recibiremos el objeto 'prestamo' completo con toda su info
interface ModalTablaPagosPrestamoProps {
  isOpen: boolean;
  onClose: () => void;
  prestamo: any | null; 
}

export default function ModalTablaPagosPrestamo({ isOpen, onClose, prestamo }: ModalTablaPagosPrestamoProps) {
  
  // 2. Calculamos la tabla solo si el modal está abierto y hay un préstamo seleccionado
  const tablaPagos = useMemo(() => {
    if (!prestamo) return [];

    const monto = prestamo.montoOriginal;
    const tasaDecimal = prestamo.tasa / 100;
    const plazo = prestamo.plazoMeses;
    const tipo = prestamo.tipoInteres || 'saldosInsolutos'; // Tu nuevo campo de BD

    let tabla = [];
    let saldoRestante = monto;

    if (tipo === 'saldosInsolutos') {
      // FÓRMULA DE SALDOS INSOLUTOS (Cuota Fija)
      // R = P * (i * (1 + i)^n) / ((1 + i)^n - 1)
      const factor = Math.pow(1 + tasaDecimal, plazo);
      const pagoMensualFijo = monto * ((tasaDecimal * factor) / (factor - 1));

      for (let mes = 1; mes <= plazo; mes++) {
        const interesDelMes = saldoRestante * tasaDecimal;
        const capitalDelMes = pagoMensualFijo - interesDelMes;
        saldoRestante -= capitalDelMes;

        tabla.push({
          mes,
          pagoMensual: pagoMensualFijo,
          interes: interesDelMes,
          capital: capitalDelMes,
          saldoRestante: Math.max(0, saldoRestante) // Evita decimales negativos
        });
      }
    } else {
      // FÓRMULA DE INTERÉS COMPUESTO / GLOBAL
      // Interés total = Monto * Tasa * Plazo
      const interesTotal = monto * tasaDecimal * plazo;
      const deudaTotal = monto + interesTotal;
      const pagoMensualFijo = deudaTotal / plazo;
      const interesMensualFijo = interesTotal / plazo;
      const capitalMensualFijo = monto / plazo;
      
      let deudaRestante = deudaTotal;

      for (let mes = 1; mes <= plazo; mes++) {
        deudaRestante -= pagoMensualFijo;

        tabla.push({
          mes,
          pagoMensual: pagoMensualFijo,
          interes: interesMensualFijo,
          capital: capitalMensualFijo,
          saldoRestante: Math.max(0, deudaRestante)
        });
      }
    }

    return tabla;
  }, [prestamo]);

  if (!isOpen || !prestamo) return null;

  // Función para formatear el dinero bonito
  const formatearDinero = (cantidad: number) => 
    cantidad.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="modal-backdrop"> 
      {/* Hacemos la tarjeta un poco más ancha (max-width: 700px) para que quepa la tabla */}
      <div className="modal-card" style={{ maxWidth: '700px', width: '90%' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0 }}>Tabla de Amortización</h3>
            <p style={{ margin: '4px 0 0 0', color: '#5f584f' }}>
              <strong>Préstamo:</strong> {prestamo.proposito} <br/>
              <strong>Tipo de cálculo:</strong> {prestamo.tipoInteres === 'compuesto' ? 'Interés Global Compuesto' : 'Saldos Insolutos'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✖</button>
        </div>
        
        {/* Contenedor con Scroll por si el préstamo es a muchos meses */}
        <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto', marginTop: '20px', border: '1px solid #e1dcd5', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
            <thead style={{ backgroundColor: '#f8f5ef', position: 'sticky', top: 0 }}>
              <tr>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e1dcd5' }}>Mes</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e1dcd5' }}>Abono a Capital</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e1dcd5' }}>Interés</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e1dcd5', backgroundColor: '#eaf4ea' }}>Pago Mensual Total</th>
                <th style={{ padding: '12px', borderBottom: '2px solid #e1dcd5' }}>Saldo Restante</th>
              </tr>
            </thead>
            <tbody>
              {tablaPagos.map((fila) => (
                <tr key={fila.mes} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>{fila.mes}</td>
                  <td style={{ padding: '10px', color: '#5f584f' }}>{formatearDinero(fila.capital)}</td>
                  <td style={{ padding: '10px', color: '#dc3545' }}>{formatearDinero(fila.interes)}</td>
                  <td style={{ padding: '10px', fontWeight: 'bold', backgroundColor: '#f8fff8', color: '#28a745' }}>
                    {formatearDinero(fila.pagoMensual)}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>{formatearDinero(fila.saldoRestante)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-actions" style={{ marginTop: '20px' }}>
          <button type="button" className="secondary-button" onClick={onClose}>
            Cerrar Tabla
          </button>
        </div>

      </div>
    </div>
  );
}
