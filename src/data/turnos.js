const FLOTA_DEFAULT = [
  { nombre: "Segundo Ramírez C.", placa: "M5S-188", terminal: "San Marcos", activo: true, foto: "" },
  { nombre: "Carlos Mendoza P.", placa: "T3X-120", terminal: "San Marcos", activo: true, foto: "" },
  { nombre: "Víctor Huamán R.", placa: "A8K-942", terminal: "Cajamarca", activo: true, foto: "" },
  { nombre: "Julio César B.", placa: "M5S-189", terminal: "Cajamarca", activo: true, foto: "" },
];

const obtenerFlota = () => {
  try {
    const saved = JSON.parse(localStorage.getItem('flotaConductores') || 'null');
    if (saved && Array.isArray(saved) && saved.length > 0) {
      const flotaValida = saved.filter(c => c && c.nombre && c.placa && c.activo !== false);
      if (flotaValida.length > 0) return flotaValida;
    }
  } catch (e) { 
    console.warn('Error leyendo flota:', e); 
  }
  
  localStorage.setItem('flotaConductores', JSON.stringify(FLOTA_DEFAULT));
  return FLOTA_DEFAULT;
};

const seededRandom = (seed) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash |= 0;
  }
  return () => {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash) / 233280;
  };
};

const DURACION_VIAJE = 105;
const MARGEN_DESCANSO = 15;
const TIEMPO_TOTAL_OCUPADO = DURACION_VIAJE + MARGEN_DESCANSO;

const generarAsignacionDia = (fecha, origen) => {
  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const seed = `${año}-${mes}-${dia}-${origen}`;
  const random = seededRandom(seed);

  const flota = obtenerFlota();
  
  let pool = flota.filter(c => c.terminal === origen);
  if (pool.length === 0) pool = flota;

  if (pool.length === 0) {
    console.error('❌ Flota vacía');
    return {};
  }

  // Mezclar el pool con el random determinístico
  const poolMezclado = [...pool].sort(() => random() - 0.5);

  const ocupadosHasta = {};
  poolMezclado.forEach(c => { ocupadosHasta[c.nombre] = 0; });

  const asignacion = {};

  // ✅ NUEVO: Índice rotativo para round-robin puro
  let indiceRotativo = 0;

  for (let hora = 5; hora <= 20; hora++) {
    for (let minuto of [0, 30]) {
      if (hora === 20 && minuto === 30) continue;
      
      const minutoActual = (hora - 5) * 60 + minuto;
      
      // ✅ NUEVO: Round-robin puro
      // Buscar el siguiente conductor disponible desde el índice rotativo
      let choferDisponible = null;
      let intentos = 0;
      
      while (!choferDisponible && intentos < poolMezclado.length) {
        const candidato = poolMezclado[indiceRotativo % poolMezclado.length];
        
        if (ocupadosHasta[candidato.nombre] <= minutoActual) {
          choferDisponible = candidato;
        }
        
        indiceRotativo++;
        intentos++;
      }
      
      // Si ningún conductor está disponible, usar el que se libere primero
      if (!choferDisponible) {
        choferDisponible = poolMezclado.reduce((min, c) => 
          ocupadosHasta[c.nombre] < ocupadosHasta[min.nombre] ? c : min
        , poolMezclado[0]);
      }
      
      if (choferDisponible) {
        asignacion[`${hora}-${minuto}`] = choferDisponible;
        ocupadosHasta[choferDisponible.nombre] = minutoActual + TIEMPO_TOTAL_OCUPADO;
      }
    }
  }

  return asignacion;
};

const generarTurnoConChofer = (fecha, hora, minuto, origen, asignacion) => {
  const año = fecha.getFullYear();
  const mes = fecha.getMonth() + 1;
  const dia = fecha.getDate();
  const horaStr = hora.toString().padStart(2, '0');
  const minStr = minuto.toString().padStart(2, '0');
  const ampm = hora < 12 ? 'AM' : 'PM';
  const hora12 = hora > 12 ? hora - 12 : (hora === 0 ? 12 : hora);
  
  const chofer = asignacion[`${hora}-${minuto}`];
  
  return {
    id: `T-${año}${mes.toString().padStart(2, '0')}${dia.toString().padStart(2, '0')}-${horaStr}${minStr}-${origen === 'San Marcos' ? 'SM' : 'CAJ'}`,
    fecha: fecha.toISOString().split('T')[0],
    origen,
    destino: origen === 'San Marcos' ? 'Cajamarca' : 'San Marcos',
    hora: `${hora12}:${minStr} ${ampm}`,
    horaNumerica: hora * 60 + minuto,
    conductor: chofer ? chofer.nombre : 'Por asignar',
    placa: chofer ? chofer.placa : '---',
    fotoConductor: chofer ? (chofer.foto || '') : '',
    disponible: chofer !== null,
    asientosDisponibles: 15,
    ocupados: [],
    estado: 'programado',
  };
};

const calcularEstado = (turno, fechaDelTurno) => {
  const ahora = new Date();
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const fechaTurno = new Date(fechaDelTurno);
  fechaTurno.setHours(0, 0, 0, 0);
  
  if (fechaTurno < hoy) return 'salido';
  
  if (fechaTurno.getTime() === hoy.getTime()) {
    const horaActualMinutos = ahora.getHours() * 60 + ahora.getMinutes();
    if (horaActualMinutos > turno.horaNumerica + 15) return 'salido';
    if (horaActualMinutos >= turno.horaNumerica) return 'abordando';
  }
  
  return 'programado';
};

export const getTurnos = () => {
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const diaInicio = horaActual >= 20 ? 1 : 0;
  
  const turnosRotativos = [];
  
  for (let i = diaInicio; i < diaInicio + 7; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + i);
    fecha.setHours(0, 0, 0, 0);
    
    const asignacionSM = generarAsignacionDia(fecha, 'San Marcos');
    const asignacionCAJ = generarAsignacionDia(fecha, 'Cajamarca');
    
    for (let hora = 5; hora <= 20; hora++) {
      for (let minuto of [0, 30]) {
        if (hora === 20 && minuto === 30) continue;
        
        const turnoSM = generarTurnoConChofer(fecha, hora, minuto, 'San Marcos', asignacionSM);
        const estadoSM = calcularEstado(turnoSM, fecha);
        if (estadoSM !== 'salido') {
          turnosRotativos.push({ ...turnoSM, dia: i - diaInicio, estado: estadoSM, visible: true });
        }
        
        const turnoCAJ = generarTurnoConChofer(fecha, hora, minuto, 'Cajamarca', asignacionCAJ);
        const estadoCAJ = calcularEstado(turnoCAJ, fecha);
        if (estadoCAJ !== 'salido') {
          turnosRotativos.push({ ...turnoCAJ, dia: i - diaInicio, estado: estadoCAJ, visible: true });
        }
      }
    }
  }
  
  return turnosRotativos;
};

export const getFechas7Dias = () => {
  const dias = [];
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const diaInicio = horaActual >= 20 ? 1 : 0;
  
  const nombresDias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const nombresMes = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  
  for (let i = 0; i < 7; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() + diaInicio + i);
    
    let label = nombresDias[fecha.getDay()];
    if (i === 0 && diaInicio === 0) label = 'Hoy';
    if (i === 0 && diaInicio === 1) label = 'Mañana';
    if (i === 1 && diaInicio === 0) label = 'Mañana';
    
    dias.push({
      label,
      dia: fecha.getDate(),
      mes: nombresMes[fecha.getMonth()],
      fecha: fecha.toISOString().split('T')[0],
      index: i,
    });
  }
  
  return dias;
};

export const getYapeEmpresa = () => ({
  titular: "EMPRESA DE TRANSPORTES NUEVO PATRON SAN MARCOS S.R.L.",
  ruc: "20615321151",
  numero: "999 888 777",
  tipo: "Yape Negocios",
});
