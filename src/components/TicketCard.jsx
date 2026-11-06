import { useRef } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';

export default function TicketCard({ boleto, turno, onClose }) {
  const ticketRef = useRef(null);
  const isPendiente = boleto.estadoPago === 'pendiente';

  const handleDescargar = async () => {
    if (!ticketRef.current) return;
    try {
      const canvas = await html2canvas(ticketRef.current, { scale: 2, backgroundColor: '#FFFFFF' });
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `boleto-${boleto.codigo}.png`;
      link.click();
    } catch (e) { alert('Error generando la imagen.'); }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full overflow-hidden">
      <div ref={ticketRef} className="bg-white">
        <div className={`p-4 text-white ${isPendiente ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-brand-orange to-brand-red'}`}>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Nuevo Patrón</p>
              <p className="text-xs font-mono font-bold opacity-90">RUC 20615321151</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest opacity-80">Código</p>
              <p className="font-mono text-xs font-black">{boleto.codigo}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {/* Badge de estado */}
          <div className="flex justify-center mb-4">
            <span className={`inline-block px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full ${
              isPendiente ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {isPendiente ? 'Pendiente de pago' : 'Pagado'}
            </span>
          </div>

          <div className="flex justify-between items-center mb-4 pb-4 border-b border-dashed border-slate-200">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Origen</p>
              <p className="text-sm font-black text-slate-900">{boleto.origen}</p>
            </div>
            <div className="text-brand-orange"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg></div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Destino</p>
              <p className="text-sm font-black text-slate-900">{boleto.destino}</p>
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <div className="bg-white p-3 border-2 border-dashed border-slate-200 rounded-lg">
              <QRCode value={`BOLETO-${boleto.codigo}-${boleto.turno?.placa}`} size={120} fgColor="#0F172A"/>
            </div>
          </div>

          <div className="space-y-2 text-xs mb-4">
            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Pasajero</span><span className="font-black text-slate-900">{boleto.nombre || 'Cliente'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Asiento</span><span className="font-black text-brand-orange">{boleto.asientos}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Salida</span><span className="font-black text-slate-900">{boleto.turno?.hora}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Vehículo</span><span className="font-mono font-black text-slate-900">{boleto.turno?.placa}</span></div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-dashed border-slate-200">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Total</p>
              <p className="text-lg font-black text-slate-900">S/ {(boleto.total || 10).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Método</p>
              <p className="font-black text-slate-900 uppercase text-xs">{boleto.metodo || 'Yape'}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 text-white text-[8px] text-center py-2 px-3 font-mono uppercase tracking-wider">
          {isPendiente ? 'Presenta este código en ventanilla para pagar' : 'Presenta este boleto al abordar · Válido solo para la fecha indicada'}
        </div>
      </div>

      <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
        <button onClick={handleDescargar} className="flex-1 bg-white border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg hover:bg-slate-100 transition-colors">Descargar</button>
        <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider py-2.5 rounded-lg hover:bg-slate-800 transition-colors">Imprimir</button>
        {onClose && <button onClick={onClose} className="w-10 bg-slate-200 text-slate-600 font-bold rounded-lg hover:bg-slate-300 transition-colors">×</button>}
      </div>
    </div>
  );
}
