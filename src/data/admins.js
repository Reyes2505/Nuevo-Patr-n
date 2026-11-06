// Lista de DNIs autorizados como administradores
// El rol "admin" tiene los privilegios más altos del sistema
export const ADMIN_DNIS = [
  '60405480', // Aarón Rodrigo Reyes Abanto - Administrador Principal
];

export const esAdmin = (dni) => {
  if (!dni) return false;
  return ADMIN_DNIS.includes(dni);
};

// Roles disponibles en el sistema
export const ROLES = {
  admin: {
    nombre: 'Administrador',
    color: 'amber', // dorado
    icono: '⚙️',
    privilegios: [
      'Acceso total al panel de administración',
      'Ver todos los boletos y clientes',
      'Gestionar flota de vehículos',
      'Aprobar/rechazar reembolsos',
      'Acceso a reportes tributarios',
      'POS y cobros en tiempo real',
    ],
  },
  cliente: {
    nombre: 'Cliente',
    color: 'emerald',
    icono: '✓',
    privilegios: [
      'Comprar boletos',
      'Ver historial de viajes',
      'Solicitar reembolsos',
    ],
  },
};
