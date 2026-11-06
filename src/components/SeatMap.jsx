export default function SeatMap({ selectedSeats, onSeatToggle, occupiedSeatsExternos = [], lockedSeats = [] }) {
  const handleSeatClick = (seatNumber) => {
    // Bloqueo si el asiento está vendido o bloqueado temporalmente por otro usuario
    if (occupiedSeatsExternos.includes(seatNumber) || lockedSeats.includes(seatNumber)) return;
    onSeatToggle(seatNumber);
  };

  const Seat = ({ number, x, y, w = 80, h = 66 }) => {
    const isOcc = occupiedSeatsExternos.includes(number);
    const isLocked = lockedSeats.includes(number);
    const isSel = selectedSeats.includes(number);

    let fill = '#FFFFFF';
    let stroke = '#CBD5E1';
    let text = '#0F172A';
    let headrest = '#F1F5F9';

    // PRIORIDAD: vendido > bloqueado > seleccionado
    if (isOcc) {
      fill = '#E2E8F0'; 
      stroke = '#CBD5E1'; 
      text = '#94A3B8'; 
      headrest = '#F1F5F9'; 
    } else if (isLocked) {
      fill = '#FEE2E2'; 
      stroke = '#EF4444'; 
      text = '#EF4444'; 
      headrest = '#FEF2F2'; 
    } else if (isSel) {
      fill = '#FF6A00'; 
      stroke = '#FF6A00'; 
      text = '#FFFFFF'; 
      headrest = 'rgba(255,255,255,0.3)'; 
    }

    return (
      <g 
        onClick={() => handleSeatClick(number)} 
        className={isOcc || isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}
      >
        <g style={{ filter: isSel ? 'drop-shadow(0 0 6px rgba(255,106,0,0.4))' : 'none' }}>
          <rect x={x} y={y} width={w} height={h} rx="10" fill={fill} stroke={stroke} strokeWidth="1.5"/>
          <rect x={x+8} y={y+8} width={w-16} height={h-16} rx="6" fill={headrest} stroke={stroke} strokeWidth="1"/>
          <rect x={x+w-14} y={y+10} width="14" height={h-20} rx="4" fill={headrest} stroke={stroke} strokeWidth="1"/>
        </g>
        <text x={x+w/2 - 5} y={y+h/2 + 6} fill={text} fontSize="16" fontWeight="900" textAnchor="middle">{number}</text>
        {/* Marca de X si está vendido */}
        {isOcc && <line x1={x+10} y1={y+10} x2={x+w-10} y2={y+h-10} stroke="#EF4444" strokeWidth="2" opacity="0.4"/>}
        {isOcc && <line x1={x+w-10} y1={y+10} x2={x+10} y2={y+h-10} stroke="#EF4444" strokeWidth="2" opacity="0.4"/>}
        {/* Candado si está bloqueado temporalmente */}
        {isLocked && (
          <g transform={`translate(${x+w/2 - 6}, ${y+h/2 - 10})`}>
            <rect x="0" y="8" width="12" height="8" rx="1.5" fill="#EF4444"/>
            <path d="M 2 8 V 5 A 4 4 0 0 1 10 5 V 8" fill="none" stroke="#EF4444" strokeWidth="1.5"/>
          </g>
        )}
      </g>
    );
  };

  return (
    <div className="w-full flex justify-center">
      <svg viewBox="0 0 1120 540" className="w-full h-auto max-h-[320px] select-none">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff"/>
            <stop offset="100%" stopColor="#f8fafc"/>
          </linearGradient>
        </defs>

        <g stroke="#94a3b8" strokeWidth="2.5" fill="url(#bodyGradient)">
          <path d="M 145 92 C 145 70, 158 60, 168 62 C 172 63, 172 82, 166 94 Z" fill="#94a3b8" strokeWidth="1.4"/>
          <path d="M 145 428 C 145 450, 158 460, 168 458 C 172 457, 172 438, 166 426 Z" fill="#94a3b8" strokeWidth="1.4"/>
          <path d="M 120 120 C 75 140, 52 200, 52 260 C 52 320, 75 380, 120 400 C 170 414, 250 416, 330 416 L 1025 416 C 1045 416, 1056 405, 1058 370 L 1060 260 L 1058 150 C 1056 115, 1045 104, 1025 104 L 330 104 C 250 104, 170 106, 120 120 Z" strokeWidth="2.5"/>
          <path d="M 130 128 C 190 142, 235 146, 250 146 L 250 374 C 235 374, 190 378, 130 392" fill="none" strokeDasharray="4 4" strokeWidth="1.5" opacity="0.5"/>
          <path d="M 135 145 C 195 185, 215 220, 215 260 C 215 300, 195 335, 135 375" fill="none" strokeWidth="1.5" opacity="0.5"/>
          <path d="M 405 104 L 540 104" stroke="#10b981" strokeWidth="4" strokeLinecap="round"/>
          <text x="445" y="128" fill="#10b981" fontSize="11" fontWeight="900" letterSpacing="2">PUERTA</text>
        </g>

        <g transform="translate(225, 335)">
          <circle cx="0" cy="0" r="28" fill="#ffffff" stroke="#94a3b8" strokeWidth="2.5"/>
          <circle cx="0" cy="0" r="9" fill="#94a3b8" stroke="#94a3b8" strokeWidth="1.5" opacity="0.5"/>
          <line x1="-23" y1="0" x2="23" y2="0" stroke="#94a3b8" strokeWidth="2"/>
          <line x1="0" y1="0" x2="0" y2="23" stroke="#94a3b8" strokeWidth="2"/>
        </g>
        <g>
          <rect x="256" y="306" width="102" height="96" rx="10" fill="#F1F5F9" stroke="#94a3b8" strokeWidth="1.5"/>
          <text x="307" y="360" fill="#64748B" fontSize="11" fontWeight="900" textAnchor="middle">CHOFER</text>
        </g>

        <Seat number={1} x={265} y={210} w={80} h={70}/>
        <Seat number={2} x={265} y={120} w={80} h={70}/>
        <Seat number={3} x={436} y={186} w={80} h={66}/>
        <Seat number={4} x={436} y={259} w={80} h={66}/>
        <Seat number={5} x={436} y={332} w={80} h={66}/>
        <Seat number={6} x={576} y={118} w={79} h={74}/>
        <Seat number={7} x={576} y={259} w={80} h={66}/>
        <Seat number={8} x={576} y={332} w={80} h={66}/>
        <Seat number={9} x={716} y={118} w={79} h={74}/>
        <Seat number={10} x={716} y={259} w={80} h={66}/>
        <Seat number={11} x={716} y={332} w={80} h={66}/>
        <Seat number={12} x={864} y={122} w={80} h={65}/>
        <Seat number={13} x={864} y={193} w={80} h={65}/>
        <Seat number={14} x={864} y={264} w={80} h={65}/>
        <Seat number={15} x={864} y={334} w={80} h={65}/>
      </svg>
    </div>
  );
}
