import { useRef, useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function BoardingPass({ boleto, pasajeros, turno, origen, destino, onClose }) {
  const ticketRef = useRef(null);
  const [logoBase64, setLogoBase64] = useState('');
  const [descargando, setDescargando] = useState(false);
  const [status, setStatus] = useState('');
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = '/logo-patron.png';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      setLogoBase64(canvas.toDataURL('image/png'));
    };
    setTimeout(() => setQrReady(true), 500);
  }, []);

  const pasajeroPrincipal = boleto.pasajeros?.[0] || pasajeros?.[Object.keys(pasajeros || {})[0]];
  const nombreCompleto = pasajeroPrincipal 
    ? `${pasajeroPrincipal.nombre} ${pasajeroPrincipal.apellidos}`.trim()
    : boleto.nombre || 'Cliente';
  
  const asientosTexto = boleto.asientos || boleto.asientosArray?.map(n => `N°${n}`).join(', ') || '—';
  const horaSalida = boleto.turno?.hora || turno?.hora || '—';
  const placa = boleto.turno?.placa || turno?.placa || '—';
  const rutaOrigen = boleto.origen || origen || 'San Marcos';
  const rutaDestino = boleto.destino || destino || 'Cajamarca';
  const codigo = boleto.codigo || '—';

  // URL de validación del boleto (para escanear con cualquier cámara)
  const qrValue = `${window.location.origin}/validar/${encodeURIComponent(`BOLETO-${codigo}-${asientosTexto}-${placa}`)}`;

  const generarCaptura = async () => {
    if (!ticketRef.current) throw new Error('No hay elemento para capturar');
    if (!qrReady) throw new Error('Espera un momento, el boleto aún se está generando.');

    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '0';
    wrapper.style.left = '-9999px';
    wrapper.style.width = '420px';
    wrapper.style.backgroundColor = '#FFFFFF';
    wrapper.style.zIndex = '-1';

    const clon = ticketRef.current.cloneNode(true);
    clon.style.width = '420px';
    clon.style.maxWidth = '420px';
    clon.style.margin = '0';
    clon.style.boxShadow = 'none';
    wrapper.appendChild(clon);

    document.body.appendChild(wrapper);
    await new Promise(resolve => setTimeout(resolve, 400));

    const canvas = await html2canvas(wrapper, {
      scale: 3,
      backgroundColor: '#FFFFFF',
      useCORS: true,
      allowTaint: true,
      logging: false,
      width: 420,
      height: wrapper.scrollHeight,
      windowWidth: 420,
      windowHeight: wrapper.scrollHeight,
      scrollX: 0,
      scrollY: 0,
    });

    document.body.removeChild(wrapper);
    return canvas;
  };

  const handleDescargarPNG = async () => {
    if (descargando) return;
    setDescargando(true);
    setStatus('Generando imagen...');
    try {
      const canvas = await generarCaptura();
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `Boleto-${codigo}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setStatus('¡Imagen descargada!');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error('Error PNG:', e);
      setStatus('Error: ' + e.message);
      setTimeout(() => setStatus(''), 4000);
    } finally {
      setDescargando(false);
    }
  };

  const handleDescargarPDF = async () => {
    if (descargando) return;
    setDescargando(true);
    setStatus('Generando PDF...');
    try {
      const canvas = await generarCaptura();
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Boleto-${codigo}.pdf`);
      setStatus('¡PDF descargado!');
      setTimeout(() => setStatus(''), 2000);
    } catch (e) {
      console.error('Error PDF:', e);
      setStatus('Error: ' + e.message);
      setTimeout(() => setStatus(''), 4000);
    } finally {
      setDescargando(false);
    }
  };

  const C = {
    dark: '#0F172A',
    orange: '#D9531E',
    white: '#FFFFFF',
    gray200: '#E2E8F0',
    gray300: '#CBD5E1',
    gray400: '#94A3B8',
    gray500: '#64748B',
    gray900: '#0F172A',
    orangeLight: '#FFF7ED',
    orangeBorder: '#FED7AA',
    whiteMuted: 'rgba(255,255,255,0.6)',
  };

  return (
    <div>
      <div 
        ref={ticketRef} 
        style={{
          backgroundColor: C.white,
          borderRadius: '16px',
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          width: '100%',
          maxWidth: '400px',
          margin: '0 auto',
          border: '1px solid ' + C.gray200,
        }}
      >
        {/* CABECERA */}
        <div style={{ backgroundColor: C.dark, color: C.white, padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {logoBase64 ? (
              <img src={logoBase64} alt="Nuevo Patrón" style={{ height: '48px', width: 'auto' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ height: '48px', width: '96px', backgroundColor: C.gray300, borderRadius: '4px' }}></div>
            )}
            <div>
              <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.orange }}>Nuevo Patrón</p>
              <p style={{ fontSize: '8px', fontFamily: 'monospace', color: C.whiteMuted }}>RUC 20615321151</p>
            </div>
          </div>
          <div>
            <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.whiteMuted, textAlign: 'right' }}>Boleto</p>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 900, color: C.orange, textAlign: 'right' }}>{codigo}</p>
          </div>
        </div>

        {/* CUERPO */}
        <div style={{ padding: '20px', backgroundColor: C.white }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px dashed ' + C.gray300 }}>
            <div>
              <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Origen</p>
              <p style={{ fontSize: '18px', fontWeight: 900, color: C.gray900 }}>{rutaOrigen}</p>
            </div>
            <div style={{ padding: '0 8px' }}>
              <svg style={{ width: '24px', height: '24px', color: C.orange }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
              </svg>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Destino</p>
              <p style={{ fontSize: '18px', fontWeight: 900, color: C.gray900 }}>{rutaDestino}</p>
            </div>
          </div>

          {/* QR apuntando a la URL de validación */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ backgroundColor: C.white, padding: '12px', border: '2px dashed ' + C.gray300, borderRadius: '12px' }}>
              <QRCode value={qrValue} size={140} fgColor={C.dark} />
            </div>
          </div>

          <div style={{ fontSize: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Pasajero</span>
              <span style={{ fontWeight: 900, color: C.gray900 }}>{nombreCompleto}</span>
            </div>
            {pasajeroPrincipal?.dni && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>DNI</span>
                <span style={{ fontWeight: 900, color: C.gray900, fontFamily: 'monospace' }}>{pasajeroPrincipal.dni}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Asiento(s)</span>
              <span style={{ fontWeight: 900, color: C.orange, fontSize: '14px' }}>{asientosTexto}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Hora de salida</span>
              <span style={{ fontWeight: 900, color: C.gray900 }}>{horaSalida}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Placa</span>
              <span style={{ fontWeight: 900, color: C.gray900, fontFamily: 'monospace' }}>{placa}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 0', marginTop: '8px', borderTop: '1px dashed ' + C.gray300 }}>
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.gray400 }}>Total pagado</span>
              <span style={{ fontWeight: 900, color: C.gray900 }}>S/ {(boleto.total || 10).toFixed(2)}</span>
            </div>
          </div>

          <div style={{ backgroundColor: C.orangeLight, border: '1px solid ' + C.orangeBorder, borderRadius: '8px', padding: '12px', marginTop: '16px' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.orange, marginBottom: '4px' }}>Presenta este boleto al abordar</p>
            <p style={{ fontSize: '10px', color: C.gray500, lineHeight: 1.5 }}>Preséntate 15 minutos antes en el terminal. El conductor escaneará este código QR para validar tu asiento.</p>
          </div>
        </div>

        <div style={{ backgroundColor: C.dark, color: C.whiteMuted, textAlign: 'center', padding: '8px', fontSize: '8px', fontFamily: 'monospace', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          Boleto digital · Válido solo para la fecha y hora indicadas
        </div>
      </div>

      {status && (
        <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] p-2 rounded-lg text-center font-bold">
          {status}
        </div>
      )}

      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={handleDescargarPNG} disabled={descargando}
          className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5">
          {descargando ? (
            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
          )}
          PNG
        </button>
        <button onClick={handleDescargarPDF} disabled={descargando}
          className="bg-white border-2 border-slate-900 hover:bg-slate-50 disabled:opacity-50 text-slate-900 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
          PDF
        </button>
        {onClose && (
          <button onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all">
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
}
