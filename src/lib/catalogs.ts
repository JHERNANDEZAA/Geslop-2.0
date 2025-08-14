
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import type { CatalogAdmin } from './types';

export const saveAdminCatalog = async (catalogData: CatalogAdmin) => {
  const catalogRef = doc(db, 'catalogs_admin', catalogData.id);

  const docSnap = await getDoc(catalogRef);
  if (docSnap.exists()) {
    // Document exists, which means the ID is not unique.
    // We throw an error to be caught in the component.
    throw new Error("Catalog ID already exists");
  }

  // Document does not exist, so we can create it.
  await setDoc(catalogRef, catalogData);
};
