
import { db } from './firebase';
import { collection, query, where, getDocs, writeBatch, doc, DocumentData } from 'firebase/firestore';
import type { ProductRequest } from './types';

interface RequestData {
  center: string;
  warehouseCode: string;
  catalog: string;
  requestDate: string;
  products: ProductRequest[];
}

export const saveRequest = async (requestData: RequestData) => {
  const { center, warehouseCode, requestDate, products } = requestData;

  // First, check if there are any products to save.
  const validProducts = products.filter(p => p.quantity > 0);
  if (validProducts.length === 0) {
    // If no products have a quantity > 0, we don't do anything.
    // This prevents deleting existing requests when submitting an empty one.
    console.log('No products with quantity > 0. Aborting save.');
    return;
  }

  const requestsRef = collection(db, 'requests');

  // Create a query to find existing documents for the same center, warehouse and date
  const q = query(
    requestsRef,
    where('center', '==', center),
    where('warehouseCode', '==', warehouseCode),
    where('requestDate', '==', requestDate)
  );

  const batch = writeBatch(db);

  try {
    // Delete existing documents that match the query
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new documents for products with quantity > 0
    validProducts.forEach((product) => {
      const newRequestRef = doc(requestsRef);
      batch.set(newRequestRef, {
        center,
        warehouseCode,
        requestDate,
        catalog: requestData.catalog,
        productCode: product.materialCode,
        quantity: product.quantity,
        notes: product.notes,
      });
    });
    
    // Commit the batch
    await batch.commit();
    console.log('Request saved successfully');
  } catch (error) {
    console.error('Error saving request: ', error);
    throw error;
  }
};
