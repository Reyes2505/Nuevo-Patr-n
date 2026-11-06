import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

export default function ScannerQR() {
  const [mensaje, setMensaje] = useState('');
  const [resultado, setResultado] = useState(null);
  const navigate = useNavigate();
  const scannerRef = useRef(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner('reader', {
      fps: 10,
      qrbox: { width: 250, height: 250 },
    });

    scanner.render(
      (decodedText) => {
        const match = decodedText.match(/BOLETO-([^-]+)-([^-]+)-([^-]+)/);
        if (!match) {
          setMensaje('❌ QR inválido');
          return;
        }

        const [, codigo, asientos, placa] = match;
        
        const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
        const boleto = boletos.find(b => b.codigo === codigo);
        
        if (!boleto) {
          setMensaje(`❌ Boleto ${codigo} no encontrado`);
          return;
        }

        if (boleto.estadoPago !== 'pagado') {
          setMensaje(`❌ Boleto ${codigo} no está pagado`);
          return;
        }

        // Actualizar estado de abordaje
        const actualizados = boletos.map(b => 
          b.codigo === codigo ? { ...b, estadoAbordaje: 'abordando' } : b
        );
        localStorage.setItem('misBoletos', JSON.stringify(actualizados));

        // Notificar a otras pestañas
        const channel = new BroadcastChannel('sync-dispatch');
        channel.postMessage({ accion: 'abordar', codigoBoleto: codigo });
        channel.close();

        setResultado({ codigo, asientos, placa, nombre: boleto.nombre });
        setMensaje(`✅ ¡Bienvenido ${boleto.nombre}! Abordando al asiento ${asientos}`);
        
        setTimeout(() => {
          setResultado(null);
          setMensaje('');
        }, 3000);
      },
      () => {
        // Ignorar errores
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 max-w-md w-full">
        <div className="text-center mb-4">
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-7 h-7 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/></svg>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Escáner de Abordaje</h1>
          <p className="text-xs text-slate-500">Apunta la cámara al QR del pasajero</p>
        </div>

        <div id="reader" className="rounded-xl overflow-hidden mb-4"></div>

        {mensaje && (
          <div className={`p-4 rounded-xl text-center font-black mb-4 animate-fade-slide-up ${
            mensaje.includes('✅') ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {mensaje}
          </div>
        )}

        <button 
          onClick={() => navigate('/admin/dispatch')} 
          className="w-full bg-slate-900 hover:bg-black text-white font-black py-3 rounded-xl transition-colors active:scale-95"
        >
          Volver al Kanban
        </button>
      </div>
    </div>
  );
}
