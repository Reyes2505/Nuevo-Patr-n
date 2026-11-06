import { useEffect } from 'react';
import { getTurnos } from '../data/turnos';

export default function MonitorEmbarque() {
  useEffect(() => {
    const revisar = () => {
      const ahora = new Date();
      const turnos = getTurnos();
      const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');

      turnos.forEach(turno => {
        if (turno.estado === 'salido') return;

        // Calcular minutos para la salida
        const [horaStr, minutoStr] = turno.hora.split(':');
        const esPM = turno.hora.includes('PM');
        let hora = parseInt(horaStr);
        if (esPM && hora !== 12) hora += 12;
        if (!esPM && hora === 12) hora = 0;
        
        const fechaSalida = new Date();
        fechaSalida.setHours(hora, parseInt(minutoStr), 0, 0);
        const diffMinutos = (fechaSalida - ahora) / 1000 / 60;

        // Si faltan entre 0 y 60 minutos para salir
        if (diffMinutos > 0 && diffMinutos <= 60) {
          const boletosDelTurno = boletos.filter(b => 
            b.turno?.id === turno.id && 
            b.estadoPago !== 'reembolsado' && 
            b.declaracionFirmada !== true 
          );

          boletosDelTurno.forEach(boleto => {
            // Revisar si ya lo notificamos en esta sesión
            const alertadoKey = `alerta_notificada_${boleto.codigo}`;
            if (sessionStorage.getItem(alertadoKey)) return;

            const tienePasajeroEspecial = (boleto.pasajeros || []).some(p => {
              const edad = parseInt(p.edad, 10);
              return !isNaN(edad) && (edad < 13 || edad >= 80);
            });

            if (tienePasajeroEspecial) {
              window.dispatchEvent(new CustomEvent('nueva-venta-declaracion', {
                detail: {
                  pasajero: boleto.nombre || 'Pasajero',
                  dni: boleto.dni || '---',
                  asiento: boleto.asientosArray?.[0] || '---',
                  solicitaImpresion: boleto.solicitaImpresion || false,
                  codigoBoleto: boleto.codigo,
                  turnoHora: turno.hora,
                  placa: turno.placa,
                  esAlertaPreSalida: true
                }
              }));
              sessionStorage.setItem(alertadoKey, 'true');
            }
          });
        }
      });
    };

    revisar(); // Ejecutar inmediatamente al montar
    const interval = setInterval(revisar, 30000); // Revisar cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  return null;
}
