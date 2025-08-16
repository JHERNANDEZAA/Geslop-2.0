import type { AppDefinition } from './types';
import { UserCog, AppWindow, UserCheck, Users, Library, Beaker, ShoppingCart, List } from 'lucide-react';

export const availableApps: AppDefinition[] = [
    { id: '/purchaseRequisition', name: 'Solicitud de productos', description: 'Permite a los usuarios crear y gestionar solicitudes de productos.', icon: List, isAdmin: false },
    { id: '/adminPurchasing', name: 'Administración de compras', description: 'Permite gestionar catálogos, familias y destinatarios.', icon: ShoppingCart, isAdmin: false },
    { id: '/admin/roles', name: 'Administración de Roles', description: 'Permite crear y gestionar los roles de usuario.', icon: UserCog, isAdmin: true },
    { id: '/admin/role-apps', name: 'Asignación de Aplicaciones', description: 'Permite asignar aplicaciones a los diferentes roles.', icon: AppWindow, isAdmin: true },
    { id: '/admin/user-roles', name: 'Asignación de Roles a Usuarios', description: 'Permite asignar roles a los usuarios.', icon: UserCheck, isAdmin: true },
    { id: '/admin/users', name: 'Gestión de Usuarios', description: 'Permite crear y gestionar los usuarios del sistema.', icon: Users, isAdmin: true },
    { id: '/admin/catalog-families', name: 'Asignación catálogos a familias', description: 'Permite asignar catálogos a las familias de productos.', icon: Library, isAdmin: true },
    { id: '/admin/prueba', name: 'Prueba', description: 'Página de prueba.', icon: Beaker, isAdmin: true },
];

export const getAllApps = async (): Promise<AppDefinition[]> => {
    // In the future, this could fetch from a database or a configuration file.
    // For now, it returns the hardcoded list.
    const apps = availableApps.filter(app => !app.isAdmin);
    return Promise.resolve(apps);
}

export const getAllAdminApps = async (): Promise<AppDefinition[]> => {
    const apps = availableApps.filter(app => app.isAdmin);
    return Promise.resolve(apps);
}

export const getAppsForUser = async (userProfile: import('./types').UserProfile | null): Promise<AppDefinition[]> => {
    if (!userProfile) {
        return [];
    }

    if (userProfile.isAdministrator) {
        return availableApps.filter(app => !app.isAdmin);
    }
    
    if (userProfile.roles && userProfile.roles.length > 0) {
        const roles = await import('./roles').then(module => module.getRoleByIds(userProfile.roles));
        const allowedAppIds = new Set<string>();
        
        roles.forEach(role => {
            if (role.apps) {
                role.apps.forEach(appId => allowedAppIds.add(appId));
            }
        });
        
        return availableApps.filter(app => allowedAppIds.has(app.id) && !app.isAdmin);
    }

    return [];
};