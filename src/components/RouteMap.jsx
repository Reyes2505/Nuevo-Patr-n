export default function RouteMap() {
  return (
    <div className="w-full h-64 bg-slate-100 border-t border-slate-200 relative">
      <iframe 
        src="https://www.google.com/maps/embed?pb=!1m28!1m12!1m3!1d140345.20891334763!2d-78.4190239880696!3d-7.23721881174142!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!4m13!3e6!4m5!1s0x91b25b1049888c41%3A0x3d1050867546664a!2sTerminal%20Terrestre%20San%20Marcos%2C%203N%20411%2C%20Cajamarca%2006003!3m2!1d-7.167088799999999!2d-78.5015892!4m5!1s0x91b217c9aa61b89d%3A0x50c51759b06a9026!2sEmpresa%20transportes%20Divino%20Patr%C3%B3n%20San%20Marcos%20SRL.%2C%20Bolognesi%20318%2C%20San%20Marcos%2006321!3m2!1d-7.3363301!2d-78.17207719999999!5e1!3m2!1ses-419!2spe!4v1793741002250!5m2!1ses-419!2spe" 
        width="100%" 
        height="100%" 
        style={{ border: 0 }} 
        allowFullScreen="" 
        loading="lazy" 
        referrerPolicy="strict-origin-when-cross-origin"
        title="Ruta San Marcos a Cajamarca"
        className="grayscale-[20%] hover:grayscale-0 transition-all duration-500"
      ></iframe>
    </div>
  );
}
