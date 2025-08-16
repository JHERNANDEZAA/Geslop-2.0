
import type { AppDefinition, AppDefinitionDB, UserProfile } from './types';
import * as LucideIcons from 'lucide-react';
import { getRoleByIds } from './roles';

const hardcodedAdminAppsConfig: Omit<AppDefinitionDB, 'id'>[] = [
    { name: 'Administración de Roles', description: 'Permite crear y gestionar los roles de usuario.', iconName: 'UserCog', isAdmin: true, route: '/admin/roles' },
    { name: 'Asignación de Aplicaciones', description: 'Permite asignar aplicaciones a los diferentes roles.', iconName: 'AppWindow', isAdmin: true, route: '/admin/role-apps' },
    { name: 'Asignación de Roles a Usuarios', description: 'Permite asignar roles a los usuarios.', iconName: 'UserCheck', isAdmin: true, route: '/admin/user-roles' },
    { name: 'Gestión de Usuarios', description: 'Permite crear y gestionar los usuarios del sistema.', iconName: 'Users', isAdmin: true, route: '/admin/users' },
    { name: 'Asignación catálogos a familias', description: 'Permite asignar catálogos a las familias de productos.', iconName: 'Library', isAdmin: true, route: '/admin/catalog-families' },
];

const hardcodedUserAppsConfig: Omit<AppDefinitionDB, 'id'>[] = [
     { name: 'Solicitud de compra', description: 'Permite crear y gestionar las solicitudes de compra.', iconName: 'ShoppingCart', isAdmin: false, route: '/purchaseRequisition' },
     { name: 'Administración de compras', description: 'Permite administrar las compras.', iconName: 'Archive', isAdmin: false, route: '/adminPurchasing' },
];

const iconMap: Record<string, React.ElementType> = LucideIcons;

const mapAppDefinition = (app: AppDefinitionDB): AppDefinition => {
    return {
        ...app,
        icon: iconMap[app.iconName] || LucideIcons.AppWindow,
    };
}

export const getAllHardcodedApps = (): AppDefinition[] => {
    const adminApps: AppDefinitionDB[] = hardcodedAdminAppsConfig.map(app => ({ ...app, id: app.route }));
    const userApps: AppDefinitionDB[] = hardcodedUserAppsConfig.map(app => ({ ...app, id: app.route }));
    const allApps = [...adminApps, ...userApps];
    return allApps.map(mapAppDefinition).sort((a, b) => a.name.localeCompare(b.name));
};

export const getAllApps = async (): Promise<AppDefinition[]> => {
    try {
        const hardcodedApps = getAllHardcodedApps();
        return Promise.resolve(hardcodedApps);
    } catch (error) {
        console.error("Error getting all apps: ", error);
        throw new Error("No se pudo obtener la lista completa de aplicaciones.");
    }
}

export const getAllAdminApps = async (): Promise<AppDefinition[]> => {
    const adminApps: AppDefinitionDB[] = hardcodedAdminAppsConfig.map(app => ({ ...app, id: app.route }));
    const mappedAdminApps = adminApps.map(mapAppDefinition);
    return Promise.resolve(mappedAdminApps.sort((a,b) => a.name.localeCompare(b.name)));
}

export const getAppsForUser = async (userProfile: UserProfile | null): Promise<AppDefinition[]> => {
    if (!userProfile) {
        return [];
    }
    
    const availableUserApps = hardcodedUserAppsConfig.map(app => mapAppDefinition({ ...app, id: app.route }));

    if (userProfile.isAdministrator) {
        return availableUserApps;
    }
    
    if (userProfile.roles && userProfile.roles.length > 0) {
        const roles = await getRoleByIds(userProfile.roles);
        const allowedAppIds = new Set<string>();
        
        roles.forEach(role => {
            if (role.apps) {
                role.apps.forEach(appId => allowedAppIds.add(appId));
            }
        });
        
        return availableUserApps.filter(app => allowedAppIds.has(app.id));
    }

    return [];
};
