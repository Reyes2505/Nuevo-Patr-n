import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import QRCodeLib from 'qrcode';
import jsPDF from 'jspdf';
import { useUser } from '../context/UserContext';
import Footer from '../components/Footer';
import CheckInTerminal from '../components/CheckInTerminal';

export default function MyTrips() {
  const { user, logout, misBoletos, solicitarReembolso, solicitudesReembolso } = useUser();
  const navigate = useNavigate();
  
  const [boletoSeleccionado, setBoletoSeleccionado] = useState(null);
  const [boletoReembolso, setBoletoReembolso] = useState(null);
  const [motivoReembolso, setMotivoReembolso] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [tabActiva, setTabActiva] = useState('proximos');
  const [descargaStatus, setDescargaStatus] = useState('');

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
          </div>
          <h2 className="text-xl font-black text-slate-900 mb-2">Inicia sesión</h2>
          <p className="text-sm text-slate-500 mb-6">Debes ingresar para ver tus boletos.</p>
          <Link to="/login" className="block w-full bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-xl transition-colors">Ir al Login</Link>
        </div>
      </div>
    );
  }

  const puedeReembolsarse = (boleto) => {
    if (boleto.estadoPago !== 'pagado') return false;
    const yaSolicitado = solicitudesReembolso.some(s => s.boletoCodigo === boleto.codigo);
    if (yaSolicitado) return false;
    return true;
  };

  const handleSolicitarReembolso = (e) => {
    e.preventDefault();
    if (!motivoReembolso.trim()) return;
    solicitarReembolso(boletoReembolso, motivoReembolso);
    setMensajeExito(`Solicitud de reembolso enviada para el boleto ${boletoReembolso.codigo}.`);
    setBoletoReembolso(null);
    setMotivoReembolso('');
    setTimeout(() => setMensajeExito(''), 4000);
  };

  const { proximos, historial, reembolsos } = useMemo(() => {
    const ordenados = [...(misBoletos || [])].sort((a, b) => {
      const fechaA = new Date(a.fecha || 0).getTime();
      const fechaB = new Date(b.fecha || 0).getTime();
      return fechaB - fechaA;
    });

    const prox = ordenados.filter(b => b.estadoPago === 'pagado' || b.estadoPago === 'pendiente');
    const hist = ordenados.filter(b => b.estadoPago === 'reembolsado');
    
    const reem = (solicitudesReembolso || []).map(sol => {
      const boletoOriginal = misBoletos.find(b => b.codigo === sol.boletoCodigo);
      return { solicitud: sol, boleto: boletoOriginal };
    }).filter(item => item.boleto);

    return { proximos: prox, historial: hist, reembolsos: reem };
  }, [misBoletos, solicitudesReembolso]);

  // --- GENERACIÓN DE BOLETO CON QR Y TODA LA INFO ---
  const generarBoletoCanvas = async (boleto) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const W = 800;
    const H = 1500;
    canvas.width = W;
    canvas.height = H;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#18191B';
    ctx.fillRect(0, 0, W, 120);

    ctx.fillStyle = '#FF6A00';
    ctx.font = 'bold 28px Arial';
    ctx.fillText('NUEVO PATRÓN', 40, 50);
    
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px Arial';
    ctx.fillText('RUC 20615321151', 40, 75);

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('CÓDIGO', W - 40, 45);
    
    ctx.fillStyle = '#FF6A00';
    ctx.font = 'bold 22px monospace';
    ctx.fillText(boleto.codigo, W - 40, 80);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#FF6A00';
    ctx.fillRect(40, 140, W - 80, 60);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const fechaStr = boleto.fechaViaje 
      ? new Date(boleto.fechaViaje + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
      : 'Fecha no disponible';
    ctx.fillText('FECHA DEL VIAJE', W/2, 165);
    ctx.font = 'bold 22px Arial';
    ctx.fillText(fechaStr.toUpperCase(), W/2, 190);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px Arial';
    ctx.fillText('ORIGEN', 40, 250);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(boleto.origen, 40, 290);

    ctx.fillStyle = '#FF6A00';
    ctx.font = 'bold 32px Arial';
    ctx.fillText('→', W/2 - 20, 290);

    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'right';
    ctx.fillText('DESTINO', W - 40, 250);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(boleto.destino, W - 40, 290);
    ctx.textAlign = 'left';

    ctx.fillStyle = '#F8F9FA';
    ctx.fillRect(40, 320, W - 80, 80);
    ctx.strokeStyle = '#E2E8F0';
    ctx.strokeRect(40, 320, W - 80, 80);
    ctx.fillStyle = '#94A3B8';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('HORA DE SALIDA', W/2, 345);
    ctx.fillStyle = '#0F172A';
    ctx.font = 'bold 36px Arial';
    ctx.fillText(boleto.turno?.hora || '--:--', W/2, 385);
    ctx.textAlign = 'left';

    ctx.strokeStyle = '#CBD5E1';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(40, 430);
    ctx.lineTo(W - 40, 430);
    ctx.stroke();
    ctx.setLineDash([]);

    const qrValue = `${window.location.origin}/validar/${encodeURIComponent(`BOLETO-${boleto.codigo}-${boleto.asientos}-${boleto.turno?.placa}`)}`;
    
    try {
      const qrDataUrl = await QRCodeLib.toDataURL(qrValue, {
        width: 240,
        margin: 1,
        color: { dark: '#0F172A', light: '#FFFFFF' }
      });
      
      const qrImage = new Image();
      await new Promise((resolve, reject) => {
        qrImage.onload = resolve;
        qrImage.onerror = reject;
        qrImage.src = qrDataUrl;
      });
      
      ctx.drawImage(qrImage, W/2 - 120, 460, 240, 240);
      
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      ctx.strokeRect(W/2 - 130, 450, 260, 260);
      ctx.setLineDash([]);
    } catch (e) {
      console.error('Error QR:', e);
    }

    const info = [
      ['PASAJERO', boleto.nombre],
      ['DNI', boleto.dni],
      ['ASIENTOS', boleto.asientos],
      ['PLACA', boleto.turno?.placa || '---'],
      ['TOTAL', `S/ ${boleto.total?.toFixed(2) || '0.00'}`],
    ];

    let y = 780;
    info.forEach(([label, value]) => {
      ctx.fillStyle = '#94A3B8';
      ctx.font = 'bold 12px Arial';
      ctx.fillText(label, 40, y);
      
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px Arial';
      ctx.fillText(value || '---', 40, y + 28);
      
      y += 80;
    });

    ctx.fillStyle = '#18191B';
    for (let i = 0; i < 80; i++) {
      const width = Math.random() > 0.5 ? 4 : 2;
      ctx.fillRect(40 + i * 8, 1240, width, 40);
    }

    ctx.fillStyle = '#FFF7ED';
    ctx.fillRect(40, 1300, W - 80, 60);
    ctx.fillStyle = '#FF6A00';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PRESENTA ESTE QR AL ABORDAR', W/2, 1335);

    ctx.fillStyle = '#18191B';
    ctx.fillRect(0, H - 60, W, 60);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '12px monospace';
    ctx.fillText('BOLETO DIGITAL · VÁLIDO SOLO PARA LA FECHA INDICADA', W/2, H - 30);
    ctx.textAlign = 'left';

    return canvas;
  };

  const handleDescargarPNG = async () => {
    if (!boletoSeleccionado) return;
    setDescargaStatus('Generando imagen...');
    try {
      const canvas = await generarBoletoCanvas(boletoSeleccionado);
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png', 1.0);
      link.download = `Boleto-${boletoSeleccionado.codigo}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDescargaStatus('¡Imagen descargada!');
      setTimeout(() => setDescargaStatus(''), 2500);
    } catch (e) {
      console.error(e);
      setDescargaStatus('Error al descargar');
      setTimeout(() => setDescargaStatus(''), 3000);
    }
  };

  const handleDescargarPDF = async () => {
    if (!boletoSeleccionado) return;
    setDescargaStatus('Generando PDF...');
    try {
      const canvas = await generarBoletoCanvas(boletoSeleccionado);
      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      pdf.save(`Boleto-${boletoSeleccionado.codigo}.pdf`);
      
      setDescargaStatus('¡PDF descargado!');
      setTimeout(() => setDescargaStatus(''), 2500);
    } catch (e) {
      console.error(e);
      setDescargaStatus('Error al descargar');
      setTimeout(() => setDescargaStatus(''), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-1">
            <span className="text-xl font-black text-brand-orange tracking-tighter">Nuevo</span>
            <span className="text-xl font-black text-slate-900 tracking-tighter">Patrón</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/perfil" className="hidden sm:flex items-center gap-2 bg-slate-50 rounded-full pl-2 pr-3 py-1.5 border border-slate-200 hover:bg-slate-100 transition-colors">
              <div className="w-7 h-7 bg-brand-orange rounded-full flex items-center justify-center text-white text-xs font-black">
                {user.nombre?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-bold text-slate-700">{user.nombre?.split(' ')[0] || 'Usuario'}</span>
            </Link>
            <button onClick={() => { logout(); navigate('/'); }} className="w-9 h-9 rounded-full bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors" title="Cerrar Sesión">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto px-6 py-10 w-full">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-[11px] font-black text-brand-orange uppercase tracking-widest mb-1">Tu billetera de viajes</p>
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Mis Viajes</h1>
            <p className="text-sm text-slate-500 font-medium mt-1">{misBoletos.length} boleto{misBoletos.length !== 1 ? 's' : ''} en total</p>
          </div>
          <Link to="/" className="inline-flex items-center gap-2 bg-[#18191B] hover:bg-black text-white font-black text-sm px-5 py-3 rounded-xl transition-all shadow-lg active:scale-95 w-fit">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
            Comprar boleto
          </Link>
        </div>

        {mensajeExito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-4 rounded-xl mb-6 font-bold flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
            {mensajeExito}
          </div>
        )}

        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-2xl mb-8 w-fit shadow-sm">
          <button onClick={() => setTabActiva('proximos')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${tabActiva === 'proximos' ? 'bg-[#18191B] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
            Próximos <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tabActiva === 'proximos' ? 'bg-white/20' : 'bg-slate-100'}`}>{proximos.length}</span>
          </button>
          <button onClick={() => setTabActiva('historial')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${tabActiva === 'historial' ? 'bg-[#18191B] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
            Historial <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tabActiva === 'historial' ? 'bg-white/20' : 'bg-slate-100'}`}>{historial.length}</span>
          </button>
          <button onClick={() => setTabActiva('reembolsos')} className={`px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${tabActiva === 'reembolsos' ? 'bg-[#18191B] text-white shadow-md' : 'text-slate-500 hover:text-slate-900'}`}>
            Reembolsos {reembolsos.length > 0 && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tabActiva === 'reembolsos' ? 'bg-white/20' : 'bg-orange-100 text-brand-orange'}`}>{reembolsos.length}</span>}
          </button>
        </div>

        <div className="min-h-[300px]">
          {tabActiva === 'proximos' && (
            proximos.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"/></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">No tienes viajes próximos</h3>
                <p className="text-sm text-slate-500 mb-6">Cuando compres un pasaje, aparecerá aquí listo para abordar.</p>
                <Link to="/" className="bg-brand-orange hover:bg-orange-700 text-white font-black py-3 px-8 rounded-xl transition-colors">Comprar mi primer pasaje</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {proximos.map((boleto, index) => {
                  const isPendiente = boleto.estadoPago === 'pendiente';
                  const reembolsable = puedeReembolsarse(boleto);
                  const fechaFormateada = boleto.fechaViaje 
                    ? new Date(boleto.fechaViaje + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '';
                  const esHoy = boleto.fechaViaje === new Date().toISOString().split('T')[0];
                  
                  return (
                    <div key={`${boleto.codigo}-${index}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all flex flex-col">
                      <div className={`text-white p-4 ${isPendiente ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gradient-to-r from-[#18191B] to-slate-800'}`}>
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-widest opacity-80">{isPendiente ? 'Pendiente' : 'Pagado'}</span>
                            <p className="font-black text-sm">{boleto.origen} → {boleto.destino}</p>
                          </div>
                          <span className="text-xl font-black">{boleto.turno?.hora}</span>
                        </div>
                        {fechaFormateada && (
                          <p className="text-[10px] font-bold text-white/70 mt-1">📅 {fechaFormateada}</p>
                        )}
                      </div>
                      <div className="p-4 flex items-center justify-between border-b border-slate-100">
                        <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Asientos</p>
                          <p className="font-black text-brand-orange text-sm">{boleto.asientos}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Código</p>
                          <p className="font-mono font-black text-slate-700 text-xs">{boleto.codigo}</p>
                        </div>
                      </div>

                      {/* CHECK-IN AUTOMÁTICO SI ES HOY */}
                      {esHoy && boleto.estadoPago === 'pagado' && (
                        <div className="px-3 pt-3">
                          <CheckInTerminal boleto={boleto} />
                        </div>
                      )}

                      <div className="p-3 bg-slate-50 flex justify-between items-center gap-2 mt-auto">
                        <button onClick={() => setBoletoSeleccionado(boleto)} className="text-[10px] font-black text-brand-orange uppercase tracking-wider hover:underline">Ver boleto</button>
                        {reembolsable && <button onClick={() => setBoletoReembolso(boleto)} className="text-[10px] font-black text-red-600 uppercase tracking-wider hover:underline">Reembolso</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tabActiva === 'historial' && (
            historial.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">Historial vacío</h3>
                <p className="text-sm text-slate-500">Aquí aparecerán los boletos que hayan sido reembolsados.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {historial.map((boleto, index) => (
                  <div key={`${boleto.codigo}-${index}`} className="bg-white rounded-2xl border border-slate-200 overflow-hidden opacity-75">
                    <div className="p-4 bg-slate-500 text-white">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-widest opacity-80">Reembolsado</span>
                          <p className="font-black text-sm">{boleto.origen} → {boleto.destino}</p>
                        </div>
                        <span className="text-xl font-black">{boleto.turno?.hora}</span>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <p className="font-mono font-black text-slate-500 text-xs">{boleto.codigo}</p>
                      <button onClick={() => setBoletoSeleccionado(boleto)} className="text-[10px] font-black text-slate-500 uppercase tracking-wider hover:underline">Ver detalles</button>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tabActiva === 'reembolsos' && (
            reembolsos.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center flex flex-col items-center">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"/></svg>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">Sin solicitudes</h3>
                <p className="text-sm text-slate-500">Si solicitas un reembolso, podrás hacer seguimiento aquí.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reembolsos.map((item) => (
                  <div key={item.solicitud.id} className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z"/></svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-black text-slate-900">Boleto {item.boleto.codigo}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          item.solicitud.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' :
                          item.solicitud.estado === 'rechazado' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-brand-orange'
                        }`}>
                          {item.solicitud.estado === 'aprobado' ? 'Aprobado' : item.solicitud.estado === 'rechazado' ? 'Rechazado' : 'En revisión'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{item.boleto.origen} → {item.boleto.destino} · {item.boleto.turno?.hora}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Monto</p>
                      <p className="font-black text-slate-900">S/ {item.solicitud.monto?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </main>
      
      <Footer />

      {/* MODAL BOLETO CON INFO PRIMORDIAL */}
      {boletoSeleccionado && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto" onClick={() => setBoletoSeleccionado(null)}>
          <div className="animate-scale-in my-8" onClick={(e) => e.stopPropagation()}>
            
            <div className="bg-[#18191B] rounded-2xl overflow-hidden shadow-2xl max-w-sm w-full">
              <div className="p-4 flex justify-between items-center border-b border-white/10">
                <div>
                  <p className="text-[9px] font-black text-brand-orange uppercase tracking-widest">Nuevo Patrón</p>
                  <p className="text-[8px] font-mono text-white/50">RUC 20615321151</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-white/50 uppercase tracking-widest">Código</p>
                  <p className="text-xs font-mono font-black text-brand-orange">{boletoSeleccionado.codigo}</p>
                </div>
              </div>
              <div className="p-5 bg-white">
                <div className="bg-gradient-to-r from-brand-orange to-orange-600 rounded-xl p-3 mb-4 text-center">
                  <p className="text-[9px] font-black text-white/80 uppercase tracking-widest mb-1">Fecha del viaje</p>
                  <p className="text-sm font-black text-white capitalize">
                    {boletoSeleccionado.fechaViaje 
                      ? new Date(boletoSeleccionado.fechaViaje + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
                      : 'Fecha no disponible'}
                  </p>
                </div>

                <div className="flex items-center justify-between mb-4 pb-3 border-b border-dashed border-slate-300">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Origen</p>
                    <p className="text-lg font-black text-slate-900">{boletoSeleccionado.origen}</p>
                  </div>
                  <svg className="w-6 h-6 text-brand-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3"/></svg>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Destino</p>
                    <p className="text-lg font-black text-slate-900">{boletoSeleccionado.destino}</p>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 mb-4 text-center border border-slate-200">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Hora de salida</p>
                  <p className="text-2xl font-black text-slate-900">{boletoSeleccionado.turno?.hora}</p>
                </div>

                <div className="flex justify-center mb-4">
                  <div className="bg-white p-3 border-2 border-dashed border-slate-300 rounded-xl">
                    <QRCode 
                      value={`${window.location.origin}/validar/${encodeURIComponent(`BOLETO-${boletoSeleccionado.codigo}-${boletoSeleccionado.asientos}-${boletoSeleccionado.turno?.placa}`)}`}
                      size={120} 
                      fgColor="#0F172A"
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Pasajero</span>
                    <span className="text-xs font-black text-slate-900 text-right truncate max-w-[200px]">{boletoSeleccionado.nombre}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">DNI</span>
                    <span className="text-xs font-mono font-black text-slate-900">{boletoSeleccionado.dni}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Asientos</span>
                    <span className="text-sm font-black text-brand-orange">{boletoSeleccionado.asientos}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Placa</span>
                    <span className="text-xs font-mono font-black text-slate-900">{boletoSeleccionado.turno?.placa}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Total</span>
                    <span className="text-sm font-black text-slate-900">S/ {boletoSeleccionado.total?.toFixed(2)}</span>
                  </div>
                </div>

                <div className="w-full h-10 bg-[repeating-linear-gradient(90deg,#0F172A_0px,#0F172A_2px,#fff_2px,#fff_4px)] opacity-80 rounded-sm mb-3"></div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-2.5 text-center">
                  <p className="text-[9px] font-black text-brand-orange uppercase">Presenta este QR al abordar · Válido solo el día del viaje</p>
                </div>
              </div>
              <div className="py-2 text-center bg-[#18191B]">
                <p className="text-[8px] font-mono text-white/50 uppercase tracking-widest">Boleto digital · Válido solo para la fecha indicada</p>
              </div>
            </div>

            {descargaStatus && (
              <div className="mt-3 bg-blue-50 border border-blue-200 text-blue-700 text-[11px] p-2 rounded-lg text-center font-bold">
                {descargaStatus}
              </div>
            )}

            <div className="mt-4 grid grid-cols-3 gap-2 max-w-sm">
              <button onClick={handleDescargarPNG} className="bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                PNG
              </button>
              <button onClick={handleDescargarPDF} className="bg-white border-2 border-slate-900 hover:bg-slate-50 text-slate-900 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
                PDF
              </button>
              <button onClick={() => setBoletoSeleccionado(null)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-wider py-3 rounded-xl transition-all active:scale-95">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {boletoReembolso && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={() => setBoletoReembolso(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-md w-full animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-black mb-2">Solicitar reembolso</h2>
            <p className="text-sm text-slate-500 mb-4">Boleto {boletoReembolso.codigo} · S/ {boletoReembolso.total?.toFixed(2)}</p>
            <form onSubmit={handleSolicitarReembolso}>
              <textarea value={motivoReembolso} onChange={(e) => setMotivoReembolso(e.target.value)} rows={4} required placeholder="Motivo del reembolso..." className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-orange mb-4"/>
              <div className="flex gap-2">
                <button type="button" onClick={() => setBoletoReembolso(null)} className="flex-1 bg-slate-100 py-3 rounded-xl font-bold">Cancelar</button>
                <button type="submit" className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black">Enviar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
