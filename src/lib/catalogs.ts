
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CatalogAdmin } from './types';

export const saveAdminCatalog = async (catalogData: CatalogAdmin) => {
  const catalogRef = doc(db, 'catalogs_admin', catalogData.id);

  try {
    const docSnap = await getDoc(catalogRef);
    if (docSnap.exists()) {
      // Document exists, which means the ID is not unique.
      // We throw an error to be caught in the component.
      throw new Error(`El ID de catálogo '${catalogData.id}' ya existe. Por favor, use uno diferente.`);
    }

    // Document does not exist, so we can create it.
    await setDoc(catalogRef, catalogData);
  } catch (error: any) {
    // We re-throw the error to be handled by the calling component
    // This allows us to display specific Firestore permission errors etc.
    console.error("Error in saveAdminCatalog: ", error);
    throw error;
  }
};
