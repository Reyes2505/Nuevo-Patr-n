export default function SkeletonCard() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between h-[220px]">
      {/* Animación de brillo nativa usando style */}
      <style>
        {`
          @keyframes shimmer {
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <div 
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent z-10" 
        style={{ animation: 'shimmer 1.5s infinite' }}
      ></div>
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="h-8 w-24 bg-slate-200 rounded-md mb-2"></div>
          <div className="h-3 w-20 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-6 w-20 bg-slate-200 rounded-md"></div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
          <div className="h-3 w-24 bg-slate-200 rounded-md"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-3 w-12 bg-slate-200 rounded-md"></div>
          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
        </div>
      </div>

      <div className="flex justify-between items-center border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-slate-200 rounded-full"></div>
          <div className="h-3 w-16 bg-slate-200 rounded-md"></div>
        </div>
        <div className="h-3 w-12 bg-slate-200 rounded-md"></div>
      </div>
    </div>
  );
}
