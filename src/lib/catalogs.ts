import { db } from './firebase';
import { doc, getDoc, setDoc, collection, getDocs, query, where, QueryConstraint, deleteDoc } from 'firebase/firestore';
import type { CatalogAdmin } from './types';

export const saveAdminCatalog = async (catalogData: CatalogAdmin): Promise<{ success: boolean; message?: string }> => {
  const catalogRef = doc(db, 'catalogs_admin', catalogData.id);

  try {
    const docSnap = await getDoc(catalogRef);
    if (docSnap.exists()) {
      return { success: false, message: `El ID de catálogo '${catalogData.id}' ya existe. Por favor, use uno diferente.` };
    }

    await setDoc(catalogRef, catalogData);
    return { success: true };
  } catch (error: any) {
    console.error("Error in saveAdminCatalog: ", error);
    throw error;
  }
};

interface SearchFilters {
    id?: string;
    description?: string;
    purchaseGroup?: string;
    type?: '' | 'C' | 'T';
    salesOrg?: string;
}

export const searchAdminCatalogs = async (filters: SearchFilters): Promise<CatalogAdmin[]> => {
    const catalogsRef = collection(db, 'catalogs_admin');
    const constraints: QueryConstraint[] = [];

    if (filters.id) {
        // Firestore doesn't support partial text search natively.
        // This will act as a 'starts with' filter.
        constraints.push(where('id', '>=', filters.id));
        constraints.push(where('id', '<=', filters.id + '\uf8ff'));
    }
    if (filters.description) {
        constraints.push(where('description', '>=', filters.description));
        constraints.push(where('description', '<=', filters.description + '\uf8ff'));
    }
    if (filters.purchaseGroup) {
        constraints.push(where('purchaseGroup', '==', filters.purchaseGroup));
    }
    if (filters.type) {
        constraints.push(where('type', '==', filters.type));
    }
    if (filters.salesOrg) {
        constraints.push(where('salesOrg', '==', filters.salesOrg));
    }
    
    // If no filters are applied, return all catalogs, otherwise query with filters
    const q = constraints.length > 0 ? query(catalogsRef, ...constraints) : query(catalogsRef);

    try {
        const querySnapshot = await getDocs(q);
        const results: CatalogAdmin[] = [];
        querySnapshot.forEach((doc) => {
            results.push(doc.data() as CatalogAdmin);
        });
        return results;
    } catch (error) {
        console.error("Error searching admin catalogs: ", error);
        // Note for developer: If you see errors about indexes,
        // you need to create composite indexes in Firestore.
        // The error message in the console will provide a direct link to create it.
        throw new Error("La consulta de búsqueda no se pudo realizar. Es posible que falte una configuración de índice en la base de datos.");
    }
};

export const deleteAdminCatalog = async (catalogId: string): Promise<void> => {
    const catalogRef = doc(db, 'catalogs_admin', catalogId);
    try {
        await deleteDoc(catalogRef);
    } catch (error: any) {
        console.error("Error deleting admin catalog: ", error);
        throw new Error("No se pudo eliminar el catálogo. Revise los permisos o inténtelo de nuevo.");
    }
};
    