const STORAGE_KEY = 'comprobantesElectronicos';
const SERIE_BOLETA = 'B001';
const SERIE_FACTURA = 'F001';

// Obtiene todos los comprobantes
export const getComprobantes = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    return [];
  }
};

// Obtiene el próximo número correlativo para la serie
export const getProximoNumero = (serie = SERIE_BOLETA) => {
  const comprobantes = getComprobantes();
  const deLaSerie = comprobantes.filter(c => c.serie === serie);
  if (deLaSerie.length === 0) return 1;
  const maxNumero = Math.max(...deLaSerie.map(c => c.numero));
  return maxNumero + 1;
};

// Genera un comprobante a partir de un boleto
export const generarComprobante = (boleto, tipo = 'boleta') => {
  const serie = tipo === 'factura' ? SERIE_FACTURA : SERIE_BOLETA;
  const numero = getProximoNumero(serie);
  const numeroFormateado = String(numero).padStart(8, '0');
  const id = `${serie}-${numeroFormateado}`;

  const total = boleto.total || 0;
  const baseImponible = total / 1.18;
  const igv = total - baseImponible;

  const comprobante = {
    id,
    serie,
    numero,
    numeroFormateado,
    tipo,
    fechaEmision: new Date().toISOString(),
    boletoCodigo: boleto.codigo,
    clienteNombre: boleto.nombre || 'Cliente',
    clienteDni: boleto.dni || '',
    baseImponible: parseFloat(baseImponible.toFixed(2)),
    igv: parseFloat(igv.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
    estadoSunat: 'aceptado', // Simulamos que SUNAT lo acepta al instante
    hashCpe: generarHashCpe(id, total),
    turno: boleto.turno,
    origen: boleto.origen,
    destino: boleto.destino,
  };

  const comprobantes = getComprobantes();
  const nuevos = [comprobante, ...comprobantes];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevos));

  // Notificar a otras pestañas
  const channel = new BroadcastChannel('sync-comprobantes');
  channel.postMessage({});
  channel.close();

  return comprobante;
};

// Genera un hash simulado tipo CPE (Código de Producto Electrónico)
const generarHashCpe = (id, total) => {
  const str = `${id}-${total}-${Date.now()}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(12, '0').slice(0, 12);
};

// Anular un comprobante
export const anularComprobante = (id, motivo = 'Anulación solicitada') => {
  const comprobantes = getComprobantes();
  const actualizados = comprobantes.map(c => 
    c.id === id 
      ? { ...c, estadoSunat: 'anulado', motivoAnulacion: motivo, fechaAnulacion: new Date().toISOString() }
      : c
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizados));
  
  const channel = new BroadcastChannel('sync-comprobantes');
  channel.postMessage({});
  channel.close();
  
  return actualizados;
};

// Obtener comprobantes por período (mes/año)
export const getComprobantesPorPeriodo = (mes, año) => {
  return getComprobantes().filter(c => {
    const f = new Date(c.fechaEmision);
    return f.getMonth() === mes && f.getFullYear() === año && c.estadoSunat !== 'anulado';
  });
};

// Calcular resumen tributario de un período
export const calcularResumenTributario = (mes, año) => {
  const comprobantes = getComprobantesPorPeriodo(mes, año);
  const totalFacturado = comprobantes.reduce((s, c) => s + c.total, 0);
  const baseImponible = comprobantes.reduce((s, c) => s + c.baseImponible, 0);
  const igvTotal = comprobantes.reduce((s, c) => s + c.igv, 0);
  const renta = baseImponible * 0.015;
  const detraccion = totalFacturado * 0.12;

  return {
    cantidad: comprobantes.length,
    totalFacturado,
    baseImponible,
    igvTotal,
    renta,
    detraccion,
    comprobantes,
  };
};
