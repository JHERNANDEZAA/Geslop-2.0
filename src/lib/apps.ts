import type { AppDefinition } from './types';

export const availableApps: AppDefinition[] = [
    { id: '/purchaseRequisition', name: 'Solicitud de productos', description: 'Permite a los usuarios crear y gestionar solicitudes de productos.' },
    { id: '/adminPurchasing', name: 'Administración de compras', description: 'Permite gestionar catálogos, familias y destinatarios.' },
    { id: '/adminRoles', name: 'Administración de Roles', description: 'Permite crear y gestionar los roles de usuario.' },
    { id: '/adminRoleApps', name: 'Asignación de Aplicaciones', description: 'Permite asignar aplicaciones a los diferentes roles.' },
    { id: '/adminUserRoles', name: 'Asignación de Roles a Usuarios', description: 'Permite asignar roles a los usuarios.' },
    { id: '/adminUsers', name: 'Gestión de Usuarios', description: 'Permite crear y gestionar los usuarios del sistema.' },
    { id: '/adminCatalogFamilies', name: 'Asignación de catálogos a familias', description: 'Permite asignar catálogos a las familias de productos.' },
];

export const getAllApps = async (): Promise<AppDefinition[]> => {
    // In the future, this could fetch from a database or a configuration file.
    // For now, it returns the hardcoded list.
    return Promise.resolve(availableApps);
}
