import { db } from './firebase';
import { doc, setDoc, collection, getDocs, deleteDoc, getDoc, runTransaction, updateDoc, query, where } from 'firebase/firestore';
import type { Role } from './types';
import { format } from 'date-fns';

export const saveRole = async (roleData: Omit<Role, 'id' | 'createdAt' | 'createdBy'>, userEmail: string): Promise<{ success: boolean; message?: string }> => {
  const counterRef = doc(db, 'counters', 'roles_counter');
  
  try {
    const newRoleId = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      let nextId = 1;
      if (counterDoc.exists()) {
        nextId = counterDoc.data().currentId + 1;
      }
      transaction.set(counterRef, { currentId: nextId });
      return nextId.toString();
    });

    const roleRef = doc(db, 'roles', newRoleId);

    const newRole: Role = {
      ...roleData,
      id: newRoleId,
      createdAt: format(new Date(), 'dd-MM-yyyy'),
      createdBy: userEmail,
      isAdministrator: false, // Default to not administrator
      apps: [],
    };

    await setDoc(roleRef, newRole);
    return { success: true };
  } catch (error: any) {
    console.error("Error in saveRole: ", error);
    throw error;
  }
};

export const getAllRoles = async (): Promise<Role[]> => {
    const rolesRef = collection(db, 'roles');
    try {
        const querySnapshot = await getDocs(rolesRef);
        const results: Role[] = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data() as Role);
        });
        // Sort roles by name alphabetically
        return results.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
        console.error("Error getting all roles: ", error);
        throw new Error("No se pudo obtener la lista de roles.");
    }
};

export const getRoleByIds = async (roleIds: string[]): Promise<Role[]> => {
    if (!roleIds || roleIds.length === 0) {
        return [];
    }
    const rolesRef = collection(db, 'roles');
    const q = query(rolesRef, where('id', 'in', roleIds));
    try {
        const querySnapshot = await getDocs(q);
        const results: Role[] = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data() as Role);
        });
        return results;
    } catch (error) {
        console.error("Error getting roles by IDs: ", error);
        throw new Error("No se pudieron obtener los roles.");
    }
}

export const deleteRole = async (roleId: string): Promise<void> => {
    const roleRef = doc(db, 'roles', roleId);
    try {
        await deleteDoc(roleRef);
    } catch (error: any) {
        console.error("Error deleting role: ", error);
        throw new Error("No se pudo eliminar el rol.");
    }
};

export const updateRoleStatus = async (roleId: string, isActive: boolean): Promise<void> => {
    const roleRef = doc(db, 'roles', roleId);
    try {
        await updateDoc(roleRef, {
            isActive: isActive
        });
    } catch (error: any) {
        console.error("Error updating role status: ", error);
        throw new Error("No se pudo actualizar el estado del rol.");
    }
};

export const updateRoleApps = async (roleId: string, appIds: string[]): Promise<void> => {
    const roleRef = doc(db, 'roles', roleId);
    try {
        await updateDoc(roleRef, {
            apps: appIds
        });
    } catch (error: any) {
        console.error("Error updating role apps: ", error);
        throw new Error("No se pudo actualizar las aplicaciones del rol.");
    }
};

export const updateRoleAdministrator = async (roleId: string, isAdministrator: boolean): Promise<void> => {
    const roleRef = doc(db, 'roles', roleId);
    try {
        await updateDoc(roleRef, {
            isAdministrator: isAdministrator
        });
    } catch (error: any) {
        console.error("Error updating role administrator status: ", error);
        throw new Error("No se pudo actualizar el estado de administrador del rol.");
    }
};
