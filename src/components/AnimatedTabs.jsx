import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function AnimatedTabs({ dias, diaSeleccionado, onChange }) {
  const pillRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Animación de la píldora deslizante
    const tabs = containerRef.current.querySelectorAll('.tab-btn');
    const selectedTab = tabs[diaSeleccionado];
    
    if (selectedTab && pillRef.current) {
      const rect = selectedTab.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      
      gsap.to(pillRef.current, {
        x: rect.left - containerRect.left,
        width: rect.width,
        duration: 0.4,
        ease: "power3.out"
      });
    }
  }, [diaSeleccionado]);

  return (
    <div ref={containerRef} className="relative flex bg-slate-200/60 p-1.5 rounded-xl backdrop-blur-sm">
      {/* La píldora animada */}
      <div 
        ref={pillRef} 
        className="absolute top-1.5 bottom-1.5 bg-white rounded-lg shadow-sm z-0"
        style={{ left: 0, width: 0 }}
      ></div>
      
      {dias.map((dia, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={`tab-btn relative z-10 px-5 py-2 text-sm font-bold rounded-lg transition-colors ${diaSeleccionado === index ? 'text-brand-dark' : 'text-slate-500 hover:text-slate-700'}`}
        >
          {dia}
        </button>
      ))}
    </div>
  );
}
