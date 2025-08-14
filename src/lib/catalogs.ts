
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CatalogAdmin } from './types';

export const saveAdminCatalog = async (catalogData: CatalogAdmin): Promise<{ success: boolean; message?: string }> => {
  const catalogRef = doc(db, 'catalogs_admin', catalogData.id);

  try {
    const docSnap = await getDoc(catalogRef);
    if (docSnap.exists()) {
      // Document exists, which means the ID is not unique.
      // Return an object indicating failure instead of throwing an error.
      return { success: false, message: `El ID de catálogo '${catalogData.id}' ya existe. Por favor, use uno diferente.` };
    }

    // Document does not exist, so we can create it.
    await setDoc(catalogRef, catalogData);
    return { success: true };
  } catch (error: any) {
    // For other errors (like permissions), we still throw them to be handled.
    console.error("Error in saveAdminCatalog: ", error);
    throw error;
  }
};
