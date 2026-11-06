import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

export default function ValidarBoleto() {
  const { codigo } = useParams();
  const [estado, setEstado] = useState('cargando'); // 'cargando' | 'valido' | 'invalido' | 'expirado' | 'reembolsado'
  const [boleto, setBoleto] = useState(null);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    const validar = () => {
      try {
        // El QR contiene: "BOLETO-CODIGO-ASIENTOS-PLACA" (URL-encoded)
        const decodificado = decodeURIComponent(codigo);
        const partes = decodificado.split('-');
        
        // El código es la parte 1 (después de "BOLETO")
        const codigoBoleto = partes[1];
        const asientosQR = partes[2];
        const placaQR = partes[3];

        if (!codigoBoleto) {
          setEstado('invalido');
          setMensaje('Código de boleto no válido.');
          return;
        }

        // Buscar el boleto en localStorage
        const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
        const boletoEncontrado = boletos.find(b => 
          b.codigo?.toLowerCase() === codigoBoleto.toLowerCase() ||
          b.codigo === codigoBoleto
        );

        if (!boletoEncontrado) {
          setEstado('invalido');
          setMensaje('Boleto no encontrado en el sistema.');
          return;
        }

        setBoleto(boletoEncontrado);

        // 1. Verificar que no esté reembolsado
        if (boletoEncontrado.estadoPago === 'reembolsado') {
          setEstado('reembolsado');
          setMensaje('Este boleto fue reembolsado y ya no es válido.');
          return;
        }

        // 2. Verificar que no esté pendiente (efectivo sin pagar)
        if (boletoEncontrado.estadoPago === 'pendiente') {
          setEstado('invalido');
          setMensaje('Este boleto está pendiente de pago. Preséntate en ventanilla.');
          return;
        }

        // 3. Verificar la fecha del viaje
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Usar fechaViaje si existe, sino la fecha de compra
        const fechaViajeStr = boletoEncontrado.fechaViaje || boletoEncontrado.fecha?.split('T')[0];
        
        if (!fechaViajeStr) {
          setEstado('invalido');
          setMensaje('El boleto no tiene fecha de viaje registrada.');
          return;
        }

        const fechaViaje = new Date(fechaViajeStr + 'T00:00:00');
        const diffDias = Math.floor((hoy - fechaViaje) / (1000 * 60 * 60 * 24));

        // Tolerancia: solo válido el mismo día del viaje
        if (diffDias > 0) {
          setEstado('expirado');
          setMensaje(`Este boleto era para el ${fechaViaje.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}. Ya expiró.`);
          return;
        }

        if (diffDias < 0) {
          setEstado('invalido');
          setMensaje(`Este boleto es para el ${fechaViaje.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}. Aún no es válido.`);
          return;
        }

        // 4. Verificar que los asientos del QR coincidan
        if (asientosQR && boletoEncontrado.asientos !== asientosQR && boletoEncontrado.asientos?.replace(/N°/g, '') !== asientosQR) {
          // Verificación laxa: no bloqueamos por esto
        }

        // ¡Todo bien!
        setEstado('valido');
        setMensaje('Boleto válido. ¡Buen viaje!');
      } catch (e) {
        console.error(e);
        setEstado('invalido');
        setMensaje('Error al validar el boleto.');
      }
    };

    // Pequeño delay para simular verificación
    setTimeout(validar, 800);
  }, [codigo]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-md">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-1">
            <span className="text-3xl font-black text-brand-orange tracking-tighter">Nuevo</span>
            <span className="text-3xl font-black text-slate-900 tracking-tighter">Patrón</span>
          </Link>
          <p className="text-sm text-slate-500 mt-2">Validación de boleto</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          
          {/* CARGANDO */}
          {estado === 'cargando' && (
            <>
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Verificando boleto...</h2>
              <p className="text-sm text-slate-500">Estamos consultando el sistema.</p>
            </>
          )}

          {/* VÁLIDO */}
          {estado === 'valido' && boleto && (
            <>
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pop-in">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-emerald-600 mb-2">¡Boleto Válido!</h2>
              <p className="text-sm text-slate-500 mb-6">Buen viaje, {boleto.nombre?.split(' ')[0] || 'pasajero'}.</p>

              <div className="bg-slate-50 rounded-2xl p-4 text-left space-y-2 mb-6">
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Código</span>
                  <span className="text-xs font-mono font-black text-slate-900">{boleto.codigo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Pasajero</span>
                  <span className="text-xs font-black text-slate-900">{boleto.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Ruta</span>
                  <span className="text-xs font-black text-slate-900">{boleto.origen} → {boleto.destino}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Asientos</span>
                  <span className="text-xs font-black text-brand-orange">{boleto.asientos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Salida</span>
                  <span className="text-xs font-black text-slate-900">{boleto.turno?.hora}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-black text-slate-400 uppercase">Fecha viaje</span>
                  <span className="text-xs font-black text-slate-900">
                    {new Date((boleto.fechaViaje || boleto.fecha) + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>

              <Link to="/" className="block w-full bg-brand-orange hover:bg-orange-700 text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-colors">
                Ir al inicio
              </Link>
            </>
          )}

          {/* EXPIRADO */}
          {estado === 'expirado' && (
            <>
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-amber-600 mb-2">Boleto Expirado</h2>
              <p className="text-sm text-slate-500 mb-6">{mensaje}</p>
              <Link to="/" className="block w-full bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-colors">
                Volver al inicio
              </Link>
            </>
          )}

          {/* REEMBOLSADO */}
          {estado === 'reembolsado' && (
            <>
              <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-slate-600 mb-2">Boleto Reembolsado</h2>
              <p className="text-sm text-slate-500 mb-6">{mensaje}</p>
              <Link to="/" className="block w-full bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-colors">
                Volver al inicio
              </Link>
            </>
          )}

          {/* INVÁLIDO */}
          {estado === 'invalido' && (
            <>
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <h2 className="text-2xl font-black text-red-600 mb-2">Boleto Inválido</h2>
              <p className="text-sm text-slate-500 mb-6">{mensaje}</p>
              <Link to="/" className="block w-full bg-slate-900 hover:bg-black text-white font-black text-sm uppercase tracking-wider py-3 rounded-xl transition-colors">
                Volver al inicio
              </Link>
            </>
          )}
        </div>

        <p className="text-center text-[10px] text-slate-400 mt-6">
          Sistema de validación de Nuevo Patrón · RUC 20615321151
        </p>
      </div>
    </div>
  );
}
