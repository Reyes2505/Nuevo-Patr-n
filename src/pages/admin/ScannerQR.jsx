import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function ScannerQR() {
  const navigate = useNavigate();
  const [boletoEscaneado, setBoletoEscaneado] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [requiereDeclaracion, setRequiereDeclaracion] = useState(false);
  const [declaracionAprobada, setDeclaracionAprobada] = useState(false);

  useEffect(() => {
    // Inicializar el escáner
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
    
    const onScanSuccess = (decodedText) => {
      scanner.clear();
      // El texto escaneado debe tener el formato BOLETO-CODIGO-PLACA
      const codigo = decodedText.split('-')[1]; // Asumiendo que el QR dice BOLETO-ABC123-M5S-188
      
      if (!codigo) {
        setError('Código QR inválido o formato incorrecto.');
        return;
      }

      // Buscar el boleto en localStorage
      const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
      const boleto = boletos.find(b => b.codigo === codigo);

      if (!boleto) {
        setError('Boleto no encontrado en el sistema. Posible fraude.');
        return;
      }

      // Revisar si tiene menores de 13 o mayores de 80
      const pasajerosEspeciales = (boleto.pasajeros || []).filter(p => {
        const edad = parseInt(p.edad, 10);
        return !isNaN(edad) && (edad < 13 || edad >= 80);
      });

      if (pasajerosEspeciales.length > 0 && !boleto.declaracionFirmada) {
        setRequiereDeclaracion(true);
      }

      setBoletoEscaneado(boleto);
    };

    const onScanError = (err) => {
      // Ignorar errores de escaneo hasta que se detecte algo
    };

    scanner.render(onScanSuccess, onScanError);

    return () => {
      scanner.clear().catch(e => console.error(e));
    };
  }, []);

  const handleAprobarDeclaracion = () => {
    // Actualizar el boleto en localStorage
    const boletos = JSON.parse(localStorage.getItem('misBoletos') || '[]');
    const index = boletos.findIndex(b => b.codigo === boletoEscaneado.codigo);
    
    if (index !== -1) {
      boletos[index].declaracionFirmada = true;
      localStorage.setItem('misBoletos', JSON.stringify(boletos));
      setDeclaracionAprobada(true);
      setRequiereDeclaracion(false);
      
      // Emitir evento para que el POS/Admin actualice si es necesario
      window.dispatchEvent(new Event('declaracion-aprobada'));
    }
  };

  const handleCerrar = () => {
    setBoletoEscaneado(null);
    setRequiereDeclaracion(false);
    setDeclaracionAprobada(false);
    setError('');
    setExito('');
    // Recargar la página para reiniciar el escáner
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[#18191B] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Control de Abordaje</h1>
            <p className="text-xs text-slate-500">Escanea el boleto para validar</p>
          </div>
          <button onClick={() => navigate('/admin')} className="text-xs font-bold text-slate-500 hover:text-slate-900">Volver al Panel</button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm font-bold border border-red-200">{error}</div>}
        {exito && <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl mb-4 text-sm font-bold border border-emerald-200">{exito}</div>}

        {/* LECTOR QR */}
        {!boletoEscaneado && (
          <div className="border-4 border-dashed border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
            <div id="reader" className="w-full"></div>
          </div>
        )}

        {/* RESULTADO DEL ESCANEO */}
        {boletoEscaneado && (
          <div className="space-y-4">
            <div className={`p-4 rounded-2xl border-2 ${requiereDeclaracion ? 'border-amber-400 bg-amber-50' : 'border-emerald-400 bg-emerald-50'}`}>
              <h3 className="font-black text-lg text-slate-900">Boleto: {boletoEscaneado.codigo}</h3>
              <p className="text-sm font-bold text-slate-600">Pasajero: {boletoEscaneado.nombre}</p>
              <p className="text-xs text-slate-500">Asiento: {boletoEscaneado.asientos} · {boletoEscaneado.origen} → {boletoEscaneado.destino}</p>
              
              {requiereDeclaracion ? (
                <div className="mt-4 p-4 bg-white rounded-xl border border-amber-200">
                  <p className="text-sm font-black text-amber-600 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                    PASAJERO REQUIERE DECLARACIÓN JURADA
                  </p>
                  <p className="text-xs text-slate-600 mt-1">El pasajero viaja por ser menor de 13 o mayor de 80 años. Por favor, solicite el documento físico firmado.</p>
                  <button onClick={handleAprobarDeclaracion} className="mt-3 w-full bg-amber-500 hover:bg-amber-600 text-white font-black py-3 rounded-xl transition-colors">
                    Aprobar Presentación y Permitir Abordaje
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-white rounded-xl border border-emerald-200">
                  <p className="text-sm font-black text-emerald-600 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    ABORDAJE PERMITIDO
                  </p>
                  <p className="text-xs text-slate-600 mt-1">El pasajero cuenta con todos los requisitos para viajar.</p>
                </div>
              )}
            </div>
            <button onClick={handleCerrar} className="w-full bg-slate-900 hover:bg-black text-white font-black py-3 rounded-xl transition-colors">
              Escanear otro boleto
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
