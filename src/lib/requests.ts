
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
    // Delete existing documents
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Add new documents for products with quantity > 0
    products.forEach((product) => {
      if (product.quantity > 0) {
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
      }
    });
    
    // Commit the batch
    await batch.commit();
    console.log('Request saved successfully');
  } catch (error) {
    console.error('Error saving request: ', error);
    throw error;
  }
};
