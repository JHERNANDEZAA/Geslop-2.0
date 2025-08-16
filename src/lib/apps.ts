
import { db } from './firebase';
import type { AppDefinition, AppDefinitionDB, UserProfile, App, Role } from './types';
import * as LucideIcons from 'lucide-react';
import { getRoleByIds } from './roles';
import { collection, getDocs, doc, setDoc, deleteDoc, getDoc, writeBatch } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const hardcodedAdminAppsConfig: Omit<AppDefinitionDB, 'id'>[] = [
    { name: 'Administración de Roles', description: 'Permite crear y gestionar los roles de usuario.', iconName: 'UserCog', isAdmin: true, route: '/admin/roles' },
    { name: 'Asignación de Aplicaciones', description: 'Permite asignar aplicaciones a los diferentes roles.', iconName: 'AppWindow', isAdmin: true, route: '/admin/role-apps' },
    { name: 'Asignación de Roles a Usuarios', description: 'Permite asignar roles a los usuarios.', iconName: 'UserCheck', isAdmin: true, route: '/admin/user-roles' },
    { name: 'Gestión de Usuarios', description: 'Permite crear y gestionar los usuarios del sistema.', iconName: 'Users', isAdmin: true, route: '/admin/users' },
    { name: 'Gestión de Aplicaciones', description: 'Permite gestionar las aplicaciones del sistema.', iconName: 'Library', isAdmin: true, route: '/admin/apps' },
    { name: 'Asignación catálogos a familias', description: 'Permite asignar catálogos a las familias de productos.', iconName: 'Archive', isAdmin: true, route: '/admin/catalog-families' },
];

const hardcodedUserAppsConfig: Omit<AppDefinitionDB, 'id'>[] = [
     { name: 'Solicitud de compra', description: 'Permite crear y gestionar las solicitudes de compra.', iconName: 'ShoppingCart', isAdmin: false, route: '/purchaseRequisition' },
     { name: 'Administración de compras', description: 'Permite administrar las compras.', iconName: 'Archive', isAdmin: false, route: '/adminPurchasing' },
];

const iconMap: Record<string, React.ElementType> = LucideIcons;

const mapAppToAppDefinition = (app: App): AppDefinition => {
    return {
        ...app,
        icon: iconMap[app.iconName] || LucideIcons.AppWindow,
    };
};

const mapAppDefinitionDBToAppDefinition = (app: AppDefinitionDB): AppDefinition => {
    return {
        ...app,
        icon: iconMap[app.iconName] || LucideIcons.AppWindow,
    };
}

export const getAllHardcodedApps = (): AppDefinition[] => {
    const adminApps: AppDefinitionDB[] = hardcodedAdminAppsConfig.map(app => ({ ...app, id: app.route }));
    const userApps: AppDefinitionDB[] = hardcodedUserAppsConfig.map(app => ({ ...app, id: app.route }));
    const allApps = [...adminApps, ...userApps];
    return allApps.map(mapAppDefinitionDBToAppDefinition);
};

export const getAppsFromDB = async (): Promise<App[]> => {
    const appsRef = collection(db, 'apps');
    try {
        const querySnapshot = await getDocs(appsRef);
        const apps: App[] = [];
        querySnapshot.forEach((doc) => {
            apps.push(doc.data() as App);
        });
        return apps;
    } catch (error) {
        console.error("Error getting apps from DB: ", error);
        throw new Error("No se pudo obtener la lista de aplicaciones de la base de datos.");
    }
}

export const saveApp = async (app: App, isUpdate: boolean): Promise<{ success: boolean; message?: string }> => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
        throw new Error("Usuario no autenticado. Por favor, inicie sesión.");
    }
    
    const appRef = doc(db, 'apps', app.id);
    
    if (!isUpdate) {
        const docSnap = await getDoc(appRef);
        if (docSnap.exists()) {
            throw new Error(`Ya existe una aplicación con el ID '${app.id}'.`);
        }
    }
    
    try {
        await setDoc(appRef, app, { merge: isUpdate });
        return { success: true };
    } catch (error: any) {
        console.error("Error in saveApp: ", error);
        throw new Error(error.message || "No se pudo guardar la aplicación.");
    }
};

export const deleteApp = async (appId: string): Promise<void> => {
    const appRef = doc(db, 'apps', appId);
    const rolesRef = collection(db, 'roles');
    
    try {
        const batch = writeBatch(db);
        
        // 1. Delete the app document
        batch.delete(appRef);

        // 2. Remove the app from all roles that have it
        const rolesSnapshot = await getDocs(rolesRef);
        rolesSnapshot.forEach(doc => {
            const role = doc.data() as Role;
            if (role.apps && role.apps.includes(appId)) {
                const updatedApps = role.apps.filter(id => id !== appId);
                batch.update(doc.ref, { apps: updatedApps });
            }
        });

        await batch.commit();

    } catch (error: any) {
        console.error("Error deleting app and updating roles: ", error);
        throw new Error("No se pudo eliminar la aplicación.");
    }
};


export const getAllApps = async (): Promise<AppDefinition[]> => {
    try {
        const dbApps = await getAppsFromDB();
        return dbApps.map(mapAppToAppDefinition).sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error getting all apps from DB: ", error);
        throw new Error("No se pudo obtener la lista completa de aplicaciones.");
    }
}

export const getAllAdminApps = (): AppDefinition[] => {
    const adminApps: AppDefinitionDB[] = hardcodedAdminAppsConfig.map(app => ({ ...app, id: app.route }));
    return adminApps.map(mapAppDefinitionDBToAppDefinition).sort((a,b) => a.name.localeCompare(b.name));
}

export const getAppsForUser = async (userProfile: UserProfile | null): Promise<AppDefinition[]> => {
    if (!userProfile) {
        return [];
    }
    
    const availableUserApps = hardcodedUserAppsConfig.map(app => mapAppDefinitionDBToAppDefinition({ ...app, id: app.route }));

    if (userProfile.isAdministrator) {
        return availableUserApps.sort((a,b) => a.name.localeCompare(b.name));
    }
    
    if (userProfile.roles && userProfile.roles.length > 0) {
        const roles = await getRoleByIds(userProfile.roles);
        const allowedAppIds = new Set<string>();
        
        roles.forEach(role => {
            if (role.apps) {
                role.apps.forEach(appId => allowedAppIds.add(appId));
            }
        });
        
        const allDbApps = await getAppsFromDB();
        const allowedDbApps = allDbApps.filter(app => allowedAppIds.has(app.id));
        const allowedRoutes = new Set(allowedDbApps.map(app => app.route));

        const filteredApps = availableUserApps.filter(app => allowedRoutes.has(app.route));
        return filteredApps.sort((a,b) => a.name.localeCompare(b.name));
    }

    return [];
};
