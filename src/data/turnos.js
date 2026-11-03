// Simulamos la base de datos de turnos para los próximos 3 días
const conductores = [
  { nombre: "Segundo Ramírez C.", placa: "M5S-188", yape: "901 729 528" },
  { nombre: "Carlos Mendoza P.", placa: "T3X-120", yape: "976 432 109" },
  { nombre: "Víctor Huamán R.", placa: "A8K-942", yape: "955 965 645" },
  { nombre: "Julio César B.", placa: "M5S-189", yape: "912 345 678" },
];

// Generador de turnos de 4:00 AM a 8:00 PM cada 30 min
export const getTurnos = () => {
  const turnos = [];
  let id = 1;
  
  // Generamos turnos para hoy y los próximos 2 días (3 días en total)
  for (let dia = 0; dia < 3; dia++) {
    for (let hora = 4; hora <= 20; hora++) {
      for (let minuto of [0, 30]) {
        if (hora === 20 && minuto === 30) continue; // El último es 8:00 PM (20:00)

        const horaStr = hora.toString().padStart(2, '0');
        const minStr = minuto.toString().padStart(2, '0');
        const ampm = hora < 12 ? 'AM' : 'PM';
        const hora12 = hora > 12 ? hora - 12 : (hora === 0 ? 12 : hora);

        // Asignamos un conductor aleatorio a cada turno
        const chofer = conductores[(id) % conductores.length];
        // Simulamos algunos asientos ocupados (varía por turno)
        const asientosOcupados = Array.from({ length: Math.floor(Math.random() * 5) }, () => Math.floor(Math.random() * 15) + 1);

        turnos.push({
          id: `T-${dia}-${horaStr}${minStr}`,
          dia: dia,
          hora: `${hora12}:${minStr} ${ampm}`,
          conductor: chofer.nombre,
          placa: chofer.placa,
          yape: chofer.yape,
          asientosDisponibles: 15 - asientosOcupados.length,
          ocupados: asientosOcupados
        });
        id++;
      }
    }
  }
  return turnos;
};
