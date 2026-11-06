import { useState, useEffect } from 'react';

const STORAGE_KEY = 'flotaConductores';

const flotaInicial = [
  { id: 1, nombre: "Segundo Ramírez C.", dni: "12345678", telefono: "901 729 528", placa: "M5S-188", vehiculo: "Toyota Hiace Commuter", color: "Blanco/Naranja", terminal: "San Marcos", yape: "901 729 528", activo: true, foto: "" },
  { id: 2, nombre: "Carlos Mendoza P.", dni: "23456789", telefono: "976 432 109", placa: "T3X-120", vehiculo: "Toyota Hiace Commuter", color: "Blanco/Naranja", terminal: "San Marcos", yape: "976 432 109", activo: true, foto: "" },
  { id: 3, nombre: "Víctor Huamán R.", dni: "34567890", telefono: "955 965 645", placa: "A8K-942", vehiculo: "Toyota Hiace Commuter", color: "Blanco/Naranja", terminal: "Cajamarca", yape: "955 965 645", activo: true, foto: "" },
  { id: 4, nombre: "Julio César B.", dni: "45678901", telefono: "912 345 678", placa: "M5S-189", vehiculo: "Toyota Hiace Commuter", color: "Blanco/Naranja", terminal: "Cajamarca", yape: "912 345 678", activo: true, foto: "" },
];

export default function Flota() {
  const [flota, setFlota] = useState([]);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [conductorEditando, setConductorEditando] = useState(null);
  const [confirmacion, setConfirmacion] = useState('');

  const [form, setForm] = useState({
    nombre: '', dni: '', telefono: '', placa: '', vehiculo: 'Toyota Hiace Commuter', color: 'Blanco/Naranja', terminal: 'San Marcos', yape: '', activo: true, foto: ''
  });

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved && saved.length > 0) {
      setFlota(saved);
    } else {
      setFlota(flotaInicial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(flotaInicial));
    }
  }, []);

  const guardarFlota = (nuevaFlota) => {
    setFlota(nuevaFlota);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nuevaFlota));
    const channel = new BroadcastChannel('sync-flota');
    channel.postMessage({});
    channel.close();
  };

  const abrirNuevo = () => {
    setConductorEditando(null);
    setForm({ nombre: '', dni: '', telefono: '', placa: '', vehiculo: 'Toyota Hiace Commuter', color: 'Blanco/Naranja', terminal: 'San Marcos', yape: '', activo: true, foto: '' });
    setModalAbierto(true);
  };

  const abrirEditar = (conductor) => {
    setConductorEditando(conductor);
    setForm({ ...conductor });
    setModalAbierto(true);
  };

  const handleGuardar = (e) => {
    e.preventDefault();
    if (!form.nombre || !form.placa || !form.yape) return;

    let nuevaFlota;
    if (conductorEditando) {
      nuevaFlota = flota.map(c => c.id === conductorEditando.id ? { ...form, id: conductorEditando.id } : c);
      setConfirmacion(`Conductor ${form.nombre} actualizado.`);
    } else {
      const nuevoId = Math.max(...flota.map(c => c.id), 0) + 1;
      nuevaFlota = [...flota, { ...form, id: nuevoId }];
      setConfirmacion(`Conductor ${form.nombre} agregado.`);
    }
    guardarFlota(nuevaFlota);
    setModalAbierto(false);
    setTimeout(() => setConfirmacion(''), 3000);
  };

  const handleEliminar = (conductor) => {
    if (!window.confirm(`¿Eliminar a ${conductor.nombre}?`)) return;
    const nuevaFlota = flota.filter(c => c.id !== conductor.id);
    guardarFlota(nuevaFlota);
    setConfirmacion(`Conductor ${conductor.nombre} eliminado.`);
    setTimeout(() => setConfirmacion(''), 3000);
  };

  const handleToggleActivo = (conductor) => {
    const nuevaFlota = flota.map(c => c.id === conductor.id ? { ...c, activo: !c.activo } : c);
    guardarFlota(nuevaFlota);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar tamaño máximo 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert('La foto debe ser menor a 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setForm(prev => ({ ...prev, foto: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const activos = flota.filter(c => c.activo).length;
  const inactivos = flota.length - activos;

  return (
    <div>
      <div className="flex justify-between items-end mb-6 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Gestión de Flota</h1>
          <p className="text-sm text-slate-500 mt-1">Administra conductores, vehículos y datos de Yape.</p>
        </div>
        <button onClick={abrirNuevo}
          className="bg-brand-orange hover:bg-orange-700 text-white font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg>
          Agregar conductor
        </button>
      </div>

      {confirmacion && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm p-3 rounded-lg mb-4 font-bold">
          {confirmacion}
        </div>
      )}

      <div className="flex gap-3 mb-6 text-xs">
        <span className="bg-emerald-100 text-emerald-700 font-black px-3 py-1.5 rounded-full uppercase tracking-wider">{activos} activos</span>
        <span className="bg-slate-100 text-slate-600 font-black px-3 py-1.5 rounded-full uppercase tracking-wider">{inactivos} inactivos</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {flota.map((conductor) => (
          <div key={conductor.id} className={`bg-white border rounded-xl p-5 transition-all ${conductor.activo ? 'border-slate-200' : 'border-slate-200 opacity-60'}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                {/* FOTO DEL CONDUCTOR */}
                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 flex-shrink-0 bg-slate-100">
                  {conductor.foto ? (
                    <img src={conductor.foto} alt={conductor.nombre} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black text-lg">
                      {conductor.nombre.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-black text-slate-900">{conductor.nombre}</h3>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      conductor.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {conductor.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">DNI: {conductor.dni} · {conductor.telefono}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleToggleActivo(conductor)} title={conductor.activo ? 'Desactivar' : 'Activar'}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    conductor.activo ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={conductor.activo ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"}/>
                  </svg>
                </button>
                <button onClick={() => abrirEditar(conductor)} title="Editar"
                  className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                </button>
                <button onClick={() => handleEliminar(conductor)} title="Eliminar"
                  className="w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 flex items-center justify-center transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs border-t border-slate-100 pt-3">
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Vehículo</p>
                <p className="font-bold text-slate-700">{conductor.vehiculo}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Placa</p>
                <p className="font-mono font-black text-brand-orange">{conductor.placa}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Yape</p>
                <p className="font-mono font-bold text-slate-700">{conductor.yape}</p>
              </div>
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Terminal</p>
                <p className="font-bold text-slate-700">{conductor.terminal}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg my-8 overflow-hidden">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <h2 className="text-lg font-black">{conductorEditando ? 'Editar conductor' : 'Agregar conductor'}</h2>
              <button onClick={() => setModalAbierto(false)} className="text-white/70 hover:text-white text-xl">×</button>
            </div>

            <form onSubmit={handleGuardar} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* FOTO */}
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 flex items-center justify-center relative group">
                  {form.foto ? (
                    <img src={form.foto} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                  )}
                  <label htmlFor="foto-input" className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                    </svg>
                  </label>
                  <input id="foto-input" type="file" accept="image/*" onChange={handleFotoUpload} className="hidden"/>
                </div>
                <p className="text-[10px] text-slate-400 mt-2">Haz clic para subir foto</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Nombre completo *</label>
                  <input type="text" name="nombre" value={form.nombre} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">DNI</label>
                  <input type="text" name="dni" value={form.dni} onChange={handleChange} maxLength={8} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Teléfono</label>
                  <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Datos del vehículo</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Placa *</label>
                  <input type="text" name="placa" value={form.placa} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono font-bold focus:outline-none focus:border-brand-orange uppercase"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Vehículo</label>
                  <input type="text" name="vehiculo" value={form.vehiculo} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Color</label>
                  <input type="text" name="color" value={form.color} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange"/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Terminal base</label>
                  <select name="terminal" value={form.terminal} onChange={handleChange} className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-bold focus:outline-none focus:border-brand-orange">
                    <option value="San Marcos">San Marcos</option>
                    <option value="Cajamarca">Cajamarca</option>
                  </select>
                </div>
                <div className="col-span-2 border-t border-slate-100 pt-4 mt-2">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Cobros</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Número de Yape *</label>
                  <input type="tel" name="yape" value={form.yape} onChange={handleChange} required placeholder="9XXXXXXXX" className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm font-mono font-bold focus:outline-none focus:border-brand-orange"/>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input type="checkbox" name="activo" id="activo" checked={form.activo} onChange={handleChange} className="w-4 h-4 accent-brand-orange"/>
                  <label htmlFor="activo" className="text-xs font-bold text-slate-700">Conductor activo</label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setModalAbierto(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-lg transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-brand-orange hover:bg-orange-700 text-white font-black py-3 rounded-lg transition-colors">
                  {conductorEditando ? 'Guardar cambios' : 'Agregar conductor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
