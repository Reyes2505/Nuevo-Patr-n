import { useRef } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

export default function TicketModal({ isOpen, onClose, turno, nombre, dni, telefono, metodoPago, boletoCodigo }) {
  const ticketRef = useRef(null);

  if (!isOpen) return null;

  const handleEnviarWhatsApp = async () => {
    if (!ticketRef.current) return;

    try {
      // 1. Convertir el boleto a imagen
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#FAF8F5' });
      const imagenBase64 = canvas.toDataURL('image/png');

      // 2. Descargar la imagen automáticamente (el usuario la adjunta en WhatsApp)
      const link = document.createElement('a');
      link.href = imagenBase64;
      link.download = `Boleto-${boletoCodigo}.png`;
      link.click();

      // 3. Abrir WhatsApp con el mensaje + instrucción de adjuntar la imagen descargada
      const mensaje = `🚌 *BOLETO DIGITAL - NUEVO PATRÓN*%0A%0A` +
                      `🎫 *Código:* ${boletoCodigo}%0A` +
                      `👤 *Pasajero:* ${nombre}%0A` +
                      `📍 *Ruta:* San Marcos ⇄ Cajamarca%0A` +
                      `⏰ *Salida:* ${turno.hora}%0A` +
                      `🚐 *Vehículo:* ${turno.placa}%0A%0A` +
                      `📎 *Acabo de descargar la imagen del boleto. Por favor, adjúntala para tu control.*`;

      window.open(`https://wa.me/51${telefono.replace(/\D/g, '')}?text=${mensaje}`, '_blank');

      // 4. Nota: en producción, la imagen se enviaría automáticamente vía API de WhatsApp Business
    } catch (error) {
      console.error('Error al generar la imagen:', error);
      alert('Hubo un error generando el boleto. Intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md relative my-8">
        
        {/* BOLETO VISUAL (Lo que se convierte a imagen) */}
        <div 
          ref={ticketRef} 
          className="bg-[#FAF8F5] border-2 border-[#1A1A1A] overflow-hidden"
          style={{ fontFamily: 'ui-monospace, monospace' }}
        >
          
          {/* CABECERA */}
          <div className="bg-[#1A1A1A] text-white p-4 text-center">
            <div className="flex justify-center mb-2">
              <img src="/logo-patron.png" alt="Nuevo Patrón" className="h-10 w-auto" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D9531E]">Boleto de Viaje</div>
            <div className="text-[9px] font-mono text-white/60 mt-1">RUC 20615321151</div>
          </div>

          {/* CÓDIGO QR + BOLETO */}
          <div className="p-6 flex flex-col items-center border-b-2 border-dashed border-[#1A1A1A]/30">
            <div className="bg-white p-3 border-2 border-[#1A1A1A]">
              <QRCode 
                value={`BOLETO-${boletoCodigo}-${turno.placa}-${dni}`}
                size={120}
                fgColor="#1A1A1A"
              />
            </div>
            <span className="mt-3 text-[10px] font-black uppercase tracking-widest text-[#1A1A1A]/50">Código de Boleto</span>
            <span className="text-xl font-black text-[#1A1A1A] tracking-wider">{boletoCodigo}</span>
          </div>

          {/* DATOS DEL PASAJERO */}
          <div className="p-5 space-y-2 border-b-2 border-dashed border-[#1A1A1A]/30">
            <div className="flex justify-between text-xs">
              <span className="text-[#1A1A1A]/50 uppercase font-black">Pasajero</span>
              <span className="font-bold text-[#1A1A1A] text-right">{nombre}</span>
            </div>
            {dni && (
              <div className="flex justify-between text-xs">
                <span className="text-[#1A1A1A]/50 uppercase font-black">DNI</span>
                <span className="font-mono font-bold text-[#1A1A1A]">{dni}</span>
              </div>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-[#1A1A1A]/50 uppercase font-black">Método de Pago</span>
              <span className={`font-black uppercase ${metodoPago === 'credito' ? 'text-red-600' : 'text-emerald-600'}`}>
                {metodoPago}
              </span>
            </div>
          </div>

          {/* DATOS DEL VIAJE */}
          <div className="p-5 space-y-2 border-b-2 border-dashed border-[#1A1A1A]/30">
            <div className="flex justify-between text-xs">
              <span className="text-[#1A1A1A]/50 uppercase font-black">Ruta</span>
              <span className="font-bold text-[#1A1A1A]">San Marcos ⇄ Cajamarca</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#1A1A1A]/50 uppercase font-black">Salida</span>
              <span className="font-bold text-[#1A1A1A]">{turno.hora}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#1A1A1A]/50 uppercase font-black">Vehículo</span>
              <span className="font-mono font-bold text-[#1A1A1A]">Toyota Hiace · {turno.placa}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#1A1A1A]/50 uppercase font-black">Conductor</span>
              <span className="font-bold text-[#1A1A1A]">{turno.conductor}</span>
            </div>
          </div>

          {/* TOTAL + FIRMA */}
          <div className="p-5 flex justify-between items-end">
            <div>
              <span className="block text-[10px] font-black uppercase text-[#1A1A1A]/50">Total Pagado</span>
              <span className="text-3xl font-black text-[#D9531E]">S/ 10.00</span>
            </div>
            <div className="text-right">
              <div className="border-b-2 border-[#1A1A1A]/50 w-24 h-8 mb-1"></div>
              <span className="text-[8px] font-black uppercase text-[#1A1A1A]/50">Firma Chofer</span>
            </div>
          </div>

          {/* PIE */}
          <div className="bg-[#1A1A1A] text-white/60 text-[8px] text-center py-2 font-mono uppercase tracking-widest">
            Presenta este boleto al abordar · Valido solo para la fecha indicada
          </div>
        </div>

        {/* BOTONES (Fuera del boleto para que no aparezcan en la imagen) */}
        <div className="flex gap-2 mt-4">
          <button 
            onClick={onClose}
            className="flex-1 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] font-black text-xs uppercase tracking-wider py-3 hover:bg-slate-100 transition-colors"
          >
            Cerrar
          </button>
          <button 
            onClick={handleEnviarWhatsApp}
            className="flex-2 bg-[#25D366] hover:bg-[#1ebd59] text-white font-black text-xs uppercase tracking-wider py-3 px-4 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.126-.074-.271-.085-.579-.185-.995-.361-1.75-.752-2.898-2.523-2.985-2.64-.087-.118-.714-.95-.714-1.812 0-.862.453-1.286.613-1.46.161-.174.349-.218.465-.218.116 0 .232.002.333.006.106.004.249-.04.391.299.145.343.492 1.201.534 1.287.043.087.072.188.014.304-.058.116-.116.188-.174.259-.058.071-.121.143-.173.208-.058.072-.119.15-.05.272.069.122.309.508.663.823.456.405.838.532.958.591.121.059.192.048.264-.03.072-.078.313-.363.396-.487.083-.124.166-.103.281-.059.115.044.731.343.857.405.126.062.21.092.24.143.03.052.03.301-.114.706z"/></svg>
            Enviar por WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}
