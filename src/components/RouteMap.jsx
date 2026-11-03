import { useState, useEffect } from 'react';

export default function RouteMap() {
  const [tiempoEstimado, setTiempoEstimado] = useState('');

  // Coordenadas exactas
  const originPos = [-7.1670, -78.5015];
  const destPos = [-7.3363, -78.1720];

  useEffect(() => {
    // Usamos OSRM para calcular el tiempo real (lo pasamos al padre, pero lo dejamos aquí por si acaso)
    const url = `https://router.project-osrm.org/route/v1/driving/${originPos[1]},${originPos[0]};${destPos[1]},${destPos[0]}?overview=false`;
    
    fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.routes && data.routes.length > 0) {
          const segundos = data.routes[0].duration;
          const minutos = Math.round(segundos / 60);
          const horas = Math.floor(minutos / 60);
          const minRestantes = minutos % 60;
          setTiempoEstimado(horas > 0 ? `${horas}h ${minRestantes} min` : `${minutos} min`);
        }
      })
      .catch(() => {});
  }, []);

  // URL del mapa visual
  const mapUrl = "https://maps.google.com/maps?q=Terminal+Terrestre+San+Marcos,+Cajamarca&t=&z=10&ie=UTF8&iwloc=&output=embed&saddr=Terminal+Terrestre+San+Marcos,+Cajamarca&daddr=Empresa+transportes+Divino+Patron+San+Marcos+SRL.,+Bolognesi+318,+San+Marcos+06321&dirflg=d";

  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 w-full mt-6">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-slate-800">Trazado de Ruta</h3>
        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded">
          Carretera 3N
        </span>
      </div>
      
      <div className="w-full h-[400px] rounded-xl overflow-hidden border border-slate-200 relative bg-slate-100 shadow-inner">
        <iframe 
          src={mapUrl}
          width="100%" 
          height="100%" 
          style={{ border: 0 }} 
          allowFullScreen="" 
          loading="lazy" 
          referrerPolicy="no-referrer-when-downgrade"
          title="Ruta San Marcos a Cajamarca"
          className="absolute inset-0"
        ></iframe>
      </div>
    </div>
  );
}
