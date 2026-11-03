export default function SeatMap({ selectedSeats, onSeatToggle, occupiedSeatsExternos = [] }) {
  
  const handleSeatClick = (seatNumber) => {
    if (occupiedSeatsExternos.includes(seatNumber)) return;
    onSeatToggle(seatNumber);
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-slate-200 w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Croquis Técnico</h2>
          <p className="text-xs text-slate-500 font-medium">Selecciona tus asientos (Compra múltiple permitida)</p>
        </div>
        <div className="flex gap-3 text-[11px] font-medium text-slate-600">
          <span className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-sm"></div>Libre</span>
          <span className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-brand-orange border-2 border-brand-orange rounded-sm"></div>Elegido</span>
          <span className="flex items-center gap-1.5"><div className="w-3.5 h-3.5 bg-slate-200 border-2 border-slate-300 rounded-sm"></div>Ocupado</span>
        </div>
      </div>

      <div className="bg-slate-50 rounded-xl p-2 sm:p-4 flex justify-center border border-slate-200 overflow-hidden relative">
        <svg viewBox="0 0 1120 540" className="w-full h-auto max-h-[420px] select-none drop-shadow-md">
          <defs>
            <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#e2e8f0" />
            </linearGradient>
            <linearGradient id="liveryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8B1C1C" />
              <stop offset="50%" stopColor="#D9531E" />
              <stop offset="100%" stopColor="#8B1C1C" />
            </linearGradient>
          </defs>

          <g id="vehicle-chassis">
            <path d="M 145 92 C 145 70, 158 60, 168 62 C 172 63, 172 82, 166 94 Z" fill="#94a3b8" stroke="#64748b" strokeWidth="1.4" />
            <path d="M 145 428 C 145 450, 158 460, 168 458 C 172 457, 172 438, 166 426 Z" fill="#94a3b8" stroke="#64748b" strokeWidth="1.4" />
            <path d="M 120 120 C 75 140, 52 200, 52 260 C 52 320, 75 380, 120 400 C 170 414, 250 416, 330 416 L 1025 416 C 1045 416, 1056 405, 1058 370 L 1060 260 L 1058 150 C 1056 115, 1045 104, 1025 104 L 330 104 C 250 104, 170 106, 120 120 Z" fill="url(#bodyGradient)" stroke="#94a3b8" strokeWidth="3" />
            <path d="M 330 104 L 1025 104 C 1045 104, 1056 115, 1058 150 L 1060 260 L 1058 370 C 1056 405, 1045 416, 1025 416 L 330 416" fill="none" stroke="url(#liveryGradient)" strokeWidth="20" strokeLinecap="round" opacity="0.15" />
            <path d="M 330 104 L 1025 104 C 1045 104, 1056 115, 1058 150 L 1060 260 L 1058 370 C 1056 405, 1045 416, 1025 416 L 330 416" fill="none" stroke="url(#liveryGradient)" strokeWidth="4" strokeLinecap="round" opacity="0.6" />
            <path d="M 130 128 C 190 142, 235 146, 250 146 L 250 374 C 235 374, 190 378, 130 392" fill="none" stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth="1.5" />
            <path d="M 135 145 C 195 185, 215 220, 215 260 C 215 300, 195 335, 135 375" fill="none" stroke="#94a3b8" strokeWidth="2" />
            <line x1="250" y1="104" x2="250" y2="416" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" />
            <path d="M 405 104 L 540 104" stroke="#10b981" strokeWidth="4" strokeLinecap="round"/>
            <text x="445" y="128" fill="#10b981" fontSize="10" fontFamily="sans-serif" fontWeight="bold" letterSpacing="1">PUERTA</text>
            <path d="M 1055 160 L 1055 360" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 2"/>
          </g>

          <g id="cockpit">
            <g transform="translate(225, 335)">
              <circle cx="0" cy="0" r="28" fill="none" stroke="#64748b" strokeWidth="3" />
              <circle cx="0" cy="0" r="23" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1" />
              <line x1="-23" y1="0" x2="23" y2="0" stroke="#64748b" strokeWidth="2.5" />
              <line x1="0" y1="0" x2="0" y2="23" stroke="#64748b" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="9" fill="#e2e8f0" stroke="#64748b" strokeWidth="1.5" />
            </g>
            <g id="seat-driver">
              <rect x="256" y="306" width="102" height="96" rx="14" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
              <text x="307" y="360" fill="#64748b" fontSize="11" fontWeight="bold" textAnchor="middle">CHOFER</text>
            </g>
          </g>

          {(() => {
            const Seat = ({ number, x, y, w, h }) => {
              // Revisamos si viene ocupado desde la BD o desde el estado de React
              const isOcc = occupiedSeatsExternos.includes(number);
              const isSel = selectedSeats.includes(number);
              
              let fill = '#f0fdf4'; let stroke = '#22c55e'; let text = '#166534'; let headrest = '#bbf7d0';
              if (isOcc) { fill = '#f1f5f9'; stroke = '#cbd5e1'; text = '#94a3b8'; headrest = '#e2e8f0'; }
              if (isSel) { fill = '#D9531E'; stroke = '#b91c1c'; text = '#ffffff'; headrest = '#fca5a5'; }

              return (
                <g onClick={() => handleSeatClick(number)} className={isOcc ? "cursor-not-allowed" : "cursor-pointer hover:opacity-80 transition-opacity"}>
                  <rect x={x} y={y} width={w} height={h} rx="12" fill={fill} stroke={stroke} strokeWidth="2.5"/>
                  <rect x={x+8} y={y+8} width={w-16} height={h-16} rx="8" fill={headrest} stroke={stroke} strokeWidth="1"/>
                  <rect x={x+w-14} y={y+10} width="14" height={h-20} rx="5" fill={headrest} stroke={stroke} strokeWidth="1.5"/>
                  <text x={x+w/2 - 5} y={y+h/2 + 4} fill={text} fontSize="14" fontWeight="bold" textAnchor="middle">{number}</text>
                  {isOcc && <line x1={x+10} y1={y+10} x2={x+w-10} y2={y+h-10} stroke="#ef4444" strokeWidth="2" opacity="0.6"/>}
                </g>
              );
            };
            return (
              <>
                <Seat number={1} x={265} y={210} w={80} h={70} /> 
                <Seat number={2} x={265} y={120} w={80} h={70} />
                <Seat number={3} x={436} y={186} w={80} h={66} />
                <Seat number={4} x={436} y={259} w={80} h={66} />
                <Seat number={5} x={436} y={332} w={80} h={66} />
                <Seat number={6} x={576} y={118} w={79} h={74} />
                <Seat number={7} x={576} y={259} w={80} h={66} />
                <Seat number={8} x={576} y={332} w={80} h={66} />
                <Seat number={9} x={716} y={118} w={79} h={74} />
                <Seat number={10} x={716} y={259} w={80} h={66} />
                <Seat number={11} x={716} y={332} w={80} h={66} />
                <Seat number={12} x={864} y={122} w={80} h={65} />
                <Seat number={13} x={864} y={193} w={80} h={65} />
                <Seat number={14} x={864} y={264} w={80} h={65} />
                <Seat number={15} x={864} y={334} w={80} h={65} />
              </>
            );
          })()}
          <text x="96" y="265" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" transform="rotate(-90 96 265)">FRENTE</text>
          <text x="1046" y="265" fill="#94a3b8" fontSize="9" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle" transform="rotate(90 1046 265)">FONDO</text>
        </svg>
      </div>
    </div>
  );
}
