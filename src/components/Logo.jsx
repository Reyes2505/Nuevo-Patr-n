export default function Logo() {
  return (
    <div className="flex items-center gap-3 cursor-pointer group">
      <div className="relative">
        {/* Glow detrás del logo */}
        <div className="absolute inset-0 bg-brand-orange blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <img 
          src="/logo-patron.png" 
          alt="Logo Divino Patrón" 
          className="h-10 sm:h-14 w-auto object-contain drop-shadow-md relative z-10 transition-transform group-hover:scale-105"
        />
      </div>
      <div className="hidden sm:block border-l border-slate-200 pl-3">
        <p className="text-[10px] font-black text-slate-500 tracking-widest uppercase leading-tight">
          Emp. de Transp.
        </p>
        <p className="text-xs font-bold text-slate-800 leading-tight">
          San Marcos - Cajamarca
        </p>
      </div>
    </div>
  );
}
