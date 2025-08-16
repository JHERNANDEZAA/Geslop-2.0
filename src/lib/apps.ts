
import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, deleteDoc } from 'firebase/firestore';
import type { AppDefinition, AppDefinitionDB } from './types';
import * as LucideIcons from 'lucide-react';

// Admin apps are still hardcoded as they are essential for the system's administration.
const adminAppsConfig: Omit<AppDefinitionDB, 'id'>[] = [
    { name: 'Administración de Roles', description: 'Permite crear y gestionar los roles de usuario.', iconName: 'UserCog', isAdmin: true, route: '/admin/roles' },
    { name: 'Asignación de Aplicaciones', description: 'Permite asignar aplicaciones a los diferentes roles.', iconName: 'AppWindow', isAdmin: true, route: '/admin/role-apps' },
    { name: 'Asignación de Roles a Usuarios', description: 'Permite asignar roles a los usuarios.', iconName: 'UserCheck', isAdmin: true, route: '/admin/user-roles' },
    { name: 'Gestión de Usuarios', description: 'Permite crear y gestionar los usuarios del sistema.', iconName: 'Users', isAdmin: true, route: '/admin/users' },
    { name: 'Asignación catálogos a familias', description: 'Permite asignar catálogos a las familias de productos.', iconName: 'Library', isAdmin: true, route: '/admin/catalog-families' },
    { name: 'Gestión de Aplicaciones', description: 'Permite la gestión de las aplicaciones del sistema', iconName: 'AppWindow', isAdmin: true, route: '/admin/apps' },
];

const adminApps: AppDefinitionDB[] = adminAppsConfig.map(app => ({
    ...app,
    id: app.route,
}));

const iconMap: Record<string, React.ElementType> = LucideIcons;

const mapAppDefinition = (app: AppDefinitionDB): AppDefinition => {
    return {
        ...app,
        icon: iconMap[app.iconName] || LucideIcons.AppWindow,
    };
}

export const getAppsFromDB = async (): Promise<AppDefinition[]> => {
    const appsRef = collection(db, 'apps');
    const q = query(appsRef);
    
    try {
        const querySnapshot = await getDocs(q);
        const apps = querySnapshot.docs.map(doc => mapAppDefinition(doc.data() as AppDefinitionDB));
        return apps.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error getting apps: ", error);
        throw new Error("No se pudo obtener la lista de aplicaciones.");
    }
}


export const getAllApps = async (): Promise<AppDefinition[]> => {
    try {
        const dbApps = await getAppsFromDB();
        const allApps = [...adminApps.map(mapAppDefinition), ...dbApps];
        const uniqueApps = Array.from(new Map(allApps.map(app => [app.id, app])).values());
        return uniqueApps.sort((a,b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error getting all apps: ", error);
        throw new Error("No se pudo obtener la lista completa de aplicaciones.");
    }
}

export const getAllAdminApps = async (): Promise<AppDefinition[]> => {
    const mappedAdminApps = adminApps.map(mapAppDefinition);
    return Promise.resolve(mappedAdminApps.sort((a,b) => a.name.localeCompare(b.name)));
}

export const getAppsForUser = async (userProfile: import('./types').UserProfile | null): Promise<AppDefinition[]> => {
    if (!userProfile) {
        return [];
    }
    
    const allApps = await getAllApps();
    const userApps = allApps.filter(app => !app.isAdmin);

    if (userProfile.isAdministrator) {
        return userApps;
    }
    
    if (userProfile.roles && userProfile.roles.length > 0) {
        const roles = await import('./roles').then(module => module.getRoleByIds(userProfile.roles));
        const allowedAppIds = new Set<string>();
        
        roles.forEach(role => {
            if (role.apps) {
                role.apps.forEach(appId => allowedAppIds.add(appId));
            }
        });
        
        return userApps.filter(app => allowedAppIds.has(app.id));
    }

    return [];
};

export const saveApp = async (appData: Omit<AppDefinitionDB, 'id'>, id: string): Promise<{ success: boolean; message?: string }> => {
    const appRef = doc(db, 'apps', id);
    try {
        const docSnap = await getDoc(appRef);
        if (docSnap.exists()) {
            return { success: false, message: `El ID de la aplicación '${id}' ya existe. Por favor, use uno diferente.` };
        }

        const newApp: AppDefinitionDB = {
            id,
            ...appData,
        };

        await setDoc(appRef, newApp);
        return { success: true };
    } catch (error: any) {
        console.error("Error in saveApp: ", error);
        throw error;
    }
}

export const deleteApp = async (appId: string): Promise<void> => {
    if (adminApps.some(app => app.id === appId)) {
        throw new Error("No se pueden eliminar las aplicaciones de administración del sistema.");
    }
    const appRef = doc(db, 'apps', appId);
    try {
        await deleteDoc(appRef);
    } catch (error: any) {
        console.error("Error deleting app: ", error);
        throw new Error("No se pudo eliminar la aplicación.");
    }
};

